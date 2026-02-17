const {
    spawn
} = require('child_process');
const http = require('http');

function startWorker() {
    console.log('🤖 Starting Worker...');
    const worker = spawn('npx', ['tsx', 'scripts/inventory-worker.ts'], {
        stdio: 'inherit',
        shell: true
    });
    return worker;
}

// 1. Start Worker
let worker = startWorker();

// 2. Send 100 Buys
console.log('📦 Sending 100 Buys...');
// (Pseudocode calling our load script or custom fetch loop)

// 3. Kill Worker after 5 seconds (Mid-processing)
setTimeout(() => {
    console.log('🧨 CHAOS: Killing Worker!');
    worker.kill('SIGKILL'); // Hard kill

    // 4. Verify System Logic
    // In a real test, we would expect:
    // - In-flight batches might be lost if not using LMOVE (Phase 28 limitation acknowledged in code comment)
    // - But Idempotency prevents duplicates on restart.

    // 5. Restart Worker
    setTimeout(() => {
        console.log('🚑 Restarting Worker...');
        worker = startWorker();
    }, 2000);

}, 5000);