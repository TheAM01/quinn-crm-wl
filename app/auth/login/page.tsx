import { LoginForm } from "@/components/supabase/login-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getClaims();

	if (!error && data?.claims) {
		redirect("/dashboard?already-logged-in=true");
	}

	const params = await searchParams;
	const redirectTo = params["redirect-to"] ?? null;

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-stone-900">
			<div className="w-full max-w-sm">
				<LoginForm redirectTo={redirectTo} />
			</div>
		</div>
	);
}
