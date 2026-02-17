import http from 'http';

const PORT = 8079;

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const commands = JSON.parse(body);
      // Upstash REST API can take a single command or a pipeline (array of commands)
      // Check path to distinguish? @upstash/redis client typically uses /pipeline for verify-all or multi
      
      const isPipeline = req.url?.includes('pipeline');
      
      console.log(`[MockRedis] Request: ${req.url} Body: ${body.substring(0, 100)}...`);

      if (isPipeline) {
        // Assume body is array of commands: [ ["INCR", "key"], ["EXPIRE", "key", "60"] ]
        const results = commands.map((cmd: any[]) => processCommand(cmd));
        const response = results.map((r: any) => ({ result: r }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else {
        // Single command: ["GET", "key"]
        const result = processCommand(commands);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result }));
      }

    } catch (e) {
      console.error('[MockRedis] Error:', e);
      res.writeHead(400);
      res.end();
    }
  });
});

const store = new Map<string, any>();

function processCommand(cmd: any[]): any {
  const op = cmd[0].toUpperCase();
  const key = cmd[1];
  
  if (op === 'EVAL' || op === 'EVALSHA') {
    return [1, 20, 19, Date.now() + 60000];
  }
  
  if (op === 'SCRIPT') return "sha1-mock";
  
  if (op === 'GET') return store.get(key) || null;
  if (op === 'SET') {
      store.set(key, cmd[2]);
      return "OK";
  }
  if (op === 'INCR') {
      const val = (store.get(key) || 0) + 1;
      store.set(key, val);
      return val;
  }
  if (op === 'EXPIRE') return 1;
  if (op === 'DEL') {
      store.delete(key);
      return 1;
  }
  
  if (op === 'RPUSH' || op === 'LPUSH') {
      const list = store.get(key) || [];
      if (!Array.isArray(list)) return 0; // Type error in real redis, simplified here
      // cmd[2] is the value
      list.push(cmd[2]);
      store.set(key, list);
      return list.length;
  }
  
  if (op === 'LPOP') { // Worker uses LPOP or RPOP? Typically queues use LPOP/RPOP.
      const list = store.get(key) || [];
      if (!Array.isArray(list) || list.length === 0) return null;
      const val = list.shift(); // LPOP
      store.set(key, list);
      return val;
  }
  
    if (op === 'RPOP') {
      const list = store.get(key) || [];
      if (!Array.isArray(list) || list.length === 0) return null;
      const val = list.pop(); 
      store.set(key, list);
      return val;
  }
  
  if (op === 'LLEN') {
      const list = store.get(key) || [];
      return Array.isArray(list) ? list.length : 0;
  }

  return "OK";
}

server.listen(PORT, () => {
  console.log(`[MockRedis] Upstash-compatible server listening on port ${PORT}`);
});
