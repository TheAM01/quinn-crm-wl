import AdvancedAnalyticsClient from "./AdvancedAnalyticsClient";
import {requireAuth} from "@/lib/auth/require-auth";

export default async function AnalyticsPage() {
    await requireAuth();

    return <AdvancedAnalyticsClient />;
}