"use client";

import { useState } from 'react';
import {MoreVertical, Calendar, Trophy, Send, List} from 'lucide-react';
import BroadcastModal from './BroadcastModal';
import {Campaign} from "@/types/campaigns";
import Toast from "@/components/ui/Toast";
import Link from 'next/link';


interface DropDownMenuProps { campaign: Campaign; isOpen: boolean; onViewAnalytics?: (campaign: string) => void; onDelete: (campaign: string) => void;}

const DropdownMenu = ({ campaign, isOpen, onDelete }: DropDownMenuProps) => {
	if (!isOpen) return null;

	return (
		<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 flex flex-col">
			{/*<button*/}
			{/*	onClick={() => onViewAnalytics(campaign.campaign_id)}*/}
			{/*	className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"*/}
			{/*>*/}
			{/*	View Analytics*/}
			{/*</button>*/}
			<button
				onClick={() => onDelete(campaign.campaign_id)}
				className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
			>
				Delete Campaign
			</button>
		</div>
	);
};

const CampaignCard = ({
						  campaign,
						  openDropdownId,
						  onToggleDropdown,
						  onViewAnalytics,
						  onDelete
					  }: {
	campaign: Campaign;
	openDropdownId: string | null;
	onToggleDropdown: (id: string, e: React.MouseEvent) => void;
	onViewAnalytics: (id: string) => void;
	onDelete: (id: string) => void;
}) => {
	const [showBroadcastModal, setShowBroadcastModal] = useState(false);
	const [toast, setToast] = useState({
		show: false,
		message: '',
		type: 'success'
	});

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getStatusBadge = (status: boolean, startDate: string, endDate: string) => {
		const now = new Date();
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (!status) return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Inactive</span>;
		if (now < start) return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Upcoming</span>;
		if (now > end) return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Ended</span>;
		return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Active</span>;
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

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-xl transition-all overflow-hidden group">
			{/* Image Banner - Full Width */}
			{campaign.thumbnail_url && (
				<div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-yellow-100 to-yellow-200">
					<img
						src={campaign.thumbnail_url}
						alt="campaign banner"
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>
					{/* Gradient Overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

					{/* Status Badge Overlay */}
					<div className="absolute top-4 left-4">
						{getStatusBadge(true, campaign.start_date, campaign.end_date)}
					</div>

					{/* Dropdown Menu Overlay */}
					<div className="absolute top-4 right-4">
						<div className="relative">
							<button
								onClick={(e) => onToggleDropdown(campaign.campaign_id, e)}
								className="p-2 bg-white/30 backdrop-blur-sm text-gray-700 hover:bg-white/80 rounded-lg transition-colors shadow-sm duration-20"
							>
								<MoreVertical className="w-4 h-4"/>
							</button>
							<DropdownMenu
								campaign={campaign}
								isOpen={openDropdownId === campaign.campaign_id}
								onViewAnalytics={onViewAnalytics}
								onDelete={onDelete}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Content Section */}
			<div className="p-6">
				{/* Header */}
				<div className="mb-4">
					<div className="flex items-start justify-between mb-2">
						<h3 className="text-2xl font-bold text-gray-900 flex-1 group-hover:text-yellow-600 transition-colors">
							{campaign.name}
						</h3>
						{!campaign.thumbnail_url && (
							<div className="flex items-center gap-2">
								{getStatusBadge(true, campaign.start_date, campaign.end_date)}
								<div className="relative">
									<button
										onClick={(e) => onToggleDropdown(campaign.campaign_id, e)}
										className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
									>
										<MoreVertical className="w-4 h-4"/>
									</button>
									<DropdownMenu
										campaign={campaign}
										isOpen={openDropdownId === campaign.campaign_id}
										onViewAnalytics={onViewAnalytics}
										onDelete={onDelete}
									/>
								</div>
							</div>
						)}
					</div>
					<p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
						ID: {campaign.campaign_id}
					</p>
				</div>

				{/* Description */}
				<p className="text-gray-700 mb-4 leading-relaxed line-clamp-2">
					{campaign.description}
				</p>

				{/* Date Range with Visual Bar */}
				<div className="mb-4">
					<div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
						<div className="flex items-center gap-1.5">
							<Calendar className="w-4 h-4 text-yellow-600"/>
							<span className="font-medium">{formatDate(campaign.start_date)}</span>
						</div>
						<div className="flex-1 h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full" />
						<span className="font-medium">{formatDate(campaign.end_date)}</span>
					</div>
				</div>

				{/* Prizes Section */}
				{campaign.prizes.length > 0 && (
					<div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
						<div className="flex items-center gap-2 mb-2">
							<Trophy className="w-4 h-4 text-yellow-600" />
							<span className="text-sm font-semibold text-gray-900">
								{campaign.prizes.length} {campaign.prizes.length === 1 ? 'Prize' : 'Prizes'} Available
							</span>
						</div>

						<div className="flex flex-wrap gap-2">
							{campaign.prizes.slice(0, 3).map((prize, index) => (
								<span
									key={index}
									className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-medium shadow-sm"
								>
									{prize.name} — x{prize.quantity}
								</span>
							))}

							{campaign.prizes.length > 3 && (
								<span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium shadow-sm">
									+{campaign.prizes.length - 3} more
								</span>
							)}
						</div>
					</div>
				)}


				{/* Footer */}
				<div className="flex items-center justify-between pt-4 border-t border-gray-100">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
							{campaign.created_by.charAt(0).toUpperCase()}
						</div>
						<span className="text-xs text-gray-600">
							{campaign.created_by}
						</span>
					</div>

					{false && <div className="flex items-center gap-2">
						{new Date(campaign.end_date) > new Date() ? (
							<button
								onClick={() => setShowBroadcastModal(true)}
								className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
							>
								<Send className="w-4 h-4"/>
								<span>Broadcast</span>
							</button>
						) : (
							<div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg">
								Ended
							</div>
						)}
					</div>}

					<Link
						href={`/campaigns/${campaign.campaign_id}`}
						className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm border border-gray-800"
					>
						<List className="w-4 h-4"/>
						<span>See Details</span>
					</Link>


				</div>

				{/*<div className="flex items-center justify-end gap-4 mt-4">*/}
				{/*	<Link*/}
				{/*		href={`/campaigns/${campaign.campaign_id}/follow-ups`}*/}
				{/*		className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm border border-gray-800"*/}
				{/*	>*/}
				{/*		<ArrowUpCircle className="w-4 h-4"/>*/}
				{/*		<span>Follow Ups</span>*/}
				{/*	</Link>*/}

				{/*	<Link*/}
				{/*		href={`/campaigns/${campaign.campaign_id}/orders`}*/}
				{/*		className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm border border-gray-300"*/}
				{/*	>*/}
				{/*		<ShoppingBag className="w-4 h-4"/>*/}
				{/*		<span>Orders</span>*/}
				{/*	</Link>*/}

				{/*	<Link*/}
				{/*		href={`/campaigns/${campaign.campaign_id}/leaderboard`}*/}
				{/*		className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm border border-gray-300"*/}
				{/*	>*/}
				{/*		<Award className="w-4 h-4"/>*/}
				{/*		<span>Leaderboard</span>*/}
				{/*	</Link>*/}
				{/*</div>*/}
			</div>

			<BroadcastModal
				isOpen={showBroadcastModal}
				onClose={() => setShowBroadcastModal(false)}
				campaignId={campaign.campaign_id}
				onSuccess={handleBroadcastSuccess}
			/>

			<Toast
				message={toast.message}
				type={toast.type as ('success' | 'error' )}
				show={toast.show}
				onClose={hideToast}
			/>
		</div>
	);
};

export default CampaignCard;