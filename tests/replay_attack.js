// Replay Attack Test
// Uses native fetch (Node 18+)
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({
    path: '.env.local'
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || process.env.ADMIN_TOKEN;
const ITEM_ID = process.env.TEST_ITEM_ID || 'item-123'; // Default logic needs valid ID

if (!ADMIN_TOKEN) {
    console.error('Missing ADMIN_TOKEN env var');
    process.exit(1);
}

console.log(`Using Base URL: ${BASE_URL}`);
console.log(`Target Item: ${ITEM_ID}`);

async function runReplayAttack() {
    console.log('⚔️ Starting Replay & Concurrency Test...');

    const idempotencyKey = crypto.randomUUID();
    const requests = [];

    // Launch 20 simultaneous requests with SAME Key
    for (let i = 0; i < 20; i++) {
        requests.push(
            fetch(`${BASE_URL}/api/inventory/${ITEM_ID}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                    'Idempotency-Key': idempotencyKey
                },
                body: JSON.stringify({
                    decrement: 1
                })
            })
        );
    }

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);

    console.log('Statuses returned:', statuses);

    const successCount = statuses.filter(s => s === 200).length;
    // We expect at most 1 "real" execution (200 OK from DB) or 202 (Accepted) or 200 (Cached).
    // The exact behavior depends on the idempotency implementation (200 cached vs 409 conflict).
    // Our Idempotency layer returns 409 if processing, or 200 if done. 
    // Ideally 1 success, others 409 or 200 (cached).

    // We verify data integrity next.

    console.log('Request batch complete. Verifying stock...');
    // Manual verification via GET
    const getRes = await fetch(`${BASE_URL}/api/inventory/${ITEM_ID}`, {
        headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
    });

    if (getRes.ok) {
        const item = await getRes.json();
        console.log(`Current Stock: ${item.quantity_available}`);
        console.log(`Sold: ${item.quantity_sold}`);
    } else {
        console.error('Failed to fetch item status:', getRes.status);
    }
}

runReplayAttack().catch(console.error);