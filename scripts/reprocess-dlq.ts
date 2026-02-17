import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

const DLQ_KEY = 'inventory:buy:dlq';
const QUEUE_KEY = 'inventory:buy:queue';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

async function reprocessDLQ() {
  console.log('♻️  Starting DLQ Reprocess...');
  
  const len = await redis.llen(DLQ_KEY);
  if (len === 0) {
      console.log('✅ DLQ is empty.');
      return;
  }

  console.log(`Found ${len} failed jobs. Reprocessing...`);
  
  // Pipeline move
  const pipeline = redis.pipeline();
  for (let i = 0; i < len; i++) {
     pipeline.lmove(DLQ_KEY, QUEUE_KEY, 'right', 'left');
  }
  
  const results = await pipeline.exec();
  console.log(`Moved ${results.length} jobs back to Main Queue.`);
}

reprocessDLQ();
