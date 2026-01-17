"use client";

import { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Package, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import PageLoader from "@/components/ui/PageLoader";

interface CartItem {
	name: string;
	quantity: number;
	price: number;
}

interface Order {
	id: string;
	created_at: string;
	customer_phone: string;
	part_of_campaign: string;
	cart_items: CartItem[];
	total_amount: number;
	status: string;
	customer_name: string;
}

interface StatusBreakdown {
	placed: number;
	confirmed: number;
	cancelled: number;
}

interface Summary {
	status_breakdown: StatusBreakdown;
	total_amount: number;
}

interface Filters {
	status: string | null;
	campaign_id: string;
}

interface Pagination {
	current_page: number;
	page_size: number;
	total_pages: number;
	total_orders: number;
}

interface AnalyticsData {
	pagination: Pagination;
	filters: Filters;
	summary: Summary;
	orders: Order[];
}

export default function CampaignOrdersClient({ campaignId }: { campaignId: string }) {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [showFilters, setShowFilters] = useState<boolean>(false);

	useEffect(() => {
		fetchAnalytics();
	}, [campaignId, currentPage, statusFilter]);

	const fetchAnalytics = async (): Promise<void> => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				campaign_id: campaignId,
				page: currentPage.toString(),
				page_size: '20',
			});

			if (statusFilter) {
				params.append('status', statusFilter);
			}

			const response = await fetch(`/api/analytics/orders?${params.toString()}`);
			if (response.ok) {
				const analyticsData: AnalyticsData = await response.json();
				setData(analyticsData);
			} else {
				console.error('Failed to fetch analytics');
			}
		} catch (error) {
			console.error('Error fetching analytics:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const formatCurrency = (amount: number): string => {
		return `Rs ${amount.toFixed(2)} /-`;
	};

	const getStatusColor = (status: string): string => {
		switch (status.toLowerCase()) {
			case 'placed':
				return 'bg-blue-100 text-blue-800';
			case 'confirmed':
				return 'bg-green-100 text-green-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	if (loading && !data) {
		return <PageLoader text={`Loading analytics for campaign ${campaignId}...`} />;
	}

	if (!data) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50 flex-1">
				<div className="text-center">
					<p className="text-gray-600">No analytics data available</p>
				</div>
			</div>
		);
	}

	const { summary, orders, pagination } = data;

	return (
		<div className="flex flex-1 bg-gray-50 flex-col p-3">
			<div className="flex flex-1 flex-col">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Analytics</h1>
					<p className="text-gray-600">Campaign ID: <span className="font-semibold text-yellow-600">{campaignId}</span></p>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{/* Total Orders */}
					<div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Total Orders</p>
								<p className="text-3xl font-bold text-gray-900">{pagination.total_orders}</p>
							</div>
							<div className="p-3 bg-yellow-100 rounded-lg">
								<ShoppingCart className="w-8 h-8 text-yellow-600" />
							</div>
						</div>
					</div>

					{/* Total Revenue */}
					<div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Total Revenue</p>
								<p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.total_amount)}</p>
							</div>
							<div className="p-3 bg-yellow-100 rounded-lg">
								<DollarSign className="w-8 h-8 text-yellow-600" />
							</div>
						</div>
					</div>

					{/* Placed Orders */}
					<div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Placed</p>
								<p className="text-3xl font-bold text-gray-900">{summary.status_breakdown.placed}</p>
							</div>
							<div className="p-3 bg-blue-100 rounded-lg">
								<Package className="w-8 h-8 text-blue-600" />
							</div>
						</div>
					</div>

					{/* Confirmed Orders */}
					<div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Confirmed</p>
								<p className="text-3xl font-bold text-gray-900">{summary.status_breakdown.confirmed}</p>
							</div>
							<div className="p-3 bg-green-100 rounded-lg">
								<Package className="w-8 h-8 text-green-600" />
							</div>
						</div>
					</div>
				</div>

				{/* Status Breakdown Chart */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h2>
					<div className="space-y-4">
						{/* Placed */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium text-gray-700">Placed</span>
								<span className="text-sm font-semibold text-gray-900">{summary.status_breakdown.placed}</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-3">
								<div
									className="bg-blue-500 h-3 rounded-full transition-all duration-300"
									style={{
										width: `${(summary.status_breakdown.placed / pagination.total_orders) * 100}%`,
									}}
								/>
							</div>
						</div>

						{/* Confirmed */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium text-gray-700">Confirmed</span>
								<span className="text-sm font-semibold text-gray-900">{summary.status_breakdown.confirmed}</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-3">
								<div
									className="bg-green-500 h-3 rounded-full transition-all duration-300"
									style={{
										width: `${(summary.status_breakdown.confirmed / pagination.total_orders) * 100}%`,
									}}
								/>
							</div>
						</div>

						{/* Cancelled */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium text-gray-700">Cancelled</span>
								<span className="text-sm font-semibold text-gray-900">{summary.status_breakdown.cancelled}</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-3">
								<div
									className="bg-red-500 h-3 rounded-full transition-all duration-300"
									style={{
										width: `${(summary.status_breakdown.cancelled / pagination.total_orders) * 100}%`,
									}}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="bg-white rounded-lg shadow-sm p-4 mb-6">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold text-gray-900">Orders</h2>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
						>
							<Filter className="w-4 h-4" />
							Filters
						</button>
					</div>

					{showFilters && (
						<div className="mt-4 pt-4 border-t border-gray-200">
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => {
										setStatusFilter(null);
										setCurrentPage(1);
									}}
									className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										statusFilter === null
											? 'bg-yellow-500 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									All
								</button>
								<button
									onClick={() => {
										setStatusFilter('placed');
										setCurrentPage(1);
									}}
									className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										statusFilter === 'placed'
											? 'bg-yellow-500 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Placed
								</button>
								<button
									onClick={() => {
										setStatusFilter('confirmed');
										setCurrentPage(1);
									}}
									className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										statusFilter === 'confirmed'
											? 'bg-yellow-500 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Confirmed
								</button>
								<button
									onClick={() => {
										setStatusFilter('cancelled');
										setCurrentPage(1);
									}}
									className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										statusFilter === 'cancelled'
											? 'bg-yellow-500 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Cancelled
								</button>
								{statusFilter && (
									<button
										onClick={() => {
											setStatusFilter(null);
											setCurrentPage(1);
										}}
										className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-2"
									>
										<X className="w-4 h-4" />
										Clear
									</button>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Orders List */}
				<div className="space-y-4 mb-8">
					{orders.length === 0 ? (
						<div className="bg-white rounded-lg shadow-sm p-12 text-center">
							<ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-600">No orders found</p>
						</div>
					) : (
						orders.map((order) => (
							<div key={order.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
								<div className="flex items-start justify-between mb-4">
									<div>
										<div className="flex items-center gap-3 mb-2">
											<h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
											<span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
										</div>
										<p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
									</div>
									<div className="text-right">
										<p className="text-2xl font-bold text-yellow-600">{formatCurrency(order.total_amount)}</p>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
									<div>
										<p className="text-sm text-gray-600 mb-1">Customer Name</p>
										<p className="font-medium text-gray-900">{order.customer_name}</p>
									</div>
									<div>
										<p className="text-sm text-gray-600 mb-1">Phone Number</p>
										<p className="font-medium text-gray-900">{order.customer_phone}</p>
									</div>
								</div>

								{/* Cart Items */}
								<div className="border-t border-gray-200 pt-4">
									<p className="text-sm font-semibold text-gray-700 mb-3">Cart Items</p>
									<div className="space-y-2">
										{order.cart_items.map((item, index) => (
											<div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
														<Package className="w-5 h-5 text-yellow-600" />
													</div>
													<div>
														<p className="font-medium text-gray-900">{item.name}</p>
														<p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
													</div>
												</div>
												<p className="font-semibold text-gray-900">{formatCurrency(item.price)}</p>
											</div>
										))}
									</div>
								</div>
							</div>
						))
					)}
				</div>

				{/* Pagination */}
				{pagination.total_pages > 1 && (
					<div className="bg-white rounded-lg shadow-sm p-4">
						<div className="flex items-center justify-between">
							<div className="text-sm text-gray-600">
								Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_orders} total orders)
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setCurrentPage(currentPage - 1)}
									disabled={currentPage === 1}
									className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
								>
									<ChevronLeft className="w-4 h-4" />
									Previous
								</button>
								<button
									onClick={() => setCurrentPage(currentPage + 1)}
									disabled={currentPage === pagination.total_pages}
									className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
								>
									Next
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}