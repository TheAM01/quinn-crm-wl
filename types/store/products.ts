export interface Product {
	product_id: string;
	created_at: string;
	current_quantity: number;
	inventory_item_id: number;
	variant_id: number;
	product_title: string;
	slug: string;
	image_url: string | null;
	updated_at: string;
}