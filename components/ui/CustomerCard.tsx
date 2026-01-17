import {CustomerData} from "@/types/user";
import React, {useEffect, useRef, useState} from "react";
import {AlertCircle, Banknote, EllipsisVertical, Mail, Phone, Trash2} from "lucide-react";

export const CustomerCard = ({ customerData, onCustomerDeleted }: { customerData: CustomerData, onCustomerDeleted?: () => void }) => {
	const [showDropdown, setShowDropdown] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const initials = customerData.customer_name
		? customerData.customer_name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase()
		: `?`;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleDeleteUser = async () => {
		if (!confirm(`Are you sure you want to delete ${customerData.customer_name || customerData.phone_number}?`)) return;

		setIsDeleting(true);
		try {
			const response = await fetch(`/api/customers/${customerData.phone_number}/delete`, { method: 'DELETE' });
			if (!response.ok) throw new Error('Failed to delete user');

			alert('User deleted successfully');
			setShowDropdown(false);

			if (onCustomerDeleted) onCustomerDeleted();
		} catch (err) {
			console.error(err);
			alert('Failed to delete user');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="flex p-4 items-start gap-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ">
			<div className="flex flex-1 gap-4">
				{/* Avatar */}
				<div className="flex-shrink-0">
					<div className="flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl text-white text-lg font-bold w-14 h-14 shadow-sm">
						{initials}
					</div>
				</div>

				{/* Content */}
				<div className="flex flex-col gap-2 flex-1 min-w-0">
					{/* Header with name and status badges */}
					<div className="flex items-center gap-2 flex-wrap">
						<h3 className="font-semibold text-gray-900 text-lg">
							{customerData.customer_name || `+${customerData.phone_number}`}
						</h3>
						{customerData.customer_type && (
							<span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
								{customerData.customer_type}
							</span>
						)}
						{customerData.escalation_status && (
							<span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200 flex items-center gap-1">
								<AlertCircle size={12} />
								Escalated
                      		</span>
						)}
						{!customerData.is_active && (
							<span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
								Inactive
							</span>
						)}
					</div>

					{/* Contact Information */}
					<div className="flex flex-col gap-1.5 text-sm text-gray-600">
						{customerData.email && (
							<div className="flex items-center gap-2">
								<Mail size={14} className="text-gray-400 flex-shrink-0" />
								<span className="truncate">{customerData.email}</span>
							</div>
						)}
						<div className="flex items-center gap-2">
							<Phone size={14} className="text-gray-400 flex-shrink-0" />
							<span>{customerData.phone_number}</span>
						</div>
						{customerData.total_spend !== undefined && customerData.total_spend > 0 && (
							<div className="flex items-center gap-2">
								<Banknote size={14} className="text-green-600 flex-shrink-0" />
								<span className="font-medium text-green-700">
									Rs {customerData.total_spend.toLocaleString()} /-
								</span>
							</div>
						)}
					</div>

					{/* Tags */}
					{customerData.tags && customerData.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mt-1">
							{customerData.tags.map((tag, idx) => (
								<span
									key={idx}
									className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md border border-blue-200 font-medium"
								>
                            {tag}
                         </span>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Actions Menu */}
			<div className="relative flex-shrink-0" ref={dropdownRef}>
				<button
					className="flex items-center justify-center cursor-pointer hover:bg-gray-100 duration-150 p-2 rounded-lg transition-colors"
					onClick={() => setShowDropdown(!showDropdown)}
				>
					<EllipsisVertical size={18} className="text-gray-500"/>
				</button>

				{showDropdown && (
					<div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-10 min-w-52">
						<button
							onClick={handleDeleteUser}
							disabled={isDeleting}
							className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<Trash2 size={16} />
							<span>{isDeleting ? 'Deleting...' : 'Delete user & chat history'}</span>
						</button>
					</div>
				)}
			</div>
		</div>
	)
}