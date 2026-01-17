// "use client";
//
// import {PageHeading} from "@/components/ui/Structure";
// import React, { useState } from "react";
// import BotSettingsTab from "./_components/BotPersonaClient";
// import AccountSettingsTab from "./_components/AccountSettingsClient";
// import NotificationSettingsTab from "./_components/NotificationSettingsClient";
// import PermissionSettingsTab from "./_components/PermissionSettingsTab";
// import {useUserRole} from "@/hooks/useUserRole";
// import PageLoader from "@/components/ui/PageLoader";
//
// export default function SettingsClient() {
// 	const [activeTab, setActiveTab] = useState("account");
//
// 	const { role, loading } = useUserRole();
//
// 	if (loading) return <PageLoader text="Loading Settings..." />;
//
// 	const allTabs = [
// 		{ id: "account", label: "Account", component: AccountSettingsTab, roles: ["super_admin", "admin", "representative"] },
// 		{ id: "bot", label: "Bot", component: BotSettingsTab, roles: ["super_admin"] },
// 		{ id: "permissions", label: "Permissions", component: PermissionSettingsTab, roles: ["super_admin", "admin", "representative"] },
// 		{ id: "notifications", label: "Notifications", component: NotificationSettingsTab, roles: ["super_admin", "admin", "representative"] },
// 	];
//
// 	const tabs = allTabs.filter(tab => tab.roles.includes(role ?? "representative"));
//
//
// 	const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AccountSettingsTab;
//
// 	return (
// 		<div className="p-3 flex-1 flex flex-col gap-6 h-full">
// 			<PageHeading
// 				title="Settings"
// 				description="Change Settings"
// 			/>
//
// 			{/* Tab Navigation */}
// 			<div className="border-b border-gray-200">
// 				<nav className="flex space-x-8">
// 					{tabs.map((tab) => (
// 						<button
// 							key={tab.id}
// 							onClick={() => setActiveTab(tab.id)}
// 							className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
// 								activeTab === tab.id
// 									? "border-yellow-500 text-yellow-600"
// 									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
// 							}`}
// 						>
// 							{tab.label}
// 						</button>
// 					))}
// 				</nav>
// 			</div>
//
// 			{/* Tab Content */}
// 			<div className="flex-1">
// 				<ActiveComponent />
// 			</div>
// 		</div>
// 	)
// }