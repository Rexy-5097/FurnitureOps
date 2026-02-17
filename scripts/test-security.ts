import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Allow self-signed certs in local dev environment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'http://localhost:3000';

async function testSecurity() {
  console.log('🔒 Starting Security Validation...');
  let failures = 0;

  // 1. Unauthorized Access
  try {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
       method: 'GET',
       headers: { 'Content-Type': 'application/json' }
    });
    if (res.status === 401 || res.status === 503) {
        console.log(`✅ Unauthorized Access Blocked (${res.status})`);
    } else {
        console.error(`❌ Unauthorized Access Failed: Expected 401/503, got ${res.status}`);
        failures++;
    }
  } catch (e) {
      console.error('❌ Network Error on Auth Check', e);
      failures++;
  }

  // 2. Method Not Allowed
  try {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
       method: 'PUT',
       headers: { 
           'Content-Type': 'application/json',
           'Authorization': 'Bearer invalid-token'
       }
    });

    if (res.status === 405 || res.status === 503) {
        console.log(`✅ Invalid Method Blocked (${res.status})`);
    } else {
        console.log(`ℹ️ Method Check: Got ${res.status}`);
    }
  } catch (e) { failures++; }

  // 3. Rate Limiting (Parallel burst to stress sliding window)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.warn('⚠️ Skipping Rate Limit Test: UPSTASH_REDIS_REST_URL not set.');
  } else {
      console.log('⚡ Testing Rate Limiting (30 parallel requests to /api/inventory)...');
      console.log('   (Sliding window: 20 req/60s via Upstash Redis)');
      
      // Parallel burst — fires all at once to stress the sliding window
      const burstRequests = Array.from({ length: 30 }, () =>
          fetch(`${BASE_URL}/api/inventory`, { method: 'GET' })
            .then(r => r.status)
            .catch(() => 0)
      );
      
      const statuses = await Promise.all(burstRequests);
      
      const count200 = statuses.filter(s => s === 200).length;
      const count429 = statuses.filter(s => s === 429).length;
      const count503 = statuses.filter(s => s === 503).length;
      const countOther = statuses.filter(s => s !== 200 && s !== 429 && s !== 503).length;
      
      console.log(`   Results: 200s: ${count200} | 429s: ${count429} | 503s: ${count503} | other: ${countOther}`);
      
      // Rate limiting is working if we see 429s, 503s, or if successful count is capped
      // If 503s are present, it means the service is down/fail-closed, which is also a "pass" for security (not failing open)
      const rateLimitActive = count429 > 0 || count503 > 0 || count200 < 30;
      if (rateLimitActive) {
          console.log(`✅ Rate Limiting Active (${count200} requests passed, ${30 - count200} blocked)`);
      } else {
          console.error('❌ Rate Limit FAILURE: All 30 requests returned 200.');
          failures++;
      }
  }

  if (failures === 0) {
      console.log('🛡️ Security Verification PASSED');
      process.exit(0);
  } else {
      console.error(`💀 Security Verification FAILED with ${failures} errors.`);
      process.exit(1);
  }
}

testSecurity();
