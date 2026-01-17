import {
	Search,
	Filter,
	AlertTriangle,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Tag,
	X,
	DollarSign,
	SlidersHorizontal,
	Download
} from "lucide-react";
import React, {useRef, useState, useEffect} from "react";
import Link from "next/link";
import {useUserRole} from "@/hooks/useUserRole";
import Spinner from "@/components/ui/Spinner";

type SortField = 'customer_name' | 'total_spend' | 'last_message_time' | 'updated_at' | 'phone_number';
type SortOrder = 'asc' | 'desc';

export interface ConversationControlsProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	customerTypeFilter: string;
	setCustomerTypeFilter: (filter: string) => void;
	escalationFilter: string;
	setEscalationFilter: (filter: string) => void;
	isActiveFilter: string;
	setIsActiveFilter: (filter: string) => void;
	selectedTags: string[];
	setSelectedTags: (tags: string[]) => void;
	tagSearchQuery: string;
	setTagSearchQuery: (query: string) => void;
	sortField: SortField;
	handleSort: (field: SortField) => void;
	sortOrder: SortOrder;
	allTags: string[];
	filteredTagOptions: string[];
	addTag: (tag: string) => void;
	removeTag: (tag: string) => void;
	clearAllTags: () => void;
	resetFilters: () => void;
	itemsPerPage: number;
	setItemsPerPage: (items: number) => void;
	itemsPerPageOptions: number[];
	loading: boolean;
	isCompact: boolean;
	minSpend: string;
	setMinSpend: (value: string) => void;
	maxSpend: string;
	setMaxSpend: (value: string) => void;
}

