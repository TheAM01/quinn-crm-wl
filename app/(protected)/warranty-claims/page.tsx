import WarrantyClaimsClient from "./WarrantyClaimsClient";
import {requireAuth} from "@/lib/auth/require-auth";
import {redirect} from "next/navigation";

export default async function SettingsPage() {
    return redirect("/");
    await requireAuth();
    return <WarrantyClaimsClient/>
}