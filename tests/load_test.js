import http from 'k6/http';
import {
    check,
    sleep
} from 'k6';

// Config
export const options = {
    scenarios: {
        stock_depletion: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [{
                    duration: '30s',
                    target: 50
                }, // Ramp up
                {
                    duration: '1m',
                    target: 500
                }, // Stress
                {
                    duration: '10s',
                    target: 0
                }, // Cooldown
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must be < 500ms
        http_req_failed: ['rate<0.01'], // < 1% errors
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;
const ITEM_ID = __ENV.ITEM_ID; // Pre-created item with 1000 stock

export default function() {
    const url = `${BASE_URL}/api/inventory/${ITEM_ID}`;
    const payload = JSON.stringify({
        decrement: 1, // Decrement by 1
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            // Random Idempotency Key per request to simulate unique sales
            'Idempotency-Key': `load-test-${Date.now()}-${Math.random()}`,
        },
    };

    const res = http.patch(url, payload, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'status is 409 (if out of stock)': (r) => r.status === 409, // Acceptable correctness
        'idempotency protected': (r) => r.status !== 500,
    });

    sleep(0.1); // Small think time
}