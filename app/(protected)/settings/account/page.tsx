import AccountSettingsClient from "./AccountSettingsClient";
import {requireAuth} from "@/lib/auth/require-auth";

export default async function SettingsPage() {
    await requireAuth()

    return <AccountSettingsClient />;
}