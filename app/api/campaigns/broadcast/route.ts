import { NextRequest, NextResponse } from 'next/server';
// import { tagCustomersInBatches } from '@/lib/tagCustomers'; // ✅ keep this import

const SERVER_BASE_URL = process.env.SERVER_BASE_URL!;
const SERVER_API_KEY = process.env.SERVER_API_KEY!;

interface Cust {
	phone_number: string;
	customer_name?: string;
}

export async function POST(request: NextRequest) {
	try {
		if (!SERVER_BASE_URL || !SERVER_API_KEY) {
			return NextResponse.json(
				{ error: 'Server configuration missing' },
				{ status: 500 }
			);
		}

		const body = await request.json();
		const { campaign_id, customers } = body;

		if (!campaign_id || !Array.isArray(customers)) {
			return NextResponse.json(
				{ error: 'Invalid data format.' },
				{ status: 400 }
			);
		}

		// Extract phone numbers only
		const normalizedPhoneNumbers = customers.map((c: Cust) => c.phone_number);

		// 📨 Send broadcast
		const response = await fetch(`${SERVER_BASE_URL}/broadcasts`, {
			method: 'POST',
			headers: {
				'x-api-key': SERVER_API_KEY,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ campaign_id, phone_numbers: normalizedPhoneNumbers }),
		});

		if (!response.ok) {
			const errText = await response.text();
			console.error(`API error: ${response.status} - ${errText}`);
			throw new Error(`HTTP ${response.status}`);
		}

		const broadcastData = await response.json();

		// 🏷️ Tag customers AFTER broadcast succeeds
		// const phoneNumbers = normalizedCustomers.map(c => c.phone_number);
		// const campaignTag = `campaign:${campaign_id}`;

		// // You can “fire and forget” this if you want it async
		// tagCustomersInBatches(normalizedPhoneNumbers, campaignTag)
		// 	.then(res => console.log('Tagging complete:', res))
		// 	.catch(err => console.error('Tagging failed:', err));

		// ✅ Return broadcast result instantly
		return NextResponse.json(broadcastData);
	} catch (error) {
		console.error('Error sending broadcast:', error);
		return NextResponse.json(
			{ error: 'Failed to send broadcast' },
			{ status: 500 }
		);
	}
}
