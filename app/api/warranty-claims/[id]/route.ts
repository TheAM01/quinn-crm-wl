// app/api/warranty-claims/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Attachment {
    filename: string;
    url: string;
    file_type: string;
}

interface UpdateClaimBody {
    status?: string;
    notes?: string;
    attachment?: Attachment;
}

interface UpdateResponse {
    success: boolean;
    message: string;
}

interface ErrorResponse {
    error: string;
}

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'YOUR_SERVER_BASE_URL';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdateResponse | ErrorResponse>> {
    try {
        const {id: claimId} = await params;
        const body = await request.json() as UpdateClaimBody;

        const response = await fetch(
            `${SERVER_BASE_URL}/warranty-claims/${claimId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': `${process.env.SERVER_API_KEY}`
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.message || 'Failed to update warranty claim' },
                { status: response.status }
            );
        }

        const data = await response.json() as UpdateResponse;

        return NextResponse.json({
            success: true,
            message: data.message || 'Warranty claim updated successfully',
        });
    } catch (error) {
        console.error('Error updating warranty claim:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}