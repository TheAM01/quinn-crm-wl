"use client";


import React, {useEffect, useState} from "react";
import {
	ChevronLeft,
	ChevronRight
} from "lucide-react";
import {PageGroup, PageItem} from "@/types/nav";
import SidebarLink from "@/components/ui/SidebarLink";
import {usePathname} from "next/navigation";
import {pages} from "@/lib/pages";


interface SidebarProps {
	userRole?: string;
	isSuperAdmin?: boolean;
	initialIsOpen?: boolean;
}

export default function Sidebar({ userRole, isSuperAdmin, initialIsOpen = true }: SidebarProps) {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(initialIsOpen);

	// Determine user permissions
	const isAdmin = userRole === 'admin' || isSuperAdmin;
	const isSuperAdminUser = isSuperAdmin || userRole === 'super_admin';

	useEffect(() => {
		document.cookie = `sidebarOpen=${isOpen}; path=/; max-age=31536000`; // 1 year
	}, [isOpen]);


	// Helper function to filter items based on role
	const filterItemsByRole = (items: PageItem[]): PageItem[] => {
		return items.filter(item => {
			// Super admin only items
			if (['credentials', "/settings/bot-persona", "/store/orders", "/store/products", 'changelog'].some(path => item.href.includes(path))) {
				return isSuperAdminUser;
			}

			// Admin+ items (admin and super admin)
			if (['broadcast', 'users', 'add-user', 'campaigns', 'customers', 'team', '/notifications/broadcast'].some(path => item.href.includes(path))) {
				return isAdmin;
			}

			// All authenticated users can access these
			return true;
		});
	};

	// Filter pages based on user role
	const filteredPages: PageGroup[] = pages.map(pageGroup => ({
		...pageGroup,
		items: filterItemsByRole(pageGroup.items)
	})).filter(pageGroup => pageGroup.items.length > 0); // Remove empty groups

	const switchOpen = () => {
		setIsOpen(!isOpen);
	}


	return (
		<div className="flex flex-col shadow-xl justify-between min-h-screen max-h-screen overflow-y-auto bg-stone-900 text-white chat-box">
			<div className="flex flex-col">
				<div className={`flex gap-4 ${isOpen && "px-3 py-2.5"} items-center border-b border-stone-700 transition-all duration-200`}>
					{isOpen &&
						// <>
						// 	<img src={"https://boost-lifestyle.co/cdn/shop/files/CompressJpeg.Online_Crop-Img_18_1107x.webp?v=1713279590"} className={"h-11 duration-150 fade-in"} height={11}/>
						// </>
						<div className="flex flex-col gap-2">
							<div className="text-2xl font-bold">
								Quinn
							</div>
							<div className="text-xs text-yellow-500">CRM Dashboard</div>
						</div>
					}
					<button
						onClick={switchOpen}
						className={` ${isOpen ? "ml-auto mr-0" : "mx-auto my-4"} hover:bg-yellow-300 hover:text-stone-800 rounded-md p-1 duration-150 cursor-pointer transition-all duration-200`}>
						{isOpen ? <ChevronLeft/> : <ChevronRight/>}
					</button>
				</div>

				<div className={`flex flex-col ${isOpen ? "py-6 px-2 gap-4" : "p-1"} transition-all duration-200 h-full`}>
					{
						filteredPages.map((pageGroup: PageGroup, i: number) => (
							<div className={`flex flex-col  ${isOpen ? "mb-2 gap-2" : ""}`} key={i}>
								{isOpen && <div
									className={"text-neutral-200 font-semibold text-xs uppercase "}>{pageGroup.title}</div>}
								<div className={`flex flex-col ${isOpen ? "gap-1.5" : "gap-1"}`}>
									{
										pageGroup.items.map((page: PageItem, ii: number) => (
											<SidebarLink page={page} key={ii} isSelected={pathname === page.href} isOpen={isOpen}/>
										))
									}
								</div>
							</div>
						))
					
					}
				</div>
			</div>

		</div>
	)
}