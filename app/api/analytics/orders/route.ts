// app/api/analytics/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL;
const SERVER_API_KEY = process.env.SERVER_API_KEY;

interface CartItem {
	name: string;
	quantity: number;
	price: number;
}

interface Order {
	id: string;
	created_at: string;
	customer_phone: string;
	part_of_campaign: string;
	cart_items: CartItem[];
	total_amount: number;
	status: string;
	customer_name: string;
}

interface StatusBreakdown {
	placed: number;
	confirmed: number;
	cancelled: number;
}

interface Summary {
	status_breakdown: StatusBreakdown;
	total_amount: number;
}

interface Filters {
	status: string | null;
	campaign_id: string;
}

interface Pagination {
	current_page: number;
	page_size: number;
	total_pages: number;
	total_orders: number;
}

interface AnalyticsResponse {
	pagination: Pagination;
	filters: Filters;
	summary: Summary;
	orders: Order[];
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const campaignId = searchParams.get('campaign_id');
		const page = searchParams.get('page') || '1';
		const pageSize = searchParams.get('page_size') || '20';
		const status = searchParams.get('status');

		if (!campaignId) {
			return NextResponse.json(
				{ message: 'campaign_id is required' },
				{ status: 400 }
			);
		}

		// Build query params
		const queryParams = new URLSearchParams({
			campaign_id: campaignId,
			page,
			page_size: pageSize,
		});

		if (status) {
			queryParams.append('status', status);
		}

		const response = await fetch(
			`${SERVER_BASE_URL}/analytics/orders?${queryParams.toString()}`,
			{
				method: 'GET',
				headers: {
					'x-api-key': SERVER_API_KEY || '',
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return NextResponse.json(
				{ message: errorData.message || 'Failed to fetch analytics' },
				{ status: response.status }
			);
		}

		const data: AnalyticsResponse = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		console.error('Error fetching analytics:', error);
		return NextResponse.json(
			{ message: 'Internal server error' },
			{ status: 500 }
		);
	}
}