"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Calendar, Shield, Clock, Edit2, Save, X, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import PageLoader from "@/components/ui/PageLoader";
import Toast from "@/components/ui/Toast";
import Spinner from "@/components/ui/Spinner";

export default function AccountSettingsClient() {
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [editMode, setEditMode] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const supabase = createClient();

	const showToast = (message: string, type: 'success' | 'error' = 'success') => {
		setToast({ message, type });
	};

	const hideToast = () => {
		setToast(null);
	};

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const { data: { user }, error: userError } = await supabase.auth.getUser();
				if (userError) {
					console.error('Error fetching user:', userError);
					return;
				}

				setUser(user);

				if (user?.user_metadata) {
					// Check if we have first_name and last_name
					if (user.user_metadata.first_name && user.user_metadata.last_name) {
						setFirstName(user.user_metadata.first_name);
						setLastName(user.user_metadata.last_name);
					}
					// If we have 'name', split it
					else if (user.user_metadata.name) {
						const nameParts = user.user_metadata.name.trim().split(' ');
						setFirstName(nameParts[0] || '');
						setLastName(nameParts.slice(1).join(' ') || '');
					}
				}
			} catch (error) {
				console.error('Error:', error);
			} finally {
				setLoading(false);
			}
		};

		void fetchUserData();
	}, [supabase]);

	const handleSave = async () => {
		if (!user) return;

		// Validation
		if (!firstName.trim() || !lastName.trim()) {
			showToast('First name and last name are required', 'error');
			return;
		}

		setSaving(true);
		try {
			// Get current metadata
			const currentMetadata = { ...user.user_metadata };

			// 1. Set first_name and last_name
			currentMetadata.first_name = firstName.trim();
			currentMetadata.last_name = lastName.trim();

			// 2. Remove 'name' field if it exists
			if ('name' in currentMetadata) {
				delete currentMetadata.name;
			}

			// 3. If no role, set to 'representative'
			if (!currentMetadata.role) {
				currentMetadata.role = 'representative';
			}

			// 4. Set 'sub' if it doesn't exist
			if (!currentMetadata.sub) {
				currentMetadata.sub = user.id;
			}

			// 5. Handle super_admin logic
			const isSuperAdmin =
				currentMetadata.role === 'super_admin' ||
				currentMetadata.is_super_admin === true;

			if (isSuperAdmin) {
				currentMetadata.role = 'super_admin';
				currentMetadata.is_super_admin = true;
			}

			// Update auth metadata
			const { error: updateError } = await supabase.auth.updateUser({
				data: currentMetadata
			});

			if (updateError) {
				throw updateError;
			}

			showToast('Profile updated successfully');
			setEditMode(false);

			// Refresh user data
			const { data: { user: updatedUser } } = await supabase.auth.getUser();
			if (updatedUser) {
				setUser(updatedUser);
			}
		} catch (error) {
			console.error('Error updating profile:', error);
			showToast('Failed to update profile', 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		// Reset to original values
		if (user?.user_metadata) {
			if (user.user_metadata.first_name && user.user_metadata.last_name) {
				setFirstName(user.user_metadata.first_name);
				setLastName(user.user_metadata.last_name);
			} else if (user.user_metadata.name) {
				const nameParts = user.user_metadata.name.trim().split(' ');
				setFirstName(nameParts[0] || '');
				setLastName(nameParts.slice(1).join(' ') || '');
			}
		}
		setEditMode(false);
	};

	if (loading) {
		return <PageLoader text={"Loading Account Settings..."} />
	}

	if (!user) {
		return (
			<div className="bg-white rounded-xl border border-gray-200 p-6">
				<div className="flex items-center gap-3 mb-4">
					<div className="p-2 bg-red-100 rounded-lg">
						<User className="w-5 h-5 text-red-600" />
					</div>
					<div>
						<h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
						<p className="text-sm text-gray-600">Unable to load account information</p>
					</div>
				</div>
				<div className="bg-red-50 p-6 rounded-lg border border-red-200">
					<p className="text-red-600">Please try refreshing the page or logging in again.</p>
				</div>
			</div>
		);
	}

	const formatDate = (dateString: string | number | Date | null | undefined) => {
		if (!dateString) return 'Not available';
		try {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.log(error)
			return 'Invalid date';
		}
	};

	return (
		<div className="p-3 flex flex-1 flex-col">
			<div className="space-y-3 flex flex-1 flex-col">
				<div className="">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-yellow-100 rounded-lg">
								<User className="w-5 h-5 text-yellow-600" />
							</div>
							<div>
								<h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
								<p className="text-sm text-gray-600">Manage your account information and preferences</p>
							</div>
						</div>

						{!editMode && (
							<button
								onClick={() => setEditMode(true)}
								className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
							>
								<Edit2 size={18} />
								Edit Profile
							</button>
						)}
					</div>

					<div className="space-y-6">
						{/* Editable Profile Information */}
						<div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
								{editMode && (
									<div className="flex items-center gap-2">
										<button
											onClick={handleCancel}
											disabled={saving}
											className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
										>
											<X size={18} />
											Cancel
										</button>
										<button
											onClick={handleSave}
											disabled={saving}
											className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
										>
											{saving ? <Spinner /> : <Save size={18} />}
											Save Changes
										</button>
									</div>
								)}
							</div>

							{editMode && (
								<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
									<AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
									<p className="text-sm text-yellow-800">
										You are in edit mode. Make your changes and click &quot;Save Changes&quot; to update your profile.
									</p>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* First Name */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										First Name
									</label>
									{editMode ? (
										<input
											type="text"
											value={firstName}
											onChange={(e) => setFirstName(e.target.value)}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
											placeholder="Enter first name"
											disabled={saving}
										/>
									) : (
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-100 rounded-lg">
												<User className="w-4 h-4 text-blue-600" />
											</div>
											<p className="text-gray-900">{firstName || 'Not set'}</p>
										</div>
									)}
								</div>

								{/* Last Name */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Last Name
									</label>
									{editMode ? (
										<input
											type="text"
											value={lastName}
											onChange={(e) => setLastName(e.target.value)}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
											placeholder="Enter last name"
											disabled={saving}
										/>
									) : (
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-100 rounded-lg">
												<User className="w-4 h-4 text-blue-600" />
											</div>
											<p className="text-gray-900">{lastName || 'Not set'}</p>
										</div>
									)}
								</div>

								{/* Email (Read-only) */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email
									</label>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-purple-100 rounded-lg">
											<Mail className="w-4 h-4 text-purple-600" />
										</div>
										<p className="text-gray-900">{user.email}</p>
									</div>
									<p className="text-xs text-gray-500 mt-1">Email cannot be changed from this page</p>
								</div>

								{/* Phone (Read-only) */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Phone Number
									</label>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-green-100 rounded-lg">
											<Shield className="w-4 h-4 text-green-600" />
										</div>
										<p className="text-gray-900">{user.phone || 'Not set'}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Account Information (Read-only) */}
						<div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
							<h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										User ID
									</label>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-purple-100 rounded-lg">
											<Shield className="w-4 h-4 text-purple-600" />
										</div>
										<p className="text-sm text-gray-600 font-mono">{user.id}</p>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Account Created
									</label>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-yellow-100 rounded-lg">
											<Calendar className="w-4 h-4 text-yellow-600" />
										</div>
										<p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Last Sign In
									</label>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-green-100 rounded-lg">
											<Clock className="w-4 h-4 text-green-600" />
										</div>
										<p className="text-sm text-gray-600">{formatDate(user.last_sign_in_at)}</p>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email Status
									</label>
									<div className="flex items-center gap-2">
										<div className={`w-2 h-2 rounded-full ${user.email_confirmed_at ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
										<span className="text-sm text-gray-600">
											{user.email_confirmed_at ? 'Verified' : 'Not Verified'}
										</span>
										{user.email_confirmed_at && (
											<span className="text-xs text-gray-500 ml-2">
												on {formatDate(user.email_confirmed_at)}
											</span>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Role Information */}
						{user.user_metadata?.role && (
							<div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
								<h3 className="text-lg font-medium text-gray-900 mb-4">Role & Permissions</h3>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-indigo-100 rounded-lg">
										<Shield className="w-4 h-4 text-indigo-600" />
									</div>
									<div>
										<p className="text-sm font-medium text-gray-700">Current Role</p>
										<p className="text-sm text-gray-900 capitalize">
											{user.user_metadata.role.replace(/_/g, ' ')}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					show={!!toast}
					onClose={hideToast}
					duration={3000}
				/>
			)}
		</div>
	);
}