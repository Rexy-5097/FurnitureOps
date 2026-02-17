import http from 'k6/http';
import {
    check,
    sleep
} from 'k6';

export const options = {
    stages: [{
            duration: '30s',
            target: 100
        }, // Ramp to 100 concurrent
        {
            duration: '1m',
            target: 100
        }, // Sustain
    ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USE_QUEUE = __ENV.USE_QUEUE === 'true'; // Toggle

export default function() {
    const endpoint = USE_QUEUE ? '/api/buy' : '/api/inventory/123'; // 123 is test item

    const payload = JSON.stringify({
        itemId: '123', // Assuming ID for Buy Route
        quantity: 1,
        actorId: 'test-actor',
        // Legacy route uses 'decrement: 1' inside body structure, adapted here conceptually
        decrement: 1
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer TEST_TOKEN',
            'Idempotency-Key': `bench-${Date.now()}-${Math.random()}`
        },
    };

    const res = http.post(`${BASE_URL}${endpoint}`, payload, params);

    check(res, {
        'status is 2xx': (r) => r.status >= 200 && r.status < 300,
        'latency < 500ms': (r) => r.timings.duration < 500,
    });
}