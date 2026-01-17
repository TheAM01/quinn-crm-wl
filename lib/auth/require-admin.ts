import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function requireAdmin() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getClaims();

	// Get full URL path + search params
	const h = await headers();
	const pathname = h.get("x-pathname") || "";       // Next injects this automatically
	const search = h.get("x-search") || "";           // includes ?a=1&b=2 etc

	const fullPath = `${pathname}${search ? `?${search}` : ""}`;
	const loginURL = `/auth/login?redirect-to=${encodeURIComponent(fullPath)}`;

	if (error || !data?.claims) {
		redirect(loginURL);
	}

	const { data: { user } } = await supabase.auth.getUser();

	const isAdmin =
		user?.user_metadata?.role === "admin" ||
		user?.user_metadata?.role === "super_admin" ||
		user?.app_metadata?.is_super_admin === true;

	if (!isAdmin) {
		redirect("/dashboard");
	}

	return user;
}
