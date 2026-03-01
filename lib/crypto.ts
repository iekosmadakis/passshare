/**
 * Client-side cryptography using Web Crypto API (AES-256-GCM)
 */

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
  str += '='.repeat((4 - str.length % 4) % 4);
  str = str.replace(/-/g, '+').replace(/_/g, '/');

  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return base64UrlEncode(exported);
}

export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = base64UrlDecode(keyData);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function encrypt(plaintext: string, key: CryptoKey): Promise<{
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}> {
  const iv = generateIV();
  const data = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return { ciphertext, iv };
}

export async function decrypt(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

export function combineIvAndCiphertext(iv: Uint8Array, ciphertext: ArrayBuffer): ArrayBuffer {
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return combined.buffer;
}

export function separateIvAndCiphertext(combined: ArrayBuffer): {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
} {
  const combinedArray = new Uint8Array(combined);
  const iv = combinedArray.slice(0, 12);
  const ciphertext = combinedArray.slice(12);
  return { iv, ciphertext: ciphertext.buffer };
}
