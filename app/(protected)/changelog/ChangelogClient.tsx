"use client";

import React from 'react';
import { Calendar, Plus, Bug, Wrench, Sparkles, AlertCircle, Trash2 } from 'lucide-react';

// Type definitions for changelog entries
type ChangeType = 'feature' | 'improvement' | 'bugfix' | 'breaking' | 'deprecated' | 'other';

interface Change {
	type: ChangeType;
	description: string;
}

interface ChangelogEntry {
	version: string;
	date: string;
	changes: Change[];
}

// ============================================
// ADD NEW CHANGELOG ENTRIES HERE
// ============================================
const CHANGELOG_DATA: ChangelogEntry[] = [
	{
		version: "2.5.1",
		date: "2025-12-07",
		changes: [
			{
				type: "feature",
				description: "Added a hard-coded \"Developer\" role, only available to actual developers"
			},
			{
				type: "feature",
				description: "Made Sidebar state persistent; Sidebar's state is conserved across refreshes"
			},
			{
				type: "feature",
				description: "Added an option for super admins and developers to export a specific customer's chats through inbox and chats export page"
			},
			{
				type: "improvement",
				description: "Improved chats loading time in Inbox"
			},
			{
				type: "bugfix",
				description: "Removed \"No chats found\" error on load in Inbox "
			},
			{
				type: "other",
				description: "Renamed \"Company Knowledge Base\" to \"Knowledge Base Files\""
			},
			{
				type: "other",
				description: "Moved Broadcast under \"Customer Management\""
			},
			{
				type: "other",
				description: "Moved Inbox under \"Customer Management\""
			},
			{
				type: "deprecated",
				description: "Removed the \"Advanced Analytics\" page"
			},
		]
	},
	{
		version: "2.4.4",
		date: "2025-12-06",
		changes: [
			{
				type: "improvement",
				description: "Enhanced search bar to show quantity of search results"
			},
			{
				type: "improvement",
				description: "Converted customer's page into tabular form"
			},
			{
				type: "other",
				description: "Moved Product Waitlist under \"Store\""
			},
			{
				type: "bugfix",
				description: "Removed bugs"
			},
			{
				type: "bugfix",
				description: "Removed Herobrine"
			},
		]
	},
	{
		version: "2.3.17 [EXPERIMENTAL]",
		date: "2025-12-02",
		changes: [
			{
				type: "improvement",
				description: "Improved campaigns to be more detailed. Introduced a separate details page with proper actions."
			},
			{
				type: "improvement",
				description: "Made searching better in pages where search was available."
			},
			{
				type: "improvement",
				description: "Enhanced the appearance of KPI cards."
			}
		]
	},
	{
		version: "2.3.16",
		date: "2025-11-29",
		changes: [
			{
				type: "feature",
				description: "Added campaigns version 3"
			}
		]
	},
	{
		version: "2.3.7 [EXPERIMENTAL]",
		date: "2025-11-21",
		changes: [
			{
				type: "feature",
				description: "Added a page to view all products available on store"
			},
			{
				type: "feature",
				description: "Added a page to view all orders that recently happened"
			},
			{
				type: "feature",
				description: "Added campaign versions 2"
			},
		]
	},
	{
		version: "2.3.4",
		date: "2025-11-19",
		changes: [
			{
				type: "feature",
				description: "Added AI-powered message enhancement feature in chat inbox to help improve message quality and professionalism"
			},
		]
	},
	{
		version: "2.3.1",
		date: "2025-11-15",
		changes: [
			{
				type: "feature",
				description: "Added options to manage global and self's quick messages"
			},
			{
				type: "improvement",
				description: "Made UI changes to Inbox page to improve user experience and added company logo to Sidebar"
			},
		]
	},
	{
		version: "2.2.2",
		date: "2025-11-11",
		changes: [
			{
				type: "bugfix",
				description: "Fixed some minor bugs and removed unnecessary print statements"
			},
		]
	},
	{
		version: "2.2.1",
		date: "2025-11-11",
		changes: [
			{
				type: "feature",
				description: "Added notifications"
			},
		]
	},
	{
		version: "2.1.2 [EXPERIMENTAL]",
		date: "2025-11-02",
		changes: [
			{
				type: "feature",
				description: "Added new and advanced analytics (bugs and inconsistencies expected)"
			},
		]
	},
	{
		version: "2.1.1",
		date: "2025-11-02",
		changes: [
			{
				type: "improvement",
				description: "Improved several components in the inbox tab, reducing chances of future bugs"
			},
			{
				type: "improvement",
				description: "Improved the \"load more\" functionality in chat lists"
			},
			{
				type: "improvement",
				description: "Tags in the inbox controls now have pre-fetched values"
			}
		]
	},
	{
		version: "2.1.0",
		date: "2025-11-02",
		changes: [
			{
				type: "feature",
				description: "Added 'All Time' analytics option to view data from August 1, 2025 to present"
			},
			{
				type: "feature",
				description: "New Changelog page to track product updates and changes"
			},
			{
				type: "improvement",
				description: "Enhanced date range selector with better UX"
			}
		]
	},
	{
		version: "2.0.10",
		date: "2025-11-01",
		changes: [
			{
				type: "improvement",
				description: "Used query parameters on inbox page to persist current chat between page refreshes"
			},
			{
				type: "bugfix",
				description: "Fixed minor bug on inbox page"
			}
		]
	},
	{
		version: "2.0.8",
		date: "2025-10-31",
		changes: [
			{
				type: "feature",
				description: "Added customer representative names in chat messages"
			},
			{
				type: "bugfix",
				description: "Resolved minor issue with properties panel text selection"
			}
		]
	}
];
// ============================================

