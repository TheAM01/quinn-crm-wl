import { requireAdmin } from "@/lib/auth/require-admin";
import BroadcastClient from "./BroadcastClient";

export default async function BroadcastPage() {
	await requireAdmin()

	return <BroadcastClient />;
}