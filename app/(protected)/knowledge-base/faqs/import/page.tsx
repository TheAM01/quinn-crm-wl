import UploadClient from "./ImportFaqsClient"
import {requireAuth} from "@/lib/auth/require-auth";

export default async function ImportFAQsPage() {
	await requireAuth();

	return <UploadClient/>
}