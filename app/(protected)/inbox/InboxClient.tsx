"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import Toast from "@/components/ui/Toast";
import PageLoader from "@/components/ui/PageLoader";
import Spinner from "@/components/ui/Spinner";

import { UsersApiResponse } from "@/types/responses";
import { CustomerChats } from "@/types/user";

import InboxControls from "./_components/InboxControls";
import InboxList from "./_components/InboxList";
import Pagination from "./_components/Pagination";
import StatusAlerts from "./_components/StatusAlerts";
import ChatClient from "./_components/InPageChatClient";

type SortField = "customer_name" | "total_spend" | "last_message_time" | "updated_at" | "phone_number";
type SortOrder = "asc" | "desc";

interface ExtendedUsersApiResponse extends UsersApiResponse {
	customers: CustomerChats[];
	pagination?: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

interface ApiResponse {
	customers: CustomerChats[];
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next: boolean;
	has_previous: boolean;
	total_escalated: number;
}

const DEFAULT_ITEMS_PER_PAGE = 25;
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEBOUNCE_DELAY = 1000; // 1s
const REFRESH_INTERVAL = 30000; // 30s
const COUNTDOWN_INTERVAL = 1000; // 1s

export default function InboxClient() {
	// Add render counter at the very top
	const renderCount = useRef(0);
	renderCount.current++;

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [initialLoading, setInitialLoading] = useState(true);
	const [loading, setLoading] = useState(false);
	const [userData, setUserData] = useState<ExtendedUsersApiResponse>({ customers: [] });
	const [error, setError] = useState<string | null>(null);
	const [showToast, setShowToast] = useState(false);
	console.log(loading, initialLoading)
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
	const [searchQuery, setSearchQuery] = useState("");
	const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
	const [escalationFilter, setEscalationFilter] = useState("all");
	const [isActiveFilter, setIsActiveFilter] = useState("all");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [tagSearchQuery, setTagSearchQuery] = useState("");
	const [sortField, setSortField] = useState<SortField>("last_message_time");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
	const [minSpend, setMinSpend] = useState("");
	const [maxSpend, setMaxSpend] = useState("");

	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [debouncedMinSpend, setDebouncedMinSpend] = useState("");
	const [debouncedMaxSpend, setDebouncedMaxSpend] = useState("");

	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [totalEscalated, setTotalEscalated] = useState(0);

	const [isRefreshing, setIsRefreshing] = useState(false);
	const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
	const [allTags, setAllTags] = useState<string[]>([]);
	const [isInitialPhoneSet, setIsInitialPhoneSet] = useState(false);

	// Fixed timer refs - use number for browser setTimeout
	const searchTimerRef = useRef<number | null>(null);
	const minSpendTimerRef = useRef<number | null>(null);
	const maxSpendTimerRef = useRef<number | null>(null);

	const hasMountedRef = useRef(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const countdownRef = useRef<HTMLDivElement | null>(null);
	const countdownValueRef = useRef<number>(30);
	const refreshIntervalRef = useRef<number | null>(null);
	const countdownIntervalRef = useRef<number | null>(null);

	// Filtered tag options
	const filteredTagOptions = allTags.filter(
		(tag) => !tagSearchQuery.trim() || tag.includes(tagSearchQuery.toLowerCase())
	);

	// -----------------------------------------------------------------------------
	// FETCH CUSTOMERS - Memoized with useCallback
	// -----------------------------------------------------------------------------
	const fetchCustomers = useCallback(async (page: number, limit: number, isAutoRefresh = false) => {

		// Abort previous request
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			if (isAutoRefresh) {
				setIsRefreshing(true);
			} else {
				setLoading(true);
			}

			const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
			if (debouncedSearchQuery.trim()) params.append("search", debouncedSearchQuery.trim());
			if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));
			if (customerTypeFilter !== "all") params.append("customer_type", customerTypeFilter);
			if (escalationFilter !== "all")
				params.append("escalation_status", escalationFilter === "escalated" ? "true" : "false");
			if (isActiveFilter !== "all")
				params.append("is_active", isActiveFilter === "active" ? "true" : "false");
			if (debouncedMinSpend) params.append("min_spend", debouncedMinSpend);
			if (debouncedMaxSpend) params.append("max_spend", debouncedMaxSpend);
			params.append("sort_by", sortField);
			params.append("sort_order", sortOrder);

			const res = await fetch(`/api/chats?${params}`, { signal: abortController.signal });
			if (!res.ok) throw new Error(`Failed (${res.status}) ${res.statusText}`);

			const data: ApiResponse = await res.json();

			setUserData({
				customers: data.customers,
				pagination: {
					total: data.total,
					page: data.page,
					limit: data.limit,
					totalPages: data.total_pages,
					hasNext: data.has_next,
					hasPrev: data.has_previous,
				},
			});
			setTotalItems(data.total);
			setTotalPages(data.total_pages);
			setTotalEscalated(data.total_escalated);

			const tagSet = new Set<string>();
			data.customers.forEach((c) => c.tags?.forEach((t) => t && tagSet.add(t.toLowerCase())));
			setAllTags(Array.from(tagSet).sort());

			setError(null);
			setShowToast(false);

			console.log("Done with fetching!")
		} catch (err) {
			// Ignore abort errors
			if (err instanceof Error && err.name === 'AbortError') {
				console.log('Fetch aborted');
				return;
			}
			const message = err instanceof Error ? err.message : "Failed to load conversations.";
			setError(message);
			setShowToast(true);
			setInitialLoading(false);
		} finally {
			if (isAutoRefresh) {
				setIsRefreshing(false);
			} else {
				setLoading(false);
				console.log("setting initial loading to false");
				console.log(totalItems)
				setInitialLoading(false);
			}
		}
	}, [
		debouncedSearchQuery,
		selectedTags,
		customerTypeFilter,
		escalationFilter,
		isActiveFilter,
		debouncedMinSpend,
		debouncedMaxSpend,
		sortField,
		sortOrder,
	]);

	// -----------------------------------------------------------------------------
	// EFFECTS
	// -----------------------------------------------------------------------------

	// Initialize selected phone from URL on mount
	useEffect(() => {
		const phoneFromUrl = searchParams.get('phone');
		if (phoneFromUrl && !isInitialPhoneSet) {
			setSelectedPhone(phoneFromUrl);
			setIsInitialPhoneSet(true);
		} else if (!isInitialPhoneSet) {
			setIsInitialPhoneSet(true);
		}
	}, [searchParams, isInitialPhoneSet]);

	// Update selected phone when customer list changes (only if phone doesn't exist or no phone selected yet)
	// Update selected phone when customer list changes
	useEffect(() => {
		if (userData.customers.length > 0 && isInitialPhoneSet) {
			const prev = selectedPhone;

			// If no phone selected yet and initial data loaded, select first
			if (!prev) {
				const firstPhone = userData.customers[0]?.phone_number || null;
				if (firstPhone) {
					setSelectedPhone(firstPhone);

					// Update URL without navigation (moved outside setState)
					const currentParams = new URLSearchParams(window.location.search);
					currentParams.set('phone', firstPhone);
					const newUrl = `${pathname}?${currentParams.toString()}`;
					router.replace(newUrl, { scroll: false });
				}
			}
		}
	}, [userData.customers, isInitialPhoneSet, router, pathname, selectedPhone]);

	// Debounce search query
	useEffect(() => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = window.setTimeout(
			() => setDebouncedSearchQuery(searchQuery),
			DEBOUNCE_DELAY
		);
		return () => {
			if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		};
	}, [searchQuery]);

	// Debounce min spend
	useEffect(() => {
		if (minSpendTimerRef.current) clearTimeout(minSpendTimerRef.current);
		minSpendTimerRef.current = window.setTimeout(
			() => setDebouncedMinSpend(minSpend),
			DEBOUNCE_DELAY
		);
		return () => {
			if (minSpendTimerRef.current) clearTimeout(minSpendTimerRef.current);
		};
	}, [minSpend]);

	// Debounce max spend
	useEffect(() => {
		if (maxSpendTimerRef.current) clearTimeout(maxSpendTimerRef.current);
		maxSpendTimerRef.current = window.setTimeout(
			() => setDebouncedMaxSpend(maxSpend),
			DEBOUNCE_DELAY
		);
		return () => {
			if (maxSpendTimerRef.current) clearTimeout(maxSpendTimerRef.current);
		};
	}, [maxSpend]);

	// Initial mount - fetch data
	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			setIsInitialPhoneSet(true);
			// fetchCustomers(1, itemsPerPage);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// When filters change, reset to page 1
	useEffect(() => {
		if (hasMountedRef.current) {
			setCurrentPage(1);
		}
	}, [
		debouncedSearchQuery,
		selectedTags,
		customerTypeFilter,
		escalationFilter,
		isActiveFilter,
		debouncedMinSpend,
		debouncedMaxSpend,
		sortField,
		sortOrder,
		itemsPerPage,
	]);

	// Fetch whenever page or filters change (combined effect)
	useEffect(() => {
		if (hasMountedRef.current) {
			void fetchCustomers(currentPage, itemsPerPage);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		currentPage,
		debouncedSearchQuery,
		selectedTags,
		customerTypeFilter,
		escalationFilter,
		isActiveFilter,
		debouncedMinSpend,
		debouncedMaxSpend,
		sortField,
		sortOrder,
		itemsPerPage,
	]);

	// Auto-refresh with countdown - restart when filters change
	useEffect(() => {
		let counter = 30;
		countdownValueRef.current = counter;
		if (countdownRef.current) countdownRef.current.textContent = `${counter}s`;

		// Countdown ticker
		countdownIntervalRef.current = window.setInterval(() => {
			counter--;
			if (counter < 0) counter = 29; // Reset before it shows -1
			countdownValueRef.current = counter;
			if (countdownRef.current) {
				countdownRef.current.textContent = `${counter}s`;
			}
		}, COUNTDOWN_INTERVAL);

		// Refresh timer
		refreshIntervalRef.current = window.setInterval(() => {
			void fetchCustomers(currentPage, itemsPerPage, true);
		}, REFRESH_INTERVAL);

		return () => {
			if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
			if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
		};
	}, [currentPage, itemsPerPage, fetchCustomers]); // Include fetchCustomers to restart timer when filters change

	// Cleanup abort controller on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	// -----------------------------------------------------------------------------
	// HANDLERS
	// -----------------------------------------------------------------------------
	const handleSetSelectedPhone = useCallback((phone: string | null) => {
		setSelectedPhone(phone);

		// Update URL params
		const currentParams = new URLSearchParams(window.location.search);
		if (phone) {
			currentParams.set('phone', phone);
		} else {
			currentParams.delete('phone');
		}
		const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
		router.replace(newUrl, { scroll: false });
	}, [router, pathname]);

	const handleEscalationChange = useCallback((phone: string, newStatus: boolean) => {
		setUserData((prev) => ({
			...prev,
			customers: prev.customers.map((c) =>
				c.phone_number === phone ? { ...c, escalation_status: newStatus } : c
			),
		}));
	}, []);

	const handleChatDeleted = useCallback(
		(phone: string) => {
			setUserData((prev) => ({
				...prev,
				customers: prev.customers.filter((c) => c.phone_number !== phone),
			}));
			void fetchCustomers(currentPage, itemsPerPage);
		},
		[currentPage, itemsPerPage, fetchCustomers]
	);

	const handleSort = useCallback((field: SortField) => {
		setSortField((prev) => {
			if (prev === field) {
				// Toggle order
				setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
			} else {
				// New field - set default order
				const defaultOrder = field === "last_message_time" || field === "updated_at" ? "desc" : "asc";
				setSortOrder(defaultOrder);
			}
			return field;
		});
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	const handleItemsPerPageChange = useCallback((val: number) => {
		setItemsPerPage(val);
		setCurrentPage(1);
	}, []);

	const getPageNumbers = useCallback(() => {
		const delta = 2;
		const range: (number | string)[] = [];
		const rangeWithDots: (number | string)[] = [];

		for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
			range.push(i);
		}
		if (currentPage - delta > 2) rangeWithDots.push(1, "...");
		else rangeWithDots.push(1);

		rangeWithDots.push(...range);

		if (currentPage + delta < totalPages - 1) rangeWithDots.push("...", totalPages);
		else if (totalPages > 1) rangeWithDots.push(totalPages);

		return rangeWithDots;
	}, [currentPage, totalPages]);

	// -----------------------------------------------------------------------------
	// RENDER
	// -----------------------------------------------------------------------------
	if (initialLoading) return <PageLoader text="Loading Conversations..." />;

	return (
		<main className="flex flex-1 flex-col gap-6 w-full">
			<div className="flex flex-1 flex-row overflow-y-auto">
				<div
					className={`flex h-full overflow-y-auto flex-col ${
						selectedPhone ? "w-3/14" : "w-full"
					} gap-2 overflow-x-hidden border-r border-neutral-200 p-1`}
				>
					{false && <div className="flex items-center justify-between h-min sticky">
						<div className={`text-2xl font-bold text-gray-900 items-center`}>
							Inbox
						</div>
						<div className="relative w-7 h-7 flex items-center justify-center">gvf
							{isRefreshing ? (
								<div
									className="w-7 h-7 border-2 border-t-yellow-600 border-gray-200 rounded-full animate-spin"/>
							) : (
								<div ref={countdownRef} className="text-[10px] font-medium text-yellow-700">
									30s
								</div>
							)}
						</div>
					</div>}

					<StatusAlerts
						escalatedCount={totalEscalated}
						chatOnlyCount={0}
						customerOnlyCount={0}
						loading={loading}
						error={error}
					/>

					{!error && (
						<InboxControls
							searchQuery={searchQuery}
							setSearchQuery={setSearchQuery}
							customerTypeFilter={customerTypeFilter}
							setCustomerTypeFilter={setCustomerTypeFilter}
							escalationFilter={escalationFilter}
							setEscalationFilter={setEscalationFilter}
							isActiveFilter={isActiveFilter}
							setIsActiveFilter={setIsActiveFilter}
							selectedTags={selectedTags}
							setSelectedTags={setSelectedTags}
							tagSearchQuery={tagSearchQuery}
							setTagSearchQuery={setTagSearchQuery}
							sortField={sortField}
							handleSort={handleSort}
							sortOrder={sortOrder}
							allTags={allTags}
							filteredTagOptions={filteredTagOptions}
							addTag={(t) => setSelectedTags((p) => [...p, t])}
							removeTag={(t) => setSelectedTags((p) => p.filter((x) => x !== t))}
							clearAllTags={() => setSelectedTags([])}
							resetFilters={() => {
								setSearchQuery("");
								setCustomerTypeFilter("all");
								setEscalationFilter("all");
								setIsActiveFilter("all");
								setSelectedTags([]);
								setMinSpend("");
								setMaxSpend("");
							}}
							itemsPerPage={itemsPerPage}
							setItemsPerPage={handleItemsPerPageChange}
							itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
							loading={loading}
							isCompact={!!selectedPhone}
							minSpend={minSpend}
							setMinSpend={setMinSpend}
							maxSpend={maxSpend}
							setMaxSpend={setMaxSpend}
						/>
					)}

					{!loading && !error && (
						<div className="flex items-center justify-between text-xs text-gray-600 gap-2">
							<div>
								Showing {(currentPage - 1) * itemsPerPage + 1}–
								{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
							</div>
						</div>
					)}

					<div className="flex flex-col gap-2">
						{(loading || initialLoading) ? (
							<div className="flex flex-col justify-center items-center py-12 gap-3">
								<Spinner size="lg" />
								<p className="text-sm text-gray-500">Searching...</p>
							</div>
						) : error ? (
							<div className="text-center py-8 text-gray-500">
								<p className="text-lg font-medium text-red-600">Unable to load conversations</p>
							</div>
						) : userData.customers.length > 0 ? (
							<>
								<InboxList
									conversations={userData.customers}
									selectedChat={selectedPhone ?? ""}
									selectChat={handleSetSelectedPhone}
									onChatDeleted={handleChatDeleted}
									loading={loading || initialLoading}
								/>
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									totalItems={totalItems}
									handlePageChange={handlePageChange}
									getPageNumbers={getPageNumbers}
									loading={loading}
								/>
							</>
						) : (
							<div className="text-center py-12 text-gray-500">
								<p className="text-lg font-medium">No chats found</p>
								<p className="text-sm mt-2">Try adjusting your filters or search query</p>
							</div>
						)}
					</div>
				</div>

				{selectedPhone && (
					<div className="overflow-y-auto flex flex-1">
						<ChatClient
							key={selectedPhone}
							phone={selectedPhone}
							setSelectedPhone={handleSetSelectedPhone}
							onEscalationChange={handleEscalationChange}
						/>
					</div>
				)}
			</div>

			<Toast
				type="error"
				message={error || "An error occurred"}
				show={showToast && !!error}
				onClose={() => {
					setShowToast(false);
					setError(null);
				}}
				duration={8000}
			/>
		</main>
	);
}