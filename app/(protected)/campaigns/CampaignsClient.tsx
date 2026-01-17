'use client';

import {useState, useEffect} from 'react';
import {redirect, useRouter} from 'next/navigation';
import Link from 'next/link';
import {Plus} from "lucide-react";

import Toast from '@/components/ui/Toast';
import SearchBar from "@/components/ui/SearchBar";
import {PageHeading} from "@/components/ui/Structure";

import StatsGrid from "./_components/StatsGrid";
import LoadingSkeleton from "./_components/LoadingSkeleton";
import CampaignCard from "./_components/CampaignCard";
import EmptyState from "./_components/EmptyState";
import DeleteConfirmationModal from "./_components/DeleteConfirmationModal";

import {User} from "@supabase/supabase-js";
import type {Campaign} from "@/types/campaigns"


export default function CampaignsPage({user}: {user: User}) {

	const router = useRouter();
	const [campaigns, setCampaigns] = useState<Campaign[]>([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
	const [toast, setToast] = useState<{
		show: boolean
		message: string
		type: 'success' | 'error'
	}>({
		show: false,
		message: '',
		type: 'success'
	})
	console.log(user?.email)

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = () => {
			setOpenDropdownId(null)
		}

		if (openDropdownId) {
			document.addEventListener('click', handleClickOutside)
		}

		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	}, [openDropdownId])

	const showToast = (message: string, type: 'success' | 'error') => {
		setToast({show: true, message, type})
	}

	const hideToast = () => {
		setToast(prev => ({...prev, show: false}))
	}

	const handleViewAnalytics = (campaignId: string) => {
		router.push(`/campaigns/${campaignId}`);
		setOpenDropdownId(null)
	}

	const handleDeleteCampaign = async () => {
		if (!campaignToDelete) return

		try {
			const response = await fetch(`/api/campaigns/${campaignToDelete}/delete`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const result = await response.json()
				throw new Error(result.error || 'Failed to delete campaign')
			}

			setCampaigns(campaigns.filter((c) => c.campaign_id !== campaignToDelete))
			showToast('Campaign deleted successfully! 🗑️', 'success')
		} catch (error) {
			console.error('Error deleting campaign:', error)
			showToast(
				error instanceof Error ? error.message : 'Failed to delete campaign',
				'error'
			)
		} finally {
			setCampaignToDelete(null)
		}
	}

	const toggleDropdown = (campaignId: string, e: React.MouseEvent) => {
		e.stopPropagation()
		setOpenDropdownId(openDropdownId === campaignId ? null : campaignId)
	}

	// Fetch campaigns on component mount
	useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/campaigns', {
                    cache: 'no-store', // 🚫 disable caching
                })
                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to fetch campaigns')
                }

                setCampaigns(result.data || [])
            } catch (error) {
                console.error('Error fetching campaigns:', error)
                showToast(
                    error instanceof Error ? error.message : 'Failed to load campaigns',
                    'error'
                )
                setCampaigns([])
            } finally {
                setLoading(false)
            }
        }

        void fetchCampaigns()

    }, [])

	const filteredCampaigns = campaigns.filter(campaign =>
		campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
		campaign.campaign_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
		campaign.created_by.toLowerCase().includes(searchTerm.toLowerCase())
	)



	return (
		<div className="flex flex-1 flex-col p-3 gap-8">
			<div className="flex w-full justify-between shrink-1 basis-0 items-center">
				<div className="flex h-min">
					<PageHeading title={"Campaigns"} description={"Manage your referral campaigns"} bottomMargin={"0"}/>
				</div>

				<SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} resultsAmount={filteredCampaigns.length}/>

				<Link
					href={"/campaigns/new"}
					className="bg-yellow-400 cursor-pointer text-white h-min px-6 py-3 rounded-lg hover:bg-yellow-600 transition-all font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl"
				>
					<Plus className="w-5 h-5"/>
					<span>Create Campaign</span>
				</Link>
			</div>


			<div className="flex flex-col gap-8">

				<StatsGrid campaigns={campaigns} />


				{/* Campaigns Grid */}
				{loading ? (
					<LoadingSkeleton />
				) : filteredCampaigns.length === 0 ? (
					<EmptyState
						searchTerm={searchTerm}
						onCreateClick={() => redirect("/campaigns/new")}
					/>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{filteredCampaigns.map((campaign) => (
							<CampaignCard
								key={campaign.campaign_id}
								campaign={campaign}
								openDropdownId={openDropdownId}
								onToggleDropdown={toggleDropdown}
								onViewAnalytics={handleViewAnalytics}
								onDelete={(id) => {
									setOpenDropdownId(null)
									setCampaignToDelete(id)
								}}
							/>
						))}
					</div>
				)}
			</div>

			{/* Toast Notification */}
			{toast.show && (
				<Toast
					message={toast.message}
					type={toast.type}
					show={toast.show}
					onClose={hideToast}
				/>
			)}

			<DeleteConfirmationModal
				campaignToDelete={campaignToDelete}
				campaigns={campaigns}
				onClose={() => setCampaignToDelete(null)}
				onConfirm={handleDeleteCampaign}
			/>
		</div>
	)
}