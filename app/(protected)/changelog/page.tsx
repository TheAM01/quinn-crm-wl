import ChangelogClient from "@/app/(protected)/changelog/ChangelogClient";
import {requireSuperAdmin} from "@/lib/auth/require-super-admin";

export default async function Changelog() {
    await requireSuperAdmin();
    return <ChangelogClient/>
}