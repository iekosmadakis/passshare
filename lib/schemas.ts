import { z } from 'zod';

/**
 * Max encrypted data size: 10,000 chars plaintext + AES-GCM overhead (28 bytes)
 * + base64 expansion (~33%) = ~13,500 chars, rounded to 15,000 for safety.
 */
export const MAX_ENCRYPTED_DATA_LENGTH = 15000;

export const MAX_PLAINTEXT_LENGTH = 10000;

export const shareSecretSchema = z.object({
  encryptedData: z
    .string()
    .min(1, "Encrypted data is required")
    .max(MAX_ENCRYPTED_DATA_LENGTH, `Encrypted data exceeds maximum allowed size of ${MAX_ENCRYPTED_DATA_LENGTH} characters`),
});

export const secretIdSchema = z
  .string()
  .length(21, "Invalid secret ID format")
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid secret ID characters");

export type ShareSecretRequest = z.infer<typeof shareSecretSchema>;
export type SecretId = z.infer<typeof secretIdSchema>;
