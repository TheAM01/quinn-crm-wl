// app/api/products/route.ts
import { NextResponse } from 'next/server';

interface Product {
    product_id: string;
    created_at: string;
    current_quantity: number;
    inventory_item_id: number;
    variant_id: number;
    product_title: string;
    slug: string;
    image_url: string | null;
    updated_at: string;
}

interface ProductsAPIResponse {
    success: boolean;
    count: number;
    products: Product[];
}

interface ErrorResponse {
    success: false;
    error: string;
    message: string;
}

export async function GET(): Promise<NextResponse<ProductsAPIResponse | ErrorResponse>> {
    try {
        const baseUrl = process.env.SERVER_BASE_URL;
        const apiKey = process.env.SERVER_API_KEY;

        if (!baseUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Configuration error',
                    message: 'SERVER_BASE_URL is not configured'
                },
                { status: 500 }
            );
        }

        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Configuration error',
                    message: 'SERVER_API_KEY is not configured'
                },
                { status: 500 }
            );
        }

        const response = await fetch(`${baseUrl}/shopify/products`, {
            headers: {
                'x-api-key': apiKey,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json() as ProductsAPIResponse;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch products',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}