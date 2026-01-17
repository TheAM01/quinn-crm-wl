// lib/supabase/server-client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,       // your Supabase URL
    process.env.SUPABASE_SERVICE_ROLE_KEY!,      // service role key (server-only)
    {
        auth: {
            persistSession: false,                   // optional, since this is server
        },
    }
);

export default supabaseAdmin;
