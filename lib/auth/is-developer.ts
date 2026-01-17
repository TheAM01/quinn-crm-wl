import {createClient} from "@/lib/supabase/server";
import {developers} from "@/lib/developers";

export async function isDeveloper() {
	const supabase = await createClient();

	const {data, error} = await supabase.auth.getUser();
	if (error || !data?.user) return false;

	const email = data.user.email;
	if (!email) return false;

	return developers.includes(email);
}