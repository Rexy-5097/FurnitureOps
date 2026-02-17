
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { getAdminToken } from './lib/test-auth';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000'; // Assuming local production server
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runLoadTest() {
    console.log("🔥 Starting Phase 5: Load Smoke Test...");
    
    // 0. Setup: Create Item with Qty 1
    const { data: item, error } = await supabase.from('inventory').insert({
        name: 'Load Test Item',
        origin: 'Test Origin',
        price: 100,
        quantity_available: 1, // Only 1 available
        quantity_sold: 0,
        image_url: 'https://placehold.co/50'
    }).select().single();
    
    if (error) throw error;
    console.log(`✅ Setup: Created Item ${item.id} (Qty: 1)`);

    let token: string;
    let actorId: string;
    try {
        const authData = await getAdminToken();
        token = authData.token;
        actorId = authData.userId;
    } catch (e) {
        console.error("Failed to get admin token:", e);
        process.exit(1);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 1. 50 Concurrent Buy Requests (Race Condition)
    // NOTE: Batched to 5 concurrent to avoid Sophos Firewall blocking (Rate Limit)
    console.log("\n🚀 1. Executing 50 Buy Requests (Batched 5 concurrent)...");
    const buyResults: number[] = [];
    const TOTAL_BUYS = 50;
    const BUY_CONCURRENCY = 5;

    const startBuy = performance.now();
    for (let i = 0; i < TOTAL_BUYS; i += BUY_CONCURRENCY) {
        const batch = [];
        for (let j = 0; j < BUY_CONCURRENCY && (i + j) < TOTAL_BUYS; j++) {
            const reqIndex = i + j;
            const idempotencyKey = `load-test-${Date.now()}-${reqIndex}`;
            
            batch.push(
                fetch(`${BASE_URL}/api/buy`, {
                    method: 'POST',
                    headers: { ...headers, 'Idempotency-Key': idempotencyKey },
                    body: JSON.stringify({ 
                        itemId: item.id, 
                        quantity: 1, 
                        actorId
                    })
                }).then(async r => {
                    if (!r.ok && reqIndex === 0) {
                        const text = await r.text();
                        console.error(`❌ Request 0 Failed: Status ${r.status}, Body: ${text}`);
                        return r.status;
                    }
                    return r.status;
                }).catch(e => {
                    console.error(`❌ Request ${reqIndex} Network Error:`, e);
                    return 500;
                })
            );
        }
        buyResults.push(...(await Promise.all(batch)));
    }
    const endBuy = performance.now();
    
    const successCount = buyResults.filter(s => s === 200 || s === 202).length;
    const failCount = buyResults.filter(s => s !== 200 && s !== 202).length;
    
    console.log(`   - Duration: ${(endBuy - startBuy).toFixed(2)}ms`);
    console.log(`   - Success (200/202): ${successCount} (Expected 50 - API Async Accepted)`);
    console.log(`   - Failed: ${failCount}`);
    
    // Note: Since API is async (Queue-based), 200 OK means "Accepted". 
    // The REAL race condition check is in the DB.
    // We will verify DB state after a short delay to allow worker to process.
    console.log("⏳ Waiting 5s for Worker to process...");
    await new Promise(r => setTimeout(r, 5000));
    
    const { data: finalItem } = await supabase.from('inventory').select('*').eq('id', item.id).single();
    console.log(`   - Final Item State: Qty ${finalItem.quantity_available}, Sold ${finalItem.quantity_sold}`);
    
    if (finalItem.quantity_sold === 1 && finalItem.quantity_available === 0) {
        console.log("✅ Race Condition Logic Passed (Only 1 item sold).");
    } else {
         console.error(`❌ RACE CONDITION FAILURE! Sold ${finalItem.quantity_sold} (Expected 1)`);
    }

    // 2. 200 Rapid GET /inventory
    console.log("\n🚀 2. Executing 200 Rapid GET /inventory...");
    const readPromises = [];
    const CONCURRENT_REQS = 5;
    const TOTAL_READS = 200;
    
    const startRead = performance.now();
    for (let i = 0; i < TOTAL_READS; i+=CONCURRENT_REQS) {
        const batch = [];
        for (let j = 0; j < CONCURRENT_REQS; j++) {
            batch.push(fetch(`${BASE_URL}/api/inventory`, { headers }).then(r => r.status));
        }
        readPromises.push(...(await Promise.all(batch)));
    }
    const endRead = performance.now();
    
    const successRead = readPromises.filter(s => s === 200).length;
    console.log(`   - Duration: ${(endRead - startRead).toFixed(2)}ms`); // Total logical time (batched)
    console.log(`   - Throughput: ${(TOTAL_READS / ((endRead - startRead)/1000)).toFixed(2)} req/sec`);
    console.log(`   - Success: ${successRead}/${TOTAL_READS}`);
    
    // 3. 30 Rapid Admin API Calls (Rate Limit Check)
    console.log("\n🚀 3. Executing 30 Rapid Admin Calls (Rate Limit Check)...");
    const adminPromises = [];
    for (let i = 0; i < 30; i++) {
        adminPromises.push(
            fetch(`${BASE_URL}/api/admin/audit-logs`, { headers }).then(r => r.status)
        );
    }
    const adminResults = await Promise.all(adminPromises);
    const rateLimited = adminResults.filter(s => s === 429).length;
    const adminSuccess = adminResults.filter(s => s === 200).length;
    
    console.log(`   - Success: ${adminSuccess}`);
    console.log(`   - Rate Limited (429): ${rateLimited}`);
    
    // Cleanup
    await supabase.from('inventory').delete().eq('id', item.id);
}

runLoadTest().catch(console.error);
