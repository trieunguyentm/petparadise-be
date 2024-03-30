import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Khai báo biến cho kết nối cached
let cachedClient: ReturnType<typeof createClient> | null = null;

export const connectRedis = async () => {
  if (cachedClient) {
    return cachedClient;
  }

  const client = createClient({
    url: `redis://${process.env.HOST_REDIS}:${process.env.PORT_REDIS}`,
    password: process.env.PASSWORD_REDIS,
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
  });

  client.on('error', (err) => {
    console.log('Redis Client Error', err);
  });

  // Đợi kết nối được thiết lập trước khi gán vào biến cached
  await client.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
    throw err;
  });

  // Lưu client vào biến cached để tái sử dụng
  cachedClient = client;
  return client;
};

// Export để sử dụng ở những nơi khác
export { cachedClient };
