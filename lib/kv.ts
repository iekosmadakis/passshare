/**
 * Vercel KV client setup and helper functions
 */

import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

export interface StoredSecret {
  encryptedData: string; // Base64URL encoded ciphertext with IV
  createdAt: number; // Unix timestamp in milliseconds
}

// TTL for secrets (24 hours in seconds)
export const SECRET_TTL = 24 * 60 * 60; // 86400 seconds

/**
 * Store encrypted secret data in KV with TTL
 * @param encryptedData Base64URL encoded encrypted data (IV + ciphertext)
 * @returns Unique secret ID
 */
export async function storeSecret(encryptedData: string): Promise<string> {
  const secretId = nanoid(21); // Generate cryptographically secure ID
  const key = `secret:${secretId}`;
  
  const secretData: StoredSecret = {
    encryptedData,
    createdAt: Date.now(),
  };
  
  // Store with TTL (expires after 24 hours)
  await kv.setex(key, SECRET_TTL, JSON.stringify(secretData));
  
  return secretId;
}

/**
 * Atomically retrieve and delete secret data from KV
 * @param secretId The secret ID
 * @returns The stored secret data or null if not found
 */
export async function retrieveAndDeleteSecret(secretId: string): Promise<StoredSecret | null> {
  const key = `secret:${secretId}`;
  
  try {
    // Use GETDEL for atomic get-and-delete operation
    const secretData = await kv.getdel(key);
    
    if (!secretData) {
      return null;
    }
    
    // Check if data is already parsed (object) or needs parsing (string)
    let parsed: StoredSecret;
    if (typeof secretData === 'string') {
      parsed = JSON.parse(secretData) as StoredSecret;
    } else {
      parsed = secretData as StoredSecret;
    }
    
    return parsed;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error retrieving secret:', error);
    }
    return null;
  }
}

/**
 * Rate limiting types for different endpoints
 */
export type RateLimitType = 'share' | 'retrieve';

/**
 * Rate limiting helper using atomic INCR operation
 * @param identifier IP address or user identifier
 * @param type The type of rate limit (share or retrieve) - uses separate counters
 * @param limit Number of requests allowed
 * @param window Time window in seconds
 * @returns Rate limit status
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType,
  limit: number = 10,
  window: number = 60
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Use separate keys for different rate limit types to prevent cross-endpoint interference
  const key = `rate_limit:${type}:${identifier}`;
  const now = Date.now();
  
  try {
    // Use atomic INCR - this eliminates race conditions
    // INCR creates the key with value 1 if it doesn't exist
    const current = await kv.incr(key);
    
    if (current === 1) {
      // First request - set the expiry window
      await kv.expire(key, window);
    }
    
    if (current > limit) {
      // Rate limit exceeded
      const ttl = await kv.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + (Math.max(ttl, 0) * 1000)
      };
    }
    
    // Get TTL for accurate reset time
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
    // SECURITY: Deny request on error to prevent rate limit bypass
    // This is safer than allowing requests when the rate limiter fails
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + (window * 1000)
    };
  }
}
