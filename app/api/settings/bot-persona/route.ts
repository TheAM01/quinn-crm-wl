import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { persona } = body;

		// Validate the persona data
		if (!persona || typeof persona !== 'string' || persona.trim().length === 0) {
			return NextResponse.json(
				{ error: 'Persona is required and must be a non-empty string' },
				{ status: 400 }
			);
		}

		// Simulate processing time
		await new Promise(resolve => setTimeout(resolve, 500));

		return NextResponse.json({
			success: true,
			message: 'Bot persona updated successfully',
			data: {
				persona: persona.trim(),
				updatedAt: new Date().toISOString()
			}
		});

	} catch (error) {
		console.error('Error updating bot persona:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}