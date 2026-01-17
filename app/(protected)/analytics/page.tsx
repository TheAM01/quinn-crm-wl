import AnalyticsClient from "./AnalyticsClient";
import {requireAuth} from "@/lib/auth/require-auth";

export default async function AnalyticsPage() {
	await requireAuth();

	return <AnalyticsClient />;
}