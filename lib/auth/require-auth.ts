import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function requireAuth() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getClaims();

	// Auto-detect current path + query
	const h = await headers();
	const pathname = h.get("x-pathname") || "";
	const search = h.get("x-search") || "";
	const fullPath = `${pathname}${search ? `?${search}` : ""}`;

	const loginURL = `/auth/login?redirect-to=${encodeURIComponent(fullPath)}`;

	if (error || !data?.claims) {
		redirect(loginURL);
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect(loginURL);
	}

	return user;
}
