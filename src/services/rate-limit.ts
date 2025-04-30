import redis from '@/config/redis';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60; // 15 minutes in seconds
const ATTEMPT_WINDOW = 60; // 1 minute window for attempts

export async function checkRateLimit(identifier: string): Promise<{ isBlocked: boolean; remainingAttempts: number; timeToUnblock?: number }> {
  const key = `auth:${identifier}`;
  const blockKey = `auth:block:${identifier}`;

  // Check if user is blocked
  const isBlocked = await redis.exists(blockKey);
  if (isBlocked) {
    const ttl = await redis.ttl(blockKey);
    return { isBlocked: true, remainingAttempts: 0, timeToUnblock: ttl };
  }

  // Get current attempts
  const attempts = await redis.get(key);
  const currentAttempts = attempts ? parseInt(attempts) : 0;

  return {
    isBlocked: false,
    remainingAttempts: MAX_ATTEMPTS - currentAttempts,
  };
}

export async function incrementFailedAttempt(identifier: string): Promise<void> {
  const key = `auth:${identifier}`;
  const blockKey = `auth:block:${identifier}`;

  // Increment failed attempts
  const attempts = await redis.incr(key);
  
  // Set expiration if this is the first attempt
  if (attempts === 1) {
    await redis.expire(key, ATTEMPT_WINDOW);
  }

  // Block user if max attempts reached
  if (attempts >= MAX_ATTEMPTS) {
    await redis.setex(blockKey, BLOCK_DURATION, '1');
    await redis.del(key); // Clear attempts counter
  }
}

export async function resetAttempts(identifier: string): Promise<void> {
  const key = `auth:${identifier}`;
  const blockKey = `auth:block:${identifier}`;
  
  await redis.del(key);
  await redis.del(blockKey);
} 