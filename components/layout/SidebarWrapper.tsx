// components/layout/SidebarWrapper.tsx
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Sidebar from "./Sidebar";

export default async function SidebarWrapper() {
	const supabase = await createClient();
	const cookieStore = await cookies();

	try {
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return <Sidebar />;
		}

		const isSuperAdmin = user?.user_metadata?.role === 'super_admin' ||
			user?.app_metadata?.is_super_admin === true;

		const userRole = user?.user_metadata?.role || user?.app_metadata?.role || 'user';

		// Read sidebar state from cookie
		const sidebarOpen = cookieStore.get('sidebarOpen')?.value;
		const initialIsOpen = sidebarOpen !== undefined ? sidebarOpen === 'true' : true;

		return (
			<Sidebar
				userRole={userRole}
				isSuperAdmin={isSuperAdmin}
				initialIsOpen={initialIsOpen}
			/>
		);
	} catch (error) {
		console.error('Error fetching user data for sidebar:', error);
		return <Sidebar />;
	}
}