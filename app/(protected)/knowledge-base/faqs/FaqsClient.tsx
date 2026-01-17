"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {Download, Plus, RefreshCw, TableOfContents, Upload, User, CheckCircle} from 'lucide-react';
import Toast from '@/components/ui/Toast';
import PageLoader from "@/components/ui/PageLoader";
import FAQAddForm from '@/app/(protected)/knowledge-base/faqs/_components/FAQAddForm';
import FAQItem from '@/app/(protected)/knowledge-base/faqs/_components/FAQItem';
import FAQEditForm from '@/app/(protected)/knowledge-base/faqs/_components/FAQEditForm';
import FAQEmptyState from '@/app/(protected)/knowledge-base/faqs/_components/FAQEmptyState';
import { useFAQs } from '@/app/(protected)/knowledge-base/faqs/_hooks/useFAQs';
import {PageHeading} from "@/components/ui/Structure";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import StatCard from "@/components/ui/StatCard";
import { useUserRole } from '@/hooks/useUserRole';

interface FAQ {
	id: string;
	question: string;
	answer: string;
	updated_at: string;
	author: string;
}

interface ToastState {
	show: boolean;
	message: string;
	type: 'success' | 'error';
}

interface NewFAQ {
	question: string;
	answer: string;
}


export default function FAQsManager() {
	const {
		faqs,
		filteredFaqs,
		total,
		loading,
		saving,
		editingId,
		editingFAQ,
		deletingId,
		searchTerm,
		setSearchTerm,
		setEditingFAQ,
		fetchFAQs,
		createFAQ,
		updateFAQ,
		deleteFAQ,
		startEdit,
		cancelEdit,
		isUnanswered
	} = useFAQs();

	const { user, loading: userLoading } = useUserRole();

	console.log(`Total faqs: ${total}`);
	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
	const [showAddForm, setShowAddForm] = useState(false);
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
	const [newFAQ, setNewFAQ] = useState<NewFAQ>({
		question: '',
		answer: '',
	});
	const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	// Calculate stats
	const stats = useMemo(() => {
		const userEmail = user?.email || '';
		const myFAQs = faqs.filter(faq => faq.author === userEmail).length;
		const activeFAQs = faqs.filter(faq => !isUnanswered(faq)).length;
		const unansweredFAQs = faqs.filter(faq => isUnanswered(faq)).length;

		return {
			total: faqs.length,
			myFAQs,
			activeFAQs,
			unansweredFAQs
		};
	}, [faqs, user, isUnanswered]);

	const showToast = (message: string, type: 'success' | 'error' = 'success') => {
		setToast({ show: true, message, type });
	};

	const hideToast = () => {
		setToast(prev => ({ ...prev, show: false }));
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (activeDropdown !== null) {
				const dropdownElement = dropdownRefs.current[activeDropdown];
				if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
					setActiveDropdown(null);
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [activeDropdown]);

	const handleCreateFAQ = async () => {
		try {
			await createFAQ(newFAQ);
			setNewFAQ({ question: '', answer: '' });
			setShowAddForm(false);
			showToast('FAQ created successfully', 'success');
		} catch (error) {
			console.log(error);
			showToast('Failed to create FAQ', 'error');
		}
	};

	const handleUpdateFAQ = async () => {
		if (!editingFAQ) return;

		try {
			await updateFAQ(editingFAQ);
			cancelEdit();
			showToast('FAQ updated successfully', 'success');
		} catch (error) {
			console.log(error);
			showToast('Failed to update FAQ', 'error');
		}
	};

	const handleDeleteFAQ = async (faq: FAQ) => {
		if (!confirm(`Are you sure you want to delete this FAQ?\n\nQuestion: ${faq.question}\n\nThis action cannot be undone.`)) {
			return;
		}

		try {
			await deleteFAQ(faq);
			showToast('FAQ deleted successfully', 'success');
			setActiveDropdown(null);
		} catch (error) {
			console.log(error);
			showToast('Failed to delete FAQ', 'error');
		}
	};

	const handleToggleDropdown = (faqId: string) => {
		setActiveDropdown(activeDropdown === faqId ? null : faqId);
	};

	const handleUpdateNewFAQ = (field: 'question' | 'answer', value: string) => {
		setNewFAQ(prev => ({ ...prev, [field]: value }));
	};

	const handleUpdateEditingFAQ = (field: 'question' | 'answer', value: string) => {
		setEditingFAQ(prev => prev ? { ...prev, [field]: value } : null);
	};

	if (loading || userLoading) {
		return <PageLoader text="Loading FAQs..." />;
	}

	return (
		<div className="flex flex-1 flex-col bg-gray-50 p-3">
			<div className="">
				{/* Header */}
				<div className="mb-8 flex w-full justify-between items-center">

					<PageHeading title="FAQs" description="Create and manage FAQs" bottomMargin={"0"} />

					<SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} resultsAmount={filteredFaqs.length}/>

					<div className="flex gap-2">
						<button
							onClick={() => setShowAddForm(!showAddForm)}
							className="text-sm cursor-pointer flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"
						>
							<Plus className="w-4 h-4" />
							Add FAQ
						</button>

						<Link
							href="/faqs/import"
							className="text-sm flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"
						>
							<Upload className="w-4 h-4" />
							Import FAQs
						</Link>

						<Link
							href="/faqs/export"
							className="text-sm flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"
						>
							<Download className="w-4 h-4" />
							Export FAQs
						</Link>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					<StatCard
						value={stats.total}
						label="Total FAQs"
						icon={TableOfContents}
						iconColor="text-blue-600"
						iconBgColor="bg-blue-100"
						valueColor="text-blue-600"
					/>
					<StatCard
						value={stats.myFAQs}
						label="FAQs Uploaded by You"
						icon={User}
						iconColor="text-purple-600"
						iconBgColor="bg-purple-100"
						valueColor="text-purple-600"
					/>
					<StatCard
						value={stats.activeFAQs}
						label="Active FAQs"
						icon={CheckCircle}
						iconColor="text-green-600"
						iconBgColor="bg-green-100"
						valueColor="text-green-600"
					/>
					{/*<StatCard*/}
					{/*	value={stats.unansweredFAQs}*/}
					{/*	label="Unanswered FAQs"*/}
					{/*	icon={Clock}*/}
					{/*	iconColor="text-orange-600"*/}
					{/*	iconBgColor="bg-orange-100"*/}
					{/*	valueColor="text-orange-600"*/}
					{/*/>*/}
				</div>

				{/* Add FAQ Form */}
				{showAddForm && (
					<FAQAddForm
						newFAQ={newFAQ}
						saving={saving}
						onUpdate={handleUpdateNewFAQ}
						onCreate={handleCreateFAQ}
						onCancel={() => setShowAddForm(false)}
					/>
				)}

				{/* FAQs List */}
				<div className="space-y-4">
					{filteredFaqs.length === 0 ? (
						<FAQEmptyState hasAnyFAQs={faqs.length > 0} />
					) : (
						filteredFaqs.map((faq) => (
							<div key={faq.id}>
								{editingId === faq.id && editingFAQ ? (
									<div className="bg-white rounded-lg shadow-sm border p-6">
										<FAQEditForm
											editingFAQ={editingFAQ}
											saving={saving}
											onUpdate={handleUpdateEditingFAQ}
											onSave={handleUpdateFAQ}
											onCancel={cancelEdit}
										/>
									</div>
								) : (
									<FAQItem
										faq={faq}
										isUnanswered={isUnanswered(faq)}
										activeDropdown={activeDropdown}
										deletingId={deletingId}
										onEdit={() => startEdit(faq)}
										onDelete={() => handleDeleteFAQ(faq)}
										onToggleDropdown={() => handleToggleDropdown(faq.id)}
									/>
								)}
							</div>
						))
					)}
				</div>

				{/* Refresh Button */}
				<div className="mt-8 flex justify-center">
					<button
						onClick={fetchFAQs}
						disabled={loading}
						className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
					>
						<RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
						Refresh FAQs
					</button>
				</div>
			</div>

			{/* Toast */}
			{toast.show && (
				<Toast
					message={toast.message}
					type={toast.type}
					show={toast.show}
					onClose={hideToast}
				/>
			)}
		</div>
	);
}