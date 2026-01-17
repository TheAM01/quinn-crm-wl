import {
	AlertCircle,
	Ban,
	Clock,
	EllipsisVertical,
	ExternalLink,
	Image as ImageIcon,
	MessageCircle,
	Mic,
	Phone,
	Trash2
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";



import { ChatMessage } from "@/types/chat";
import { ExtendedUserData } from "@/types/user";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {createClient} from "@/lib/supabase/client";

const supabase = createClient();

// Cache for representative names to avoid repeated database calls
const repNameCache = new Map<string, string>();
let isFetchingAllReps = false;
let hasInitializedCache = false;

// Fetch all representative names and populate cache
const fetchAllRepNames = async () => {
	if (isFetchingAllReps || hasInitializedCache) return;

	isFetchingAllReps = true;
	try {
		const { data, error } = await supabase
			.from('representatives_profile')
			.select('email, full_name');

		if (error) {
			console.error("Error fetching all rep names:", error);
			return;
		}

		if (data) {
			data.forEach(rep => {
				if (rep.email && rep.full_name) {
					repNameCache.set(rep.email, rep.full_name);
				}
			});
			hasInitializedCache = true;
		}
	} catch (err) {
		console.error("Error in fetchAllRepNames:", err);
	} finally {
		isFetchingAllReps = false;
	}
};

interface ChatPreviewProps {
	chatData: ExtendedUserData;
	disabled: boolean;
	latestMessage?: ChatMessage | null;
	lastMessageLoading?: boolean;
	isSelected: boolean;
	onChatDeleted?: (phoneNumber: string) => void;
	onSelected: (phone: string) => void;
}

export default function ChatPreview({ chatData, disabled, latestMessage, lastMessageLoading, isSelected, onChatDeleted, onSelected }: ChatPreviewProps) {
	const router = useRouter();
	const [showDropdown, setShowDropdown] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isBlocking, setIsBlocking] = useState(false);
	const [isUnblocking, setIsUnblocking] = useState(false);
	const [repName, setRepName] = useState<string | null>(null);
	const [isLoadingRepName, setIsLoadingRepName] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const initials = chatData.customer_name
		? chatData.customer_name.split(" ").map(word => word[0]).join("").slice(0, 2)
		: "?";

	// Initialize cache on first mount
	useEffect(() => {
		void fetchAllRepNames();
	}, []);

	// Get representative name from cache if latest message is from a rep
	useEffect(() => {
		if (!latestMessage) return;

		const sender = latestMessage.sender;
		const isRep = sender && sender !== "agent" && sender !== "customer";

		if (isRep && sender.toLowerCase() !== "representative") {
			// Check cache first
			const cachedName = repNameCache.get(sender);
			if (cachedName) {
				setRepName(cachedName);
				return;
			}

			// If not in cache yet, show loading and wait for cache to populate
			setIsLoadingRepName(true);

			// Set up an interval to check if the cache has been populated
			const checkInterval = setInterval(() => {
				const name = repNameCache.get(sender);
				if (name) {
					setRepName(name);
					setIsLoadingRepName(false);
					clearInterval(checkInterval);
				} else if (hasInitializedCache) {
					// Cache is initialized but name not found, use fallback
					setRepName("Representative");
					setIsLoadingRepName(false);
					clearInterval(checkInterval);
				}
			}, 100);

			// Clear interval after 5 seconds if still not found
			setTimeout(() => {
				clearInterval(checkInterval);
				if (!repName) {
					setRepName("Representative");
					setIsLoadingRepName(false);
				}
			}, 5000);

			return () => clearInterval(checkInterval);
		}
	}, [latestMessage, repName]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleDeleteChat = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm(`Delete chat history for ${chatData.customer_name || chatData.phone_number}?`)) {
			setShowDropdown(false);
			return;
		}
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/chats/${chatData.phone_number}/delete`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) throw new Error('Failed to delete');
			if (onChatDeleted) onChatDeleted(chatData.phone_number);
		} catch (error) {
			console.error('Error deleting:', error);
			alert('Failed to delete. Try again.');
		} finally {
			setIsDeleting(false);
			setShowDropdown(false);
		}
	};

	const handleBlockCustomer = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm(`Block ${chatData.customer_name || chatData.phone_number}?`)) {
			setShowDropdown(false);
			return;
		}
		setIsBlocking(true);
		try {
			const response = await fetch(`/api/chats/${chatData.phone_number}/block`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) throw new Error('Failed to block');
			alert('Customer blocked');
			router.refresh();
		} catch (error) {
			console.error('Error blocking:', error);
			alert('Failed to block. Try again.');
		} finally {
			setIsBlocking(false);
			setShowDropdown(false);
		}
	};

	const handleUnblockCustomer = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm(`Unblock ${chatData.customer_name || chatData.phone_number}?`)) {
			setShowDropdown(false);
			return;
		}
		setIsUnblocking(true);
		try {
			const response = await fetch(`/api/chats/${chatData.phone_number}/unblock`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) throw new Error('Failed to unblock');
			alert('Customer unblocked');
			router.refresh();
		} catch (error) {
			console.error('Error unblocking:', error);
			alert('Failed to unblock. Try again.');
		} finally {
			setIsUnblocking(false);
			setShowDropdown(false);
		}
	};

	const handleDropdownToggle = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setShowDropdown(!showDropdown);
	};

	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
		const diffInHours = Math.floor(diffInMinutes / 60);
		const diffInDays = Math.floor(diffInHours / 24);

		if (diffInMinutes < 1) return "now";
		if (diffInMinutes < 60) return `${diffInMinutes}m`;
		if (diffInHours < 24) return `${diffInHours}h`;
		if (diffInDays < 7) return `${diffInDays}d`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	const getMessageTypeIcon = (messageType: string) => {
		const iconClass = "w-3 h-3";
		switch (messageType) {
			case 'audio': return <Mic className={`${iconClass} text-purple-500`} />;
			case 'image': return <ImageIcon className={`${iconClass} text-blue-500`} />;
			default: return <MessageCircle className={`${iconClass} text-gray-400`} />;
		}
	};

	const truncateMessage = (content: string, maxLength: number = 70) => {
		if (!content) return "";
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + "...";
	};

	const getMessagePreview = (message: ChatMessage) => {
		switch (message.message_type) {
			case 'audio': return "Voice message";
			case 'image': return "Photo";
			default: return truncateMessage(message.content);
		}
	};

	const getSenderStyle = (sender: string) => {
		const role = sender.toLowerCase();
		if (role.includes("customer") || role.includes("user")) return "bg-blue-50 text-blue-600";
		if (role.includes("representative") || (!role.includes("agent") && !role.includes("customer"))) return "bg-yellow-50 text-yellow-600";
		if (role.includes("agent")) return "bg-green-50 text-green-600";
		return "bg-stone-50 text-stone-600";
	};

	const getDisplayName = (sender: string) => {
		if (!sender) return "Unknown";
		if (sender === "customer") return "Customer";
		if (sender === "agent") return "Agent";

		const isRep = sender !== "agent" && sender !== "customer";
		if (isRep) {
			if (sender.toLowerCase() === "representative") return "Representative";
			return repName || "Representative";
		}

		return sender;
	};

	const isEscalated = chatData.escalation_status;
	const hasRecentMessage = latestMessage && !lastMessageLoading;
	const isRecent = hasRecentMessage && (new Date().getTime() - new Date(latestMessage.time_stamp).getTime()) < 3600000;
	const isBlocked = chatData.tags?.some(tag => tag.toLowerCase() === 'blocked');

	return (
		<div
			className={`group relative transition-all duration-100 rounded-md cursor-pointer ${
				disabled ? "opacity-60" : "hover:shadow-md"
			}`}
			onClick={() => {
				if (!disabled) return onSelected(chatData.phone_number)
			}}
		>
			<div className={`block ${disabled ? "pointer-events-none" : ""}`}>
				<div
					className={`relative p-2 rounded-md border transition-all duration-50 
					${disabled
						? "bg-gray-50 border-gray-200"
						: isSelected
							? isEscalated
								? "bg-gradient-to-r from-red-100 to-yellow-50 border-red-400 shadow-lg shadow-red-100"
								: "bg-yellow-50 border-yellow-400 shadow-lg shadow-yellow-100"
							: isEscalated
								? "bg-red-50 border-red-200 hover:border-red-300"
								: "bg-white border-stone-200 hover:border-stone-300"
					}`}
				>
					{isEscalated && (
						<div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
					)}
					{isRecent && !isEscalated && (
						<div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
					)}

					{!disabled && (
						<div className="absolute top-1.5 right-1.5 z-10" ref={dropdownRef}>
							<button
								onClick={handleDropdownToggle}
								className="flex items-center justify-center w-6 h-6 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
							>
								<EllipsisVertical className="w-3.5 h-3.5" />
							</button>

							{showDropdown && (
								<div className="absolute right-0 top-7 bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-44 z-20">
									<Link
										href={`/inbox/${chatData.phone_number}`}
										className="w-full px-3 py-1.5 text-left text-sm text-stone-900 hover:bg-stone-50 flex items-center gap-2"
									>
										<ExternalLink className="w-3.5 h-3.5" />
										Open in full window
									</Link>
									{isBlocked ? (
										<button
											onClick={handleUnblockCustomer}
											disabled={isUnblocking}
											className="w-full px-3 py-1.5 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
										>
											<Ban className="w-3.5 h-3.5" />
											{isUnblocking ? 'Unblocking...' : 'Unblock'}
										</button>
									) : (
										<button
											onClick={handleBlockCustomer}
											disabled={isBlocking}
											className="w-full px-3 py-1.5 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
										>
											<Ban className="w-3.5 h-3.5" />
											{isBlocking ? 'Blocking...' : 'Block'}
										</button>
									)}
									<button
										onClick={handleDeleteChat}
										disabled={isDeleting}
										className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
									>
										<Trash2 className="w-3.5 h-3.5" />
										{isDeleting ? 'Deleting...' : 'Delete history'}
									</button>
								</div>
							)}
						</div>
					)}

					{/* Content Column */}
					<div className="flex flex-col gap-2.5 w-full">
						{/* Line 1: Avatar, Name, Phone, Time */}
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								{/* Avatar */}
								<div className="relative flex-shrink-0">
									<div className={`flex items-center justify-center rounded-full text-white font-semibold shadow w-11 h-11 text-sm ${
										disabled
											? "bg-stone-400"
											: chatData.phone_number === "923002369080"
												? "bg-gradient-to-br from-rose-500 to-yellow-500"
												: isEscalated
													? "bg-gradient-to-br from-red-400 to-red-600"
													: "bg-gradient-to-br from-yellow-500 to-yellow-600"
									}`}>
										{initials.toUpperCase()}
									</div>
									{isRecent && (
										<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
									)}
								</div>

								{/* Name & Phone */}
								<div className="flex flex-col min-w-0 gap-0.5">
									<h3 className="font-semibold text-stone-900 truncate text-base leading-tight">
										{chatData.customer_name || `+${chatData.phone_number}`}
									</h3>
									<div className="flex items-center gap-1.5 text-xs text-stone-600">
										<Phone className="w-3.5 h-3.5 text-stone-400" />
										<span className="font-mono">{chatData.phone_number}</span>
									</div>
								</div>
							</div>

							{/* Time */}
							<div className="flex-shrink-0">
								{hasRecentMessage && (
									<div className={`flex items-center gap-1 text-xs font-medium ${
										isRecent ? "text-green-600" : "text-stone-500"
									}`}>
										<Clock className="w-3.5 h-3.5" />
										{formatTimestamp(latestMessage.time_stamp)}
									</div>
								)}
								{lastMessageLoading && (
									<div className="w-3.5 h-3.5 border border-stone-300 border-t-yellow-500 rounded-full animate-spin" />
								)}
							</div>
						</div>

						{/* Line 2: Customer Type & Tags */}
						<div className="flex flex-wrap items-center gap-1.5">
							{chatData.customer_type && (
								<span className="p-1 bg-stone-100 text-stone-700 text-xs font-medium rounded uppercase leading-2.5">
									{chatData.customer_type}
								</span>
							)}
							{chatData.tags && chatData.tags.length > 0 && (
								<>
									{chatData.tags.map((tag, index) => {
										const t = (tag || "").toLowerCase().trim();
										const tagClasses =
											t === "developer" ? "bg-amber-100 text-amber-600" :
												t === "spam" ? "bg-red-100 text-red-700" :
													t === "blocked" ? "bg-stone-900 text-white" :
														"bg-blue-100 text-blue-700";
										return (
											<span
												key={index}
												className={`p-1 text-xs font-medium leading-2.5 rounded ${tagClasses} ${t.includes("campaign") ? "uppercase" : "capitalize"}`}
											>
												{t}
											</span>
										);
									})}
								</>
							)}
							{(!!chatData.total_spend && chatData.total_spend > 0) && (
								<span className="text-xs text-stone-600 font-medium ml-auto">
									Rs {chatData.total_spend.toLocaleString()}
								</span>
							)}
						</div>

						{/* Line 3: Last Message */}
						{hasRecentMessage ? (
							<div className="flex items-center gap-2 text-xs p-2 bg-stone-100 rounded whitespace-nowrap">
								{getMessageTypeIcon(latestMessage.message_type)}
								{isLoadingRepName ? (
									<span className="h-3 w-20 bg-yellow-100 rounded animate-pulse"></span>
								) : (
									<span className={`font-medium ${getSenderStyle(latestMessage.sender).split(' ')[1]}`}>
										{getDisplayName(latestMessage.sender)}:
									</span>
								)}
								<span className="text-stone-700 truncate">
									{getMessagePreview(latestMessage)}
								</span>
							</div>
						) : lastMessageLoading ? (
							<div className="flex items-center gap-2.5 p-2 bg-stone-50 rounded animate-pulse">
								<div className="w-3.5 h-3.5 bg-stone-200 rounded-full"></div>
								<div className="h-3 bg-stone-200 rounded w-1/2"></div>
							</div>
						) : chatData.status === 'customer_only' ? (
							<div className="flex items-center gap-2 text-xs p-2 bg-amber-50 rounded">
								<AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
								<span className="font-medium text-amber-800">No history</span>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}