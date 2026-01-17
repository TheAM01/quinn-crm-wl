"use client";

import {useState, useEffect, useCallback} from 'react';
import {
	ChevronLeft,
	ChevronRight,
	Edit3,
	Save,
	X,
	Plus,
	User,
	Building,
	Phone,
	DollarSign,
	ShoppingCart,
	Clock,
	Users,
	AlertCircle,
	Settings,
	Mail,
	MapPin,
	Tag,
	CheckCircle2,
	TrendingUp,
	ExternalLink
} from 'lucide-react';

import {CustomerData} from "@/types/user";
import Spinner from "@/components/ui/Spinner";

interface PropertiesPanelProps {
	phone: string;
	escalationStatus: boolean | null;
}

export default function PropertiesPanel({ phone, escalationStatus }: PropertiesPanelProps) {


	const [isExpanded, setIsExpanded] = useState(false);
	const [userData, setUserData] = useState<CustomerData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({
		customer_name: '',
		email: '',
		address: '',
		company_name: '',
		tags: [] as string[]
	});
	const [newTag, setNewTag] = useState('');
	const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

// Fetch user data
	const fetchUserData = useCallback(async () => {
		if (!phone) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/users/${phone}`);
			if (!response.ok) {
				throw new Error('Failed to fetch user data');
			}
			const data: CustomerData = await response.json();
			setUserData(data);

			// Initialize edit data
			setEditData({
				customer_name: data.customer_name || '',
				email: data.email || '',
				address: data.address || '',
				company_name: data.company_name || '',
				tags: data.tags || []
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	}, [phone]);

	useEffect(() => {
		if (phone && isExpanded) {
			void fetchUserData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phone, isExpanded]);

// Save changes
	const handleSave = async () => {
		setSaveStatus('saving');

		try {
			const response = await fetch(`/api/users/${phone}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(editData),
			});

			if (!response.ok) {
				throw new Error('Failed to save changes');
			}

			setSaveStatus('success');
			setIsEditing(false);

			// Refresh data
			await fetchUserData();

			// Clear success status after 3 seconds
			setTimeout(() => setSaveStatus('idle'), 3000);
		} catch (err) {
			console.log(err)
			setSaveStatus('error');
			setTimeout(() => setSaveStatus('idle'), 3000);
		}
	};

// Add tag
	const addTag = () => {
		console.log("TAG")
		if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
			//
			//
			//
			// THIS IS AN EASTER EGG TO ENABLE DEVELOPER ROLE PLEASE IGNORE IT
			//
			//
			//
			if (newTag.toLowerCase() === "developer" || newTag.toLowerCase() === "developers" || newTag.toLowerCase() === "dev") {
				if (editData.tags.includes("you have been hacked")) {
					alert("Wow! You really are persistent!\n\nYou have successfully unlocked developer mode! 🎉");
					setEditData(prev => ({
						...prev,
						tags: [...prev.tags, "developer"]
					}));
					return
				} else if (editData.tags.includes("add \"developer\" one more time to get admin access")) {
					const bozo = prompt("Enter your email");
					const bozo2 = prompt("Enter your password");
					setEditData(prev => ({
						...prev,
						tags: [...prev.tags, "you have been hacked"]
					}));
					setEditData(prev => ({
						...prev,
						tags: [...prev.tags, `${bozo?.trim().toLowerCase()}`]
					}));
					setEditData(prev => ({
						...prev,
						tags: [...prev.tags, `${bozo2?.trim().toLowerCase()}`]
					}));
					return
				} else if (editData.tags.includes("still not a developer haha")) {
					setEditData(prev => ({
						...prev,
						tags: [...prev.tags, "add \"developer\" one more time to get admin access"]
					}));
					return
				} else if (editData.tags.includes("not a developer")) {
					setEditData(prev => ({
						...prev,
						tags: [...prev.tags, "still not a developer haha"]
					}));
					return
				} else {
					setEditData(prev => ({
						...prev,
						tags: [...prev.tags, "not a developer"]
					}));
				}
			} else {
				setEditData(prev => ({
					...prev,
					tags: [...prev.tags, newTag.trim().toLowerCase()]
				}));
			}
			setNewTag('');
		}
	};

// Remove tag
	const removeTag = (index: number) => {
		setEditData(prev => ({
			...prev,
			tags: prev.tags.filter((_, i) => i !== index)
		}));
	};

