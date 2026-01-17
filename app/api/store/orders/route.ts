// app/api/orders/route.ts
import { NextResponse } from 'next/server';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000';
const SERVER_API_KEY = process.env.SERVER_API_KEY;

export async function GET() {
    try {
        // Check if API key is configured
        if (!SERVER_API_KEY) {
            return NextResponse.json(
                { error: 'Server API key not configured' },
                { status: 500 }
            );
        }

        // Fetch from your server
        const response = await fetch(`${SERVER_BASE_URL}/shopify/orders`, {
            method: 'GET',
            headers: {
                'x-api-key': SERVER_API_KEY,
                'Content-Type': 'application/json',
            },
            // Optional: Add cache control
            next: { revalidate: 60 }, // Revalidate every 60 seconds
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch orders',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Optional: Add POST handler if you need to create orders
