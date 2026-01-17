import CampaignLeaderboard from "./CampaignLeaderboard"
import {requireAdmin} from "@/lib/auth/require-admin";
import checkCampaign from "@/lib/checks/check-campaign";

export default async function CampaignsPageWrapper({ params }: { params: Promise<{id: string}> }) {
    await requireAdmin()
    const {id} = await params;
    await checkCampaign(id);
    return <CampaignLeaderboard campaignId={id} />
}