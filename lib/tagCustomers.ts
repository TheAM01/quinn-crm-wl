const SERVER_BASE_URL = process.env.SERVER_BASE_URL;
const SERVER_API_KEY = process.env.SERVER_API_KEY;

export interface TagResult {
    phone_number: string;
    success: boolean;
    error?: string;
}

export async function tagSingleCustomer(phoneNumber: string, tag: string): Promise<TagResult> {
    try {
        if (!SERVER_BASE_URL || !SERVER_API_KEY) throw new Error('Server config missing');

        // Get customer
        const getRes = await fetch(`${SERVER_BASE_URL}/customers/${encodeURIComponent(phoneNumber)}`, {
            method: 'GET',
            headers: { 'x-api-key': SERVER_API_KEY, 'Content-Type': 'application/json' },
        });

        if (!getRes.ok) throw new Error(`Failed to fetch customer: ${getRes.status}`);
        const customer = await getRes.json();

        // Update tags
        const updatedTags = customer.tags?.includes(tag) ? customer.tags : [...(customer.tags || []), tag];

        const putRes = await fetch(`${SERVER_BASE_URL}/customers/${encodeURIComponent(phoneNumber)}`, {
            method: 'PUT',
            headers: { 'x-api-key': SERVER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...customer, tags: updatedTags }),
        });

        if (!putRes.ok) throw new Error(`Failed to update customer: ${putRes.status}`);

        return { phone_number: phoneNumber, success: true };
    } catch (err) {
        return {
            phone_number: phoneNumber,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}

export async function tagCustomersInBatches(phoneNumbers: string[], tag: string, batchSize = 10): Promise<TagResult[]> {
    const results: TagResult[] = [];

    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
        const batch = phoneNumbers.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(num => tagSingleCustomer(num, tag)));
        results.push(...batchResults);
        if (i + batchSize < phoneNumbers.length) await new Promise(r => setTimeout(r, 100));
    }

    return results;
}
