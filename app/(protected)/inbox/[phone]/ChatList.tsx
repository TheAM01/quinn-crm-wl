"use client";

import {
	SendHorizonal,
	Paperclip,
	ChevronDown,
	FileText,
	Settings,
	Sparkles,
	LoaderCircle
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/types/chat";
import ChatBubble from "@/components/ui/ChatBubble";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import ChatListSkeleton from "@/app/(protected)/inbox/[phone]/ChatListSkeleton";
import {redirect} from "next/navigation";

interface ChatProps {
	chat: {
		messages: ChatMessage[];
		phone_number: string;
	};
	escalationStatus: boolean;
	repName?: string;
	repEmail: string | null;
}

function ChatList({ chat, escalationStatus, repName = "Support Agent", repEmail }: ChatProps) {
	// State
	// console.log({escalationStatus, repName, repEmail})
	const [messages, setMessages] = useState<ChatMessage[]>([...chat.messages].reverse());
	const [isBlocked, setIsBlocked] = useState<boolean | null>(null);
	const [inputValue, setInputValue] = useState("");
	const [loading, setLoading] = useState(false);
	const [loadingOlder, setLoadingOlder] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
	const [showQuickMessages, setShowQuickMessages] = useState(false);
	const [uploadingFile, setUploadingFile] = useState(false);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [showStatusBar, setShowStatusBar] = useState(true);
	const [quickMessages, setQuickMessages] = useState<string[]>([]);
	const [loadingQuickMessages, setLoadingQuickMessages] = useState(false);
	const [canSendMessage, setCanSendMessage] = useState(true);
	const [enhancingMessage, setEnhancingMessage] = useState(false);
	const [enhancedMessage, setEnhancedMessage] = useState<string | null>(null);
	const [showEnhancedMessage, setShowEnhancedMessage] = useState(false);

	// Refs
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const documentInputRef = useRef<HTMLInputElement>(null);
	const quickMessagesRef = useRef<HTMLDivElement>(null);
	const enhancedMessageRef = useRef<HTMLDivElement>(null);
	const initialScrollDone = useRef(false);
	const statusBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isFetchingRef = useRef(false);
	const currentPhoneRef = useRef(chat.phone_number);

	const maxReconnectAttempts = 5;

	const showToast = (message: string, type: 'success' | 'error' = 'success') => {
		setToast({ message, type });
	};

	const hideToast = () => {
		setToast(null);
	};

	// Fetch quick messages from API
	const fetchQuickMessages = useCallback(async () => {
		setLoadingQuickMessages(true);
		try {
			const response = await fetch('/api/quick-messages?scope=all');
			if (!response.ok) throw new Error('Failed to fetch quick messages');

			const data = await response.json();

			// Replace {{repName}} with actual rep name and sort by display_order
			const processedMessages = data.messages
				.sort((a: {display_order: number}, b: {display_order: number}) => a.display_order - b.display_order)
				.map((msg: { message: string }) =>
					msg.message.replace(/\{\{repName\}\}/g, repName)
				);

			setQuickMessages(processedMessages);
		} catch (error) {
			console.error('Error fetching quick messages:', error);
			// Fallback to default messages if API fails
			setQuickMessages([
				`Hi, I am ${repName}, how may I assist you today?`,
				"Thank you for contacting us. I'll be happy to help you with your inquiry.",
				"I understand your concern. Let me look into this for you right away.",
				"Could you please provide more details about the issue you're experiencing?",
			]);
		} finally {
			setLoadingQuickMessages(false);
		}
	}, [repName]);

	useEffect(() => {
		void fetchQuickMessages();
	}, [fetchQuickMessages]);

	// Scroll to bottom
	const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior, block: "start" });
		}
	}, []);

	const fetchCustomerData = useCallback(async () => {
		try {
			const res = await fetch(`/api/users/${chat.phone_number}`);
			if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

			const data = await res.json();
			setIsBlocked(data.tags.includes("blocked"));
		} catch (e) {
			console.error("Error fetching customer data:", e);
			showToast("There was an error, please refresh page", "error");
		}
	}, [chat.phone_number])

	useEffect(() => {
		void fetchCustomerData();
	}, [fetchCustomerData]);

	const fetchOlderMessages = useCallback(async () => {
		// Prevent concurrent fetches
		if (isFetchingRef.current || !hasMore || loadingOlder) {
			return;
		}

		const container = containerRef.current;
		if (!container) return;

		// Check if we're actually near the top
		if (container.scrollTop > 200) return;

		isFetchingRef.current = true;
		setLoadingOlder(true);

		// Save current scroll position
		const currentScrollHeight = container.scrollHeight;
		const currentScrollTop = container.scrollTop;

		try {
			const nextPage = page + 1;
			const res = await fetch(
				`/api/chats/${chat.phone_number}?page=${nextPage}&messages_count=20`
			);

			if (!res.ok) {
				throw new Error(`Failed to fetch: ${res.status}`);
			}

			const data = await res.json();

			// Check if chat hasn't changed during fetch
			if (currentPhoneRef.current !== chat.phone_number) {
				return;
			}

			if (!data.messages || data.messages.length === 0) {
				setHasMore(false);
			} else {
				const olderMessages = [...data.messages].reverse();

				setMessages((prev) => [...olderMessages, ...prev]);
				setPage(nextPage);

				// Restore scroll position after DOM updates
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						if (container && currentPhoneRef.current === chat.phone_number) {
							const newScrollHeight = container.scrollHeight;
							const scrollDiff = newScrollHeight - currentScrollHeight;
							container.scrollTop = currentScrollTop + scrollDiff;
						}
					});
				});
			}
		} catch (error) {
			console.error("Error fetching older messages:", error);
			showToast("Error loading older messages", 'error');
		} finally {
			// Delay before allowing next fetch to prevent rapid successive calls
			setTimeout(() => {
				isFetchingRef.current = false;
				setLoadingOlder(false);
			}, 500);
		}
	}, [chat.phone_number, hasMore, page, loadingOlder]);

	// Initial scroll to bottom on mount
	useEffect(() => {
		if (!initialScrollDone.current && messages.length > 0) {
			// Use multiple attempts to ensure scroll happens after render
			const scrollAttempts = [0, 50, 100, 200];

			scrollAttempts.forEach((delay) => {
				setTimeout(() => {
					if (bottomRef.current && containerRef.current) {
						containerRef.current.scrollTop = containerRef.current.scrollHeight;
						bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
					}
				}, delay);
			});

			setTimeout(() => {
				initialScrollDone.current = true;
			}, 250);
		}
	}, [messages.length]);

	// Handle scroll to detect top
	const handleScroll = useCallback(() => {
		if (isFetchingRef.current || !hasMore || loadingOlder) return;

		const container = containerRef.current;
		if (!container) return;

		// Trigger fetch when within 200px of top
		if (container.scrollTop < 200) {
			void fetchOlderMessages();
		}
	}, [hasMore, loadingOlder, fetchOlderMessages]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Throttle scroll events
		let scrollTimeout: NodeJS.Timeout | null = null;
		const throttledScroll = () => {
			if (scrollTimeout) return;

			scrollTimeout = setTimeout(() => {
				handleScroll();
				scrollTimeout = null;
			}, 150);
		};

		container.addEventListener('scroll', throttledScroll);
		return () => {
			container.removeEventListener('scroll', throttledScroll);
			if (scrollTimeout) clearTimeout(scrollTimeout);
		};
	}, [handleScroll]);

	// WebSocket connection
	const connectWebSocket = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) return;

		try {
			const wsUri = `${process.env.NEXT_PUBLIC_WEBSOCKET_URI ?? ""}/ws/${chat.phone_number}`;
			setWsStatus('connecting');
			setShowStatusBar(true);
			const ws = new WebSocket(wsUri);
			wsRef.current = ws;

			const connectionTimeout = setTimeout(() => {
				if (ws.readyState !== WebSocket.OPEN) {
					ws.close();
				}
			}, 10000);

			ws.onopen = () => {
				clearTimeout(connectionTimeout);
				setWsStatus('connected');
				reconnectAttemptsRef.current = 0;
				setShowStatusBar(true);

				if (statusBarTimeoutRef.current) {
					clearTimeout(statusBarTimeoutRef.current);
				}
				statusBarTimeoutRef.current = setTimeout(() => {
					setShowStatusBar(false);
				}, 5000);
			};

			ws.onmessage = (event) => {
				try {
					const msg: ChatMessage = JSON.parse(event.data);
					setMessages((prev) => {
						const exists = prev.some(
							(m) => m.sender === msg.sender &&
								m.time_stamp === msg.time_stamp &&
								m.content === msg.content
						);
						if (exists) return prev;

						setTimeout(() => scrollToBottom(), 100);
						return [...prev, msg];
					});
				} catch (error) {
					console.error('Error parsing WebSocket message:', error);
				}
			};

			ws.onclose = (event) => {
				clearTimeout(connectionTimeout);
				if (statusBarTimeoutRef.current) {
					clearTimeout(statusBarTimeoutRef.current);
				}
				setWsStatus('disconnected');
				setShowStatusBar(true);

				if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
					const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
					reconnectTimeoutRef.current = setTimeout(() => {
						reconnectAttemptsRef.current++;
						connectWebSocket();
					}, delay);
				}
			};

			ws.onerror = (error) => {
				clearTimeout(connectionTimeout);
				if (statusBarTimeoutRef.current) {
					clearTimeout(statusBarTimeoutRef.current);
				}
				console.error('WebSocket error:', error);
				setWsStatus('error');
				setShowStatusBar(true);
			};
		} catch (error) {
			console.error('Failed to create WebSocket:', error);
			setWsStatus('error');
			setShowStatusBar(true);
		}
	}, [chat.phone_number, scrollToBottom]);

	useEffect(() => {
		connectWebSocket();

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			if (statusBarTimeoutRef.current) {
				clearTimeout(statusBarTimeoutRef.current);
			}
			if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
				wsRef.current.close(1000, 'Component unmounting');
			}
		};
	}, [connectWebSocket]);

	// Update messages when chat changes
	useEffect(() => {
		// Reset all state when phone number changes
		currentPhoneRef.current = chat.phone_number;
		setMessages([...chat.messages].reverse());
		setPage(1);
		setHasMore(true);
		setLoadingOlder(false);
		isFetchingRef.current = false;
		initialScrollDone.current = false;
	}, [chat.phone_number, chat.messages]);

	// Check message sending permission whenever messages change
	useEffect(() => {
		const permission = getMessageSendingPermission(messages);
		setCanSendMessage(permission);
	}, [messages]);

	// Close quick messages dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (quickMessagesRef.current && !quickMessagesRef.current.contains(event.target as Node)) {
				setShowQuickMessages(false);
			}
			if (enhancedMessageRef.current && !enhancedMessageRef.current.contains(event.target as Node)) {
				setShowEnhancedMessage(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const getMessageSendingPermission = (messages: ChatMessage[]) => {
		if (!messages[0]) return false;
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i].sender !== "customer") continue;
			const ts = new Date(messages[i].time_stamp).getTime();
			const now = Date.now();
			const tfh = 23 * 60 * 60 * 1000;
			if ((now - ts) > tfh) return false;
			return true;
		}
		return false;
	};

	const resetTextareaHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = '44px'; // Reset to min height
		}
	};

	const addMessage = async (messageContent?: string) => {
		const content = messageContent || inputValue;
		if (loading || uploadingFile || !escalationStatus || !content.trim()) return;

		if (!canSendMessage) {
			showToast("Cannot send message: the last customer message is more than 23 hours old.", "error");
			return;
		}

		setLoading(true);

		scrollToBottom()

		if (!repEmail) {
			showToast("Cannot send message due invalid representative email. Please refresh page and try again.", "error");
			setLoading(false);
			return;
		}

		const newMessage: ChatMessage = {
			content,
			message_type: "text",
			sender: `${repEmail}`,
			time_stamp: new Date().toISOString(),
		};

		try {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify(newMessage));
				setMessages((prev) => [...prev, newMessage]);
				if (!messageContent) {
					setInputValue("");
					resetTextareaHeight();
				}
				scrollToBottom();
			} else {
				const response = await fetch(`/api/chats/${chat.phone_number}/send`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ content, sender: "representative" }),
				});

				if (response.ok) {
					setMessages((prev) => [...prev, newMessage]);
					if (!messageContent) {
						setInputValue("");
						resetTextareaHeight();
					}
					setTimeout(() => scrollToBottom(), 50);
				} else {
					const errorData = await response.json().catch(() => ({}));
					showToast(`Error: ${errorData.message || "Failed to send message"}`, 'error');
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			showToast(`Network error: ${errorMessage}`, 'error');
		} finally {
			setLoading(false);
		}
	};

	const getMessageType = (fileType: string): string => {
		if (fileType.startsWith('image/')) return 'image';
		if (fileType.startsWith('audio/')) return 'audio';
		if (fileType.startsWith('video/')) return 'video';
		return 'document';
	};

	const uploadFile = async (file: File) => {
		const maxSize = 16 * 1024 * 1024;
		if (file.size > maxSize) {
			showToast('File size must be less than 16MB.', 'error');
			return;
		}

		setUploadingFile(true);

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('sender', 'representative');

			const response = await fetch(`/api/chats/${chat.phone_number}/send-media`, {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				const result = await response.json();
				const fileMessage: ChatMessage = {
					content: `![${result.fileName || file.name}](${result.url || result.fileName})`,
					message_type: getMessageType(file.type),
					sender: "representative",
					time_stamp: new Date().toISOString(),
				};

				setMessages((prev) => [...prev, fileMessage]);
				showToast(`File uploaded successfully!`, 'success');
				scrollToBottom();
			} else {
				const errorData = await response.json().catch(() => ({}));
				showToast(`Upload failed: ${errorData.error || 'Unknown error'}`, 'error');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Upload failed";
			showToast(`Upload error: ${errorMessage}`, 'error');
		} finally {
			setUploadingFile(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
			if (documentInputRef.current) documentInputRef.current.value = '';
		}
	};

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const allowedTypes = [
			'image/jpeg', 'image/png', 'image/gif', 'image/webp',
			'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'
		];

		if (!allowedTypes.includes(file.type)) {
			showToast('Please select an image or audio file only.', 'error');
			return;
		}

		await uploadFile(file);
	};

	const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const allowedDocTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'text/plain',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation'
		];

		if (!allowedDocTypes.includes(file.type)) {
			showToast('Please select a document file (PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX).', 'error');
			return;
		}

		await uploadFile(file);
	};

	const handleQuickMessageSelect = (message: string) => {
		setInputValue(message);
		setShowQuickMessages(false);

		// Use requestAnimationFrame for better timing with React's state update
		requestAnimationFrame(() => {
			if (textareaRef.current) {
				textareaRef.current.style.height = 'auto';
				textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
				textareaRef.current.focus();
			}
		});
	};

	const handleReconnect = () => {
		reconnectAttemptsRef.current = 0;
		setShowStatusBar(true);
		connectWebSocket();
	};

	const handleEnhanceMessage = async () => {
		if (!inputValue.trim() || enhancingMessage) return;

		setEnhancingMessage(true);

		try {
			const response = await fetch('/api/ai/enhance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ original_message: inputValue }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				showToast(`Error enhancing message: ${errorData.message || 'Unknown error'}`, 'error');
				return;
			}

			const data = await response.json();
			setEnhancedMessage(data.improved_reply);
			setShowEnhancedMessage(true);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			showToast(`Failed to enhance message: ${errorMessage}`, 'error');
		} finally {
			setEnhancingMessage(false);
		}
	};

	const handleAcceptEnhancement = () => {
		if (enhancedMessage) {
			setInputValue(enhancedMessage);
			setShowEnhancedMessage(false);
			setEnhancedMessage(null);

			// Adjust textarea height for new content
			requestAnimationFrame(() => {
				if (textareaRef.current) {
					textareaRef.current.style.height = 'auto';
					textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
					textareaRef.current.focus();
				}
			});
		}
	};

	const handleCancelEnhancement = () => {
		setShowEnhancedMessage(false);
		setEnhancedMessage(null);
	};

	if (loading) return <ChatListSkeleton/>

	return (
		<div className="flex flex-col h-full overflow-y-hidden flex-1">
			{/* Status bar */}
			{showStatusBar && (
				<div className="bg-neutral-50 px-4 py-1 text-xs flex justify-between items-center border-b border-neutral-200 ">
					<span className="flex items-center gap-1">
						<span className={`w-2 h-2 rounded-full ${
							wsStatus === 'connected' ? 'bg-green-500' :
								wsStatus === 'connecting' ? 'bg-yellow-500' :
									'bg-red-500'
						}`} />
						<span className="text-gray-600">
							{wsStatus === 'connected' ? 'Connected' :
								wsStatus === 'connecting' ? 'Connecting...' :
									'Disconnected'}
						</span>
					</span>
					{wsStatus !== 'connected' && wsStatus !== 'connecting' && (
						<button onClick={handleReconnect} className="text-yellow-400 hover:text-yellow-600 duration-200">
							Reconnect
						</button>
					)}
				</div>
			)}

			{/* Messages container */}
			<div
				ref={containerRef}
				className="p-3 gap-2.5 bg-neutral-100 overflow-y-scroll overflow-x-hidden h-full flex flex-col texture-mosaic relative"
			>
				{loadingOlder && (
					<div className="flex w-full justify-center py-2 sticky top-0 z-10">
						<Spinner />
					</div>
				)}

				{!hasMore && !loadingOlder && (
					<div className="text-center text-xs text-gray-500 py-2">
						No more messages
					</div>
				)}

				{messages.map((msg: ChatMessage, i: number) => {
					return <ChatBubble message={msg} key={`${msg.time_stamp}-${i}`}/>
				})}

				<div ref={bottomRef} className={"w-full border border-[#abcdef00]"} />
			</div>

			{/* Input area */}
			{escalationStatus ? (
				<div className="sticky bottom-0 p-2 bg-white relative">
					{/* Enhanced message popup - positioned absolutely to avoid overflow issues */}
					{(showEnhancedMessage) && (
						<div
							ref={enhancedMessageRef}
							className="absolute bottom-full left-0 right-0 mb-2 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 z-50"
						>
							<div className="mb-3">
								<p className="text-sm font-semibold text-black mb-2">✨ Enhanced Message:</p>
								<p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
									{enhancedMessage}
								</p>
							</div>
							<div className="flex gap-2 justify-end">
								<button
									onClick={handleCancelEnhancement}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleAcceptEnhancement}
									className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors"
								>
									Accept
								</button>
							</div>
						</div>
					)}


					{!canSendMessage && (
						<div className="mb-2 px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
							⚠️ Cannot send messages: The last customer message is more than 23 hours old.
						</div>
					)}

					<div className="relative mb-2 flex justify-between items-center" ref={quickMessagesRef}>
						<div className="flex flex-1 justify-between">
							<button
								onClick={() => setShowQuickMessages(!showQuickMessages)}
								className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
							>
								<span>Quick Messages</span>
								<ChevronDown
									size={16}
									className={`transform transition-transform ${showQuickMessages ? 'rotate-180' : ''}`}
								/>
							</button>

							<button
								onClick={() => redirect('/settings/preferences')}
								className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors cursor-pointer"
								title="Edit Quick Messages"
							>
								<Settings size={16} />
								<span>Edit Messages</span>
							</button>
						</div>

						{showQuickMessages && (
							<div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
								{loadingQuickMessages ? (
									<div className="flex justify-center py-4">
										<Spinner />
									</div>
								) : quickMessages.length === 0 ? (
									<div className="px-4 py-3 text-sm text-gray-500 text-center">
										No quick messages available. Click &quot;Edit Messages&quot; to add some!
									</div>
								) : (
									quickMessages.map((message, index) => (
										<button
											key={index}
											onClick={() => handleQuickMessageSelect(message)}
											className="leading-5 cursor-pointer w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors whitespace-pre-wrap"
										>
											{message}
										</button>
									))
								)}
							</div>
						)}

						{isBlocked &&
							<div className="text-sm text-red-500">
								This chat is blocked. You can still chat, but unblock the customer if they shouldn&apos;t be blocked.
							</div>
						}

					</div>

					<div className="flex gap-2 items-center">
						<div className="relative">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*,audio/*,video/*"
								onChange={handleFileUpload}
								className="hidden"
								disabled={loading || uploadingFile}
							/>
							<button
								onClick={() => fileInputRef.current?.click()}
								disabled={loading || uploadingFile}
								className="p-3 rounded-full flex items-center justify-center text-black border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								title="Upload image, audio, or video"
							>
								{uploadingFile ? <Spinner /> : <Paperclip size={20} />}
							</button>
						</div>

						<div className="relative">
							<input
								ref={documentInputRef}
								type="file"
								accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
								onChange={handleDocumentUpload}
								className="hidden"
								disabled={loading || uploadingFile}
							/>
							<button
								onClick={() => documentInputRef.current?.click()}
								disabled={loading || uploadingFile}
								className="p-3 rounded-full flex items-center justify-center text-black border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								title="Upload document"
							>
								{uploadingFile ? <Spinner /> : <FileText size={20} />}
							</button>
						</div>

						<textarea
							ref={textareaRef}
							className="w-full hide-scrollbar p-3 leading-tight bg-neutral-100 rounded-xl border border-neutral-400 focus:outline-1 focus:outline-red-400 resize-none min-h-[44px] max-h-32 overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder={canSendMessage ? "Type a message" : "Cannot send: last customer message is over 23 hours old"}
							value={inputValue}
							onChange={(e) => {
								setInputValue(e.target.value);
								// Auto-resize on change as well
								e.target.style.height = 'auto';
								e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									if (canSendMessage) {
										void addMessage();
									} else {
										showToast("Cannot send message: the last customer message is more than 23 hours old.", "error");
									}
								}
							}}
							disabled={loading || uploadingFile || !canSendMessage}
							rows={1}
							style={{ height: '44px' }}
						/>

						<button
							onClick={handleEnhanceMessage}
							disabled={!inputValue.trim() || enhancingMessage || loading || uploadingFile}
							className={`cursor-pointer p-3 rounded-full flex items-center justify-center text-white bg-purple-500 hover:bg-purple-600 border border-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
							title={(!inputValue.trim() || enhancingMessage || loading || uploadingFile) ? "Type a message first" : "Enhance with AI"}
						>
							{enhancingMessage ? <LoaderCircle className={"text-yellow-50 animate-spin"} size={20}/> : <Sparkles size={20} />}
						</button>

						<div className="hover:shadow-xl rounded-full duration-200">
							{loading ? (
								<div className="p-4">
									<Spinner />
								</div>
							) : (
								<button
									className="p-4 rounded-full flex items-center justify-center text-black border border-neutral-400 bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									onClick={() => {
										if (canSendMessage) {
											void addMessage();
										} else {
											showToast("Cannot send message: the last customer message is more than 23 hours old.", "error");
										}
									}}
									disabled={uploadingFile || !canSendMessage}
								>
									<SendHorizonal size={25} />
								</button>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="sticky bottom-0 p-4 bg-neutral-200 text-neutral-400">
					{!isBlocked ?
						"This chat isn't escalated yet. Toggle the escalation status switch at the top to escalate the chat."
						:
						"This chat is currently blocked. You can toggle escalation to chat; otherwise, the system will not reply automatically"
					}
				</div>
			)}

			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					show={!!toast}
					onClose={hideToast}
					duration={5000}
				/>
			)}
		</div>
	);
}

export default React.memo(ChatList);