'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, Send, CheckCircle, ArrowUpDown } from 'lucide-react';

interface Customer {
    phone_number: string;
    customer_name: string | null;
    tags: string[];
    customer_type: string;
    total_spend: number;
    is_active: boolean;
    escalation_status: boolean;
}

interface ChatsResponse {
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string;
    onSuccess: () => void;
}

export default function BroadcastModal({ isOpen, onClose, campaignId, onSuccess }: BroadcastModalProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    const [successfullySent, setSuccessfullySent] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [customerTypeFilter, setCustomerTypeFilter] = useState("");
    const [minSpend, setMinSpend] = useState("");
    const [maxSpend, setMaxSpend] = useState("");
    const [sortBy, setSortBy] = useState("updated_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [allTags, setAllTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'filtered' | 'all'>('none');
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    const ITEMS_PER_PAGE = 20;

    // Fetch tags
    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen]);

    // Debounced fetch
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            void fetchCustomers();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, tagFilter, customerTypeFilter, minSpend, maxSpend, sortBy, sortOrder, currentPage, isOpen]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: ITEMS_PER_PAGE.toString(),
                page: currentPage.toString(),
                sort_by: sortBy,
                sort_order: sortOrder,
            });

            if (searchTerm) params.set('search', searchTerm);
            if (tagFilter) params.set('tags', tagFilter);
            if (customerTypeFilter) params.set('customer_type', customerTypeFilter);
            if (minSpend) params.set('min_spend', minSpend);
            if (maxSpend) params.set('max_spend', maxSpend);

            const response = await fetch(`/api/customers?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch customers');

            const data: ChatsResponse = await response.json();
            setCustomers(data.customers);
            setTotalCustomers(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllCustomers = async () => {
        setIsLoadingAll(true);
        try {
            const params = new URLSearchParams({
                limit: '1000',
                page: '1',
                sort_by: sortBy,
                sort_order: sortOrder,
            });

            if (searchTerm) params.set('search', searchTerm);
            if (tagFilter) params.set('tags', tagFilter);
            if (customerTypeFilter) params.set('customer_type', customerTypeFilter);
            if (minSpend) params.set('min_spend', minSpend);
            if (maxSpend) params.set('max_spend', maxSpend);

            const response = await fetch(`/api/customers?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch all customers');

            const data: ChatsResponse = await response.json();
            return data.customers;
        } catch (error) {
            console.error('Error fetching all customers:', error);
            return [];
        } finally {
            setIsLoadingAll(false);
        }
    };

    const handleSelectCustomer = (phoneNumber: string) => {
        const newSelected = new Set(selectedCustomers);
        if (newSelected.has(phoneNumber)) {
            newSelected.delete(phoneNumber);
        } else {
            newSelected.add(phoneNumber);
        }
        setSelectedCustomers(newSelected);
        setSelectAllMode('none');
    };

    const handleSelectAllPage = () => {
        if (selectAllMode === 'page') {
            setSelectedCustomers(new Set());
            setSelectAllMode('none');
        } else {
            const pageNumbers = new Set(customers.map(c => c.phone_number));
            setSelectedCustomers(pageNumbers);
            setSelectAllMode('page');
        }
    };

    const handleSelectAllFiltered = async () => {
        if (selectAllMode === 'filtered') {
            setSelectedCustomers(new Set());
            setSelectAllMode('none');
        } else {
            const allCustomers = await fetchAllCustomers();
            const allNumbers = new Set(allCustomers.map(c => c.phone_number));
            setSelectedCustomers(allNumbers);
            setSelectAllMode('filtered');
        }
    };

    const handleSelectAll = async () => {
        if (selectAllMode === 'all') {
            setSelectedCustomers(new Set());
            setSelectAllMode('none');
        } else {
            setIsLoadingAll(true);
            try {
                const params = new URLSearchParams({
                    limit: '1000',
                    page: '1',
                });

                const response = await fetch(`/api/customers?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch all customers');

                const data: ChatsResponse = await response.json();
                const allNumbers = new Set(data.customers.map(c => c.phone_number));
                setSelectedCustomers(allNumbers);
                setSelectAllMode('all');
            } catch (error) {
                console.error('Error fetching all customers:', error);
            } finally {
                setIsLoadingAll(false);
            }
        }
    };

    const handleBroadcast = async () => {
        if (selectedCustomers.size === 0) return;

        setBroadcasting(true);
        try {
            const targets = Array.from(selectedCustomers).map(phoneNumber => {
                const customer = customers.find(c => c.phone_number === phoneNumber);
                return {
                    phone_number: phoneNumber,
                    customer_name: customer?.customer_name || null
                };
            });

            const response = await fetch('/api/campaigns/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    campaign_id: campaignId,
                    customers: targets
                })
            });

            if (!response.ok) throw new Error('Failed to send broadcast');

            setShowSuccessModal(true);
            setSuccessfullySent(selectedCustomers.size);
            setSelectedCustomers(new Set());
            setSearchTerm("");
            setTagFilter("");
            setCustomerTypeFilter("");
            setMinSpend("");
            setMaxSpend("");
            setSelectAllMode('none');
        } catch (error) {
            console.error('Error sending broadcast:', error);
        } finally {
            setBroadcasting(false);
        }
    };

    const handleSortChange = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setCurrentPage(1);
    };

    const getSelectionText = () => {
        if (selectAllMode === 'all') {
            return `All ${totalCustomers} customers selected`;
        } else if (selectAllMode === 'filtered') {
            return `All ${selectedCustomers.size} filtered customers selected`;
        } else if (selectAllMode === 'page') {
            return `All ${customers.length} on page selected`;
        }
        return `${selectedCustomers.size} selected`;
    };

    const resetFilters = () => {
        setSearchTerm("");
        setTagFilter("");
        setCustomerTypeFilter("");
        setMinSpend("");
        setMaxSpend("");
        setSortBy("updated_at");
        setSortOrder("desc");
        setCurrentPage(1);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900">Select Customers for Broadcast</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="p-6 border-b space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, email, or company..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <select
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={tagFilter}
                                onChange={(e) => {
                                    setTagFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Tags</option>
                                {allTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>

                            <select
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={customerTypeFilter}
                                onChange={(e) => {
                                    setCustomerTypeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Customer Types</option>
                                <option value="B2B">B2B</option>
                                <option value="D2C">D2C</option>
                            </select>

                            <input
                                type="number"
                                placeholder="Min Spend"
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={minSpend}
                                onChange={(e) => {
                                    setMinSpend(e.target.value);
                                    setCurrentPage(1);
                                }}
                                min="0"
                            />

                            <input
                                type="number"
                                placeholder="Max Spend"
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={maxSpend}
                                onChange={(e) => {
                                    setMaxSpend(e.target.value);
                                    setCurrentPage(1);
                                }}
                                min="0"
                            />
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Sort by:</span>
                                <select
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="updated_at">Last Updated</option>
                                    <option value="customer_name">Name</option>
                                    <option value="total_spend">Total Spend</option>
                                    <option value="phone_number">Phone Number</option>
                                </select>
                                <button
                                    onClick={() => handleSortChange(sortBy)}
                                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                                >
                                    <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 underline"
                                >
                                    Reset Filters
                                </button>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={handleSelectAllPage}
                                    disabled={isLoadingAll}
                                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                                >
                                    {selectAllMode === 'page' ? 'Deselect' : 'Select'} Page ({customers.length})
                                </button>

                                <button
                                    onClick={handleSelectAllFiltered}
                                    disabled={isLoadingAll}
                                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isLoadingAll && selectAllMode !== 'all' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : null}
                                    {selectAllMode === 'filtered' ? 'Deselect' : 'Select'} Filtered
                                </button>

                                <button
                                    onClick={handleSelectAll}
                                    disabled={isLoadingAll}
                                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isLoadingAll && selectAllMode === 'all' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : null}
                                    {selectAllMode === 'all' ? 'Deselect' : 'Select'} All ({totalCustomers})
                                </button>

                                <span className="text-sm text-gray-600 font-medium">
                                    {getSelectionText()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer List */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <span className="ml-3 text-gray-600">Loading customers...</span>
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No customers found
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {customers.map((customer) => (
                                    <div
                                        key={customer.phone_number}
                                        className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleSelectCustomer(customer.phone_number)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCustomers.has(customer.phone_number)}
                                            onChange={() => handleSelectCustomer(customer.phone_number)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="font-medium text-gray-900">
                                                    {customer.customer_name || 'No Name'}
                                                </div>
                                                {customer.customer_type && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                                                        {customer.customer_type}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-0.5">
                                                {customer.phone_number}
                                            </div>
                                            {customer.total_spend > 0 && (
                                                <div className="text-sm text-green-600 mt-1 font-medium">
                                                    Total Spend: ${customer.total_spend.toLocaleString()}
                                                </div>
                                            )}
                                            {customer.tags.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {customer.tags.map(tag => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && customers.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t">
                            <div className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages} • {totalCustomers} total customers
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    disabled={!hasPrevious}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={!hasNext}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t">
                        <span className="text-sm text-gray-600">
                            {getSelectionText()}
                        </span>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBroadcast}
                                disabled={selectedCustomers.size === 0 || broadcasting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                            >
                                {broadcasting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Broadcasting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Send Broadcast</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex flex-col items-center text-center">
                            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Broadcast Sent!</h2>
                            <p className="text-gray-600 mb-6">
                                Your broadcast has been successfully sent to {successfullySent} customer
                                {successfullySent !== 1 ? 's' : ''}.
                            </p>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    onSuccess();
                                    onClose();
                                }}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}