require('dotenv').config();
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'thorough-reindeer-134930.upstash.io',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || 'gQAAAAAAAg8SAAIgcDFkMmNiOTVmYWExYWQ0ZWI2OGY0MjhhYzNmZDYxYTIzNQ',
  db: parseInt(process.env.REDIS_DB || '0', 10),
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error', err));

async function measureOperation(name, opFn, iterations = 30) {
  const times = [];
  
  // Warmup
  for(let i=0; i<5; i++) {
    await opFn();
  }
  
  // Measure
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await opFn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1000000);
  }
  
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.50)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  
  console.log(`\nOperation: ${name}`);
  console.log(`P50: ${p50.toFixed(2)} ms`);
  console.log(`P95: ${p95.toFixed(2)} ms`);
  console.log(`P99: ${p99.toFixed(2)} ms`);
}

async function run() {
  await measureOperation('PING', () => redis.ping());
  await measureOperation('SET', () => redis.set('benchmark_test_key', JSON.stringify({ hello: 'world' })));
  await measureOperation('GET', () => redis.get('benchmark_test_key'));
  await measureOperation('DEL', () => redis.del('benchmark_test_key'));
  redis.quit();
}

run().catch(console.error);
