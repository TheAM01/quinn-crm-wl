// app/api/quick-messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: userData, error: authError } = await supabase.auth.getUser();

        if (authError || !userData.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope'); // 'global', 'self', or 'all'

        let query = supabase
            .from('quick_messages')
            .select('*')
            .order('display_order', { ascending: true });

        if (scope === 'global') {
            query = query.eq('email', 'global');
        } else if (scope === 'self') {
            query = query.eq('email', userData.user.email);
        } else {
            // Return both global and user's personal messages
            query = query.or(`email.eq.global,email.eq.${userData.user.email}`);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages: data || [] });
    } catch (error) {
        console.error('Error fetching quick messages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: userData, error: authError } = await supabase.auth.getUser();

        if (authError || !userData.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { message, scope = 'self' } = body;

        if (!message || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Determine email based on scope
        const email = scope === 'global' ? 'global' : userData.user.email!;

        // Check message limit
        const { count } = await supabase
            .from('quick_messages')
            .select('*', { count: 'exact', head: true })
            .eq('email', email);

        const limit = email === 'global' ? 50 : 20;

        if (count !== null && count >= limit) {
            return NextResponse.json({
                error: `Maximum ${limit} messages allowed for ${scope} messages`
            }, { status: 400 });
        }

        // Get the next display_order
        const { data: lastMessage } = await supabase
            .from('quick_messages')
            .select('display_order')
            .eq('email', email)
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const nextOrder = lastMessage ? lastMessage.display_order + 1 : 1;

        const { data, error } = await supabase
            .from('quick_messages')
            .insert({
                email,
                message: message.trim(),
                display_order: nextOrder,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating quick message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}