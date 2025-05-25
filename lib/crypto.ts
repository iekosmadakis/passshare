/**
 * Client-side cryptography utilities using Web Crypto API
 * Implements AES-256-GCM encryption with secure key and IV generation
 */

// Base64URL encoding/decoding utilities
export function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64UrlDecode(str: string): ArrayBuffer {
  // Add padding if needed
  str += '='.repeat((4 - str.length % 4) % 4);
  // Replace URL-safe characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a cryptographically secure 256-bit AES key
export async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Export key to base64url format for URL embedding
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return base64UrlEncode(exported);
}

// Import key from base64url format
export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = base64UrlDecode(keyData);
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // not extractable
    ['decrypt']
  );
}

// Generate a cryptographically secure 96-bit (12-byte) IV
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

// Encrypt plaintext using AES-256-GCM
export async function encrypt(plaintext: string, key: CryptoKey): Promise<{
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}> {
  const iv = generateIV();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  
  return { ciphertext, iv };
}

// Decrypt ciphertext using AES-256-GCM
export async function decrypt(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Combine IV and ciphertext for storage
export function combineIvAndCiphertext(iv: Uint8Array, ciphertext: ArrayBuffer): ArrayBuffer {
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return combined.buffer;
}

// Separate IV and ciphertext from combined buffer
export function separateIvAndCiphertext(combined: ArrayBuffer): {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
} {
  const combinedArray = new Uint8Array(combined);
  const iv = combinedArray.slice(0, 12); // First 12 bytes are IV
  const ciphertext = combinedArray.slice(12); // Rest is ciphertext
  return { iv, ciphertext: ciphertext.buffer };
} 