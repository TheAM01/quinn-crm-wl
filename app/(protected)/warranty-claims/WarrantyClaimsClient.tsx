"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, Phone, Package, Calendar, AlertCircle, CheckCircle, Clock, TrendingUp, ExternalLink } from 'lucide-react';

type ClaimStatus = 'pending' | 'approved' | 'rejected';

interface Attachment {
    url: string;
    filename: string;
    file_type?: string;
    type?: string;
    uploaded_at?: string;
}

interface WarrantyClaim {
    id: string;
    customer_phone: string;
    product_name: string;
    issue_description: string;
    order_id: string | null;
    attachments: Attachment[];
    notes: string | null;
    status: ClaimStatus;
    created_at: string;
    updated_at: string;
}

interface PaginationInfo {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
}

interface ApiResponse {
    claims: WarrantyClaim[];
    pagination: PaginationInfo;
}

interface StatsData {
    total_claims: number;
    pending_claims: number;
    approved_claims: number;
    rejected_claims: number;
}

const WarrantyClaimsDashboard: React.FC = () => {
    const [claims, setClaims] = useState<WarrantyClaim[]>([]);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [statsLoading, setStatsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);
    const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
    const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
    const [newStatus, setNewStatus] = useState<ClaimStatus | null>(null);
    const [updating, setUpdating] = useState<boolean>(false);

    useEffect(() => {
        fetchClaims();
        fetchStats();
    }, [currentPage]);

    const fetchClaims = async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const offset = (currentPage - 1) * itemsPerPage;
            const response = await fetch(`/api/warranty-claims?limit=${itemsPerPage}&offset=${offset}`);

            if (!response.ok) throw new Error('Failed to fetch claims');

            const data = await response.json() as ApiResponse;
            setClaims(data.claims || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (): Promise<void> => {
        setStatsLoading(true);

        try {
            const response = await fetch('/api/warranty-claims/stats');

            if (!response.ok) throw new Error('Failed to fetch stats');

            const data = await response.json() as StatsData;
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    // const handleStatusChange = (status: ClaimStatus) => {
    //     if (selectedClaim && selectedClaim.status !== status) {
    //         setNewStatus(status);
    //         setShowStatusModal(true);
    //     }
    // };

    const confirmStatusChange = async (): Promise<void> => {
        if (!selectedClaim || !newStatus) return;

        setUpdating(true);

        try {
            const response = await fetch(`/api/warranty-claims/${selectedClaim.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    notes: selectedClaim.notes || '',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update claim');
            }

            // Update the claim in local state
            const updatedClaim = { ...selectedClaim, status: newStatus };
            setClaims(claims.map(c => c.id === selectedClaim.id ? updatedClaim : c));
            setSelectedClaim(updatedClaim);

            // Refresh stats
            fetchStats();

            setShowStatusModal(false);
            setNewStatus(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update claim status';
            alert(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status: ClaimStatus): string => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status: ClaimStatus) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'rejected': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const groupedClaims = claims.reduce((acc, claim) => {
        const key = claim.order_id || `no-order-${claim.id}`;
        if (!acc.has(key)) {
            acc.set(key, []);
        }
        acc.get(key)!.push(claim);
        return acc;
    }, new Map<string | null, WarrantyClaim[]>());

    const totalPages = Math.ceil(100 / itemsPerPage);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading warranty claims...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-900 text-center mb-2">Error Loading Claims</h3>
                    <p className="text-red-700 text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Warranty Claims</h1>
                    <p className="text-gray-600">Manage and track all product warranty claims</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Claims</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {statsLoading ? '...' : stats?.total_claims || 0}
                                </p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {statsLoading ? '...' : stats?.pending_claims || 0}
                                </p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {statsLoading ? '...' : stats?.approved_claims || 0}
                                </p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {statsLoading ? '...' : stats?.rejected_claims || 0}
                                </p>
                            </div>
                            <div className="bg-red-100 rounded-full p-3">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Claims Grid */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                    {Array.from(groupedClaims.entries()).map(([orderId, orderClaims]: [string | null, WarrantyClaim[]]) => {
                        const hasMultipleClaims = orderClaims.length > 1;
                        const displayOrderId = orderId?.startsWith('no-order-') ? null : orderId;

                        return (
                            <div key={orderId || 'no-order'} className={hasMultipleClaims ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 border-2 border-yellow-300 shadow-lg' : ''}>
                                {hasMultipleClaims && displayOrderId && (
                                    <div className="mb-4 flex items-center gap-3 bg-yellow-400 rounded-lg px-4 py-3 shadow-md">
                                        <Package className="w-5 h-5 text-gray-900" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Grouped Order</p>
                                            <p className="text-lg font-bold text-gray-900">{displayOrderId}</p>
                                        </div>
                                        <div className="bg-gray-900 text-yellow-400 rounded-full px-3 py-1 text-sm font-bold">
                                            {orderClaims.length} claims
                                        </div>
                                    </div>
                                )}

                                <div className={hasMultipleClaims ? 'space-y-4' : ''}>
                                    {orderClaims.map((claim: WarrantyClaim) => (
                                        <div
                                            key={claim.id}
                                            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer transform hover:-translate-y-1"
                                            onClick={() => setSelectedClaim(claim)}
                                        >
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Package className="w-5 h-5 text-yellow-500" />
                                                            <h3 className="text-xl font-bold text-gray-900">{claim.product_name}</h3>
                                                        </div>
                                                        {claim.order_id && !hasMultipleClaims && (
                                                            <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                                                                <FileText className="w-4 h-4" />
                                                                Order: {claim.order_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(claim.status)} font-medium text-sm`}>
                                                        {getStatusIcon(claim.status)}
                                                        <span className="capitalize">{claim.status}</span>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">Issue Description:</p>
                                                    <p className="text-gray-900">{claim.issue_description}</p>
                                                </div>

                                                {claim.notes && (
                                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                                        <p className="text-sm font-medium text-yellow-900 mb-1">Notes:</p>
                                                        <p className="text-sm text-yellow-800">{claim.notes}</p>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        <span>{claim.customer_phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>{formatDate(claim.created_at)}</span>
                                                    </div>
                                                    {claim.attachments && claim.attachments.length > 0 && (
                                                        <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
                                                            <FileText className="w-4 h-4 text-yellow-600" />
                                                            <span className="text-yellow-700 font-medium">{claim.attachments.length} attachment(s)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Page <span className="font-bold text-gray-900">{currentPage}</span> of{' '}
                        <span className="font-bold text-gray-900">{totalPages}</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-medium rounded-lg hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Previous
                        </button>

                        <button
                            onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || claims.length < itemsPerPage}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-medium rounded-lg hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="text-sm text-gray-600">
                        Showing <span className="font-bold text-gray-900">{Math.min(claims.length, itemsPerPage)}</span> of{' '}
                        <span className="font-bold text-gray-900">{itemsPerPage}</span> per page
                    </div>
                </div>

                {/* Modal for claim details */}
                {selectedClaim && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedClaim(null)}>
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-gray-900">
                                <h2 className="text-2xl font-bold mb-2">{selectedClaim.product_name}</h2>
                                <p className="text-gray-800">Claim ID: {selectedClaim.id.slice(0, 8)}...</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                                    <p className="text-gray-700">Phone: {selectedClaim.customer_phone}</p>
                                    {selectedClaim.order_id && <p className="text-gray-700">Order: {selectedClaim.order_id}</p>}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Issue Description</h3>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedClaim.issue_description}</p>
                                </div>

                                {selectedClaim.notes && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                                        <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">{selectedClaim.notes}</p>
                                    </div>
                                )}

                                {selectedClaim.attachments && selectedClaim.attachments.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Attachments</h3>
                                        <div className="space-y-2">
                                            {selectedClaim.attachments.map((att: Attachment, idx: number) => (
                                                <a
                                                    key={idx}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-300 hover:border-yellow-400 rounded-lg transition-all group"
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="bg-yellow-400 rounded-lg p-2">
                                                            <FileText className="w-5 h-5 text-gray-900" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-gray-900 font-medium truncate">{att.filename}</p>
                                                            <p className="text-xs text-gray-600 mt-0.5">
                                                                {att.file_type || 'Click to view'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-yellow-700 group-hover:text-yellow-800">
                              Open
                            </span>
                                                        <ExternalLink className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div>
                                        <p className="text-sm text-gray-600">Created: {formatDate(selectedClaim.created_at)}</p>
                                        <p className="text-sm text-gray-600">Updated: {formatDate(selectedClaim.updated_at)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* {selectedClaim.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange('approved')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange('rejected')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                                                >
                                                    <AlertCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </>
                                        )} */}
                                        {selectedClaim.status !== 'pending' && (
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(selectedClaim.status)} font-medium`}>
                                                {getStatusIcon(selectedClaim.status)}
                                                <span className="capitalize">{selectedClaim.status}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedClaim(null)}
                                    className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Change Confirmation Modal */}
                {showStatusModal && selectedClaim && newStatus && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                            <div className={`p-6 rounded-t-2xl ${newStatus === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}>
                                <div className="flex items-center gap-3 text-white">
                                    {newStatus === 'approved' ? (
                                        <CheckCircle className="w-8 h-8" />
                                    ) : (
                                        <AlertCircle className="w-8 h-8" />
                                    )}
                                    <h2 className="text-2xl font-bold">
                                        {newStatus === 'approved' ? 'Approve Claim?' : 'Reject Claim?'}
                                    </h2>
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-gray-700 mb-2">
                                    Are you sure you want to <span className="font-bold">{newStatus}</span> this warranty claim?
                                </p>
                                <p className="text-sm text-gray-600 mb-6">
                                    <strong>Product:</strong> {selectedClaim.product_name}
                                    <br />
                                    <strong>Customer:</strong> {selectedClaim.customer_phone}
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowStatusModal(false);
                                            setNewStatus(null);
                                        }}
                                        disabled={updating}
                                        className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmStatusChange}
                                        disabled={updating}
                                        className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                            newStatus === 'approved'
                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                : 'bg-red-500 hover:bg-red-600 text-white'
                                        }`}
                                    >
                                        {updating ? 'Updating...' : `Confirm ${newStatus === 'approved' ? 'Approval' : 'Rejection'}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarrantyClaimsDashboard;