import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

/**
 * Copy text to the clipboard. When `clearAfterMs` is set (used for plaintext
 * secrets), best-effort clear the live clipboard afterwards to shrink the
 * window during which the secret sits in the OS / cloud-synced clipboard.
 * The clear only overwrites if the clipboard still holds our value, and any
 * permission error is swallowed — it cannot remove entries already captured
 * by OS clipboard history (Win+V), so callers must not rely on it.
 */
export async function copyToClipboard(text: string, clearAfterMs?: number): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      if (clearAfterMs && clearAfterMs > 0) {
        scheduleClipboardClear(text, clearAfterMs);
      }
      return true;
    }

    // Fallback for non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

function scheduleClipboardClear(value: string, delayMs: number): void {
  setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText();
      if (current === value) {
        await navigator.clipboard.writeText('');
      }
    } catch {
      // Reading the clipboard may be denied without a user gesture — that's fine,
      // we simply skip clearing rather than wiping unrelated clipboard content.
    }
  }, delayMs);
}

/**
 * Extract a rate-limit bucket identifier from request headers in order of trust:
 * x-vercel-forwarded-for > x-real-ip > cf-connecting-ip > x-forwarded-for
 * IPv6 sources are collapsed to their /64 prefix so a single allocation (a host
 * is routinely handed a whole /64) cannot rotate through 2^64 addresses to defeat
 * per-IP limits. IPv4 keeps full precision. Falls back to a fingerprint hash.
 */
export function getClientIP(request: Request): string {
  const headerPriority = [
    'x-vercel-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-forwarded-for',
  ];

  for (const header of headerPriority) {
    const value = request.headers.get(header);
    if (value) {
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip.includes(':') ? ipv6Prefix64(ip) : ip;
      }
    }
  }

  // Fallback: consistent fingerprint to prevent shared rate-limit buckets
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLang = request.headers.get('accept-language') || '';
  return `unknown:${simpleHash(userAgent + acceptLang)}`;
}

/**
 * Reduce an IPv6 address to its /64 network prefix (the first four hextets),
 * used as the rate-limit bucket key. Expands :: compression and ignores any
 * zone id or embedded-IPv4 tail (the tail never falls inside the first 64 bits
 * for routable addresses). Errs toward coarser (stricter) bucketing on oddities.
 */
function ipv6Prefix64(ip: string): string {
  const addr = ip.split('%')[0];
  let head = addr;
  let tail = '';
  if (addr.includes('::')) {
    const parts = addr.split('::');
    head = parts[0];
    tail = parts[1] ?? '';
  }
  const headGroups = head ? head.split(':').filter(Boolean) : [];
  const tailGroups = tail ? tail.split(':').filter(Boolean) : [];
  const missing = Math.max(0, 8 - (headGroups.length + tailGroups.length));
  const full = [...headGroups, ...Array(missing).fill('0'), ...tailGroups];
  const prefix = full
    .slice(0, 4)
    .map((h) => (parseInt(h || '0', 16) || 0).toString(16))
    .join(':');
  return `${prefix}::/64`;
}

/** Validates IPv4 and IPv6 formats to prevent header injection */
function isValidIP(ip: string): boolean {
  if (!ip || ip.length > 45) return false;

  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4.test(ip)) {
    return ip.split('.').map(Number).every(n => n >= 0 && n <= 255);
  }

  const ipv6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv6.test(ip)) return true;

  const ipv6v4 = /^([0-9a-fA-F]{0,4}:){2,6}(\d{1,3}\.){3}\d{1,3}$/;
  return ipv6v4.test(ip);
}

/** Non-cryptographic hash for rate-limit bucketing */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * CSRF protection: validates that the request originates from this deployment.
 * The expected origin is derived from the (platform-set) host header, optionally
 * extended by an explicit ALLOWED_ORIGINS allowlist for custom domains. We never
 * trust a hostname *suffix* (e.g. any "*.vercel.app"), since anyone can deploy
 * under that eTLD and would otherwise pass the check.
 */
export function validateOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  let requestOrigin: string | null = null;
  try {
    requestOrigin = origin || (referer ? new URL(referer).origin : null);
  } catch {
    return 'Invalid origin header';
  }

  if (!requestOrigin) {
    // No Origin/Referer: rely on the Fetch Metadata signal. A modern browser
    // always sends Sec-Fetch-Site; same-origin/none is fine, anything else is
    // cross-site. Header-less clients (no signal at all) fail closed.
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite === 'same-origin' || secFetchSite === 'none') {
      return null;
    }
    return 'Cross-origin requests are not allowed';
  }

  const host = request.headers.get('host');
  const expectedHost = request.headers.get('x-forwarded-host') || host;

  if (!expectedHost) {
    return 'Unable to verify request origin';
  }

  const allowed = new Set<string>([
    `https://${expectedHost}`,
    `http://${expectedHost}`,
  ]);
  for (const extra of (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)) {
    allowed.add(extra);
  }

  if (!allowed.has(requestOrigin)) {
    return 'Cross-origin requests are not allowed';
  }

  return null;
}