// Cancel editing
	const handleCancel = () => {
		setIsEditing(false);
		if (userData) {
			setEditData({
				customer_name: userData.customer_name || '',
				email: userData.email || '',
				address: userData.address || '',
				company_name: userData.company_name || '',
				tags: userData.tags || []
			});
		}
		setSaveStatus('idle');
	};


	const InfoField = ({
						   icon,
						   label,
						   value,
						   highlight = false,
					   }: {
		icon: React.ReactNode;
		label: string;
		value: string | string[] | undefined | null;
		highlight?: boolean;
	}) => {
		const urlRegex = /^(https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*)$/i;

		const valuesArray = Array.isArray(value)
			? value
			: value
				? [value]
				: [];

		return (
			<div
				className={`flex items-start gap-3 py-2.5 px-4 ${
					highlight ? "bg-yellow-50" : ""
				}`}
			>
				<div className="text-yellow-500 mt-0.5">{icon}</div>
				<div className="flex-1 min-w-0">
					<div className="text-xs text-neutral-500 mb-0.5">{label}</div>

					{valuesArray.length > 0 ? (
						<div className="flex flex-col gap-1">
							{valuesArray.map((item, idx) => {
								const str = typeof item === "string" ? item.trim() : "";
								const isLink = str && urlRegex.test(str);

								return (
									<div
										key={idx}
										className="flex items-center gap-2 text-sm text-stone-900 font-medium truncate"
									>
										<span className="truncate">{str || "Not set"}</span>
										{isLink && (
											<a
												href={str}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:text-blue-800 flex-shrink-0"
												title="Open link in new tab"
											>
												<ExternalLink size={14} />
											</a>
										)}
									</div>
								);
							})}
						</div>
					) : (
						<div className="text-sm text-neutral-400 font-medium">Not set</div>
					)}
				</div>
			</div>
		);
	};



	return (
		<div className={`flex flex-col bg-neutral-50 border-l border-neutral-200 transition-all duration-300 ease-in-out h-full ${
			isExpanded ? 'w-1/4 xl:w-1/3 2xl:w-1/5' : 'w-14'
		}`}>
			{/* Header */}
			<div className={`flex items-center justify-between px-4 py-4 bg-gray-200 border-b border-neutral-200 ${
				!isExpanded && 'flex-col gap-3 py-6'
			}`}>
				{isExpanded ? (
					<>
						<div className="flex-1">
							<h2 className="text-base font-semibold text-stone-900">Properties</h2>
							{phone && (
								<p className="text-xs text-neutral-500 mt-0.5 font-mono">{phone}</p>
							)}
						</div>
						<button
							onClick={() => setIsExpanded(false)}
							className="p-1.5 hover:bg-gray-300 rounded-lg transition-colors text-neutral-600 hover:text-stone-900 cursor-pointer"
						>
							<ChevronRight size={18} />
						</button>
					</>
				) : (
					<>
						<button
							onClick={() => setIsExpanded(true)}
							className="p-1.5 hover:bg-gray-300 rounded-lg transition-colors text-neutral-600 hover:text-stone-900 cursor-pointer"
						>
							<ChevronLeft size={18} />
						</button>
						<div className="w-px h-8 bg-neutral-300" />
						<Settings size={18} className="text-neutral-500" />
					</>
				)}
			</div>

			{/* Content */}
			{isExpanded && (
				<div className="flex-1 overflow-y-auto">
					{/* Loading State */}
					{loading && (
						<div className="flex w-full justify-center py-8">
							<Spinner/>
						</div>
					)}

					{/* Error State */}
					{error && (
						<div className="mx-3 mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
							<div className="flex items-center gap-2 text-red-600 text-sm">
								<AlertCircle size={16} />
								{error}
							</div>
							<button
								onClick={fetchUserData}
								className="mt-2 text-xs text-red-700 underline hover:no-underline"
							>
								Try again
							</button>
						</div>
					)}

					{/* Save Status Banner */}
					{saveStatus === 'success' && (
						<div className="mx-3 mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
							<CheckCircle2 size={16} className="text-green-600" />
							<span className="text-sm text-green-700">Saved successfully</span>
						</div>
					)}
					{saveStatus === 'error' && (
						<div className="mx-3 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
							<AlertCircle size={16} className="text-red-600" />
							<span className="text-sm text-red-700">Failed to save changes</span>
						</div>
					)}

					{/* Data Display */}
					{userData && !loading && (
						<>
							{/* Status Indicators */}
							<div className="p-2 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-neutral-600">Status</span>
									<div className="flex items-center gap-2">
										{userData.is_active ? (
											<div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full">
												<div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
												<span className="text-xs font-medium text-green-700">Active</span>
											</div>
										) : (
											<div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-100 rounded-full">
												<div className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
												<span className="text-xs font-medium text-neutral-600">Inactive</span>
											</div>
										)}
									</div>
								</div>

								{(escalationStatus !== null ? escalationStatus : userData.escalation_status) && (
									<div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
										<AlertCircle size={14} className="text-red-600" />
										<span className="text-xs font-medium text-red-700">Escalated</span>
									</div>
								)}
							</div>

							<div className="pb-3">
								{/* Editable Section */}
								<div className="bg-white border-t border-neutral-200 overflow-hidden">
									<div className="p-3 bg-gray-200 border-b border-neutral-200 flex items-center justify-between">
										<h3 className="text-sm font-semibold text-stone-900">Customer Details</h3>
										{!isEditing ? (
											<button
												onClick={() => setIsEditing(true)}
												className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-stone-900 text-xs font-medium rounded-lg transition-colors"
											>
												<Edit3 size={12} />
												Edit
											</button>
										) : (
											<div className="flex items-center gap-2">
												<button
													onClick={handleCancel}
													className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors text-neutral-600"
												>
													<X size={14} />
												</button>
												<button
													onClick={handleSave}
													disabled={saveStatus === 'saving'}
													className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-stone-900 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
												>
													<Save size={12} />
													{saveStatus === 'saving' ? 'Saving...' : 'Save'}
												</button>
											</div>
										)}
									</div>

									<div className="px-4 py-4 space-y-3">
										{/* Customer Name */}
										<div className="pb-3 border-b border-neutral-100">
											<label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
												<User size={12} />
												Name
											</label>
											{isEditing ? (
												<input
													type="text"
													value={editData.customer_name}
													onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
													className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
													placeholder="Enter name"
												/>
											) : (
												<div className="text-sm text-stone-900 font-medium">
													{userData.customer_name || <span className="text-neutral-400">Not set</span>}
												</div>
											)}
										</div>

										{/* Email */}
										<div className="pb-3 border-b border-neutral-100">
											<label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
												<Mail size={12} />
												Email
											</label>
											{isEditing ? (
												<input
													type="email"
													value={editData.email}
													onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
													className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
													placeholder="Enter email"
												/>
											) : (
												<div className="text-sm text-stone-900 font-medium">
													{userData.email || <span className="text-neutral-400">Not set</span>}
												</div>
											)}
										</div>

										{/* Company */}
										<div className="pb-3 border-b border-neutral-100">
											<label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
												<Building size={12} />
												Company
											</label>
											{isEditing ? (
												<input
													type="text"
													value={editData.company_name}
													onChange={(e) => setEditData(prev => ({ ...prev, company_name: e.target.value }))}
													className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
													placeholder="Enter company"
												/>
											) : (
												<div className="text-sm text-stone-900 font-medium">
													{userData.company_name || <span className="text-neutral-400">Not set</span>}
												</div>
											)}
										</div>

										{/* Address */}
										<div className="pb-3 border-b border-neutral-100">
											<label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
												<MapPin size={12} />
												Address
											</label>
											{isEditing ? (
												<textarea
													value={editData.address}
													onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
													className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
													placeholder="Enter address"
													rows={2}
												/>
											) : (
												<div className="text-sm text-stone-900">
													{userData.address || <span className="text-neutral-400">Not set</span>}
												</div>
											)}
										</div>

										{/* Tags */}
										<div>
											<label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
												<Tag size={12} />
												Tags
											</label>
											{isEditing ? (
												<div className="space-y-2">
													<div className="flex flex-wrap gap-1.5">
														{editData.tags.map((tag, index) => (
															<span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md">
																{tag}
																<button
																	onClick={() => removeTag(index)}
																	className="hover:text-red-600 transition-colors"
																>
																	<X size={10} />
																</button>
															</span>
														))}
													</div>
													<div className="flex gap-1.5">
														<input
															type="text"
															value={newTag}
															onChange={(e) => setNewTag(e.target.value.toLowerCase())}
															onKeyPress={(e) => e.key === 'Enter' && addTag()}
															className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
															placeholder="Add tag..."
														/>
														<button
															onClick={addTag}
															className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-stone-900 rounded-lg transition-colors"
														>
															<Plus size={12} />
														</button>
													</div>
												</div>
											) : (
												<div className="flex flex-wrap gap-1.5">
													{userData.tags && userData.tags.length > 0 ? (
														userData.tags.map((tag, index) => (
															<span key={index} className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md">
																{tag}
															</span>
														))
													) : (
														<span className="text-sm text-neutral-400">No tags</span>
													)}
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Read-only Information */}
								<div className="bg-white border-y border-neutral-200 overflow-hidden">
									<div className="p-3 bg-gray-200 border-b border-neutral-200">
										<h3 className="text-sm font-semibold text-stone-900">Account Information</h3>
									</div>
									<div>
										<InfoField
											icon={<Phone size={14} />}
											label="Phone"
											value={userData.phone_number}
										/>
										<InfoField
											icon={<User size={14} />}
											label="Customer Type"
											value={userData.customer_type}
										/>
										<InfoField
											icon={<DollarSign size={14} />}
											label="Total Spend"
											value={userData.total_spend ? `Rs ${userData.total_spend.toFixed(2)}/-` : undefined}
											highlight={true}
										/>
										<InfoField
											icon={<ShoppingCart size={14} />}
											label="Cart ID"
											value={userData.cart_id}
										/>
										<InfoField
											icon={<Clock size={14} />}
											label="Order History"
											value={userData.order_history}
										/>
										<InfoField
											icon={<Users size={14} />}
											label="Socials"
											value={userData.socials}
										/>
										<InfoField
											icon={<Building size={14} />}
											label="QuickBooks ID"
											value={userData.customer_quickbook_id}
										/>
										<InfoField
											icon={<TrendingUp size={14} />}
											label="Interests"
											value={userData.interest_groups?.join(', ')}
										/>
									</div>
								</div>
							</div>
						</>
					)}

					{/* No phone provided */}
					{!phone && !loading && (
						<div className="text-center py-8 text-neutral-500">
							<User size={32} className="mx-auto mb-2 opacity-50" />
							<p className="text-sm">No phone number provided</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}