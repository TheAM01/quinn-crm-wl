import AddCustomersClient from "./ImportCustomersClient";
import {requireAdmin} from "@/lib/auth/require-admin";

export default async function ImportCustomersPage() {
	await requireAdmin();
	return <AddCustomersClient/>
}