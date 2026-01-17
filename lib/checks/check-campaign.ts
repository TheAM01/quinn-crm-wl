import {Campaign} from "@/types/campaigns";
import { redirect } from "next/navigation";

export default async function checkCampaign(id: string) {

	try {
		const response = await fetch(`${process.env.SERVER_BASE_URL}/campaigns`, {
			cache: 'no-store',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.SERVER_API_KEY!
			}
		});

		if (!response.ok) {
			throw new Error('Failed to fetch campaigns');
		}

		const campaigns = await response.json();
		console.log(campaigns)
		// Check if the campaign ID exists in the list
		const campaignExists = campaigns.some((campaign: Campaign) => campaign.campaign_id === id);

		if (!campaignExists) {
			return redirect("/campaigns");
		}

	} catch (error) {
		console.error('Error validating campaign:', error);
		return redirect("/campaigns");
	}

}