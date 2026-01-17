import InboxClient from "./InboxClient";
import {requireAuth} from "@/lib/auth/require-auth";


export default async function InboxPage() {
	await requireAuth();
	return <InboxClient/>
}


