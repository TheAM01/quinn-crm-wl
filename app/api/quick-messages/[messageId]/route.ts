// app/api/quick-messages/[messageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: userData, error: authError } = await supabase.auth.getUser();

        if (authError || !userData.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId } = await params;
        const body = await request.json();
        const { message } = body;

        if (!message || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('quick_messages')
            .update({
                message: message.trim(),
                updated_at: new Date().toISOString(),
            })
            .eq('message_id', messageId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: data });
    } catch (error) {
        console.error('Error updating quick message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: userData, error: authError } = await supabase.auth.getUser();

        if (authError || !userData.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId } = await params;

        const { error } = await supabase
            .from('quick_messages')
            .delete()
            .eq('message_id', messageId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting quick message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}