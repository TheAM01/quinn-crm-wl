import DashboardClient from "./DashboardClient";
import {requireAuth} from "@/lib/auth/require-auth";

export default async function DashboardPage() {

    await requireAuth();
    return <DashboardClient/>
}