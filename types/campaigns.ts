import {Prize} from "@/types/campaigns2";

export interface Campaign {
	name: string;
	prizes: Prize[],
	description: string;
	start_date: string;
	end_date: string;
	created_by: string;
	thumbnail_url: string;
	campaign_id: string;
}

export interface CustomerTarget {
	phone_number: string;
	customer_name: string;
}

export interface CreateCampaignFormData {
	name: string
	start_date: string
	end_date: string
	description: string
	prizes: string[],
	targets: CustomerTarget[]
}

export interface User {
	id: string;
	email?: string;
}

export interface CampaignsPageProps {
	user: User | null;
}

export interface CampaignAnalytics {
	totalReferrals: number
	successfulReferrals: number
	totalPoints: number
	averagePointsPerUser: number
	topReferrers: { name: string; referrals: number; points: number }[]
	dailyStats: { date: string; referrals: number; chats: number }[]
	conversionRate: number
	totalChats: number
	uniqueUsers: number
	pointsDistributed: number
}
