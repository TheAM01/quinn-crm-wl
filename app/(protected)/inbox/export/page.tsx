import ExportChatsClient from "./ExportChatsClient";
import OldExportChatsClient from "./OldExportChatsClient"
import {requireSuperAdmin} from "@/lib/auth/require-super-admin";
import {isDeveloper} from "@/lib/auth/is-developer";


export default async function ExportChatsPage() {
    await requireSuperAdmin();
    const isDev = await isDeveloper();

    if (isDev) return <ExportChatsClient/>

    return <OldExportChatsClient/>

}


