import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ phone: string }> }
) {

    const { phone } = await params;

    try {
        // Validate required fields
        if (!phone) {
            return NextResponse.json(
                { error: 'Phone parameter is required' },
                { status: 400 }
            );
        }

        // First, fetch the existing customer data
        const getResponse = await fetch(`${process.env.SERVER_BASE_URL}/customers/${phone}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.SERVER_API_KEY!
            },
        });

        if (!getResponse.ok) {
            throw new Error(`Failed to fetch customer: ${getResponse.status}`);
        }

        const customerData = await getResponse.json();

        // Add "blocked" tag to existing tags
        const existingTags = customerData.tags || [];
        const updatedTags = existingTags.includes("blocked")
            ? existingTags
            : [...existingTags, "blocked"];

        // Update the customer data with the blocked tag
        const updatedData = {
            ...customerData,
            tags: updatedTags
        };

        // Now perform the PUT request with updated data
        const response = await fetch(`${process.env.SERVER_BASE_URL}/customers/${phone}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.SERVER_API_KEY!
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Error blocking customer:', error);
        return NextResponse.json(
            { error: 'Failed to block customer' },
            { status: 500 }
        );
    }

}