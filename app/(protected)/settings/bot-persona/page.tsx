import BotPersonaClient from "./BotPersonaClient";
import {requireSuperAdmin} from "@/lib/auth/require-super-admin";

export default async function SettingsPage() {
    await requireSuperAdmin()

    return <BotPersonaClient />;
}