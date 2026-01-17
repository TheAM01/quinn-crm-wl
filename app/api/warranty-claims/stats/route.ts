import {NextResponse} from "next/server";

interface StatsResponse {
    total_claims: number;
    pending_claims: number;
    approved_claims: number;
    rejected_claims: number;
}
interface ErrorResponse {
    error: string;
}
export async function GET(): Promise<NextResponse<StatsResponse | ErrorResponse>> {
    try {
        const response = await fetch(
            `${process.env.SERVER_BASE_URL}/warranty-claims/stats`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': `${process.env.SERVER_API_KEY}`
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch warranty claim stats' },
                { status: response.status }
            );
        }

        const data = await response.json() as StatsResponse;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching warranty claim stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}