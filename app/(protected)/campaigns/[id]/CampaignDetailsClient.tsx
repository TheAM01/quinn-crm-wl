'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpCircle, ShoppingBag, Award, Calendar, Package, Send } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import BroadcastModal from '../_components/BroadcastModal';
import Toast from '@/components/ui/Toast';
import PageLoader from "@/components/ui/PageLoader";

interface Prize {
	name: string;
	quantity: number;
}

interface Campaign {
	name: string;
	prizes: Prize[];
	description: string;
	start_date: string;
	end_date: string;
	created_by: string;
	thumbnail_url: string;
	campaign_id: string;
}


export default function CampaignDetails({ campaignId }: { campaignId: string; }) {
	const [campaign, setCampaign] = useState<Campaign | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showBroadcastModal, setShowBroadcastModal] = useState(false);
	const [toast, setToast] = useState({
		show: false,
		message: '',
		type: 'success'
	});

	useEffect(() => {
		const fetchCampaign = async () => {
			try {
				const response = await fetch(`/api/campaigns/${campaignId}`);
				if (!response.ok) throw new Error('Failed to fetch campaign');
				const data = await response.json();
				setCampaign(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};

		void fetchCampaign();
	}, [campaignId]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const getCampaignStatus = (startDate: string, endDate: string) => {
		const now = new Date();
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (now < start) {
			return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800 border-blue-200' };
		} else if (now > end) {
			return { label: 'Ended', color: 'bg-gray-100 text-gray-800 border-gray-200' };
		} else {
			return { label: 'Active', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
		}
	};

	const handleBroadcastSuccess = () => {
		setToast({
			show: true,
			message: 'Broadcast sent successfully!',
			type: 'success'
		});
		setTimeout(() => {
			setToast(prev => ({ ...prev, show: false }));
		}, 3000);
	};

	const hideToast = () => {
		setToast(prev => ({ ...prev, show: false }));
	};

	if (loading) {
		return <PageLoader text={`Loading campaign ${campaignId}...`}/>
	}

	if (error || !campaign) {
		return (
			<div className="flex flex-1 min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-red-600">{error || 'Campaign not found'}</div>
			</div>
		);
	}

	const status = getCampaignStatus(campaign.start_date, campaign.end_date);

	return (
		<div className="min-h-screen bg-gray-50 flex flex-1 flex-col ">
			{/* Thumbnail */}
			<div className="w-full h-80 bg-gray-200 relative">
				<img
					src={campaign.thumbnail_url}
					alt={campaign.name}
					className="w-full h-full object-cover"
				/>
			</div>

			{/* Content */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				<div className="mb-6">
					<BackButton />
				</div>

				{/* Campaign Header */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
					<div className="flex items-start justify-between mb-6">
						<div className="flex-1">
							<div className="flex items-center gap-3 mb-3">
								<h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
								<span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                  {status.label}
                </span>
							</div>
							<p className="text-gray-600 text-sm mb-4">Campaign ID: {campaign.campaign_id}</p>
						</div>
					</div>

					<p className="text-gray-700 leading-relaxed mb-6">{campaign.description}</p>

					{/* Campaign Info Grid */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						<div className="flex items-start gap-3">
							<div className="p-2 bg-yellow-50 rounded-lg">
								<Calendar className="w-5 h-5 text-yellow-600" />
							</div>
							<div>
								<p className="text-xs text-gray-500 font-medium mb-1">Start Date</p>
								<p className="text-sm font-semibold text-gray-900">{formatDate(campaign.start_date)}</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="p-2 bg-yellow-50 rounded-lg">
								<Calendar className="w-5 h-5 text-yellow-600" />
							</div>
							<div>
								<p className="text-xs text-gray-500 font-medium mb-1">End Date</p>
								<p className="text-sm font-semibold text-gray-900">{formatDate(campaign.end_date)}</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<div className="p-2 bg-yellow-50 rounded-lg">
								<Package className="w-5 h-5 text-yellow-600" />
							</div>
							<div>
								<p className="text-xs text-gray-500 font-medium mb-1">Created By</p>
								<p className="text-sm font-semibold text-gray-900">{campaign.created_by}</p>
							</div>
						</div>
					</div>

					{/* Prizes */}
					<div className="border-t border-gray-200 pt-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Prizes</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{campaign.prizes.map((prize, index) => (
								<div
									key={index}
									className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-yellow-400 transition-colors"
								>
									<div className="flex items-center justify-between">
										<p className="font-medium text-gray-900">{prize.name}</p>
										<span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full">
                      x{prize.quantity}
                    </span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Management</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{new Date(campaign.end_date) > new Date() ? (
							<button
								onClick={() => setShowBroadcastModal(true)}
								className="group p-6 bg-gray-900 hover:bg-black text-white rounded-lg transition-all shadow-sm border border-gray-800 hover:shadow-md"
							>
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 bg-yellow-400 rounded-lg group-hover:bg-yellow-500 transition-colors">
										<Send className="w-5 h-5 text-gray-900" />
									</div>
									<span className="font-semibold">Broadcast</span>
								</div>
								<p className="text-sm text-gray-300">Invite customers to participate</p>
							</button>
						) : (
							<div className="p-6 bg-gray-100 rounded-lg border border-gray-200">
								<div className="flex items-center gap-3 mb-3">
									<div className="p-2 bg-gray-300 rounded-lg">
										<Send className="w-5 h-5 text-gray-500" />
									</div>
									<span className="font-semibold text-gray-500">Broadcast</span>
								</div>
								<p className="text-sm text-gray-500">Campaign has ended</p>
							</div>
						)}

						<Link
							href={`/campaigns/${campaign.campaign_id}/follow-ups`}
							className="group p-6 bg-white hover:bg-gray-50 text-gray-900 rounded-lg transition-all shadow-sm border border-gray-300 hover:border-yellow-400"
						>
							<div className="flex items-center gap-3 mb-3">
								<div className="p-2 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition-colors">
									<ArrowUpCircle className="w-5 h-5 text-yellow-600" />
								</div>
								<span className="font-semibold">Follow Ups</span>
							</div>
							<p className="text-sm text-gray-600">Manage follow up messages for campaign participants</p>
						</Link>

						<Link
							href={`/campaigns/${campaign.campaign_id}/orders`}
							className="group p-6 bg-white hover:bg-gray-50 text-gray-900 rounded-lg transition-all shadow-sm border border-gray-300 hover:border-yellow-400"
						>
							<div className="flex items-center gap-3 mb-3">
								<div className="p-2 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition-colors">
									<ShoppingBag className="w-5 h-5 text-yellow-600" />
								</div>
								<span className="font-semibold">Orders</span>
							</div>
							<p className="text-sm text-gray-600">See orders placed by campaign participants</p>
						</Link>

						<Link
							href={`/campaigns/${campaign.campaign_id}/leaderboard`}
							className="group p-6 bg-white hover:bg-gray-50 text-gray-900 rounded-lg transition-all shadow-sm border border-gray-300 hover:border-yellow-400"
						>
							<div className="flex items-center gap-3 mb-3">
								<div className="p-2 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition-colors">
									<Award className="w-5 h-5 text-yellow-600" />
								</div>
								<span className="font-semibold">Leaderboard</span>
							</div>
							<p className="text-sm text-gray-600">View top participants in campaign</p>
						</Link>
					</div>
				</div>
			</div>

			<BroadcastModal
				isOpen={showBroadcastModal}
				onClose={() => setShowBroadcastModal(false)}
				campaignId={campaign.campaign_id}
				onSuccess={handleBroadcastSuccess}
			/>

			<Toast
				message={toast.message}
				type={toast.type as ('success' | 'error')}
				show={toast.show}
				onClose={hideToast}
			/>
		</div>
	);
}