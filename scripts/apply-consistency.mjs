import {
    Client
} from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({
    path: '.env.local'
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
    process.exit(1);
}

// Extract Project Ref
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
// Construct Host (Standard Supabase Cloud)
const host = `db.${projectRef}.supabase.co`;

const password = process.env.DB_PASSWORD;
if (!password) {
    console.error('❌ Missing DB_PASSWORD environment variable.');
    console.error('Usage: DB_PASSWORD=your_password node scripts/apply-consistency.mjs');
    process.exit(1);
}

const connectionString = `postgres://postgres:${password}@${host}:5432/postgres`;

console.log(`🔌 Connecting to Supabase DB at ${host}...`);

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected.');

        const sqlPath = path.join(process.cwd(), 'supabase', 'consistency_hardening.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('⚡ Applying Consistency Hardening SQL...');
        await client.query(sql);
        console.log('✅ Consistency hardening applied.');

    } catch (err) {
        console.error('❌ Failed:', err);
    } finally {
        await client.end();
    }
}

run();