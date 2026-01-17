import ExportChatsClient from "./ExportFaqsClient";
import {requireAdmin} from "@/lib/auth/require-admin";

export default async function ExportFAQsPage() {
    await requireAdmin();
    return <ExportChatsClient/>
}


