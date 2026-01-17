import {useState} from "react";
import {ChevronRight, Upload, X} from "lucide-react";
import { CampaignData } from "@/types/campaigns2";

const Step1CampaignDetails = ({
								  data,
								  onChange,
								  onNext
							  }: {
	data: CampaignData;
	onChange: (data: Partial<CampaignData>) => void;
	onNext: () => void;
}) => {
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [previewUrl, setPreviewUrl] = useState<string>('');

	const today = new Date().toISOString().split('T')[0];
	const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				setErrors(prev => ({...prev, thumbnail: 'Please upload an image file'}));
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				setErrors(prev => ({...prev, thumbnail: 'Image size must be less than 5MB'}));
				return;
			}

			// Create preview URL
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);

			// Store the file object in the data
			onChange({ thumbnail: file });

			// Clear any previous errors
			setErrors(prev => {
				const newErrors = {...prev};
				delete newErrors.thumbnail;
				return newErrors;
			});
		}
	};

	const removeImage = () => {
		setPreviewUrl('');
		onChange({ thumbnail: null });
	};

	const validateAndContinue = () => {
		const newErrors: Record<string, string> = {};

		if (!data.name.trim()) newErrors.name = 'Campaign name is required';
		if (!data.description.trim()) newErrors.description = 'Description is required';
		if (!data.thumbnail) newErrors.thumbnail = 'Thumbnail image is required';
		if (!data.start_date) newErrors.start_date = 'Start date is required';
		if (!data.end_date) newErrors.end_date = 'End date is required';

		if (data.start_date && data.start_date < today) {
			newErrors.start_date = 'Start date cannot be in the past';
		}
		if (data.end_date && data.end_date < tomorrow) {
			newErrors.end_date = 'End date must be at least tomorrow';
		}
		if (data.start_date && data.end_date && data.end_date < data.start_date) {
			newErrors.end_date = 'End date must be after start date';
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length === 0) {
			onNext();
		}
	};

	return (
		<div className="flex flex-1 flex-col gap-6">
			<div>
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Details</h2>
				<p className="text-gray-600">Let&apos;s start by setting up your campaign information</p>
			</div>

			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Campaign Name *
					</label>
					<input
						type="text"
						value={data.name}
						onChange={(e) => onChange({ name: e.target.value })}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
						placeholder="Enter campaign name"
					/>
					{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Description *
					</label>
					<textarea
						value={data.description}
						onChange={(e) => onChange({ description: e.target.value })}
						rows={4}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
						placeholder="Describe your campaign"
					/>
					{errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Thumbnail Image *
					</label>

					{!previewUrl ? (
						<label className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition-colors">
							<Upload className="text-gray-400 mb-2" size={40} />
							<p className="text-sm text-gray-600 mb-1">Click to upload thumbnail</p>
							<p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
							<input
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								className="hidden"
							/>
						</label>
					) : (
						<div className="relative w-full h-40 border-2 border-gray-300 rounded-lg overflow-hidden">
							<img
								src={previewUrl}
								alt="Thumbnail preview"
								className="w-full h-full object-cover"
							/>
							<button
								onClick={removeImage}
								className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
							>
								<X size={16} />
							</button>
						</div>
					)}

					{errors.thumbnail && <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Start Date *
						</label>
						<input
							type="date"
							value={data.start_date}
							min={today}
							onChange={(e) => onChange({ start_date: e.target.value })}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
						/>
						{errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							End Date *
						</label>
						<input
							type="date"
							value={data.end_date}
							min={tomorrow}
							onChange={(e) => onChange({ end_date: e.target.value })}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
						/>
						{errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
					</div>
				</div>
			</div>

			<div className="flex justify-end pt-4">
				<button
					onClick={validateAndContinue}
					className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
				>
					Continue
					<ChevronRight size={20} />
				</button>
			</div>
		</div>
	);
};

export default Step1CampaignDetails;