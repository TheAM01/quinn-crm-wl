import ProductsClient from "./ProductsClient";
import {requireSuperAdmin} from "@/lib/auth/require-super-admin";

export default async function TeamPage() {
	await requireSuperAdmin()

	return <ProductsClient/>
}