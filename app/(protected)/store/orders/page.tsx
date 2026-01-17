import OrdersClient from "./OrdersClient";
import {requireSuperAdmin} from "@/lib/auth/require-super-admin";

export default async function TeamPage() {
	await requireSuperAdmin()

	return <OrdersClient/>
}