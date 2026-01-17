import {Product} from "@/types/store/products";

export interface ProductsAPIResponse {
	success: boolean;
	count: number;
	products: Product[];
}