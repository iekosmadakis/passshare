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
    const secretData = await kv.getdel(key) as string | null;
    
    if (!secretData) {
      return null;
    }
    
    return JSON.parse(secretData) as StoredSecret;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error retrieving secret:', error);
    }
    return null;
  }
}

/**
 * Rate limiting helper
 * @param identifier IP address or user identifier
 * @param limit Number of requests allowed
 * @param window Time window in seconds
 * @returns True if request is allowed
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - (window * 1000);
  
  try {
    // Get current count
    const current = await kv.get(key) as number | null;
    
    if (current === null) {
      // First request in window
      await kv.setex(key, window, 1);
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + (window * 1000)
      };
    }
    
    if (current >= limit) {
      // Rate limit exceeded
      const ttl = await kv.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + (ttl * 1000)
      };
    }
    
    // Increment counter
    await kv.incr(key);
    
    return {
      allowed: true,
      remaining: limit - current - 1,
      resetTime: now + (window * 1000)
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Rate limiting error:', error);
    }
    // Allow request on error to avoid blocking legitimate users
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + (window * 1000)
    };
  }
} 