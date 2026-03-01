import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

export interface StoredSecret {
  encryptedData: string;
  createdAt: number;
}

export const SECRET_TTL = 24 * 60 * 60;

export type RateLimitType = 'share' | 'retrieve';

export async function storeSecret(encryptedData: string): Promise<string> {
  const secretId = nanoid(21);
  const key = `secret:${secretId}`;

  const secretData: StoredSecret = {
    encryptedData,
    createdAt: Date.now(),
  };

  await kv.setex(key, SECRET_TTL, JSON.stringify(secretData));
  return secretId;
}

/** Atomically retrieves and deletes a secret (one-time access) */
export async function retrieveAndDeleteSecret(secretId: string): Promise<StoredSecret | null> {
  const key = `secret:${secretId}`;

  try {
    const secretData = await kv.getdel(key);
    if (!secretData) return null;

    if (typeof secretData === 'string') {
      return JSON.parse(secretData) as StoredSecret;
    }
    return secretData as StoredSecret;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error retrieving secret:', error);
    }
    return null;
  }
}

/** Rate limiter using atomic INCR with separate keys per endpoint type */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType,
  limit: number = 10,
  window: number = 60
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${type}:${identifier}`;
  const now = Date.now();

  try {
    const current = await kv.incr(key);

    if (current === 1) {
      await kv.expire(key, window);
    }

    if (current > limit) {
      const ttl = await kv.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + (Math.max(ttl, 0) * 1000)
      };
    }

    const ttl = await kv.ttl(key);
    return {
      allowed: true,
      remaining: Math.max(0, limit - current),
      resetTime: now + (Math.max(ttl, window) * 1000)
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Rate limiting error:', error);
    }
    // Deny on error to prevent rate-limit bypass
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + (window * 1000)
    };
  }
}
