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
    console.error('Usage: DB_PASSWORD=your_password node scripts/setup-db.mjs');
    process.exit(1);
}

const connectionString = `postgres://postgres:${password}@${host}:5432/postgres`;

console.log(`🔌 Connecting to Supabase DB at ${host}...`);

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    } // Required for Supabase
});

// Helper to separate statements
function splitSql(sql) {
    return sql
        .replace(/--.*$/gm, '') // Remove comments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected.');

        // 1. Read Schema
        const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📜 Applying Schema (Attributes, Tables, Policies)...');
        const statements = splitSql(schemaSql);

        for (const stmt of statements) {
            try {
                await client.query(stmt);
            } catch (err) {
                // Ignore "already exists" errors for idempotency
                if (err.code === '42710' || err.code === '42P07') {
                    // console.log('   -> Skipped (already exists)');
                } else {
                    console.error(`❌ Failed processing statement:\n${stmt.substring(0, 100)}...`);
                    throw err;
                }
            }
        }
        console.log('✅ Schema applied.');

        // 2. Read RPC (Executed as single block due to function syntax)
        const rpcPath = path.join(process.cwd(), 'supabase', 'kill_switch_rpc.sql');
        const rpcSql = fs.readFileSync(rpcPath, 'utf8');

        console.log('⚡ Applying Kill Switch RPC...');
        await client.query(rpcSql);
        console.log('✅ RPC Function created.');

        console.log('\n🎉 Database setup complete! You can now use the dashboard.');

    } catch (err) {
        console.error('❌ Database setup failed:', err);
    } finally {
        await client.end();
    }
}

run();