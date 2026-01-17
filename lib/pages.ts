import {PageGroup} from "@/types/nav";
import {
	Archive, Bot,
	ChartColumn,
	FileClock, HelpCircle, Hourglass, KeyRound,
	LayoutDashboard,
	Megaphone,
	MessageSquare,
	MessageSquarePlus, Receipt, ShieldCheck, ShoppingBag, UserCog,
	Users
} from "lucide-react";

export const pages: PageGroup[] = [
	{
		title: "Core Operations",
		items: [
			{
				title: "Dashboard",
				href: "/dashboard",
				icon: LayoutDashboard,
			},
			// {
			// 	title: "Notifications",
			// 	href: "/notifications",
			// 	icon: Bell,
			// },
			{
				title: "Changelog",
				href: "/changelog",
				icon: FileClock, // perfect for version history vibe
			},
			// {
			// 	title: "Warranty Claims",
			// 	href: "/warranty-claims",
			// 	icon: BadgeCheck, // you can swap with ClipboardCheck or BadgeCheck if you prefer
			// },
		],
	},
	{
		title: "Store",
		items: [
			{
				title: "Products",
				href: "/store/products",
				icon: ShoppingBag,
			},
			{
				title: "Orders",
				href: "/store/orders",
				icon: Receipt,
			},
			{
				title: "Product Waitlist",
				href: "/waitlist",
				icon: Hourglass, // or Clock depending on tone
			},
		]
	},
	{
		title: "Customer Management",
		items: [
			{
				title: "Customers",
				href: "/customers",
				icon: Users,
			},
			{
				title: "Inbox",
				href: "/inbox",
				icon: MessageSquare,
			},
			{
				title: "Campaigns",
				href: "/campaigns",
				icon: Megaphone,
			},
			{
				title: "Broadcast",
				href: "/broadcast",
				icon: MessageSquarePlus,
			},
		],
	},
	{
		title: "Analytics & Insights",
		items: [
			{
				title: "Analytics",
				href: "/analytics",
				icon: ChartColumn,
			},
			// {
			// 	title: "Advanced Analytics",
			// 	href: "/analytics/advanced",
			// 	icon: LineChart,
			// },
		],
	},
	{
		title: "Knowledge base",
		items: [
			{
				title: "Knowledge Base Files",
				href: "/knowledge-base/files",
				icon: Archive,
			},
			{
				title: "FAQs",
				href: "/knowledge-base/faqs",
				icon: HelpCircle,
			},
		],
	},
	{
		title: "System Management",
		items: [
			{
				title: "Team Management",
				href: "/team",
				icon: Users,
			},
			// {
			// 	title: "Notifications Broadcast",
			// 	href: "/notifications/broadcast",
			// 	icon: BellPlus,
			// },
			{
				title: "Credentials",
				href: "/credentials",
				icon: KeyRound,
			},
			{
				title: "Bot Persona",
				href: "/settings/bot-persona",
				icon: Bot,
			},
		],
	},
	{
		title: "Settings",
		items: [
			{
				title: "Account",
				href: "/settings/account",
				icon: UserCog,
			},
			{
				title: "Permissions",
				href: "/settings/permissions",
				icon: ShieldCheck,
			},
		],
	}

];