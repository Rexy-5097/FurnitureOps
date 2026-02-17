

import { getAdminToken } from './lib/test-auth';

async function testSingleApi() {
    console.log("🚀 Testing Single API Call to /api/buy...");
    
    // 1. Get Token
    const token = await getAdminToken();
    console.log("🔑 Token verified");

    // 2. Prepare Payload
    const payload = {
      itemId: 'test-item-1',
      quantity: 1, // Single item
      actorId: 'user-single-test'
    };
    
    const idempotencyKey = `single-test-${Date.now()}`;

    // 3. Make Request
    try {
        const res = await fetch('http://localhost:3000/api/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify(payload)
        });

        console.log(`📥 Status: ${res.status} ${res.statusText}`);
        
        try {
            const data = await res.json();
            console.log("📦 Response Body:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("⚠️ Could not parse JSON response (might be HTML/Text)");
            const text = await res.text();
            console.log("📄 Raw Response:", text.substring(0, 500)); // Print first 500 chars
        }

    } catch (err) {
        console.error("❌ Request Failed:", err);
    }
}

testSingleApi();
