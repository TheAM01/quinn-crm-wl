import { NextRequest, NextResponse } from 'next/server';
import { tagCustomersInBatches } from '@/lib/tagCustomers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone_numbers, tag, batch_size } = body;

        if (!phone_numbers?.length || !tag)
            return NextResponse.json({ error: 'Missing phone_numbers or tag' }, { status: 400 });

        const results = await tagCustomersInBatches(phone_numbers, tag, batch_size || 10);

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return NextResponse.json({
            total: results.length,
            successful,
            failed,
            results,
        });
    } catch (err) {
        console.error('Error tagging customers:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
