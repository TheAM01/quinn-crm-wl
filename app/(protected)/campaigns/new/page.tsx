import NewCampaignClient from "./NewCampaignClient"
import {requireAdmin} from "@/lib/auth/require-admin";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";

export default async function CampaignsPage() {
	await requireAdmin();

	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();

	if (!user) redirect(("/auth/login"));

	return <NewCampaignClient user={user} />
}