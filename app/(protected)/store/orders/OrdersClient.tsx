'use client';

import {useState, useEffect} from 'react';
import {
	// Search,
	LayoutGrid,
	Table,
	ChevronDown,
	ChevronUp,
	Package,
	User,
	MapPin,
	CreditCard,
	RefreshCw,
	Filter,
	ChevronLeft,
	ChevronRight
} from 'lucide-react';
import PageLoader from "@/components/ui/PageLoader";
import React from 'react';
import SearchBar from "@/components/ui/SearchBar";

interface ShopMoney {
	amount: string;
	currency_code: string;
}

interface PriceSet {
	shop_money: ShopMoney;
	presentment_money: ShopMoney;
}

interface Address {
	first_name: string;
	last_name: string;
	company: string | null;
	address1: string;
	address2: string | null;
	city: string;
	province: string | null;
	country: string;
	zip: string;
	phone: string;
	name: string;
	province_code: string | null;
	country_code: string;
	latitude?: number;
	longitude?: number;
}

interface Customer {
	id: number;
	email: string;
	first_name: string;
	last_name: string;
	state: string;
	note: string | null;
	verified_email: boolean;
	multipass_identifier: string | null;
	tax_exempt: boolean;
	tags: string;
	currency: string;
	created_at: string;
	updated_at: string;
}

interface LineItem {
	id: number;
	title: string;
	price: string;
	quantity: number;
	sku: string;
	variant_id: number;
	product_id: number;
	vendor: string;
	fulfillment_status: string | null;
	price_set: PriceSet;
	total_discount: string;
}

interface Order {
	id: number;
	name: string;
	email: string;
	created_at: string;
	updated_at: string;
	currency: string;
	total_price: string;
	subtotal_price: string;
	total_tax: string;
	financial_status: string;
	fulfillment_status: string | null;
	order_number: number;
	customer: Customer;
	line_items: LineItem[];
	shipping_address: Address;
	billing_address: Address;
	payment_gateway_names: string[];
	tags: string;
	total_shipping_price_set?: {
		shop_money: ShopMoney;
	};
}

interface OrdersResponse {
	success: boolean;
	orders: Order[];
}

type SortOption = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'name-asc' | 'name-desc';

