import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function run() {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  });

  const keys = await redis.keys('user:session:*');
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`Cleared ${keys.length} session cache keys`);
  } else {
    console.log('No session cache keys found');
  }
  await redis.quit();
}

run().catch(console.error);
