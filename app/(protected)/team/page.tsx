import UsersClient from "./TeamClient";
import {requireAdmin} from "@/lib/auth/require-admin";

export default async function TeamPage() {
	await requireAdmin()

	return <UsersClient/>
}