export default function OrdersClient() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [sortBy, setSortBy] = useState<SortOption>('date-desc');
	const [showFilters, setShowFilters] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [itemsPerPage] = useState<number>(50);
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

	useEffect(() => {
		void fetchOrders();
	}, []);

	const fetchOrders = async (): Promise<void> => {
		try {
			setLoading(true);
			const response = await fetch('/api/store/orders');
			if (!response.ok) throw new Error('Failed to fetch orders');
			const data: OrdersResponse = await response.json();
			setOrders(data.orders || []);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async (): Promise<void> => {
		setIsRefreshing(true);
		await fetchOrders();
		setIsRefreshing(false);
	};

	// Filter orders
	let filteredOrders = orders.filter(order => {
		const customerFirstName = order.customer?.first_name?.toLowerCase() || '';
		const customerLastName = order.customer?.last_name?.toLowerCase() || '';
		const orderName = order.name?.toLowerCase() || '';
		const orderEmail = order.email?.toLowerCase() || '';
		const search = searchTerm.toLowerCase();

		const matchesSearch =
			orderName.includes(search) ||
			customerFirstName.includes(search) ||
			customerLastName.includes(search) ||
			orderEmail.includes(search);

		const matchesStatus = statusFilter === 'all' || order.financial_status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Sort orders
	filteredOrders = [...filteredOrders].sort((a, b) => {
		switch (sortBy) {
			case 'date-desc':
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			case 'date-asc':
				return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
			case 'price-desc':
				return parseFloat(b.total_price) - parseFloat(a.total_price);
			case 'price-asc':
				return parseFloat(a.total_price) - parseFloat(b.total_price);
			case 'name-asc':
				return a.name.localeCompare(b.name);
			case 'name-desc':
				return b.name.localeCompare(a.name);
			default:
				return 0;
		}
	});

	// Pagination
	const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatCurrency = (amount: string, currency: string = 'PKR'): string => {
		return `${currency} ${parseFloat(amount).toLocaleString()}`;
	};

	const getStatusColor = (status: string): string => {
		switch (status) {
			case 'paid':
				return 'bg-green-100 text-green-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'refunded':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const uniqueStatuses = ['all', ...new Set(orders.map(o => o.financial_status).filter(Boolean))];

	if (loading) {
		return <PageLoader text={"Loading Orders..."}/>
	}

	if (error) {
		return (
			<div className="flex flex-col flex-1 p-3 items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-white">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
					<h3 className="text-red-800 font-semibold mb-2">Error Loading Orders</h3>
					<p className="text-red-600">{error}</p>
					<button
						onClick={fetchOrders}
						className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col flex-1 p-3">
			<div className="flex flex-col">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Dashboard</h1>
							<p className="text-gray-600">{orders.length} total orders
								• {filteredOrders.length} filtered</p>
						</div>
						<SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} resultsAmount={filteredOrders.length}/>
						<button
							onClick={handleRefresh}
							disabled={isRefreshing}
							className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
						>
							<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
							Refresh
						</button>
					</div>
				</div>

				{/* Controls Bar */}
				<div className="mb-6 space-y-4">
					<div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
						{/* Search */}
						{/*<div className="relative flex-1 max-w-md w-full">*/}
							{/*<Search*/}
							{/*	className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>*/}
							{/*<input*/}
							{/*	type="text"*/}
							{/*	placeholder="Search by order #, customer name, or email..."*/}
							{/*	value={searchTerm}*/}
							{/*	onChange={(e) => {*/}
							{/*		setSearchTerm(e.target.value);*/}
							{/*		setCurrentPage(1);*/}
							{/*	}}*/}
							{/*	className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"*/}
							{/*/>*/}
						{/*</div>*/}

						{/* View Toggle & Filter Button */}
						<div className="flex gap-2">
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
									showFilters
										? 'bg-yellow-500 text-white border-yellow-500'
										: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
								}`}
							>
								<Filter className="w-4 h-4"/>
								Filters
							</button>
							<div className="flex gap-1 bg-white border border-gray-300 rounded-lg p-1">
								<button
									onClick={() => setViewMode('cards')}
									className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
										viewMode === 'cards'
											? 'bg-yellow-500 text-white'
											: 'text-gray-600 hover:bg-gray-100'
									}`}
								>
									<LayoutGrid className="w-4 h-4"/>
									Cards
								</button>
								<button
									onClick={() => setViewMode('table')}
									className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
										viewMode === 'table'
											? 'bg-yellow-500 text-white'
											: 'text-gray-600 hover:bg-gray-100'
									}`}
								>
									<Table className="w-4 h-4"/>
									Table
								</button>
							</div>
						</div>
					</div>

					{/* Filters Panel */}
					{showFilters && (
						<div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-semibold text-gray-900">Filters & Sorting</h3>
								<button
									onClick={() => {
										setStatusFilter('all');
										setSortBy('date-desc');
										setSearchTerm('');
									}}
									className="text-sm text-yellow-600 hover:text-yellow-700"
								>
									Clear All
								</button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Status Filter */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
									<select
										value={statusFilter}
										onChange={(e) => {
											setStatusFilter(e.target.value);
											setCurrentPage(1);
										}}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
									>
										{uniqueStatuses.map(status => (
											<option key={status} value={status}>
												{status.charAt(0).toUpperCase() + status.slice(1)}
											</option>
										))}
									</select>
								</div>

								{/* Sort By */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value as SortOption)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
									>
										<option value="date-desc">Date (Newest First)</option>
										<option value="date-asc">Date (Oldest First)</option>
										<option value="price-desc">Price (High to Low)</option>
										<option value="price-asc">Price (Low to High)</option>
										<option value="name-asc">Order # (A-Z)</option>
										<option value="name-desc">Order # (Z-A)</option>
									</select>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Cards View */}
				{viewMode === 'cards' && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
						{paginatedOrders.map((order) => (
							<div key={order.id}
								 className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-100 bg-yellow-50">
								<div className="p-6 bg-yellow-50">
									{/* Order Header */}
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1">
											<h3 className="text-lg font-bold text-gray-900">{order.name}</h3>
											<p className="text-sm text-gray-500 mt-1">{formatDate(order.created_at)}</p>
										</div>
										<span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.financial_status)}`}>
											{order.financial_status || 'N/A'}
										</span>
									</div>

									{/* Customer Info */}
									<div className="space-y-3 mb-4">
										<div className="flex items-center gap-2 text-gray-700">
											<User className="w-4 h-4 text-yellow-500"/>
											<span className="text-sm font-medium">
												{order.customer?.first_name} {order.customer?.last_name}
											</span>
										</div>
										<div className="flex items-center gap-2 text-gray-700">
											<MapPin className="w-4 h-4 text-yellow-500"/>
											<span className="text-sm">{order.shipping_address?.city}, {order.shipping_address?.country}</span>
										</div>
									</div>

									{/* Price */}
									<div className="pt-4 border-t border-gray-200">
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-600">Total:</span>
											<span className="text-xl font-bold text-yellow-600">
												{formatCurrency(order.total_price, order.currency)}
											</span>
										</div>
									</div>

									{/* Expand Button */}
									<button
										onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
										className="mt-4 w-full text-center text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center justify-center gap-2"
									>
										{expandedOrder === order.id ? (
											<>Less Info <ChevronUp className="w-4 h-4"/></>
										) : (
											<>More Info <ChevronDown className="w-4 h-4"/></>
										)}
									</button>

									{/* Expanded Details */}
									{expandedOrder === order.id && (
										<div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm">
											<div className="bg-gray-50 rounded p-3">
												<h4 className="font-semibold text-gray-700 mb-2 text-xs uppercase">Items
													({order.line_items?.length})</h4>
												{order.line_items?.map((item, idx) => (
													<div key={idx} className="text-gray-600 mb-1 flex justify-between">
														<span>• {item.title} (×{item.quantity})</span>
														<span
															className="font-medium">{formatCurrency(item.price, order.currency)}</span>
													</div>
												))}
											</div>
											<div className="bg-gray-50 rounded p-3">
												<h4 className="font-semibold text-gray-700 mb-2 text-xs uppercase">Contact</h4>
												<p className="text-gray-600">{order.email}</p>
												<p className="text-gray-600">{order.shipping_address?.phone}</p>
											</div>
											<div className="bg-gray-50 rounded p-3">
												<h4 className="font-semibold text-gray-700 mb-2 text-xs uppercase">Shipping
													Address</h4>
												<p className="text-gray-600">
													{order.shipping_address?.address1}
													{order.shipping_address?.address2 && `, ${order.shipping_address.address2}`}
												</p>
												<p className="text-gray-600">
													{order.shipping_address?.city}, {order.shipping_address?.zip}
												</p>
											</div>
											<div className="bg-gray-50 rounded p-3">
												<h4 className="font-semibold text-gray-700 mb-2 text-xs uppercase">Payment</h4>
												<div className="flex items-center gap-2 text-gray-600">
													<CreditCard className="w-4 h-4 text-yellow-500"/>
													{order.payment_gateway_names?.[0] || 'N/A'}
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				{/* Table View */}
				{viewMode === 'table' && (
					<div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-yellow-500">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
										Order #
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
										Customer
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
										Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
										Total
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
										Actions
									</th>
								</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{paginatedOrders.map((order) => (
										<React.Fragment key={order.id}>
											<tr className="hover:bg-yellow-50 transition-colors">
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm font-bold text-gray-900">{order.name}</div>
													<div className="text-xs text-gray-500">#{order.order_number}</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm font-medium text-gray-900">
														{order.customer?.first_name} {order.customer?.last_name}
													</div>
													<div className="text-xs text-gray-500">{order.email}</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
													{formatDate(order.created_at)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm font-bold text-yellow-600">
														{formatCurrency(order.total_price, order.currency)}
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.financial_status)}`}>
														{order.financial_status || 'N/A'}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													<button
														onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
														className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
													>
														{expandedOrder === order.id ? (
															<>Less <ChevronUp className="w-4 h-4"/></>
														) : (
															<>More <ChevronDown className="w-4 h-4"/></>
														)}
													</button>
												</td>
											</tr>
											{expandedOrder === order.id && (
												<tr className="bg-gray-50">
													<td colSpan={6} className="px-6 py-4">
														<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
															<div className="bg-white rounded-lg p-4 border border-gray-200">
																<h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase text-yellow-600">Items
																	({order.line_items?.length || 0})</h4>
																{order.line_items?.map((item, idx) => (
																	<div key={idx}
																		 className="text-sm text-gray-600 mb-2 flex justify-between">
																		<span>• {item.title} (×{item.quantity})</span>
																		<span
																			className="font-medium">{formatCurrency(item.price, order.currency)}</span>
																	</div>
																))}
															</div>
															<div className="bg-white rounded-lg p-4 border border-gray-200">
																<h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase text-yellow-600">Shipping
																	& Contact</h4>
																<div className="space-y-2 text-sm">
																	<div>
																		<p className="font-medium text-gray-700">Address:</p>
																		<p className="text-gray-600">
																			{order.shipping_address?.address1}
																			{order.shipping_address?.address2 && <br/>}
																			{order.shipping_address?.address2}
																		</p>
																		<p className="text-gray-600">
																			{order.shipping_address?.city}, {order.shipping_address?.zip}
																		</p>
																		<p className="text-gray-600">{order.shipping_address?.country}</p>
																	</div>
																	<div>
																		<p className="font-medium text-gray-700">Phone:</p>
																		<p className="text-gray-600">{order.shipping_address?.phone}</p>
																	</div>
																</div>
															</div>
															<div className="bg-white rounded-lg p-4 border border-gray-200">
																<h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase text-yellow-600">Order
																	Summary</h4>
																<div className="space-y-2 text-sm">
																	<div className="flex justify-between">
																		<span className="text-gray-600">Subtotal:</span>
																		<span
																			className="font-medium">{formatCurrency(order.subtotal_price, order.currency)}</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-gray-600">Tax:</span>
																		<span
																			className="font-medium">{formatCurrency(order.total_tax, order.currency)}</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-gray-600">Shipping:</span>
																		<span
																			className="font-medium">{formatCurrency(order.total_shipping_price_set?.shop_money?.amount || '0', order.currency)}</span>
																	</div>
																	<div
																		className="flex justify-between pt-2 border-t border-gray-200">
																		<span
																			className="font-semibold text-gray-900">Total:</span>
																		<span
																			className="font-bold text-yellow-600">{formatCurrency(order.total_price, order.currency)}</span>
																	</div>
																	<div className="pt-2 border-t border-gray-200">
																		<p className="text-gray-600"><span
																			className="font-medium">Payment:</span> {order.payment_gateway_names?.[0] || 'N/A'}
																		</p>
																	</div>
																	{order.tags && (
																		<div className="pt-2 border-t border-gray-200">
																			<p className="text-xs text-gray-500">Tags: {order.tags}</p>
																		</div>
																	)}
																</div>
															</div>
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* No Results */}
				{filteredOrders.length === 0 && (
					<div className="text-center py-12 bg-white rounded-lg shadow-lg border border-gray-200">
						<Package className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
						<p className="text-gray-600">Try adjusting your search or filter criteria</p>
					</div>
				)}

				{/* Pagination */}
				{filteredOrders.length > 0 && (
					<div
						className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4">
						<div className="text-sm text-gray-600">
							Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronLeft className="w-4 h-4"/>
							</button>
							<div className="flex gap-1">
								{[...Array(totalPages)].map((_, idx) => {
									const page = idx + 1;
									if (
										page === 1 ||
										page === totalPages ||
										(page >= currentPage - 1 && page <= currentPage + 1)
									) {
										return (
											<button
												key={page}
												onClick={() => setCurrentPage(page)}
												className={`px-3 py-2 rounded-lg transition-colors ${
													currentPage === page
														? 'bg-yellow-500 text-white font-semibold'
														: 'border border-gray-300 hover:bg-gray-50'
												}`}
											>
												{page}
											</button>
										);
									} else if (page === currentPage - 2 || page === currentPage + 2) {
										return <span key={page} className="px-2">...</span>;
									}
									return null;
								})}
							</div>
							<button
								onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
								disabled={currentPage === totalPages}
								className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<ChevronRight className="w-4 h-4"/>
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}