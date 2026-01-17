import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { original_message } = body;

		if (!original_message || typeof original_message !== 'string') {
			return NextResponse.json(
				{ message: 'original_message is required and must be a string' },
				{ status: 400 }
			);
		}

		const serverBaseUrl = process.env.SERVER_BASE_URL;
		const serverApiKey = process.env.SERVER_API_KEY;

		if (!serverBaseUrl) {
			return NextResponse.json(
				{ message: 'Server configuration error: SERVER_BASE_URL not set' },
				{ status: 500 }
			);
		}

		if (!serverApiKey) {
			return NextResponse.json(
				{ message: 'Server configuration error: SERVER_API_KEY not set' },
				{ status: 500 }
			);
		}

		const response = await fetch(`${serverBaseUrl}/ai/improve-message`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': serverApiKey,
			},
			body: JSON.stringify({
                original_message,
                system_prompt: `You are an expert English language assistant specializing in grammar correction and writing assistance.
Your task is to correct the message provided. You will enhance the clarity, grammar, and style of the message while preserving its original meaning.
You must make it sound more professional and appropriate. You must not, however, add any additional information or explanation.
Only return the corrected message. Translate the message into English if it isn't`
            }),
		});

        // return NextResponse.json({
        //     improved_message: "Example"
        // });

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return NextResponse.json(
				{ message: errorData.message || 'Failed to enhance message' },
				{ status: response.status }
			);
		}

		const data = await response.json();
        console.log(data)
		return NextResponse.json(data);
	} catch (error) {
		console.error('Error in /api/ai/enhance:', error);
		return NextResponse.json(
			{ message: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
}
