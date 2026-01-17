"use client";

import { AlertCircle, MessageSquare, Users, TrendingUp, Clock, Zap, BookOpen, BarChart3, Inbox, ArrowUpRight, Image, Video, Mic, } from "lucide-react";
import { useState, useEffect } from "react";
import { ChatsData } from "@/types/chat";
import { AnalyticsOverview } from "@/types/responses";
import Toast from "@/components/ui/Toast";
import PageLoader from "@/components/ui/PageLoader";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DashboardClient() {
	const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
	const [analyticsLoading, setAnalyticsLoading] = useState(true);
	const [analyticsError, setAnalyticsError] = useState(false);

	const [chatPreview, setChatPreview] = useState<{ customers: ChatsData[] }>({ customers: [] });
	const [chatLoading, setChatLoading] = useState(true);
	const [chatPreviewError, setChatPreviewError] = useState(false);

	const [showToast, setShowToast] = useState(false);
	const [userName, setUserName] = useState<string>("");
	const [userRole, setUserRole] = useState<string>("");

	const loading = analyticsLoading || chatLoading;
	const error = chatPreviewError || analyticsError;

	const isAdmin = userRole === 'admin' || userRole === 'super_admin';

	// Get user data
	useEffect(() => {
		async function getUser() {
			const supabase = createClient();
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				setUserName(user.user_metadata?.full_name || user.user_metadata?.name || 'there');
				setUserRole(user.user_metadata?.role || '');
			}
		}
		void getUser();
	}, []);

	// Fetch analytics data
	useEffect(() => {
		async function fetchAnalyticsOverview() {
			try {
				const res = await fetch('/api/analytics/overview', {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
					},
				});

				if (!res.ok) {
					setAnalyticsError(true);
					throw new Error(`Error fetching analytics: ${res.status}`);
				}

				const data = await res.json();
				setAnalytics(data);
			} catch (err) {
				setAnalyticsError(true);
				console.error('Fetch error:', err);
			} finally {
				setAnalyticsLoading(false);
			}
		}
		void fetchAnalyticsOverview();
	}, []);

	// Fetch chat preview data
	useEffect(() => {
		async function fetchCustomers() {
			try {
				const res = await fetch('/api/chats?limit=5', {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
					},
				});
				if (!res.ok) {
					throw new Error(`Error: ${res.status}`);
				}
				const data: { customers: ChatsData[] } = await res.json();
				setChatPreview(data);
			} catch (err) {
				console.error('Error fetching customers:', err);
				setChatPreviewError(true);
			} finally {
				setChatLoading(false);
			}
		}
		void fetchCustomers();
	}, []);

	useEffect(() => {
		if (error && !loading) {
			setShowToast(true);
		}
	}, [error, loading]);

	if (loading) {
		return <PageLoader text={"Loading Dashboard..."} />;
	}

	const quickActions = [
		{ icon: Inbox, label: "View Inbox", color: "bg-yellow-400", href: "/inbox", enabled: true },
		{ icon: Users, label: "Manage Customers", color: "bg-blue-500", href: "/customers", enabled: isAdmin },
		{ icon: BookOpen, label: "Knowledge Base", color: "bg-purple-500", href: "/knowledge-base", enabled: true },
		{ icon: BarChart3, label: "Analytics", color: "bg-green-500", href: "/analytics", enabled: true },
	];

	const metrics = [
		{
			name: "Total Customers",
			value: analytics?.customer_stats?.total_customers || 0,
			change: `${analytics?.customer_stats?.total_customers || 0} active`,
			isPositive: true,
			icon: Users,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			name: "Total Messages",
			value: analytics?.message_stats?.total_messages || 0,
			change: `${analytics?.message_stats?.total_conversations || 0} conversations`,
			isPositive: true,
			icon: MessageSquare,
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			name: "D2C Customers",
			value: analytics?.customer_stats?.total_customers || 0,
			change: `${analytics?.customer_stats?.b2b_customers || 0} B2B`,
			isPositive: true,
			icon: Users,
			color: "text-yellow-600",
			bgColor: "bg-yellow-50",
		},
		{
			name: "Escalated Chats",
			value: analytics?.customer_stats?.escalated_customers || 0,
			change: `${analytics?.escalation_stats?.resolution_rate?.toFixed(1) || 0}% resolved`,
			isPositive: false,
			icon: AlertCircle,
			color: "text-red-600",
			bgColor: "bg-red-50",
		},
	];

	const messageTypeStats = [
		{
			icon: MessageSquare,
			label: "Text",
			count: analytics?.message_stats?.message_types?.text || 0,
			color: "text-blue-600",
			bgColor: "bg-blue-50"
		},
		{
			icon: Image,
			label: "Images",
			count: analytics?.message_stats?.message_types?.image || 0,
			color: "text-purple-600",
			bgColor: "bg-purple-50"
		},
		{
			icon: Video,
			label: "Videos",
			count: analytics?.message_stats?.message_types?.video || 0,
			color: "text-pink-600",
			bgColor: "bg-pink-50"
		},
		{
			icon: Mic,
			label: "Audio",
			count: analytics?.message_stats?.message_types?.audio || 0,
			color: "text-green-600",
			bgColor: "bg-green-50"
		},
	];

	return (
		<main className="flex flex-col flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-3 gap-y-8">
			{/*<div className="space-y-8 border-2 border-red-500">*/}
				{/* Welcome header */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}! 👋</h1>
					<p className="text-gray-600 mt-1">Here&#39;s what&#39;s happening with your AI assistant this month.</p>
				</div>
			</div>

			{/* Quick Actions Section */}
			<div>
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{quickActions.map((action, idx) => {
						return action.href ? (
							<Link
								key={idx}
								href={action.href}
								className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 group ${
									action.enabled
										? 'hover:shadow-md hover:border-yellow-400 cursor-pointer'
										: 'opacity-50 cursor-not-allowed'
								} transition-all`}
							>
								<div
									className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
										action.enabled ? 'group-hover:scale-110' : ''
									} transition-transform`}
								>
									<action.icon className="text-white" size={24} />
								</div>
								<p className="font-semibold text-gray-900 text-sm">{action.label}</p>
								{!action.enabled && <p className="text-xs text-gray-500 mt-1">Admin only</p>}
							</Link>
						) : (
							<div
								key={idx}
								className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 group ${
									action.enabled
										? 'hover:shadow-md hover:border-yellow-400 cursor-pointer'
										: 'opacity-50 cursor-not-allowed'
								} transition-all`}
							>
								<div
									className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
										action.enabled ? 'group-hover:scale-110' : ''
									} transition-transform`}
								>
									<action.icon className="text-white" size={24} />
								</div>
								<p className="font-semibold text-gray-900 text-sm">{action.label}</p>
								{!action.enabled && <p className="text-xs text-gray-500 mt-1">Admin only</p>}
							</div>
						);
					})}

				</div>
			</div>

			{/* Overview Section */}
			<div>
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{metrics.map((metric, idx) => (
						<div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-yellow-400 transition-colors">
							<div className="flex items-start justify-between mb-4">
								<div className={`${metric.bgColor} ${metric.color} p-3 rounded-lg`}>
									<metric.icon size={24} />
								</div>
							</div>
							<h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
							<p className="text-sm text-gray-600 mt-1">{metric.name}</p>
							<p className="text-xs text-gray-500 mt-2">{metric.change}</p>
						</div>
					))}
				</div>
			</div>

			{/* Recent Activity Section */}
			<div>
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Recent Chats */}
					<div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
						<div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-lg font-bold text-gray-900">Latest Conversations</h3>
									<p className="text-sm text-gray-600 mt-1">Recent customer interactions</p>
								</div>
								<Link href="/inbox" className="text-yellow-600 hover:text-yellow-700 font-medium text-sm flex items-center gap-1">
									View All
									<ArrowUpRight size={16} />
								</Link>
							</div>
						</div>
						<div className="divide-y divide-gray-100">
							{chatLoading ? (
								<div className="p-8 text-center">
									<p className="text-gray-500">Loading recent activity...</p>
								</div>
							) : chatPreview?.customers?.length > 0 ? (
								chatPreview.customers.map((customer, idx) => (
									<div key={idx} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
										<div className="flex items-start justify-between">
											<div className="flex items-start gap-3 flex-1">
												<div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-semibold">
													{(customer.customer_name || 'U').charAt(0).toUpperCase()}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<p className="font-semibold text-gray-900">{customer.customer_name || 'Unknown Customer'}</p>
													</div>
													<p className="text-sm text-gray-600 mt-1">{customer.phone_number || 'N/A'}</p>
													<p className="text-sm text-gray-500 mt-1">Recent conversation</p>
												</div>
											</div>
											<span className="text-xs text-gray-500 whitespace-nowrap">Recently</span>
										</div>
									</div>
								))
							) : (
								<div className="p-8 text-center">
									<MessageSquare className="mx-auto text-gray-300 mb-2" size={48} />
									<p className="text-gray-500">No recent activity</p>
								</div>
							)}
						</div>
					</div>

					{/* Performance Snapshot */}
					<div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-sm p-6 text-white">
						<div className="flex items-center gap-2 mb-4">
							<Zap size={24} />
							<h3 className="text-lg font-bold">Performance</h3>
						</div>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-yellow-50">Avg Messages/Day</span>
								<span className="font-bold">{analytics?.message_stats?.avg_messages_per_day || 0}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-yellow-50">Avg Msg/Conversation</span>
								<span className="font-bold">{analytics?.message_stats?.avg_messages_per_conversation?.toFixed(1) || 0}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-yellow-50">Active Days</span>
								<span className="font-bold">{analytics?.message_stats?.active_days || 0}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-yellow-50">Resolution Rate</span>
								<span className="font-bold">{analytics?.escalation_stats?.resolution_rate?.toFixed(1) || 0}%</span>
							</div>
						</div>
						<Link href="/analytics" className="block w-full mt-4 bg-white text-yellow-600 font-semibold py-2 rounded-lg hover:bg-yellow-50 transition-colors text-center">
							View Detailed Report
						</Link>
					</div>
				</div>
			</div>

			{/* System Status Section */}
			<div>
				<h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					<div className="p-4 border-b border-gray-200">
						<h3 className="text-lg font-bold text-gray-900">Real-time Service Monitoring</h3>
						<p className="text-sm text-gray-600 mt-1">Live system health dashboard</p>
					</div>
					<iframe
						src={process.env.NEXT_PUBLIC_STATUS_PAGE_URL}
						title="Boost Buddy Status"
						className="w-full border-0"
						style={{ minHeight: '500px' }}
					/>
				</div>
			</div>


			{/* Message Statistics */}
			<div>
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Message Insights</h2>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Message Types */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h3 className="text-lg font-bold text-gray-900 mb-4">Message Types</h3>
						<div className="grid grid-cols-2 gap-4">
							{messageTypeStats.map((stat, idx) => (
								<div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
									<div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
										<stat.icon size={20} />
									</div>
									<div>
										<p className="text-xs text-gray-600">{stat.label}</p>
										<p className="text-lg font-bold text-gray-900">{stat.count.toLocaleString()}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Sender Types */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<h3 className="text-lg font-bold text-gray-900 mb-4">Sender Statistics</h3>
						<div className="space-y-4">
							<div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
								<span className="font-medium text-gray-900">Customer Messages</span>
								<span className="text-xl font-bold text-yellow-600">
									{(analytics?.message_stats?.sender_types?.customer || 0).toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
								<span className="font-medium text-gray-900">Agent Messages</span>
								<span className="text-xl font-bold text-yellow-600">
									{(analytics?.message_stats?.sender_types?.agent || 0).toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
								<span className="font-medium text-gray-900">Representative Messages</span>
								<span className="text-xl font-bold text-yellow-600">
									{(analytics?.message_stats?.sender_types?.representative || 0).toLocaleString()}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom Stats */}
			<div>
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Link href="/knowledge-base" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-purple-400 transition-colors group">
						<div className="flex items-center gap-3 mb-2">
							<BookOpen className="text-purple-600 group-hover:scale-110 transition-transform" size={20} />
							<h3 className="font-semibold text-gray-900">Knowledge Base</h3>
						</div>
						<p className="text-2xl font-bold text-gray-900">Active</p>
						<p className="text-sm text-gray-600">Manage articles & content</p>
					</Link>

					<Link href="/faqs" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-green-400 transition-colors group">
						<div className="flex items-center gap-3 mb-2">
							<TrendingUp className="text-green-600 group-hover:scale-110 transition-transform" size={20} />
							<h3 className="font-semibold text-gray-900">FAQs</h3>
						</div>
						<p className="text-2xl font-bold text-gray-900">{analytics?.message_stats?.total_conversations || 0}</p>
						<p className="text-sm text-gray-600">Total interactions</p>
					</Link>

					<Link href="/analytics" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-yellow-400 transition-colors group">
						<div className="flex items-center gap-3 mb-2">
							<Clock className="text-yellow-600 group-hover:scale-110 transition-transform" size={20} />
							<h3 className="font-semibold text-gray-900">Avg Spend</h3>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							Rs. {analytics?.customer_stats?.avg_total_spend?.toLocaleString() || 0}
						</p>
						<p className="text-sm text-gray-600">Per customer</p>
					</Link>
				</div>
			</div>


			{(error && showToast) && (
				<Toast
					type={"error"}
					message="Oops, we ran into a problem. Refresh page & if the issue persists, contact the developer."
					onClose={() => setShowToast(false)}
				/>
			)}
		</main>
	);
}