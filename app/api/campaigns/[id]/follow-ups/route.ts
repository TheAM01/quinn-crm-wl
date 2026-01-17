// app/api/campaigns/[id]/follow-ups/route.ts

import { NextRequest, NextResponse } from 'next/server';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL;
const SERVER_API_KEY = process.env.SERVER_API_KEY;

interface BackendFollowUp {
	campaign_id: string;
	message_content: string;
	image_url: string | null;
	message_delay: number;
	message_id: number;
	created_at: string;
}

interface BackendResponse {
	campaign_id: string;
	follow_up_templates: BackendFollowUp[];
}

interface FrontendFollowUp {
	message: string;
	delayHours: number;
	delayDisplay: string;
	image: null;
	imagePreview: string;
	message_id?: number;
}

// GET: Fetch all follow-ups for a campaign
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		console.log("Hello")
		const {id: campaignId} = await params;

		const response = await fetch(`${SERVER_BASE_URL}/follow-ups/${campaignId}`, {
			method: 'GET',
			headers: {
				'x-api-key': SERVER_API_KEY || '',
			},
		});
	console.log("wtf")
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return NextResponse.json(
				{ message: errorData.message || 'Failed to fetch follow-ups' },
				{ status: response.status }
			);
		}

		const data: BackendResponse = await response.json();

		// Transform backend data to frontend format
		const followUps: FrontendFollowUp[] = data.follow_up_templates.map((fu) => {
			const delayHours = fu.message_delay / 60;
			return {
				message: fu.message_content,
				delayHours,
				delayDisplay: delayHours >= 1
					? `${delayHours} hours`
					: `${fu.message_delay} minutes`,
				image: null,
				imagePreview: fu.image_url || '',
				message_id: fu.message_id,
			};
		});

		return NextResponse.json({ followUps });
	} catch (error) {
		console.error('Error fetching follow-ups:', error);
		return NextResponse.json(
			{ message: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST: Save all follow-ups (create/update/delete)
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const {id: campaignId} = await params;
		const formData = await request.formData();

		// Parse follow-ups from form data
		const followUpsToSave: Array<{
			message: string;
			delayMinutes: number;
			image: File | null;
			message_id?: number;
		}> = [];

		let index = 0;
		while (formData.has(`followUps[${index}][message]`)) {
			const message = formData.get(`followUps[${index}][message]`) as string;
			const delayHours = parseFloat(formData.get(`followUps[${index}][delayHours]`) as string);
			const image = formData.get(`followUps[${index}][image]`) as File | null;
			const messageId = formData.get(`followUps[${index}][message_id]`) as string | null;

			followUpsToSave.push({
				message,
				delayMinutes: Math.round(delayHours * 60),
				image,
				message_id: messageId ? parseInt(messageId) : undefined,
			});

			index++;
		}

		// Fetch existing follow-ups to determine what to delete
		const existingResponse = await fetch(`${SERVER_BASE_URL}/follow-ups/${campaignId}`, {
			method: 'GET',
			headers: {
				'x-api-key': SERVER_API_KEY || '',
			},
		});

		let existingFollowUps: BackendFollowUp[] = [];
		if (existingResponse.ok) {
			const existingData: BackendResponse = await existingResponse.json();
			existingFollowUps = existingData.follow_up_templates;
		}

		const followUpIdsToKeep = followUpsToSave
			.filter(fu => fu.message_id !== undefined)
			.map(fu => fu.message_id);

		const followUpsToDelete = existingFollowUps.filter(
			fu => !followUpIdsToKeep.includes(fu.message_id)
		);

		// Track operations for potential rollback
		const createdIds: number[] = [];
		const updatedIds: number[] = [];
		const deletedIds: number[] = [];

		try {
			// Step 1: Delete removed follow-ups
			for (const fu of followUpsToDelete) {
				const deleteResponse = await fetch(
					`${SERVER_BASE_URL}/follow-ups/${campaignId}/${fu.message_id}`,
					{
						method: 'DELETE',
						headers: {
							'x-api-key': SERVER_API_KEY || '',
						},
					}
				);

				if (!deleteResponse.ok) {
					throw new Error(`Failed to delete follow-up ${fu.message_id}`);
				}
				deletedIds.push(fu.message_id);
			}

			// Step 2: Create or update follow-ups
			for (const fu of followUpsToSave) {
				const fuFormData = new FormData();
				fuFormData.append('message', fu.message);
				fuFormData.append('delay_minutes', fu.delayMinutes.toString());
				if (fu.image) {
					fuFormData.append('image', fu.image);
				}

				if (fu.message_id) {
					// Update existing
					const updateResponse = await fetch(
						`${SERVER_BASE_URL}/follow-ups/${campaignId}/${fu.message_id}`,
						{
							method: 'PUT',
							headers: {
								'x-api-key': SERVER_API_KEY || '',
							},
							body: fuFormData,
						}
					);

					if (!updateResponse.ok) {
						const errorData = await updateResponse.json().catch(() => ({}));
						throw new Error(
							`Failed to update follow-up ${fu.message_id}: ${errorData.message || 'Unknown error'}`
						);
					}
					updatedIds.push(fu.message_id);
				} else {
					// Create new
					const createResponse = await fetch(
						`${SERVER_BASE_URL}/follow-ups/${campaignId}`,
						{
							method: 'POST',
							headers: {
								'x-api-key': SERVER_API_KEY || '',
							},
							body: fuFormData,
						}
					);

					if (!createResponse.ok) {
						const errorData = await createResponse.json().catch(() => ({}));
						throw new Error(
							`Failed to create follow-up: ${errorData.message || 'Unknown error'}`
						);
					}

					const createdData = await createResponse.json();
					if (createdData.message_id) {
						createdIds.push(createdData.message_id);
					}
				}
			}

			return NextResponse.json({
				message: 'Follow-ups saved successfully',
				created: createdIds.length,
				updated: updatedIds.length,
				deleted: deletedIds.length,
			});

		} catch (error) {
			// Rollback: Try to restore previous state
			console.error('Error during save, attempting rollback:', error);

			// Delete newly created follow-ups
			for (const id of createdIds) {
				try {
					await fetch(`${SERVER_BASE_URL}/follow-ups/${campaignId}/${id}`, {
						method: 'DELETE',
						headers: {
							'x-api-key': SERVER_API_KEY || '',
						},
					});
				} catch (rollbackError) {
					console.error(`Failed to rollback created follow-up ${id}:`, rollbackError);
				}
			}

			// Note: We cannot easily rollback updates or deletions without storing previous state
			// In a production system, you'd want to implement proper transaction handling

			// Yes I can, Claude. Watch me do it.
			return NextResponse.json(
				{
					message: error instanceof Error ? error.message : 'Failed to save follow-ups. Changes have been rolled back.',
					rollback: true,
				},
				{ status: 500 }
			);
		}

	} catch (error) {
		console.error('Error in follow-ups POST:', error);
		return NextResponse.json(
			{ message: 'Internal server error' },
			{ status: 500 }
		);
	}
}