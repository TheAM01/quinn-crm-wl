'use client';

import {useState} from 'react';
import {Check, ChevronLeft} from 'lucide-react';
import {CampaignData} from "@/types/campaigns2";
import Step1CampaignDetails from "./_components/Step1";
import Step2PrizeSelection from "./_components/Step2";
import Spinner from "@/components/ui/Spinner";
import { User } from '@supabase/supabase-js'

// Main Campaign Creator Component
export default function CampaignCreator({user}: {user: User }) {

	const [currentStep, setCurrentStep] = useState(1);
	const [completedSteps, setCompletedSteps] = useState<number[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [campaignData, setCampaignData] = useState<CampaignData>({
		name: '',
		prizes: [],
		description: '',
		start_date: '',
		end_date: '',
		created_by: `${user?.email}`,
		thumbnail: null
	});

	const totalSteps = 2;

	const updateCampaignData = (updates: Partial<CampaignData>) => {
		setCampaignData(prev => ({...prev, ...updates}));
	};

	const goToNextStep = () => {
		if (!completedSteps.includes(currentStep)) {
			setCompletedSteps(prev => [...prev, currentStep]);
		}
		setCurrentStep(prev => Math.min(prev + 1, totalSteps));
	};

	const goToPreviousStep = () => {
		setCurrentStep(prev => Math.max(prev - 1, 1));
	};

	const canGoBack = currentStep > 1 && !isSubmitting;

	const handleSubmit = async () => {
		setIsSubmitting(true);

		try {
			const formData = new FormData();

			formData.append('name', campaignData.name);
			formData.append('description', campaignData.description);
			formData.append('start_date', new Date(campaignData.start_date).toISOString());
			formData.append('end_date', new Date(campaignData.end_date).toISOString());
			formData.append('created_by', campaignData.created_by);
			formData.append('prizes', JSON.stringify(campaignData.prizes));

			if (campaignData.thumbnail) {
				formData.append('thumbnail', campaignData.thumbnail);
			}

			const response = await fetch('/api/campaigns', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				window.location.href = '/campaigns';
			} else {
				alert('Failed to create campaign. Please try again.');
				setIsSubmitting(false);
			}
		} catch (error) {
			console.error(error);
			alert('An error occurred. Please try again.');
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-1 flex-col p-3">
			{/* Progress Bar */}
			<div className="flex px-5">
				<div className="flex items-center w-full">
					{Array.from({ length: totalSteps }).map((_, index) => {
						const stepNumber = index + 1;
						const isCompleted = completedSteps.includes(stepNumber);
						const isCurrent = stepNumber === currentStep;

						return (
							<div key={index} className="flex items-center w-full last:w-auto">
								{/* Step */}
								<div className="flex flex-col items-center">
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
											${isCompleted || isCurrent ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'}
											${isCurrent ? 'ring-4 ring-yellow-200' : ''}
										`}
									>
										{isCompleted ? <Check size={20} /> : stepNumber}
									</div>

									<p className="text-xs mt-2 font-medium text-gray-600">
										{index === 0
											? 'Details'
											: index === 1
												? 'Prizes'
												: `Step ${stepNumber}`}
									</p>
								</div>

								{/* Connector */}
								{index < totalSteps - 1 && (
									<div
										className={`h-[4px] flex-1 mx-2 -translate-y-2 transition-colors ${
											isCompleted ? 'bg-yellow-500' : 'bg-gray-200'
										}`}
									/>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Content */}
			<div className="flex flex-col bg-white rounded-xl shadow-sm p-8">
				{/* Back Button */}
				{canGoBack && (
					<button
						onClick={goToPreviousStep}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors w-fit"
					>
						<ChevronLeft size={20} />
						<span className="text-sm font-medium">Back</span>
					</button>
				)}

				{currentStep === 1 && (
					<Step1CampaignDetails
						data={campaignData}
						onChange={updateCampaignData}
						onNext={goToNextStep}
					/>
				)}
				{currentStep === 2 && (
					<Step2PrizeSelection
						data={campaignData}
						onChange={updateCampaignData}
						onSubmit={handleSubmit}
					/>
				)}
			</div>

			{/* Loading Overlay */}
			{isSubmitting && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl p-8 flex flex-col items-center">
						<Spinner/>
						<p className="mt-4 text-lg font-medium text-gray-900">Creating campaign...</p>
					</div>
				</div>
			)}
		</div>
	);
}