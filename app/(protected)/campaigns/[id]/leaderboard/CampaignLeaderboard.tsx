'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import ReferralLeaderboard from "@/app/(protected)/campaigns/_components/ReferralLeaderboard";
import type { Campaign } from "@/types/campaigns";
import PageLoader from "@/components/ui/PageLoader";

interface LeaderboardEntry {
    referrer_name: string;
    referrer_phone: string;
    points: number;
    total_referrals: number;
    rank: number;
}

interface Pagination {
    current_page: number;
    page_size: number;
    total_pages: number;
    total_entries: number;
}

interface CampaignWithLeaderboard {
    campaign_id: string;
    pagination: Pagination;
    leaderboard: LeaderboardEntry[];
}

export default function CampaignLeaderboard({ campaignId }: { campaignId: string; }) {
    const router = useRouter();

    const [leaderboardData, setLeaderboardData] = useState<CampaignWithLeaderboard | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCampaignLeaderboard = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/campaigns/${campaignId}/leaderboard`);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to fetch campaign leaderboard');
                }

                setLeaderboardData(result);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (campaignId) {
            fetchCampaignLeaderboard();
        }
    }, [campaignId]);

    const handleClose = () => {
        router.push('/campaigns');
    };

    if (loading) {
        return <PageLoader text={"Loading Campaign Analytics..."}/>
    }

    if (error || !leaderboardData) {
        return (
            <div className="flex flex-1 bg-yellow-50 items-center justify-center">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
                    <h3 className="text-lg font-semibold text-red-900 text-center mb-2">
                        Error Loading Campaign
                    </h3>
                    <p className="text-red-700 text-center mb-4">
                        {error || 'Campaign not found or leaderboard data unavailable'}
                    </p>
                    <button
                        onClick={handleClose}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Campaigns
                    </button>
                </div>
            </div>
        );
    }

    // Create a campaign object from the leaderboard data
    const campaign: Campaign = {
        campaign_id: leaderboardData.campaign_id,
        name: `Campaign ${leaderboardData.campaign_id}`,
        prizes: [],
        description: '',
        start_date: '',
        end_date: '',
        created_by: '',
        thumbnail_url: ''
    };

    return (
        <ReferralLeaderboard
            campaign={campaign}
            leaderboardData={leaderboardData}
            onClose={handleClose}
        />
    );
}