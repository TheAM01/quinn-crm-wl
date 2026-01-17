import { NextRequest, NextResponse } from 'next/server';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8000';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        // Fetch leaderboard data from backend
        const response = await fetch(
            `${SERVER_BASE_URL}/analytics/leaderboard/${id}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': `${process.env.SERVER_API_KEY}`
                },
                cache: 'no-store', // Disable caching for real-time data
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { 
                    error: errorData.error || 'Failed to fetch leaderboard data',
                    details: errorData 
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}