export interface Prize {
	name: string;
	quantity: number;
}

export interface CampaignData {
	name: string;
	prizes: Prize[];
	description: string;
	start_date: string;
	end_date: string;
	created_by: string;
	thumbnail: File | null; // Changed from thumbnail_url: string
}