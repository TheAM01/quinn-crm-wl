import CampaignsClient from "./CampaignsClient"
import { createClient } from '@/lib/supabase/server'
import {requireAdmin} from "@/lib/auth/require-admin";
import {redirect} from "next/navigation";

export default async function CampaignsPage() {
	await requireAdmin()

	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();

	if (!user) redirect(("/auth/login"));

	return <CampaignsClient user={user} />
}