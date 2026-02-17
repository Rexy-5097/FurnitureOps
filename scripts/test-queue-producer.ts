
import { getRedisClient } from './lib/redis-mock';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const redis = getRedisClient();

const QUEUE_KEY = 'inventory:buy:queue';

async function produceJobs() {
    console.log('🚀 Starting Queue Producer...');

    const jobs = [];
    const ITEM_ID = 'e85cae92-3d5f-461d-844f-7c42f066518a'; // Needs to be a valid item ID from previous tests or create new
    // Actually, let's just push valid shapes. The worker will fail if item doesn't exist, which is fine for "Worker Processing" test 
    // IF we are testing error handling. But we want SUCCESS validation (-50 stock).
    
    // We should probably create a test item first to ensure success.
    // Use Supabase client to create item? 
    // Simpler: Just rely on the user having a valid item or create one via script.
    // Let's assume we use the item created by test-idempotency? No, that cleans up.
    // Let's create a NEW item in this script to be self-contained.
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create Item
    console.log('📦 Creating Test Item for Queue...');
    const { data: item, error } = await supabase.from('inventory').insert({
        name: 'Queue Test Item',
        price: 50,
        quantity_available: 100, // Enough for 50 requests
        image_url: 'https://placehold.co/50',
        quantity_sold: 0
    }).select().single();

    if (error || !item) {
        console.error('Failed to create item:', error);
        return;
    }
    console.log(`✅ Item Created: ${item.id}`);

    // Push 50 Jobs
    console.log('📤 Pushing 50 jobs to Redis...');
    const pipeline = redis.pipeline();
    
    for (let i = 0; i < 50; i++) {
        const job = {
            item_id: item.id,
            quantity: 1,
            actor_id: '290cbfaa-094c-4332-aee3-f7c51ed573e0', // Valid UUID from debug-auth
            idempotency_key: `queue-test-${Date.now()}-${i}`,
            timestamp: Date.now(),
            retry_count: 0
        };
        pipeline.lpush(QUEUE_KEY, JSON.stringify(job));
    }
    
    await pipeline.exec();
    console.log('✅ 50 Jobs Pushed.');
    
    // Verify Queue Depth
    const len = await redis.llen(QUEUE_KEY);
    console.log(`📊 Current Queue Length: ${len}`);
}

produceJobs();
