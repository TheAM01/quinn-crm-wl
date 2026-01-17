import NotificationSettingsClient from "./NotificationsBroadcastClient";
import { requireAdmin } from "@/lib/auth/require-admin";
import supabaseAdmin from "@/lib/supabase/server-client";
import { type User } from "@supabase/supabase-js";

export default async function NotificationsBroadcast() {
    await requireAdmin();

    // fetch users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;

    // convert raw users to your AppUser type
    const appUsers = users.map((u: User) => {
        const role = u.user_metadata?.role ?? "representative";
        // console.log(u)
        const name =
            `${u.user_metadata?.first_name ?? ""} ${u.user_metadata?.last_name ?? ""}`.trim() ||
            u.email ||
            "Unknown";

        return {
            id: u.id,
            email: u.email ?? "",
            name,
            role: role === "user" ? "representative" : role,
        };
    });

    return <NotificationSettingsClient users={appUsers} />;
}
