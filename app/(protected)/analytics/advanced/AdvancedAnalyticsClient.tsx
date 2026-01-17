"use client";

import React, { useState, useEffect } from 'react';
import { Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Users, MessageSquare, AlertTriangle, Calendar, DollarSign, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import PageLoader from "@/components/ui/PageLoader";

// Type definitions
interface EscalatedCustomer {
    phone_number: string;
    name: string;
    company: string | null;
    customer_type: string;
    spend: number;
    is_active: boolean;
    escalation_status: boolean;
}

interface DailyEscalationBreakdown {
    date: string;
    total_escalations: number;
    total_resolved: number;
    b2b_escalations: number;
    d2c_escalations: number;
    created_at: string;
    updated_at: string;
}

interface EscalationData {
    current_total_escalations: number;
    current_escalation_rate: number;
    current_escalated_by_type: {
        B2B: number;
        D2C: number;
    };
    escalated_customers: EscalatedCustomer[];
    historical_stats: {
        total_escalations: number;
        total_resolved: number;
        resolution_rate: number;
        b2b_escalations: number;
        d2c_escalations: number;
        active_days: number;
        avg_escalations_per_day: number;
        daily_breakdown: DailyEscalationBreakdown[];
    };
}

interface DailyStat {
    date: string;
    total_messages: number;
    text_messages: number;
    image_messages: number;
    video_messages: number;
    audio_messages: number;
    document_messages: number;
    total_customer_messages: number;
    total_agent_messages: number;
    total_representative_messages: number;
    created_at: string;
    updated_at: string;
}

interface MessageData {
    days: number;
    total_messages: number;
    avg_messages_per_day: number;
    message_types: {
        text: number;
        image: number;
        video: number;
        audio: number;
        document: number;
    };
    sender_types: {
        customer: number;
        agent: number;
        representative: number;
    };
    daily_stats: DailyStat[];
}

interface TopCustomer {
    phone_number: string;
    name: string;
    company: string | null;
    customer_type: string;
    spend: number;
    is_active: boolean;
    escalation_status: boolean;
}

interface OverviewData {
    customer_stats: {
        total_customers: number;
        active_customers: number;
        escalated_customers: number;
        b2b_customers: number;
        d2c_customers: number;
        avg_total_spend: number;
    };
    message_stats: {
        total_conversations: number;
        total_messages: number;
        avg_messages_per_conversation: number;
        message_types: {
            text: number;
            image: number;
            video: number;
            audio: number;
            document: number;
        };
        sender_types: {
            customer: number;
            agent: number;
            representative: number;
        };
        avg_messages_per_day: number;
        active_days: number;
    };
    escalation_stats: {
        total_escalations: number;
        total_resolved: number;
        resolution_rate: number;
        b2b_escalations: number;
        d2c_escalations: number;
        active_days: number;
        avg_escalations_per_day: number;
    };
    top_customers_by_spend: TopCustomer[];
}

export default function AnalyticsDashboard() {
    const [dateRange, setDateRange] = useState<string>('week');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [escalationData, setEscalationData] = useState<EscalationData | null>(null);
    const [messageData, setMessageData] = useState<MessageData | null>(null);
    const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>('overview');

    useEffect(() => {
        const calculateDates = (range: string): { start: string; end: string } => {
            const today = new Date();
            const end = today.toISOString().split('T')[0];
            let start: string;

            switch (range) {
                case 'today':
                    start = end;
                    break;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    start = weekAgo.toISOString().split('T')[0];
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    start = monthAgo.toISOString().split('T')[0];
                    break;
                case 'alltime':
                    start = '2025-08-12';
                    break;
                case 'custom':
                    return {start: startDate, end: endDate};
                default:
                    start = end;
            }

            return {start, end};
        };

        const fetchData = async (): Promise<void> => {
            setLoading(true);
            const {start, end} = calculateDates(dateRange);

            try {
                const [escalations, messages, overview] = await Promise.all([
                    fetch(`/api/analytics/escalations?start_date=${start}&end_date=${end}`).then(r => r.json() as Promise<EscalationData>),
                    fetch(`/api/analytics/messages?start_date=${start}&end_date=${end}`).then(r => r.json() as Promise<MessageData>),
                    fetch(`/api/analytics/overview`).then(r => r.json() as Promise<OverviewData>)
                ]);

                setEscalationData(escalations);
                setMessageData(messages);
                setOverviewData(overview);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        if (dateRange !== 'custom' || (startDate && endDate)) {
            void fetchData();
        }
    }, [dateRange, startDate, endDate]);

    const COLORS = ['#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e'];

    // Helper Functions
    const getTimePeriodDays = (): number => {
        if (!messageData) return 0;
        return messageData.days;
    };

    const getTimeUnit = (): string => {
        const days = getTimePeriodDays();
        if (days <= 1) return 'hour';
        if (days <= 7) return 'day';
        if (days <= 31) return 'week';
        return 'month';
    };

    const getTimeUnitDivisor = (): number => {
        const unit = getTimeUnit();
        const days = getTimePeriodDays();
        switch (unit) {
            case 'hour':
                return days * 24;
            case 'day':
                return days;
            case 'week':
                return Math.max(1, days / 7);
            case 'month':
                return Math.max(1, days / 30);
            default:
                return Math.max(1, days);
        }
    };

    const calculateGrowthRate = (data: Array<{ date: string, value: number }>): number => {
        if (!data || data.length < 2) return 0;
        const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const midpoint = Math.floor(sorted.length / 2);
        const firstHalf = sorted.slice(0, midpoint).reduce((sum, d) => sum + d.value, 0) / midpoint;
        const secondHalf = sorted.slice(midpoint).reduce((sum, d) => sum + d.value, 0) / (sorted.length - midpoint);
        return ((secondHalf - firstHalf) / (firstHalf || 1)) * 100;
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
        return num.toFixed(2);
    };

    const TrendIndicator: React.FC<{ value: number }> = ({value}) => {
        if (value > 0) return <ArrowUp className="text-green-500 inline" size={16}/>;
        if (value < 0) return <ArrowDown className="text-red-500 inline" size={16}/>;
        return <Minus className="text-gray-500 inline" size={16}/>;
    };

    if (loading) {
        return <PageLoader text={"Loading Advanced Analytics..."}/>
    }

    // Data Processing
    const dailyMessageStats = messageData?.daily_stats
        ?.map(day => ({
            date: new Date(day.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
            messages: day.total_messages,
            customer: day.total_customer_messages,
            agent: day.total_agent_messages,
            text: day.text_messages,
            media: day.image_messages + day.video_messages + day.audio_messages + day.document_messages,
            rawDate: day.date
        }))
        .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()) ?? [];

    const dailyEscalationStats = escalationData?.historical_stats?.daily_breakdown
        ?.map(day => ({
            date: new Date(day.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
            escalations: day.total_escalations,
            resolved: day.total_resolved,
            pending: day.total_escalations - day.total_resolved,
            b2b: day.b2b_escalations,
            d2c: day.d2c_escalations,
            rawDate: day.date
        }))
        .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()) ?? [];

    // Financial Metrics
    const totalRevenue = (overviewData?.customer_stats?.avg_total_spend ?? 0) * (overviewData?.customer_stats?.total_customers ?? 0);
    const avgRevenuePerPeriod = totalRevenue / (getTimeUnitDivisor() || 1);
    const b2bRevenue = (overviewData?.customer_stats?.avg_total_spend ?? 0) * (overviewData?.customer_stats?.b2b_customers ?? 0);
    const d2cRevenue = (overviewData?.customer_stats?.avg_total_spend ?? 0) * (overviewData?.customer_stats?.d2c_customers ?? 0);
    const avgB2BSpend = (overviewData?.customer_stats?.b2b_customers ?? 0) > 0 ? b2bRevenue / overviewData!.customer_stats.b2b_customers : 0;
    const avgD2CSpend = (overviewData?.customer_stats?.d2c_customers ?? 0) > 0 ? d2cRevenue / overviewData!.customer_stats.d2c_customers : 0;

    // Customer Metrics
    const activeCustomerRate = ((overviewData?.customer_stats?.active_customers ?? 0) / (overviewData?.customer_stats?.total_customers || 1)) * 100;
    const escalationRate = ((overviewData?.customer_stats?.escalated_customers ?? 0) / (overviewData?.customer_stats?.total_customers || 1)) * 100;
    const avgMessagesPerCustomer = (messageData?.total_messages ?? 0) / (overviewData?.customer_stats?.total_customers || 1);
    const avgConversationsPerCustomer = (overviewData?.message_stats?.total_conversations ?? 0) / (overviewData?.customer_stats?.total_customers || 1);

    // Message Efficiency Metrics
    const customerToAgentRatio = (messageData?.sender_types?.customer ?? 0) / (messageData?.sender_types?.agent || 1);
    const messagesPerConversation = overviewData?.message_stats?.avg_messages_per_conversation ?? 0;
    const conversationRate = ((overviewData?.message_stats?.total_conversations ?? 0) / (overviewData?.customer_stats?.total_customers || 1));
    const avgMessagesPerPeriod = (messageData?.total_messages ?? 0) / (getTimeUnitDivisor() || 1);
    const textMessagePercentage = ((messageData?.message_types?.text ?? 0) / (messageData?.total_messages || 1)) * 100;
    const mediaMessagePercentage = 100 - textMessagePercentage;

    // Escalation Metrics
    const resolutionRate = escalationData?.historical_stats?.resolution_rate ?? 0;
    const avgEscalationsPerPeriod = (escalationData?.historical_stats?.total_escalations ?? 0) / (getTimeUnitDivisor() || 1);
    const b2bEscalationRate = ((escalationData?.current_escalated_by_type?.B2B ?? 0) / (overviewData?.customer_stats?.b2b_customers || 1)) * 100;
    const d2cEscalationRate = ((escalationData?.current_escalated_by_type?.D2C ?? 0) / (overviewData?.customer_stats?.d2c_customers || 1)) * 100;

    // Growth & Trends
    const messageGrowthRate = calculateGrowthRate(
        dailyMessageStats.map(d => ({date: d.rawDate, value: d.messages}))
    );
    const escalationGrowthRate = calculateGrowthRate(
        dailyEscalationStats.map(d => ({date: d.rawDate, value: d.escalations}))
    );

    // Peak Analysis
    const peakMessageDay = dailyMessageStats.reduce((max, day) => day.messages > max.messages ? day : max, dailyMessageStats[0] || {messages: 0});
    const peakEscalationDay = dailyEscalationStats.reduce((max, day) => day.escalations > max.escalations ? day : max, dailyEscalationStats[0] || {escalations: 0});

    // Comparison Data
    const customerTypeComparison = [
        {
            metric: 'Total Customers',
            B2B: overviewData?.customer_stats?.b2b_customers ?? 0,
            D2C: overviewData?.customer_stats?.d2c_customers ?? 0
        },
        {metric: 'Avg Spend', B2B: avgB2BSpend, D2C: avgD2CSpend},
        {metric: 'Escalation Rate', B2B: b2bEscalationRate, D2C: d2cEscalationRate},
        {metric: 'Total Revenue', B2B: b2bRevenue, D2C: d2cRevenue}
    ];

    const messageTypeData = messageData ? Object.entries(messageData.message_types).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        percentage: ((value / messageData.total_messages) * 100).toFixed(1)
    })) : [];

    const senderTypeData = messageData ? Object.entries(messageData.sender_types).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        percentage: ((value / messageData.total_messages) * 100).toFixed(1)
    })) : [];

    const performanceRadarData = [
        {metric: 'Resolution Rate', value: resolutionRate, fullMark: 100},
        {metric: 'Active Customers', value: activeCustomerRate, fullMark: 100},
        {metric: 'Message Efficiency', value: Math.min(100, customerToAgentRatio * 20), fullMark: 100},
        {metric: 'Engagement', value: Math.min(100, conversationRate * 10), fullMark: 100},
        {metric: 'Customer Retention', value: 100 - escalationRate, fullMark: 100}
    ];

    return (
        <div className="flex flex-1 flex-col bg-gray-50 p-3">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics Dashboard</h1>
                <p className="text-gray-600 text-sm">Tracking since August 12, 2025</p>
            </div>

            {/* Date Range Selector */}
            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow mb-6">
                <Calendar className="text-gray-500" size={20}/>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="alltime">All Time</option>
                    <option value="custom">Custom Range</option>
                </select>

                {dateRange === 'custom' && (
                    <>
                        <input
                            type="date"
                            value={startDate}
                            min="2025-08-12"
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                    </>
                )}
                <div className="ml-auto text-sm text-gray-600">
                    Showing averages per <span className="font-semibold text-yellow-600">{getTimeUnit()}</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex border-b overflow-x-auto">
                    {['overview', 'revenue', 'customers', 'messages', 'escalations', 'comparisons'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium whitespace-nowrap ${
                                activeTab === tab
                                    ? 'border-b-2 border-yellow-500 text-yellow-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                            className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
                                <DollarSign size={24}/>
                            </div>
                            <p className="text-3xl font-bold">Rs {formatNumber(totalRevenue)}</p>
                            <p className="text-sm opacity-90 mt-2">
                                Rs {formatNumber(avgRevenuePerPeriod)} per {getTimeUnit()}
                            </p>
                        </div>

                        <div
                            className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Total Customers</h3>
                                <Users size={24}/>
                            </div>
                            <p className="text-3xl font-bold">{overviewData?.customer_stats?.total_customers ?? 0}</p>
                            <p className="text-sm opacity-90 mt-2">
                                {activeCustomerRate.toFixed(1)}% Active
                            </p>
                        </div>

                        <div
                            className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-lg shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Total Messages</h3>
                                <MessageSquare size={24}/>
                            </div>
                            <p className="text-3xl font-bold">{formatNumber(messageData?.total_messages ?? 0)}</p>
                            <p className="text-sm opacity-90 mt-2">
                                {formatNumber(avgMessagesPerPeriod)} per {getTimeUnit()}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-red-400 to-red-600 text-white p-6 rounded-lg shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Active Escalations</h3>
                                <AlertTriangle size={24}/>
                            </div>
                            <p className="text-3xl font-bold">{escalationData?.current_total_escalations ?? 0}</p>
                            <p className="text-sm opacity-90 mt-2">
                                {resolutionRate.toFixed(1)}% Resolution Rate
                            </p>
                        </div>
                    </div>

                    {/* Growth Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Message Growth</p>
                                    <p className="text-2xl font-bold text-gray-900">{messageGrowthRate.toFixed(1)}%</p>
                                </div>
                                <TrendIndicator value={messageGrowthRate}/>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Escalation Trend</p>
                                    <p className="text-2xl font-bold text-gray-900">{escalationGrowthRate.toFixed(1)}%</p>
                                </div>
                                <TrendIndicator value={-escalationGrowthRate}/>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Engagement Rate</p>
                                    <p className="text-2xl font-bold text-gray-900">{conversationRate.toFixed(2)}</p>
                                </div>
                                <Activity className="text-yellow-500" size={24}/>
                            </div>
                        </div>
                    </div>

                    {/* Performance Radar */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance Score</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={performanceRadarData}>
                                <PolarGrid/>
                                <PolarAngleAxis dataKey="metric"/>
                                <PolarRadiusAxis angle={90} domain={[0, 100]}/>
                                <Radar name="Performance" dataKey="value" stroke="#facc15" fill="#facc15"
                                       fillOpacity={0.6}/>
                                <Tooltip/>
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Peak Messages</p>
                            <p className="text-xl font-bold text-gray-900">{peakMessageDay?.messages ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">{peakMessageDay?.date}</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Avg/Customer</p>
                            <p className="text-xl font-bold text-gray-900">{avgMessagesPerCustomer.toFixed(1)}</p>
                            <p className="text-xs text-gray-500 mt-1">messages</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Customer:Agent</p>
                            <p className="text-xl font-bold text-gray-900">{customerToAgentRatio.toFixed(1)}:1</p>
                            <p className="text-xs text-gray-500 mt-1">ratio</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Conversations</p>
                            <p className="text-xl font-bold text-gray-900">{overviewData?.message_stats?.total_conversations ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">{messagesPerConversation.toFixed(1)} avg msgs</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Text Messages</p>
                            <p className="text-xl font-bold text-gray-900">{textMessagePercentage.toFixed(0)}%</p>
                            <p className="text-xs text-gray-500 mt-1">of total</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Media Messages</p>
                            <p className="text-xl font-bold text-gray-900">{mediaMessagePercentage.toFixed(0)}%</p>
                            <p className="text-xs text-gray-500 mt-1">of total</p>
                        </div>
                    </div>
                </div>
            )}

            {/* REVENUE TAB */}
            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Revenue</h3>
                            <p className="text-3xl font-bold text-gray-900">Rs {totalRevenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-600 mt-2">All time earnings</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Avg Revenue Per {getTimeUnit()}</h3>
                            <p className="text-3xl font-bold text-gray-900">Rs {avgRevenuePerPeriod.toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-2">Based on selected period</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">B2B Revenue</h3>
                            <p className="text-3xl font-bold text-gray-900">Rs {b2bRevenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-600 mt-2">{((b2bRevenue / totalRevenue) * 100).toFixed(1)}%
                                of total</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">D2C Revenue</h3>
                            <p className="text-3xl font-bold text-gray-900">Rs {d2cRevenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-600 mt-2">{((d2cRevenue / totalRevenue) * 100).toFixed(1)}%
                                of total</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Customer Type</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            {name: 'B2B Revenue', value: b2bRevenue},
                                            {name: 'D2C Revenue', value: d2cRevenue}
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({name, value}) => `${name}: Rs ${value}`}
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        <Cell fill="#3b82f6"/>
                                        <Cell fill="#8b5cf6"/>
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `Rs ${value.toLocaleString()}`}/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Spend Comparison</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                    {type: 'B2B', spend: avgB2BSpend},
                                    {type: 'D2C', spend: avgD2CSpend},
                                    {type: 'Overall', spend: overviewData?.customer_stats?.avg_total_spend ?? 0}
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="type"/>
                                    <YAxis/>
                                    <Tooltip formatter={(value: number) => `Rs ${value.toFixed(2)}`}/>
                                    <Bar dataKey="spend" fill="#facc15" name="Avg Spend"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Avg B2B Customer Spend</h3>
                            <p className="text-3xl font-bold text-gray-900">Rs {avgB2BSpend.toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-2">Per B2B customer</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Avg D2C Customer Spend</h3>
                            <p className="text-3xl font-bold text-gray-900">Rs {avgD2CSpend.toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-2">Per D2C customer</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Revenue Per Message</h3>
                            <p className="text-3xl font-bold text-gray-900">Rs {(totalRevenue / (messageData?.total_messages || 1)).toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-2">Earnings efficiency</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Customers by Spend</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total
                                        Spend
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {overviewData?.top_customers_by_spend?.slice(0, 10).map((customer, index) => (
                                    <tr key={index} className={index < 3 ? 'bg-yellow-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">#{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${customer.customer_type === 'B2B' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {customer.customer_type}
                                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">Rs {customer.spend.toLocaleString()} /-</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.escalation_status ? 'bg-red-100 text-red-800' : customer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {customer.escalation_status ? 'Escalated' : customer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOMERS TAB */}
            {activeTab === 'customers' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Customers</h3>
                            <p className="text-3xl font-bold text-gray-900">{overviewData?.customer_stats?.total_customers ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">All registered</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Active Customers</h3>
                            <p className="text-3xl font-bold text-green-600">{overviewData?.customer_stats?.active_customers ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">{activeCustomerRate.toFixed(1)}% of total</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Escalated Customers</h3>
                            <p className="text-3xl font-bold text-red-600">{overviewData?.customer_stats?.escalated_customers ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">{escalationRate.toFixed(1)}% escalation rate</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Avg Conversations</h3>
                            <p className="text-3xl font-bold text-gray-900">{avgConversationsPerCustomer.toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-2">Per customer</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Type Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            {name: 'B2B', value: overviewData?.customer_stats?.b2b_customers ?? 0},
                                            {name: 'D2C', value: overviewData?.customer_stats?.d2c_customers ?? 0}
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({name, value}) => `${name}: ${value}`}
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        <Cell fill="#3b82f6"/>
                                        <Cell fill="#8b5cf6"/>
                                    </Pie>
                                    <Tooltip/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Status Overview</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                    {status: 'Active', count: overviewData?.customer_stats?.active_customers ?? 0},
                                    {
                                        status: 'Escalated',
                                        count: overviewData?.customer_stats?.escalated_customers ?? 0
                                    },
                                    {
                                        status: 'Inactive',
                                        count: (overviewData?.customer_stats?.total_customers ?? 0) - (overviewData?.customer_stats?.active_customers ?? 0)
                                    }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="status"/>
                                    <YAxis/>
                                    <Tooltip/>
                                    <Bar dataKey="count" name="Customers">
                                        <Cell fill="#10b981"/>
                                        <Cell fill="#ef4444"/>
                                        <Cell fill="#6b7280"/>
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">B2B Customers</h3>
                            <p className="text-3xl font-bold text-blue-600">{overviewData?.customer_stats?.b2b_customers ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">{((overviewData?.customer_stats?.b2b_customers ?? 0) / (overviewData?.customer_stats?.total_customers || 1) * 100).toFixed(1)}%
                                of total</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">D2C Customers</h3>
                            <p className="text-3xl font-bold text-purple-600">{overviewData?.customer_stats?.d2c_customers ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">{((overviewData?.customer_stats?.d2c_customers ?? 0) / (overviewData?.customer_stats?.total_customers || 1) * 100).toFixed(1)}%
                                of total</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Messages Per Customer</h3>
                            <p className="text-3xl font-bold text-gray-900">{avgMessagesPerCustomer.toFixed(1)}</p>
                            <p className="text-sm text-gray-600 mt-2">Average engagement</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Engagement Metrics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Avg Messages</p>
                                <p className="text-2xl font-bold text-gray-900">{avgMessagesPerCustomer.toFixed(1)}</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Avg Conversations</p>
                                <p className="text-2xl font-bold text-gray-900">{avgConversationsPerCustomer.toFixed(2)}</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Avg Spend</p>
                                <p className="text-2xl font-bold text-gray-900">Rs {(overviewData?.customer_stats?.avg_total_spend ?? 0).toFixed(2)}</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Engagement Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{((overviewData?.customer_stats?.active_customers ?? 0) / (overviewData?.customer_stats?.total_customers || 1) * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Messages</h3>
                            <p className="text-3xl font-bold text-gray-900">{formatNumber(messageData?.total_messages ?? 0)}</p>
                            <p className="text-sm text-gray-600 mt-2">In selected period</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Avg Per {getTimeUnit()}</h3>
                            <p className="text-3xl font-bold text-yellow-600">{formatNumber(avgMessagesPerPeriod)}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                <TrendIndicator value={messageGrowthRate}/> {Math.abs(messageGrowthRate).toFixed(1)}%
                                trend
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Peak Day</h3>
                            <p className="text-3xl font-bold text-gray-900">{peakMessageDay?.messages ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">{peakMessageDay?.date}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Customer:Agent Ratio</h3>
                            <p className="text-3xl font-bold text-gray-900">{customerToAgentRatio.toFixed(1)}:1</p>
                            <p className="text-sm text-gray-600 mt-2">Message efficiency</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Message Activity</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={dailyMessageStats}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="date"/>
                                    <YAxis/>
                                    <Tooltip/>
                                    <Legend/>
                                    <Area type="monotone" dataKey="customer" stackId="1" stroke="#eab308" fill="#eab308"
                                          name="Customer"/>
                                    <Area type="monotone" dataKey="agent" stackId="1" stroke="#ca8a04" fill="#ca8a04"
                                          name="Agent"/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Type Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={messageTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({name, percentage}) => `${name}: ${percentage}%`}
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        {messageTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                        ))}
                                    </Pie>
                                    <Tooltip/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Trends Over Time</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={dailyMessageStats}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="date"/>
                                <YAxis/>
                                <Tooltip/>
                                <Legend/>
                                <Bar dataKey="text" fill="#facc15" name="Text"/>
                                <Bar dataKey="media" fill="#ca8a04" name="Media"/>
                                <Line type="monotone" dataKey="messages" stroke="#854d0e" strokeWidth={2} name="Total"/>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sender Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={senderTypeData} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis type="number"/>
                                    <YAxis dataKey="name" type="category" width={80}/>
                                    <Tooltip/>
                                    <Bar dataKey="value" name="Messages">
                                        {senderTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-4">Message Breakdown</h3>
                            <div className="space-y-3">
                                {messageTypeData.map((type, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{type.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-sm font-bold text-gray-900">{type.value.toLocaleString()}</span>
                                            <span className="text-xs text-gray-500">({type.percentage}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-4">Sender Breakdown</h3>
                            <div className="space-y-3">
                                {senderTypeData.map((type, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{type.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-sm font-bold text-gray-900">{type.value.toLocaleString()}</span>
                                            <span className="text-xs text-gray-500">({type.percentage}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Total Conversations</p>
                            <p className="text-2xl font-bold text-gray-900">{overviewData?.message_stats?.total_conversations ?? 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Msgs Per Conversation</p>
                            <p className="text-2xl font-bold text-gray-900">{messagesPerConversation.toFixed(1)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Text Messages</p>
                            <p className="text-2xl font-bold text-gray-900">{textMessagePercentage.toFixed(0)}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <p className="text-xs text-gray-500 mb-1">Media Messages</p>
                            <p className="text-2xl font-bold text-gray-900">{mediaMessagePercentage.toFixed(0)}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ESCALATIONS TAB */}
            {activeTab === 'escalations' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Current Escalations</h3>
                            <p className="text-3xl font-bold text-red-600">{escalationData?.current_total_escalations ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">Active now</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Resolution Rate</h3>
                            <p className="text-3xl font-bold text-green-600">{resolutionRate.toFixed(1)}%</p>
                            <p className="text-sm text-gray-600 mt-2">Historical average</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Avg Per {getTimeUnit()}</h3>
                            <p className="text-3xl font-bold text-gray-900">{avgEscalationsPerPeriod.toFixed(1)}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                <TrendIndicator
                                    value={-escalationGrowthRate}/> {Math.abs(escalationGrowthRate).toFixed(1)}% trend
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Peak Day</h3>
                            <p className="text-3xl font-bold text-gray-900">{peakEscalationDay?.escalations ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">{peakEscalationDay?.date}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Escalation Trends</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={dailyEscalationStats}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="date"/>
                                    <YAxis/>
                                    <Tooltip/>
                                    <Legend/>
                                    <Area type="monotone" dataKey="escalations" stackId="1" stroke="#ef4444"
                                          fill="#ef4444" name="Escalations"/>
                                    <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b981"
                                          name="Resolved"/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalations by Customer Type</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            {name: 'B2B', value: escalationData?.current_escalated_by_type?.B2B ?? 0},
                                            {name: 'D2C', value: escalationData?.current_escalated_by_type?.D2C ?? 0}
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({name, value}) => `${name}: ${value}`}
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        <Cell fill="#3b82f6"/>
                                        <Cell fill="#8b5cf6"/>
                                    </Pie>
                                    <Tooltip/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalation vs Resolution Timeline</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={dailyEscalationStats}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="date"/>
                                <YAxis/>
                                <Tooltip/>
                                <Legend/>
                                <Bar dataKey="escalations" fill="#ef4444" name="Escalations"/>
                                <Bar dataKey="resolved" fill="#10b981" name="Resolved"/>
                                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2}
                                      name="Pending"/>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">B2B Escalation Rate</h3>
                            <p className="text-3xl font-bold text-blue-600">{b2bEscalationRate.toFixed(1)}%</p>
                            <p className="text-sm text-gray-600 mt-2">{escalationData?.current_escalated_by_type?.B2B ?? 0} B2B
                                customers</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">D2C Escalation Rate</h3>
                            <p className="text-3xl font-bold text-purple-600">{d2cEscalationRate.toFixed(1)}%</p>
                            <p className="text-sm text-gray-600 mt-2">{escalationData?.current_escalated_by_type?.D2C ?? 0} D2C
                                customers</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Resolved</h3>
                            <p className="text-3xl font-bold text-green-600">{escalationData?.historical_stats?.total_resolved ?? 0}</p>
                            <p className="text-sm text-gray-600 mt-2">All time</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Escalated Customers</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total
                                        Spend
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {escalationData?.escalated_customers?.map((customer, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${customer.customer_type === 'B2B' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {customer.customer_type}
                                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">Rs {customer.spend.toLocaleString()} /-</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            Escalated
                                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* COMPARISONS TAB */}
            {activeTab === 'comparisons' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">B2B vs D2C Comparison</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={customerTypeComparison}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="metric"/>
                                <YAxis/>
                                <Tooltip/>
                                <Legend/>
                                <Bar dataKey="B2B" fill="#3b82f6" name="B2B"/>
                                <Bar dataKey="D2C" fill="#8b5cf6" name="D2C"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Metrics Comparison</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-blue-600">B2B Customers</span>
                                        <span
                                            className="text-sm font-medium text-gray-900">{overviewData?.customer_stats?.b2b_customers ?? 0}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full"
                                             style={{width: `${((overviewData?.customer_stats?.b2b_customers ?? 0) / (overviewData?.customer_stats?.total_customers || 1)) * 100}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-purple-600">D2C Customers</span>
                                        <span
                                            className="text-sm font-medium text-gray-900">{overviewData?.customer_stats?.d2c_customers ?? 0}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full"
                                             style={{width: `${((overviewData?.customer_stats?.d2c_customers ?? 0) / (overviewData?.customer_stats?.total_customers || 1)) * 100}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Metrics Comparison</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-blue-600">B2B Revenue</span>
                                        <span
                                            className="text-sm font-medium text-gray-900">Rs {formatNumber(b2bRevenue)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full"
                                             style={{width: `${(b2bRevenue / totalRevenue) * 100}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-purple-600">D2C Revenue</span>
                                        <span
                                            className="text-sm font-medium text-gray-900">Rs {formatNumber(d2cRevenue)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full"
                                             style={{width: `${(d2cRevenue / totalRevenue) * 100}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">B2B Avg Spend</h3>
                            <p className="text-3xl font-bold text-blue-600">Rs {avgB2BSpend.toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-2">Per customer</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">D2C Avg Spend</h3>
                            <p className="text-3xl font-bold text-purple-600">Rs {avgD2CSpend.toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-2">Per customer</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">B2B Escalation Rate</h3>
                            <p className="text-3xl font-bold text-blue-600">{b2bEscalationRate.toFixed(1)}%</p>
                            <p className="text-sm text-gray-600 mt-2">Of B2B customers</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm font-medium mb-2">D2C Escalation Rate</h3>
                            <p className="text-3xl font-bold text-purple-600">{d2cEscalationRate.toFixed(1)}%</p>
                            <p className="text-sm text-gray-600 mt-2">Of D2C customers</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <p className="text-sm text-gray-500 mb-1">B2B Performance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(((avgB2BSpend * (overviewData?.customer_stats?.b2b_customers ?? 0)) / totalRevenue) * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600 mt-1">Revenue Contribution</p>
                            </div>
                            <div className="border-l-4 border-purple-500 pl-4">
                                <p className="text-sm text-gray-500 mb-1">D2C Performance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(((avgD2CSpend * (overviewData?.customer_stats?.d2c_customers ?? 0)) / totalRevenue) * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600 mt-1">Revenue Contribution</p>
                            </div>
                            <div className="border-l-4 border-yellow-500 pl-4">
                                <p className="text-sm text-gray-500 mb-1">Overall Health</p>
                                <p className="text-2xl font-bold text-gray-900">{(100 - escalationRate).toFixed(1)}%</p>
                                <p className="text-sm text-gray-600 mt-1">Non-Escalated Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}