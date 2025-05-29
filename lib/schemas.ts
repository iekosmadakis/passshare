/**
 * Zod schemas for input validation
 */

import { z } from 'zod';

// Schema for sharing a secret
export const shareSecretSchema = z.object({
  encryptedData: z.string().min(1, "Encrypted data is required"),
});

// Schema for secret ID validation
export const secretIdSchema = z.string().length(21);

// Type exports
export type ShareSecretRequest = z.infer<typeof shareSecretSchema>;
export type SecretId = z.infer<typeof secretIdSchema>; 