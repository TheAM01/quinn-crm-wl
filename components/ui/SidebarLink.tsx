import {PageItem} from "@/types/nav";
import Link from "next/link";

const SidebarLink = ({ page, isSelected, isOpen }: { page: PageItem, isSelected: boolean, isOpen: boolean }) => {
	return (
		<Link
			className={`flex gap-4 items-center p-2 rounded-sm leading-none ${isOpen ? "w-full": "w-min"} duration-200 ${isSelected ? "bg-yellow-400 text-black font-semibold" : "text-neutral-300 hover:bg-stone-700 hover:text-white"} transition-all duration-200`}
			href={page.href}
		>
			<page.icon size={16}/>
			{isOpen && <div className="flex leading-none items-center text-sm">{page.title}</div>}
		</Link>
	)
}

export default SidebarLink