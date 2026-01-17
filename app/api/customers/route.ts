import { NextRequest, NextResponse } from 'next/server';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;

		// Build query parameters
		const params = new URLSearchParams();

		// Pagination
		const page = searchParams.get('page') || '1';
		const limit = searchParams.get('limit') || '50';
		params.set('page', page);
		params.set('limit', limit);

		// Search
		const search = searchParams.get('search');
		if (search) {
			params.set('search', search);
		}

		// Customer type filter
		const customerType = searchParams.get('customer_type');
		if (customerType) {
			params.set('customer_type', customerType);
		}

		// Tags filter
		const tags = searchParams.get('tags');
		if (tags) {
			params.set('tags', tags);
		}

		// Spend range filters
		const minSpend = searchParams.get('min_spend');
		if (minSpend) {
			params.set('min_spend', minSpend);
		}

		const maxSpend = searchParams.get('max_spend');
		if (maxSpend) {
			params.set('max_spend', maxSpend);
		}

		// Sorting
		const sortBy = searchParams.get('sort_by');
		if (sortBy) {
			params.set('sort_by', sortBy);
		}

		const sortOrder = searchParams.get('sort_order');
		if (sortOrder) {
			params.set('sort_order', sortOrder);
		}

		// Make request to backend
		const response = await fetch(`${SERVER_BASE_URL}/customers?${params.toString()}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.SERVER_API_KEY || "abcd"
			},
		});

		if (!response.ok) {
			throw new Error(`Backend returned ${response.status}`);
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		console.error('Error fetching customers:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch customers' },
			{ status: 500 }
		);
	}
}