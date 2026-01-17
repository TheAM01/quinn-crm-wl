import {requireSuperAdmin} from "@/lib/auth/require-super-admin";
import CredentialsClient from "./CredentialsClient";

export default async function CredentialsPage() {
	await requireSuperAdmin();
	return <CredentialsClient/>
}