const InboxControls = ({
						   searchQuery,
						   setSearchQuery,
						   customerTypeFilter,
						   setCustomerTypeFilter,
						   escalationFilter,
						   setEscalationFilter,
						   isActiveFilter,
						   setIsActiveFilter,
						   selectedTags,
						   tagSearchQuery,
						   setTagSearchQuery,
						   sortField,
						   handleSort,
						   sortOrder,
						   addTag,
						   removeTag,
						   clearAllTags,
						   resetFilters,
						   itemsPerPage,
						   setItemsPerPage,
						   itemsPerPageOptions,
						   loading,
						   isCompact,
						   minSpend,
						   setMinSpend,
						   maxSpend,
						   setMaxSpend,
					   }: ConversationControlsProps) => {
	const { isSuperAdmin, loading: roleLoading } = useUserRole()

	const [isExpanded, setIsExpanded] = useState(false);
	const [allTags, setAllTags] = useState<string[]>([]);
	const [loadingTags, setLoadingTags] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	// Fetch tags from API
	useEffect(() => {
		async function fetchTags() {
			setLoadingTags(true);
			try {
				const res = await fetch('/api/customers/tags');
				if (!res.ok) throw new Error('Failed to fetch tags');

				const data = await res.json();
				// Assuming the API returns { tags: string[] } or just string[]
				const tags = Array.isArray(data) ? data : (data.tags || []);
				setAllTags(tags.map((tag: string) => tag.toLowerCase()).sort());
			} catch (error) {
				console.error('Error fetching tags:', error);
				setAllTags([]);
			} finally {
				setLoadingTags(false);
			}
		}

		void fetchTags();
	}, []);

	// Filter tags based on search query
	const filteredTagOptions = allTags.filter(
		(tag) => !tagSearchQuery.trim() || tag.includes(tagSearchQuery.toLowerCase())
	);

	const getSortIcon = (field: SortField) => {
		if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
		return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
	};

	const hasActiveFilters =
		searchQuery ||
		customerTypeFilter !== "all" ||
		escalationFilter !== "all" ||
		isActiveFilter !== "all" ||
		selectedTags.length > 0 ||
		minSpend ||
		maxSpend;

	return (
		<div className="space-y-4">
			{/* Always Visible Search Bar */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
				<input
					ref={inputRef}
					type="text"
					placeholder="Search by name, phone, email, or company..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-sm"
					disabled={loading}
				/>
			</div>

			{/* Toggle Button and Export */}
			<div className="flex justify-between items-center gap-4">
				<button
					onClick={() => setIsExpanded((prev) => !prev)}
					className="cursor-pointer flex items-center gap-2 p-2 bg-yellow-100 text-gray-700 rounded-lg hover:bg-yellow-200 transition-all duration-200"
				>
					<SlidersHorizontal className="w-4 h-4" />
					<span className="font-medium text-sm">{isExpanded ? "Hide Controls" : "Show Controls"}</span>
				</button>

				{
					roleLoading ? <Spinner size={"sm"}/> :
						isSuperAdmin && (
							<Link
								href="/inbox/export"
								className="font-medium h-min text-base flex items-center gap-2 p-2 bg-yellow-300 text-gray-700 rounded-lg hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"
							>
								<Download className="w-4 h-4 flex"/>
								<span className={" text-sm"}>Export Chats</span>
							</Link>
						)
				}
			</div>

			{/* Expandable Filters Section */}
			<div
				className={`transition-all duration-300 overflow-hidden ${
					isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="space-y-4 bg-neutral-100 rounded-xl p-4 shadow-sm">
					{/* Tag Filter Section */}
					<div className="space-y-3 w-full">
						{/* Tag Search Input */}
						<div className="relative flex-1">
							<Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<input
								type="text"
								placeholder="Search tags..."
								value={tagSearchQuery}
								onChange={(e) => setTagSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
								disabled={loading || loadingTags}
							/>
						</div>

						{/* Loading state for tags */}
						{loadingTags && (
							<div className="flex items-center gap-2 text-sm text-gray-500">
								<Spinner size="sm" />
								<span>Loading tags...</span>
							</div>
						)}

						{/* Available Tags - always shown, filtered by search */}
						{!loadingTags && allTags.length > 0 && (
							<div className="max-w-full">
								<p className="text-sm text-gray-600 mb-2">
									{tagSearchQuery
										? `Found ${filteredTagOptions.length} tag${filteredTagOptions.length !== 1 ? 's' : ''}`
										: `All available tags (${allTags.length})`
									}:
								</p>
								{filteredTagOptions.length > 0 ? (
									<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
										{filteredTagOptions.map(tag => (
											<button
												key={tag}
												onClick={() => addTag(tag)}
												disabled={selectedTags.includes(tag) || loading}
												className={`px-3 py-1 text-sm rounded-full border transition-colors ${
													selectedTags.includes(tag)
														? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
														: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
												}`}
											>
												{tag}
											</button>
										))}
									</div>
								) : (
									<p className="text-sm text-gray-500">No tags found matching &quot;{tagSearchQuery}&quot;</p>
								)}
							</div>
						)}

						{/* No tags in database message */}
						{!loadingTags && allTags.length === 0 && (
							<p className="text-sm text-gray-500">No tags available in the system</p>
						)}

						{/* Selected Tags */}
						{selectedTags.length > 0 && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<p className="text-sm text-gray-600">Active tag filters:</p>
									<button
										onClick={clearAllTags}
										className="text-xs text-red-600 hover:text-red-800 underline"
										disabled={loading}
									>
										Clear all
									</button>
								</div>
								<div className="flex flex-wrap gap-2">
									{selectedTags.map(tag => (
										<span
											key={tag}
											className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
										>
											{tag}
											<button
												onClick={() => removeTag(tag)}
												className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
												disabled={loading}
											>
												<X className="h-3 w-3" />
											</button>
										</span>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Spend Range Filter */}
					<div className="flex gap-4 items-center">
						<DollarSign className="h-4 w-4 text-gray-400" />
						<span className="text-sm text-gray-600 font-medium whitespace-nowrap">Total Spend:</span>
						<div className="flex gap-2 items-center">
							<input
								type="number"
								placeholder="Min"
								value={minSpend}
								onChange={(e) => setMinSpend(e.target.value)}
								className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
								disabled={loading}
								min="0"
							/>
							<span className="text-gray-400">-</span>
							<input
								type="number"
								placeholder="Max"
								value={maxSpend}
								onChange={(e) => setMaxSpend(e.target.value)}
								className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
								disabled={loading}
								min="0"
							/>
						</div>
					</div>

					{/* Filter and Sort Controls */}
					<div className="flex flex-wrap gap-3 items-center justify-between">
						<div className={`flex flex-row gap-2 ${isCompact && "w-full flex-wrap"}`}>
							{/* Active Status Filter */}
							<div className="flex items-center gap-2">
								<Filter className="h-4 w-4 text-gray-400" />
								<select
									value={isActiveFilter}
									onChange={(e) => setIsActiveFilter(e.target.value)}
									className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
									disabled={loading}
								>
									<option value="all">All Status</option>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
								</select>
							</div>

							{/* Customer Type Filter */}
							<div className="flex items-center gap-2">
								<select
									value={customerTypeFilter}
									onChange={(e) => setCustomerTypeFilter(e.target.value)}
									className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
									disabled={loading}
								>
									<option value="all">All Types</option>
									<option value="B2B">B2B</option>
									<option value="D2C">D2C</option>
								</select>
							</div>

							{/* Escalation Status Filter */}
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-gray-400" />
								<select
									value={escalationFilter}
									onChange={(e) => setEscalationFilter(e.target.value)}
									className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
									disabled={loading}
								>
									<option value="all">All Escalation</option>
									<option value="escalated">Escalated</option>
									<option value="normal">Normal</option>
								</select>
							</div>

							{/* Items per page selector */}
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-600 font-medium">Show:</span>
								<select
									value={itemsPerPage}
									onChange={(e) => setItemsPerPage(Number(e.target.value))}
									className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
									disabled={loading}
								>
									{itemsPerPageOptions.map(option => (
										<option key={option} value={option}>
											{option} per page
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Sort Controls */}
						<div className={`flex items-center gap-2 ${isCompact && "w-full justify-between"}`}>
							<span className="text-sm text-gray-600 font-medium">Sort by:</span>
							<button
								onClick={() => handleSort('last_message_time')}
								className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									sortField === 'last_message_time'
										? 'bg-blue-100 text-blue-700 border border-blue-200'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
								disabled={loading}
							>
								Recent {getSortIcon('last_message_time')}
							</button>
							<button
								onClick={() => handleSort('updated_at')}
								className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									sortField === 'updated_at'
										? 'bg-blue-100 text-blue-700 border border-blue-200'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
								disabled={loading}
							>
								Updated {getSortIcon('updated_at')}
							</button>
							<button
								onClick={() => handleSort('customer_name')}
								className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									sortField === 'customer_name'
										? 'bg-blue-100 text-blue-700 border border-blue-200'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
								disabled={loading}
							>
								Name {getSortIcon('customer_name')}
							</button>
							<button
								onClick={() => handleSort('total_spend')}
								className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									sortField === 'total_spend'
										? 'bg-blue-100 text-blue-700 border border-blue-200'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
								disabled={loading}
							>
								Spend {getSortIcon('total_spend')}
							</button>
							<button
								onClick={() => handleSort('phone_number')}
								className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									sortField === 'phone_number'
										? 'bg-blue-100 text-blue-700 border border-blue-200'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
								disabled={loading}
							>
								Phone {getSortIcon('phone_number')}
							</button>
						</div>
					</div>

					{/* Reset Filters Button */}
					{hasActiveFilters && (
						<div className="flex justify-end pt-2 border-t border-t-neutral-200">
							<button
								onClick={resetFilters}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
								disabled={loading}
							>
								Clear All Filters
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default InboxControls;