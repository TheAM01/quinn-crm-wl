"use client";
import React, {useEffect, useState, useMemo} from "react";
import {CustomerData} from "@/types/user";
import {Search, Filter, Tag, X, Upload, MessageSquare, ChevronUp, ChevronDown} from "lucide-react";
import {PageHeading} from "@/components/ui/Structure";
import PageLoader from "@/components/ui/PageLoader";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";

interface ChatsResponse {
	customers: CustomerData[];
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next: boolean;
	has_previous: boolean;
}

export default function CustomersClient() {
	const [loading, setLoading] = useState(true);
	const [customers, setCustomers] = useState<CustomerData[]>([]);
	const [error, setError] = useState<string | null>(null);

	// Search and filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [tagSearchQuery, setTagSearchQuery] = useState("");

	// Sorting states
	const [sortBy, setSortBy] = useState("customer_name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(50);
	const [totalCustomers, setTotalCustomers] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [hasNext, setHasNext] = useState(false);
	const [hasPrevious, setHasPrevious] = useState(false);

	// All tags for dropdown
	const [allTags, setAllTags] = useState<string[]>([]);

	// Fetch tags
	useEffect(() => {
		const fetchTags = async () => {
			try {
				const response = await fetch('/api/customers/tags');
				if (!response.ok) throw new Error('Failed to fetch tags');
				const data = await response.json();
				setAllTags(data.tags || []);
			} catch (error) {
				console.error('Error fetching tags:', error);
			}
		};
		void fetchTags();
	}, []);

	// Debounced fetch customers
	useEffect(() => {
		const timer = setTimeout(() => {
			void fetchCustomers();
		}, 800);

		return () => clearTimeout(timer);
	}, [searchQuery, customerTypeFilter, selectedTags, sortBy, sortOrder, currentPage, itemsPerPage]);

	async function fetchCustomers() {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				limit: itemsPerPage.toString(),
				page: currentPage.toString(),
				sort_by: sortBy,
				sort_order: sortOrder,
			});

			if (searchQuery) params.set('search', searchQuery);
			if (customerTypeFilter) params.set('customer_type', customerTypeFilter);
			if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));

			const res = await fetch(`/api/customers?${params.toString()}`, {
				method: 'GET',
				headers: { 'Accept': 'application/json' },
			});

			if (!res.ok) throw new Error(`Error: ${res.status}`);

			const data: ChatsResponse = await res.json();
			setCustomers(data.customers);
			setTotalCustomers(data.total);
			setTotalPages(data.total_pages);
			setHasNext(data.has_next);
			setHasPrevious(data.has_previous);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	}

	const filteredTagOptions = useMemo(() => {
		if (!tagSearchQuery.trim()) return allTags;
		return allTags.filter(tag => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()));
	}, [allTags, tagSearchQuery]);

	const addTag = (tag: string) => {
		if (!selectedTags.includes(tag)) {
			setSelectedTags([...selectedTags, tag]);
			setCurrentPage(1);
		}
		setTagSearchQuery("");
	};

	const removeTag = (tag: string) => {
		setSelectedTags(selectedTags.filter(t => t !== tag));
		setCurrentPage(1);
	};

	const clearAllTags = () => {
		setSelectedTags([]);
		setCurrentPage(1);
	};

	const handleSortChange = (field: string) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(field);
			setSortOrder('asc');
		}
		setCurrentPage(1);
	};

	const SortableHeader = ({ field, label }: { field: string; label: string }) => (
		<th
			className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
			onClick={() => handleSortChange(field)}
		>
			<div className="flex items-center gap-2">
				{label}
				{sortBy === field && (
					sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
				)}
			</div>
		</th>
	);

	const TagsCell = ({ tags }: { tags?: string[] }) => {
		if (!tags || tags.length === 0) return <span className="text-gray-400">-</span>;

		const displayTags = tags.slice(0, 2);
		const remainingCount = tags.length - 2;

		return (
			<div className="flex flex-wrap gap-1 items-center">
				{displayTags.map(tag => (
					<span
						key={tag}
						className="inline-flex items-center p-1 border border-blue-500 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
					>
						{tag}
					</span>
				))}
				{remainingCount > 0 && (
					<span
						className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 cursor-help"
						title={tags.slice(2).join(', ')}
					>
						+{remainingCount} more
					</span>
				)}
			</div>
		);
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			// Optionally show a toast notification here
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	if (loading && customers.length === 0) return <PageLoader text={"Loading Customers..."}/>

	return (
		<main className="flex min-h-screen flex-col p-3 gap-6 w-full">
			<div className="flex justify-between">
				<PageHeading title={"Customers"} description={"Manage and monitor all registered customers"} bottomMargin={"0"}/>
				<Link
					href="/customers/import"
					className="h-min text-sm flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"
				>
					<Upload className="w-4 h-4" />
					Import Customers
				</Link>
			</div>

			{error && (
				<div className="space-y-2">
					<div className="text-sm text-red-500">There was an error: {error}. Please refresh page and if issue persists, refresh page.</div>
				</div>
			)}

			{/* --- CONTROLS SECTION --- */}
			<div className="space-y-4">
				{/* Search Inputs */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
						<input
							type="text"
							placeholder="Search by name, phone, or tags..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
						/>
					</div>
					<div className="relative">
						<Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
						<input
							type="text"
							placeholder="Search tags to filter by..."
							value={tagSearchQuery}
							onChange={(e) => setTagSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
						/>
						{tagSearchQuery && filteredTagOptions.length > 0 && (
							<div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
								{filteredTagOptions.map(tag => (
									<div
										key={tag}
										className="px-4 py-2 cursor-pointer hover:bg-gray-100"
										onClick={() => addTag(tag)}
									>
										{tag}
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Filter/Sort Dropdowns */}
				<div className="flex flex-wrap items-center gap-4 text-sm">
					<div className="flex items-center gap-2">
						<span>Show:</span>
						<select
							value={itemsPerPage}
							onChange={e => {
								setItemsPerPage(Number(e.target.value));
								setCurrentPage(1);
							}}
							className="px-2 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
						>
							<option value={25}>25 per page</option>
							<option value={50}>50 per page</option>
							<option value={100}>100 per page</option>
						</select>
					</div>
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-gray-500" />
						<select
							value={customerTypeFilter}
							onChange={(e) => {
								setCustomerTypeFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
						>
							<option value="">All Types</option>
							<option value="B2B">B2B</option>
							<option value="D2C">D2C</option>
						</select>
					</div>
				</div>

				{/* Selected Tags */}
				{selectedTags.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-2">
						{selectedTags.map(tag => (
							<span
								key={tag}
								className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
							>
								{tag}
								<X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
							</span>
						))}
						<button
							onClick={clearAllTags}
							className="text-blue-600 hover:text-blue-800 text-xs"
						>
							Clear All
						</button>
					</div>
				)}
			</div>

			{/* --- TABLE SECTION --- */}
			<div className="bg-white rounded-lg shadow-md flex flex-col">
				<div className="overflow-x-auto">
					{loading ? (
						<div className="text-center py-12 text-gray-500 w-full flex justify-center">
							<Spinner/>
						</div>
					) : customers.length > 0 ? (
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
							<tr>
								<SortableHeader field="customer_name" label="Name" />
								<SortableHeader field="phone_number" label="Phone" />
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider space-x-1">
									<span>Email</span>
									<span className={"italic text-gray-600 text-xs font-light normal-case"}>Click to copy</span>
								</th>
								<SortableHeader field="customer_type" label="Type" />
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
								<SortableHeader field="total_spend" label="Total Spend" />
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider space-x-1">
									<span>Address</span>
									<span className={"italic text-gray-600 text-xs font-light normal-case"}>Click to copy</span>
								</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tags</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
								<th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Open Chat</th>
							</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
							{customers.map((customer, index) => (
								<tr key={customer.customer_quickbook_id || customer.phone_number || index} className="hover:bg-gray-50 transition-colors">
									<td className="px-4 py-3 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">
											{customer.customer_name || '-'}
										</div>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										<div className="text-sm text-gray-900">{customer.phone_number}</div>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										{/*<div className="text-sm text-gray-900">{customer.email || '-'}</div>*/}
										<div
											className="text-sm text-gray-900 max-w-xs truncate cursor-pointer hover:text-blue-600 transition-colors"
											title={customer.email ? `${customer.email} (Click to copy)` : undefined}
											onClick={() => customer.email && copyToClipboard(customer.email)}
										>
											{customer.email || '-'}
										</div>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												customer.customer_type === 'B2B'
													? 'bg-purple-100 text-purple-800'
													: 'bg-green-100 text-green-800'
											}`}>
												{customer.customer_type || '-'}
											</span>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										<div className="text-sm text-gray-900">{customer.company_name || '-'}</div>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">
											{customer.total_spend ? `Rs. ${customer.total_spend.toLocaleString()}` : '-'}
										</div>
									</td>
									<td className="px-4 py-3">
										<div
											className="text-sm text-gray-900 max-w-xs truncate cursor-pointer hover:text-blue-600 transition-colors"
											title={customer.address ? `${customer.address} (Click to copy)` : undefined}
											onClick={() => customer.address && copyToClipboard(customer.address)}
										>
											{customer.address || '-'}
										</div>
									</td>
									<td className="px-4 py-3">
										<TagsCell tags={customer.tags} />
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										<div className="flex items-center gap-2">
												<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
													customer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
												}`}>
													{customer.is_active ? 'Active' : 'Inactive'}
												</span>
											{customer.escalation_status && (
												<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
														Escalated
													</span>
											)}
										</div>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										<Link
											href={`/inbox?phone=${customer.phone_number}`}
											className="inline-flex items-center justify-center p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
											title="Open chat in inbox"
										>
											<MessageSquare className="w-4 h-4" />
										</Link>
									</td>
								</tr>
							))}
							</tbody>
						</table>
					) : (
						<div className="text-center py-12 text-gray-500">
							<p className="text-lg font-medium">No customers found</p>
							<p className="text-sm">Try adjusting your search or filter criteria</p>
						</div>
					)}
				</div>
			</div>

			{/* --- PAGINATION SECTION --- */}
			{!loading && customers.length > 0 && (
				<div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-sm text-gray-600">
					<div>
						Page {currentPage} of {totalPages} • {totalCustomers} total customers
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setCurrentPage(prev => prev - 1)}
							disabled={!hasPrevious}
							className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Previous
						</button>
						<span className="px-4">
							Page {currentPage} of {totalPages}
						</span>
						<button
							onClick={() => setCurrentPage(prev => prev + 1)}
							disabled={!hasNext}
							className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Next
						</button>
					</div>
				</div>
			)}
		</main>
	);
}