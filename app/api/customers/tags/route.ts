import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const customersRes = await fetch(`${process.env.SERVER_BASE_URL || ""}/customers/tags`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-api-key': process.env.SERVER_API_KEY || "",
            },
            cache: 'no-store'
        });

        if (!customersRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await customersRes.json();
        return NextResponse.json(data);

    } catch (err) {
        console.error('Error fetching customers:', err);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}