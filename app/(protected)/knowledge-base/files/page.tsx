import KnowledgeBaseFilesClient from "./KnowledgeBaseFilesClient"
import {requireAuth} from "@/lib/auth/require-auth";

export default async function KnowledgeBaseFilesPage() {
	await requireAuth();

	return <KnowledgeBaseFilesClient/>
}