// Helper function to get icon and color for change type
const getChangeTypeConfig = (type: ChangeType) => {
	switch (type) {
		case 'feature':
			return {
				icon: Plus,
				color: 'text-green-600',
				bgColor: 'bg-green-100',
				label: 'New Feature'
			};
		case 'improvement':
			return {
				icon: Sparkles,
				color: 'text-blue-600',
				bgColor: 'bg-blue-100',
				label: 'Improvement'
			};
		case 'bugfix':
			return {
				icon: Bug,
				color: 'text-yellow-600',
				bgColor: 'bg-yellow-100',
				label: 'Bug Fix'
			};
		case 'breaking':
			return {
				icon: AlertCircle,
				color: 'text-red-600',
				bgColor: 'bg-red-100',
				label: 'Breaking Change'
			};
		case 'deprecated':
			return {
				icon: Trash2,
				color: 'text-gray-600',
				bgColor: 'bg-gray-100',
				label: 'Deprecated'
			};
		default:
			return {
				icon: Wrench,
				color: 'text-gray-600',
				bgColor: 'bg-gray-100',
				label: 'Change'
			};
	}
};

// Format date to readable format
const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};

const ChangelogClient: React.FC = () => {
	return (
		<div className="flex flex-1 flex-col bg-gray-50 p-6">
			<div className="max-w-4xl mx-auto w-full">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">Changelog</h1>
					<p className="text-gray-600 text-lg">
						Track all the latest updates, improvements, and fixes to our platform
					</p>
				</div>

				{/* Timeline */}
				<div className="relative">
					{/* Vertical line */}
					<div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

					{/* Changelog entries */}
					<div className="space-y-12">
						{CHANGELOG_DATA.map((entry, entryIndex) => (
							<div key={entryIndex} className="relative">
								{/* Version badge */}
								<div className="flex items-center mb-4">
									<div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500 text-white font-bold text-lg shadow-lg z-10">
										{entry.version.split('.')[0]}.{entry.version.split('.')[1]}
									</div>
									<div className="ml-6">
										<h2 className="text-2xl font-bold text-gray-900">
											Version {entry.version}
										</h2>
										<div className="flex items-center text-gray-500 mt-1">
											<Calendar size={16} className="mr-2" />
											<span>{formatDate(entry.date)}</span>
										</div>
									</div>
								</div>

								{/* Changes list */}
								<div className="ml-24 bg-white rounded-lg shadow-md p-6">
									<div className="space-y-4">
										{entry.changes.map((change, changeIndex) => {
											const config = getChangeTypeConfig(change.type);
											const Icon = config.icon;

											return (
												<div key={changeIndex} className="flex items-start">
													<div className={`flex-shrink-0 w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center mr-4`}>
														<Icon size={16} className={config.color} />
													</div>
													<div className="flex-1">
														<div className="flex items-center mb-1">
                                                            <span className={`text-xs font-semibold ${config.color} uppercase tracking-wide`}>
                                                                {config.label}
                                                            </span>
														</div>
														<p className="text-gray-700 leading-relaxed">
															{change.description}
														</p>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="mt-12 text-center text-gray-500 text-sm">
					<p>Started tracking changes from November 2, 2025</p>
				</div>
			</div>
		</div>
	);
};

export default ChangelogClient;