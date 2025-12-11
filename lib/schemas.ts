/**
 * Zod schemas for input validation
 */

import { z } from 'zod';

/**
 * Maximum allowed size for encrypted data (in characters)
 * 
 * Calculation:
 * - Max plaintext: 10,000 characters (generous limit for passwords/secrets)
 * - AES-GCM adds: 16 bytes auth tag + 12 bytes IV = 28 bytes overhead
 * - Base64 encoding: increases size by ~33%
 * - Final max: ~13,500 characters (rounded up to 15,000 for safety)
 */
export const MAX_ENCRYPTED_DATA_LENGTH = 15000;

/**
 * Maximum plaintext length before encryption
 * This is enforced on the client side
 */
export const MAX_PLAINTEXT_LENGTH = 10000;

// Schema for sharing a secret
export const shareSecretSchema = z.object({
  encryptedData: z
    .string()
    .min(1, "Encrypted data is required")
    .max(MAX_ENCRYPTED_DATA_LENGTH, `Encrypted data exceeds maximum allowed size of ${MAX_ENCRYPTED_DATA_LENGTH} characters`),
});

// Schema for secret ID validation (nanoid with 21 characters)
export const secretIdSchema = z
  .string()
  .length(21, "Invalid secret ID format")
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid secret ID characters");

// Type exports
export type ShareSecretRequest = z.infer<typeof shareSecretSchema>;
export type SecretId = z.infer<typeof secretIdSchema>; 