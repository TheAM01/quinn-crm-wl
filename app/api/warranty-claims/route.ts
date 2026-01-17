// app/api/warranty-claims/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Attachment {
    url: string;
    filename: string;
    file_type?: string;
    type?: string;
    uploaded_at?: string;
}

interface WarrantyClaim {
    id: string;
    customer_phone: string;
    product_name: string;
    issue_description: string;
    order_id: string | null;
    attachments: Attachment[];
    notes: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

interface PaginationInfo {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
}

interface ApiResponse {
    claims: WarrantyClaim[];
    pagination: PaginationInfo;
}

interface ErrorResponse {
    error: string;
}

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'YOUR_SERVER_BASE_URL';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse | ErrorResponse>> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = searchParams.get('limit') || '100';
        const offset = searchParams.get('offset') || '0';

        const response = await fetch(
            `${SERVER_BASE_URL}/warranty-claims/all?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': `${process.env.SERVER_API_KEY}`
                },
                cache: 'no-store', // Disable caching for real-time data
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch warranty claims' },
                { status: response.status }
            );
        }

        const data = await response.json() as WarrantyClaim[];

        return NextResponse.json({
            claims: data,
            pagination: {
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                total: data.length,
                hasMore: data.length === parseInt(limit, 10),
            },
        });
    } catch (error) {
        console.error('Error fetching warranty claims:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// app/api/warranty-claims/stats/route.ts
// Create this as a separate file at: app/api/warranty-claims/stats/route.ts

