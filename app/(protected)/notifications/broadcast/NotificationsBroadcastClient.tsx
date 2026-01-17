"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Send, Users, CheckSquare, Square, Loader2, Eye, X } from "lucide-react";

interface AppUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface GroupedUsers {
	representative: AppUser[];
	admin: AppUser[];
	super_admin: AppUser[];
}

interface SendNotificationsClientProps {
	users: AppUser[];
}

const supabase = createClient();

export default function NotificationsBroadcastClient({ users }: SendNotificationsClientProps) {
	const { user } = useUserRole();

	const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
	const [message, setMessage] = useState<string>("");
	const [sending, setSending] = useState<boolean>(false);
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
	const [successMessage, setSuccessMessage] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState<string>("");

	// Compute sender info dynamically so it updates when user loads
	const senderEmail = user?.email || "";

	// Handle both data structures: sometimes first_name/last_name, sometimes just name
	const firstName = user?.user_metadata?.first_name ?? "";
	const lastName = user?.user_metadata?.last_name ?? "";
	const fullName = user?.user_metadata?.name ?? "";

	// Use first_name + last_name if available, otherwise use name field, otherwise fall back to email
	const senderName = firstName && lastName
		? `${firstName} ${lastName}`.trim()
		: fullName || senderEmail;



	const roleLabels: Record<string, string> = {
		representative: "Representatives",
		admin: "Admins",
		super_admin: "Super Admins",
	};

	// Group users by role
	const grouped: GroupedUsers = {
		representative: [],
		admin: [],
		super_admin: [],
	};

	users.forEach((user: AppUser) => {
		const userRole = user.role as string | undefined;
		const role = userRole === "user" || !userRole ? "representative" : userRole;
		if (role in grouped) {
			grouped[role as keyof GroupedUsers].push(user);
		}
	});

	// Get user display name
	const getUserName = (user: AppUser): string => {
		const fullName = user.name.trim();
		return fullName || "Unknown";
	};

	// Toggle individual user selection
	const toggleUser = (userId: string): void => {
		const newSelected = new Set(selectedUsers);
		if (newSelected.has(userId)) {
			newSelected.delete(userId);
		} else {
			newSelected.add(userId);
		}
		setSelectedUsers(newSelected);
	};

	// Toggle entire role group
	const toggleRole = (role: keyof GroupedUsers): void => {
		const roleUserIds = grouped[role].map((u: AppUser) => u.id);
		const allSelected = roleUserIds.every((id: string) => selectedUsers.has(id));

		const newSelected = new Set(selectedUsers);
		if (allSelected) {
			roleUserIds.forEach((id: string) => newSelected.delete(id));
		} else {
			roleUserIds.forEach((id: string) => newSelected.add(id));
		}
		setSelectedUsers(newSelected);
	};

	// Check if entire role is selected
	const isRoleSelected = (role: keyof GroupedUsers): boolean => {
		const roleUserIds = grouped[role].map((u: AppUser) => u.id);
		return roleUserIds.length > 0 && roleUserIds.every((id: string) => selectedUsers.has(id));
	};

	// Get selected users details
	const getSelectedUsersDetails = (): AppUser[] => {
		const selected: AppUser[] = [];
		Object.values(grouped).forEach((userList: AppUser[]) => {
			userList.forEach((user: AppUser) => {
				if (selectedUsers.has(user.id)) {
					selected.push(user);
				}
			});
		});
		return selected;
	};

	// Show confirmation dialog
	const handleSendClick = (): void => {
		if (selectedUsers.size === 0) {
			setErrorMessage("Please select at least one user.");
			return;
		}

		if (!message.trim()) {
			setErrorMessage("Please enter a message.");
			return;
		}

		setErrorMessage("");
		setShowConfirmation(true);
	};

	// Send notifications
	const handleConfirmSend = async (): Promise<void> => {
		setSending(true);
		setShowConfirmation(false);
		setSuccessMessage("");

		try {
			const formattedMessage = `[${senderEmail}](${senderName}): ${message}`;

			const notifications = Array.from(selectedUsers).map((userId: string) => ({
				user_id: userId,
				message: formattedMessage,
				is_read: false,
			}));

			const { error } = await supabase
				.from("user_notifications")
				.insert(notifications);

			if (error) throw error;

			setSuccessMessage(`Successfully sent notification to ${selectedUsers.size} user(s)!`);
			setMessage("");
			setSelectedUsers(new Set());

			setTimeout(() => setSuccessMessage(""), 5000);
		} catch (error) {
			console.error("Error sending notifications:", error);
			setErrorMessage("Failed to send notifications. Please try again.");
		} finally {
			setSending(false);
		}
	};

	const totalUsers = users.length;

	return (
		<div className="flex flex-1 p-3">
			<div className="flex flex-1 flex-col">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-2">
						<Send size={32} className="text-yellow-500" />
						<h1 className="text-3xl font-bold">Send Notifications</h1>
					</div>
					<p className="text-gray-600">
						Select users and compose a notification to send
					</p>
				</div>

				{/* Success/Error Messages */}
				{successMessage && (
					<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
						{successMessage}
					</div>
				)}
				{errorMessage && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
						{errorMessage}
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* User Selection Panel */}
					<div className="lg:col-span-2">
						<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold flex items-center gap-2">
									<Users size={24} className="text-yellow-500" />
									Select Recipients
								</h2>
								<span className="text-sm text-gray-600">
                                    {selectedUsers.size} of {totalUsers} selected
                                </span>
							</div>

							{/* User Groups */}
							<div className="space-y-6">
								{(Object.keys(grouped) as Array<keyof GroupedUsers>).map((role: keyof GroupedUsers) => (
									grouped[role].length > 0 && (
										<div key={role}>
											{/* Role Header */}
											<div
												onClick={() => toggleRole(role)}
												className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-2"
											>
												{isRoleSelected(role) ? (
													<CheckSquare size={20} className="text-yellow-500" />
												) : (
													<Square size={20} className="text-gray-400" />
												)}
												<span className="font-semibold text-gray-800">
                                                    {roleLabels[role]}
                                                </span>
												<span className="text-sm text-gray-500">
                                                    ({grouped[role].length})
                                                </span>
											</div>

											{/* Users in Role */}
											<div className="space-y-1 ml-8">
												{grouped[role].map((user: AppUser) => (
													<div
														key={user.id}
														onClick={() => toggleUser(user.id)}
														className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
															selectedUsers.has(user.id)
																? "bg-yellow-50 border border-yellow-200"
																: "hover:bg-gray-50"
														}`}
													>
														{selectedUsers.has(user.id) ? (
															<CheckSquare size={18} className="text-yellow-500" />
														) : (
															<Square size={18} className="text-gray-400" />
														)}
														<div className="flex-1">
															<div className="font-medium text-gray-800">
																{getUserName(user)}
															</div>
															<div className="text-sm text-gray-500">
																{user.email}
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									)
								))}
							</div>

							{totalUsers === 0 && (
								<div className="text-center py-12 text-gray-500">
									No users available to send notifications to.
								</div>
							)}
						</div>
					</div>

					{/* Message Composition Panel */}
					<div className="lg:col-span-1">
						<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sticky top-6">
							<h2 className="text-xl font-semibold mb-4">Compose Message</h2>

							{/* Preview of sender info */}
							<div className="mb-4 p-3 bg-gray-50 rounded-lg">
								<div className="text-xs text-gray-600 mb-2">Message will appear as:</div>
								<div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-1 bg-yellow-300 text-yellow-600 rounded text-xs font-semibold flex items-center leading-4">
                                        {senderName}
                                    </span>
									<span className="text-sm text-gray-600 leading-4 flex items-center">{message.length > 0 ? message : "Type in your message below..."}</span>
								</div>
							</div>

							{/* Message Input */}
							<textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Type your notification message here..."
								className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
								rows={8}
							/>

							<div className="text-xs text-gray-500 mb-4">
								{message.length} characters
							</div>

							{/* Action Buttons */}
							<div className="space-y-2">
								<button
									onClick={() => setShowPreview(true)}
									disabled={!message.trim() || selectedUsers.size === 0}
									className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Eye size={20} />
									Preview
								</button>

								<button
									onClick={handleSendClick}
									disabled={sending || selectedUsers.size === 0 || !message.trim()}
									className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{sending ? (
										<>
											<Loader2 size={20} className="animate-spin" />
											Sending...
										</>
									) : (
										<>
											<Send size={20} />
											Send to {selectedUsers.size} user(s)
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Preview Modal */}
			{showPreview && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
						<div className="p-6 border-b border-gray-200 flex items-center justify-between">
							<h3 className="text-xl font-semibold">Preview Notification</h3>
							<button
								onClick={() => setShowPreview(false)}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<X size={20} />
							</button>
						</div>
						<div className="p-6 overflow-y-auto max-h-[60vh]">
							{/* Preview as it will appear in notification */}
							<div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4 mb-4">
								<div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-1 bg-yellow-300 text-yellow-600 rounded text-xs font-semibold inline-flex items-center leading-4">
                                        {senderName}
                                    </span>
									<span className="text-sm text-gray-600 leading-4 inline-flex items-center">{message.length > 0 ? message : "Type in your message below..."}</span>
								</div>
							</div>

							<div className="mt-6">
								<h4 className="font-semibold mb-2">Will be sent to:</h4>
								<div className="space-y-2 max-h-60 overflow-y-auto">
									{getSelectedUsersDetails().map((user: AppUser) => {
										const userRole = user.role as string | undefined;
										const displayRole = userRole === "user" || !userRole ? "representative" : userRole;
										return (
											<div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
												<div>
													<div className="font-medium text-sm">{getUserName(user)}</div>
													<div className="text-xs text-gray-500">{user.email}</div>
												</div>
												<span className="text-xs text-gray-500 capitalize">
                                                    {displayRole.replace("_", " ")}
                                                </span>
											</div>
										);
									})}
								</div>
							</div>
						</div>
						<div className="p-6 border-t border-gray-200 flex gap-3">
							<button
								onClick={() => setShowPreview(false)}
								className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Confirmation Modal */}
			{showConfirmation && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
						<div className="p-6">
							<h3 className="text-xl font-semibold mb-4">Confirm Send</h3>
							<p className="text-gray-600 mb-6">
								Are you sure you want to send this notification to {selectedUsers.size} user(s)?
							</p>
							<div className="flex gap-3">
								<button
									onClick={() => setShowConfirmation(false)}
									className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={() => void handleConfirmSend()}
									className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
								>
									Confirm Send
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}