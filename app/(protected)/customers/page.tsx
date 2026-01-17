import CustomersClient from "@/app/(protected)/customers/CustomersClient";
import {requireAdmin} from "@/lib/auth/require-admin";


export default async function CustomersPage() {
	await requireAdmin();
	return <CustomersClient/>
}