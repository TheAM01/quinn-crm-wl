import { NextRequest, NextResponse } from 'next/server'
import FormData from 'form-data';

export async function POST(request: NextRequest) {
	try {
		console.log('=== Starting campaign creation ===');

		const formData = await request.formData();
		console.log('FormData keys:', Array.from(formData.keys()));

		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const start_date = formData.get('start_date') as string;
		const end_date = formData.get('end_date') as string;
		const created_by = formData.get('created_by') as string;
		const prizesStr = formData.get('prizes') as string;
		const thumbnail = formData.get('thumbnail') as File;

		console.log('Parsed fields:', { name, description, start_date, end_date, created_by, prizesStr });
		console.log('Thumbnail:', {
			name: thumbnail?.name,
			type: thumbnail?.type,
			size: thumbnail?.size
		});

		// Validate required fields
		if (!name || !start_date || !end_date || !created_by || !description || !thumbnail) {
			console.error('Missing required fields');
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Validate date logic
		const startDate = new Date(start_date);
		const endDate = new Date(end_date);

		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			console.error('Invalid date format');
			return NextResponse.json(
				{ error: 'Invalid date format' },
				{ status: 400 }
			);
		}

		if (endDate <= startDate) {
			console.error('End date before start date');
			return NextResponse.json(
				{ error: 'End date must be after start date' },
				{ status: 400 }
			);
		}

		// Prepare FormData using form-data package
		const externalFormData = new FormData();
		externalFormData.append('name', name);
		externalFormData.append('description', description);
		externalFormData.append('start_date', start_date);
		externalFormData.append('end_date', end_date);
		externalFormData.append('created_by', created_by);
		externalFormData.append('prizes', prizesStr || '');

		// Convert File to Buffer
		const fileBuffer = Buffer.from(await thumbnail.arrayBuffer());
		console.log('File buffer size:', fileBuffer.length);

		externalFormData.append('thumbnail', fileBuffer, {
			filename: thumbnail.name,
			contentType: thumbnail.type || 'image/png',
		});

		const serverBaseUrl = process.env.SERVER_BASE_URL;
		console.log('Server base URL:', serverBaseUrl);

		if (!serverBaseUrl) {
			console.error('SERVER_BASE_URL environment variable is not set');
			return NextResponse.json(
				{ error: 'Server configuration error' },
				{ status: 500 }
			);
		}

		const apiKey = process.env.SERVER_API_KEY ?? 'abcd';
		console.log('API Key (first 10 chars):', apiKey.substring(0, 10));

		// Log the headers that will be sent
		console.log('FormData headers:', externalFormData.getHeaders());

		// Parse URL
		const url = new URL('/campaigns/', serverBaseUrl);
		console.log('Full URL:', url.toString());
		console.log('Protocol:', url.protocol);
		console.log('Host:', url.host);
		console.log('Path:', url.pathname);

		// Submit to external API using the form-data submit method
		console.log('Submitting form...');
		const response = await new Promise<Response>((resolve, reject) => {
			externalFormData.submit({
				host: url.host,
				path: url.pathname,
				protocol: url.protocol as ("https:" | "http:" | undefined),
				method: 'POST',
				headers: {
					'x-api-key': apiKey,
				},
			}, (err, res) => {
				if (err) {
					console.error('Submit error:', err);
					reject(err);
					return;
				}

				console.log('Response received - Status:', res.statusCode);
				console.log('Response headers:', res.headers);

				let body = '';
				res.on('data', (chunk) => {
					body += chunk;
				});
				res.on('end', () => {
					console.log('Response body:', body);
					resolve(new Response(body, {
						status: res.statusCode,
						headers: new Headers(res.headers as HeadersInit),
					}));
				});
				res.on('error', (streamErr) => {
					console.error('Stream error:', streamErr);
					reject(streamErr);
				});
			});
		});

		console.log('Response status:', response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('External API error:', response.status, errorText);

			return NextResponse.json(
				{
					error: 'Failed to create campaign',
					details: response.status === 400 ? 'Invalid data provided' : 'Server error',
					apiResponse: errorText
				},
				{ status: response.status === 400 ? 400 : 500 }
			);
		}

		const responseData = await response.json();
		console.log('Success! Response data:', responseData);

		return NextResponse.json(
			{
				success: true,
				message: 'Campaign created successfully',
				data: responseData
			},
			{ status: 201 }
		);

	} catch (error) {
		console.error('Error creating campaign:', error);
		console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		console.error('Error cause:', error instanceof Error ? (error as Error & { cause?: unknown }).cause : 'No cause');

		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}


// Optional: Add GET method to fetch campaigns
export async function GET() {
	try {
		const serverBaseUrl = process.env.SERVER_BASE_URL

		if (!serverBaseUrl) {
			return NextResponse.json(
				{ error: 'Server configuration error' },
				{ status: 500 }
			)
		}

		const response = await fetch(`${serverBaseUrl}/campaigns`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.SERVER_API_KEY ?? 'abcd',
				// Add any additional headers like authorization if needed
			},
			cache: 'no-store',
			// Add cache control if needed
		})

		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Failed to fetch campaigns' },
				{ status: response.status }
			)
		}

		const campaigns = await response.json()

		return NextResponse.json({
			success: true,
			data: campaigns
		})

	} catch (error) {
		console.error('Error fetching campaigns:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

// DELETE method to delete a campaign
// DELETE method to delete a campaign
export async function DELETE(request: NextRequest) {
	try {
		const url = new URL(request.url)
		const campaignId = url.searchParams.get('id')

		if (!campaignId) {
			return NextResponse.json(
				{ error: 'Campaign ID is required' },
				{ status: 400 }
			)
		}

		const serverBaseUrl = process.env.SERVER_BASE_URL

		if (!serverBaseUrl) {
			return NextResponse.json(
				{ error: 'Server configuration error' },
				{ status: 500 }
			)
		}

		// Delete from external API
		const response = await fetch(`${serverBaseUrl}/campaigns/${campaignId.toUpperCase()}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.SERVER_API_KEY ?? 'abcd',
			}
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error('External API error:', response.status, errorText)

			if (response.status === 404) {
				return NextResponse.json(
					{ error: 'Campaign not found' },
					{ status: 404 }
				)
			}

			return NextResponse.json(
				{ error: 'Failed to delete campaign' },
				{ status: response.status }
			)
		}

		return NextResponse.json({
			success: true,
			message: 'Campaign deleted successfully'
		})

	} catch (error) {
		console.error('Error deleting campaign:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}