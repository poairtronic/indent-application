import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('Testing Infra Redis connection...');
  const host = process.env.INFRA_REDIS_HOST || process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.INFRA_REDIS_PORT || process.env.REDIS_PORT || '6379', 10);
  const password = process.env.INFRA_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined;
  const db = parseInt(process.env.INFRA_REDIS_DB || process.env.REDIS_DB || '0', 10);
  const useTls = (process.env.INFRA_REDIS_TLS || process.env.REDIS_TLS) === 'true';

  const client = new Redis({
    host,
    port,
    password,
    db,
    tls: useTls ? {} : undefined,
    lazyConnect: true,
    connectTimeout: 5000,
    maxRetriesPerRequest: null,
  });

  client.on('error', (err) => {
    console.error('Connection failed:', err.message);
  });

  try {
    await client.connect();
    console.log('Successfully connected to Infra Redis!');
    const ping = await client.ping();
    console.log('PING response:', ping);
    
    console.log('Testing reconnect behavior...');
    await client.quit();
    console.log('Test completed successfully.');
  } catch (err: any) {
    console.error('Test failed:', err.message);
  } finally {
    client.disconnect();
  }
}

testConnection();
