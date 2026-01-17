import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function requireSuperAdmin() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getClaims();

	// Auto-detect current path + search params
	const h = await headers();
	const pathname = h.get("x-pathname") || "";
	const search = h.get("x-search") || "";
	const fullPath = `${pathname}${search ? `?${search}` : ""}`;

	const loginURL = `/auth/login?redirect-to=${encodeURIComponent(fullPath)}`;
	console.log(loginURL)
	if (error || !data?.claims) {
		redirect(loginURL);
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isSuperAdmin =
		user?.user_metadata?.role === "super_admin" ||
		user?.app_metadata?.is_super_admin === true;

	if (!isSuperAdmin) {
		redirect("/dashboard");
	}

	return user;
}
