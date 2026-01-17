// app/api/quick-messages/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: userData, error: authError } = await supabase.auth.getUser();

        if (authError || !userData.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { messages } = body; // Array of { message_id, display_order }

        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // Update each message's display_order
        const updatePromises = messages.map(({ message_id, display_order }) =>
            supabase
                .from('quick_messages')
                .update({ display_order })
                .eq('message_id', message_id)
        );

        const results = await Promise.all(updatePromises);

        // Check if any update failed
        const failed = results.find(result => result.error);
        if (failed) {
            return NextResponse.json({ error: failed?.error?.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering quick messages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}