import React from "react";
import SidebarWrapper from "@/components/layout/SidebarWrapper";
import TopBar from "@/components/layout/TopBar";


export default function ProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="flex h-screen w-full">
			{/* Sidebar */}
			<SidebarWrapper />

			{/* Main content */}
			<div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-gray-50">
				{/* Top bar */}
				<div className="flex-shrink-0">
					<TopBar />
				</div>

				{/* Scrollable content */}
				<main className="flex flex-1 overflow-y-auto">
					{children}
				</main>
			</div>
		</div>
	);

}

// GODDAMNIT

// LORD HAVE MERCY ON MY WRETCHED SOUL