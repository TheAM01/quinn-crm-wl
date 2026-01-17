import { NextRequest, NextResponse } from 'next/server';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL;
const SERVER_API_KEY = process.env.SERVER_API_KEY;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const response = await fetch(`${SERVER_BASE_URL}/campaigns/${id}`, {
            headers: {
                'x-api-key': `${SERVER_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch campaign');
        }

        const templateDetails = await response.json();
        return NextResponse.json(templateDetails);
    } catch (error) {
        console.error('Error fetching campaign data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaign' },
            { status: 500 }
        );
    }
}