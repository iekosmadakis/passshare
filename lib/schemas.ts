/**
 * Zod schemas for input validation
 */

import { z } from 'zod';

// Schema for password generation options
export const passwordOptionsSchema = z.object({
  length: z.number().min(8).max(128),
  includeUppercase: z.boolean(),
  includeLowercase: z.boolean(),
  includeNumbers: z.boolean(),
  includeSymbols: z.boolean(),
}).refine(
  (data) => data.includeUppercase || data.includeLowercase || data.includeNumbers || data.includeSymbols,
  {
    message: "At least one character type must be selected",
  }
);

// Schema for sharing a secret
export const shareSecretSchema = z.object({
  encryptedData: z.string().min(1, "Encrypted data is required"),
});

// Schema for secret ID validation
export const secretIdSchema = z.string().regex(
  /^[A-Za-z0-9_-]{21}$/,
  "Invalid secret ID format"
);

// Type exports
export type ShareSecretRequest = z.infer<typeof shareSecretSchema>;
export type SecretId = z.infer<typeof secretIdSchema>; 