import PreferencesClient from "./PreferencesClient";
import {requireAuth} from "@/lib/auth/require-auth";

export default async function PreferencesPage() {
    await requireAuth()

    return <PreferencesClient />;
}