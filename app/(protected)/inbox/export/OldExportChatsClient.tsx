'use client';

import { useState } from 'react';
import Toast from "@/components/ui/Toast"
import {createClient} from "@/lib/supabase/client";

type ExportFormat = 'json' | 'csv' | 'text';
type TimeRange = '12' | '24' | '48' | '72' | 'all';

interface Message {
	sender: string;
	content: string;
	time_stamp: string;
	message_type: string;
}

interface ChatRecord {
	idx?: number;
	phone_number: string;
	messages: string | Message[];
	created_at: string;
	updated_at: string;
}

export default function ChatExportPage() {
	const [timeRange, setTimeRange] = useState<TimeRange>('24');
	const [format, setFormat] = useState<ExportFormat>('json');
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState('');
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

	const supabase = createClient();

	const getTimeRangeFilter = (range: TimeRange): string | null => {
		if (range === 'all') return null;

		const now = new Date();
		const hours = parseInt(range);
		const cutoffDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
		return cutoffDate.toISOString();
	};

	const parseMessages = (messagesData: string | Message[]): Message[] => {
		if (Array.isArray(messagesData)) {
			return messagesData;
		}

		if (typeof messagesData === 'string') {
			try {
				const parsed = JSON.parse(messagesData);
				return Array.isArray(parsed) ? parsed : [];
			} catch (e) {
				console.error('Error parsing messages:', e);
				return [];
			}
		}

		return [];
	};

	const exportToJSON = (chats: ChatRecord[]) => {
		const formatted = chats.map(chat => {
			const messages = parseMessages(chat.messages);

			return {
				phone_number: chat.phone_number,
				created_at: chat.created_at,
				updated_at: chat.updated_at,
				message_count: messages.length,
				messages: messages
			};
		});

		const blob = new Blob([JSON.stringify(formatted, null, 2)], {
			type: 'application/json'
		});
		downloadFile(blob, `chat-export-${Date.now()}.json`);
	};

	const exportToCSV = (chats: ChatRecord[]) => {
		const rows: string[] = [];

		rows.push('Phone Number,Created At,Updated At,Sender,Message,Timestamp,Message Type');

		chats.forEach(chat => {
			const messages = parseMessages(chat.messages);

			if (messages.length === 0) {
				const row = [
					chat.phone_number,
					chat.created_at,
					chat.updated_at,
					'N/A',
					'No messages',
					'N/A',
					'N/A'
				].join(',');
				rows.push(row);
			} else {
				messages.forEach(msg => {
					const row = [
						chat.phone_number,
						chat.created_at,
						chat.updated_at,
						msg.sender,
						`"${msg.content.replace(/"/g, '""')}"`,
						msg.time_stamp,
						msg.message_type
					].join(',');
					rows.push(row);
				});
			}
		});

		const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
		downloadFile(blob, `chat-export-${Date.now()}.csv`);
	};

	const exportToText = (chats: ChatRecord[]) => {
		const lines: string[] = [];

		chats.forEach((chat, index) => {
			lines.push('='.repeat(80));
			lines.push(`CHAT #${index + 1}`);
			lines.push(`Phone: ${chat.phone_number}`);
			lines.push(`Created: ${chat.created_at}`);
			lines.push(`Updated: ${chat.updated_at}`);
			lines.push('='.repeat(80));
			lines.push('');

			const messages = parseMessages(chat.messages);

			if (messages.length === 0) {
				lines.push('(No messages in this conversation)');
				lines.push('');
			} else {
				messages.forEach((msg) => {
					lines.push(`[${msg.time_stamp}] ${msg.sender.toUpperCase()}`);
					lines.push(msg.content);
					lines.push('');
				});
			}

			lines.push('');
			lines.push('');
		});

		const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
		downloadFile(blob, `chat-export-${Date.now()}.txt`);
	};

	const downloadFile = (blob: Blob, filename: string) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const fetchAllChats = async (cutoffDate: string | null): Promise<ChatRecord[]> => {
		const allChats: ChatRecord[] = [];
		const pageSize = 500; // Reduced for better reliability
		let lastCreatedAt: string | null = null;
		let hasMore = true;
		let pageCount = 0;

		while (hasMore) {
			try {
				pageCount++;
				setProgress(`Fetching page ${pageCount}... (${allChats.length} chats so far)`);

				let query = supabase
					.from('chat_history')
					.select('*')
					.order('created_at', { ascending: false })
					.limit(pageSize);

				if (cutoffDate) {
					query = query.gte('created_at', cutoffDate);
				}

				// Use cursor-based pagination for reliability
				if (lastCreatedAt) {
					query = query.lt('created_at', lastCreatedAt);
				}

				const { data, error } = await query;

				if (error) {
					console.error('Supabase error:', error);
					throw new Error(`Failed to fetch chats: ${error.message}`);
				}

				if (!data || data.length === 0) {
					hasMore = false;
				} else {
					allChats.push(...data);

					if (data.length < pageSize) {
						hasMore = false;
					} else {
						// Set cursor to last item's created_at
						lastCreatedAt = data[data.length - 1].created_at;
					}
				}

				// Add small delay to avoid rate limiting
				if (hasMore) {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			} catch (err) {
				console.error('Error fetching page:', err);
				// Continue with what we have if error occurs mid-fetch
				if (allChats.length > 0) {
					console.warn('Partial data retrieved, continuing with export');
					break;
				}
				throw err;
			}
		}

		return allChats;
	};

	const handleExport = async () => {
		setLoading(true);
		setToast(null);
		setProgress('Starting export...');

		try {
			const cutoffDate = getTimeRangeFilter(timeRange);

			const data = await fetchAllChats(cutoffDate);

			if (!data || data.length === 0) {
				setToast({
					message: 'No chats found for the selected time range.',
					type: 'error'
				});
				setProgress('');
				return;
			}

			setProgress('Processing data...');

			let totalMessages = 0;
			data.forEach(chat => {
				const messages = parseMessages(chat.messages);
				totalMessages += messages.length;
			});

			switch (format) {
				case 'json':
					exportToJSON(data);
					break;
				case 'csv':
					exportToCSV(data);
					break;
				case 'text':
					exportToText(data);
					break;
			}

			setToast({
				message: `Successfully exported ${data.length} chat(s) with ${totalMessages} message(s) as ${format.toUpperCase()}`,
				type: 'success'
			});
			setProgress('');
		} catch (err) {
			setToast({
				message: err instanceof Error ? err.message : 'An error occurred during export',
				type: 'error'
			});
			console.error('Export error:', err);
			setProgress('');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-1 p-3 w-full">
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					show={true}
					onClose={() => setToast(null)}
				/>
			)}

			<div className="w-full">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-slate-800 mb-2">
						Export Chat History
					</h1>
					<p className="text-slate-600">
						Export your Supabase chat conversations in multiple formats. All exported files will be downloaded directly to your device.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
					{/* Left Column - Controls */}
					<div className="space-y-6">
						{/* Time Range Selection */}
						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-2">
								Time Range
							</label>
							<select
								value={timeRange}
								onChange={(e) => setTimeRange(e.target.value as TimeRange)}
								className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
								disabled={loading}
							>
								<option value="12">Last 12 hours</option>
								<option value="24">Last 24 hours</option>
								<option value="48">Last 48 hours</option>
								<option value="72">Last 72 hours</option>
								<option value="all">All chats</option>
							</select>
							<p className="text-xs text-slate-500 mt-2">
								Select the time period for chats you want to export. &quot;All chats&quot; will export your entire conversation history.
							</p>
						</div>

						{/* Format Selection */}
						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-2">
								Export Format
							</label>
							<div className="grid grid-cols-3 gap-3">
								{(['json', 'csv', 'text'] as ExportFormat[]).map((fmt) => (
									<button
										key={fmt}
										onClick={() => setFormat(fmt)}
										disabled={loading}
										className={`py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 ${
											format === fmt
												? 'bg-yellow-400 text-slate-900 shadow-lg scale-105'
												: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										}`}
									>
										{fmt.toUpperCase()}
									</button>
								))}
							</div>
							<p className="text-xs text-slate-500 mt-2">
								Choose the format that best suits your needs. JSON is recommended for data analysis and backup purposes.
							</p>
						</div>

						{/* Progress Display */}
						{progress && (
							<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
								<p className="text-sm text-blue-800 font-medium">{progress}</p>
							</div>
						)}

						{/* Export Button */}
						<button
							onClick={handleExport}
							disabled={loading}
							className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-semibold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
						>
							{loading ? (
								<span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
											fill="none"
										/>
                                        <path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
                                    </svg>
                                    Exporting...
                                </span>
							) : (
								'Export Chats'
							)}
						</button>
					</div>

					{/* Right Column - Information */}
					<div className="space-y-6">
						{/* Format Details */}
						<div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
							<h3 className="font-semibold text-yellow-900 mb-3">Export Format Details</h3>
							<ul className="text-sm text-yellow-800 space-y-2">
								<li>
									<strong>JSON:</strong> Structured data with nested messages and message count.
									Ideal for programmatic access, data analysis, and backup purposes. Each chat
									includes full metadata and all message details.
								</li>
								<li>
									<strong>CSV:</strong> Spreadsheet format with one row per message. Perfect for
									importing into Excel, Google Sheets, or database systems. Includes all message
									details in a flat table structure.
								</li>
								<li>
									<strong>TEXT:</strong> Human-readable conversation format with clear separators.
									Great for reading conversations naturally, sharing with team members, or creating
									documentation.
								</li>
							</ul>
						</div>

						{/* Additional Information */}
						<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
							<h3 className="font-semibold text-blue-900 mb-3">What&apos;s Included</h3>
							<ul className="text-sm text-blue-800 space-y-2">
								<li>• Phone numbers for each conversation</li>
								<li>• Complete message history with timestamps</li>
								<li>• Sender information (customer/agent)</li>
								<li>• Message types and metadata</li>
								<li>• Creation and update timestamps for each chat</li>
							</ul>
						</div>

						{/* Privacy Notice */}
						<div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
							<h3 className="font-semibold text-slate-900 mb-2">Privacy & Security</h3>
							<p className="text-sm text-slate-700">
								Exported data is downloaded directly to your device and not sent to any third-party
								services. Please handle exported files securely as they contain customer conversation data.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}