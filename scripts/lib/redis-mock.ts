
import { Redis } from '@upstash/redis';
// COMMENTED OUT: File-based mock is disabled for production parity
// import fs from 'fs';
// import path from 'path';

// const MOCK_FILE = path.resolve(__dirname, '../../.redis-mock.json');

// COMMENTED OUT: MockRedis class — PRODUCTION PARITY requires real Redis
// class MockRedis {
//   private data: Record<string, any[]> = {};
//
//   constructor() {
//     this.load();
//   }
//
//   private load() {
//     if (fs.existsSync(MOCK_FILE)) {
//       try {
//         this.data = JSON.parse(fs.readFileSync(MOCK_FILE, 'utf-8'));
//       } catch (e) {
//         this.data = {};
//       }
//     }
//   }
//
//   private save() {
//     fs.writeFileSync(MOCK_FILE, JSON.stringify(this.data, null, 2));
//   }
//
//   async lpush(key: string, ...values: any[]) {
//     this.load();
//     if (!this.data[key]) this.data[key] = [];
//     for (const v of values) {
//         this.data[key].unshift(v);
//     }
//     this.save();
//     return this.data[key].length;
//   }
//
//   async rpop(key: string) {
//     this.load();
//     if (!this.data[key] || this.data[key].length === 0) return null;
//     const val = this.data[key].pop();
//     this.save();
//     return val;
//   }
//
//   async llen(key: string) {
//     this.load();
//     return (this.data[key] || []).length;
//   }
//
//   pipeline() {
//     const self = this;
//     const actions: (() => Promise<any>)[] = [];
//
//     return {
//       lpush: (key: string, ...values: any[]) => {
//         actions.push(() => self.lpush(key, ...values));
//         return this;
//       },
//       rpop: (key: string) => {
//         actions.push(() => self.rpop(key));
//         return this;
//       },
//       exec: async () => {
//         const results = [];
//         for (const action of actions) {
//           results.push(await action());
//         }
//         return results;
//       }
//     }
//   }
// }

export function getRedisClient() {
  // PRODUCTION PARITY: Real Redis ONLY. No mock fallback.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('PRODUCTION PARITY FAILURE: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required. No mock fallback.');
  }
  return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // COMMENTED OUT: Mock fallback path
  // console.warn('⚠️  [Mock] Using File-based Redis Mock');
  // return new MockRedis() as unknown as Redis; 
}
