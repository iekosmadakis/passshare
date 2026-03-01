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

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
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

/**
 * Extract client IP from request headers in order of trust:
 * x-vercel-forwarded-for > x-real-ip > cf-connecting-ip > x-forwarded-for
 * Falls back to a fingerprint hash if no valid IP is found.
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
      if (isValidIP(ip)) return ip;
    }
  }

  // Fallback: consistent fingerprint to prevent shared rate-limit buckets
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLang = request.headers.get('accept-language') || '';
  return `unknown:${simpleHash(userAgent + acceptLang)}`;
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

/** CSRF protection: validates that the request origin matches the host */
export function validateOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const requestOrigin = origin || (referer ? new URL(referer).origin : null);

  if (!requestOrigin) {
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
      return 'Cross-origin requests are not allowed';
    }
    return null;
  }

  const host = request.headers.get('host');
  const expectedHost = request.headers.get('x-forwarded-host') || host;

  if (!expectedHost) {
    return 'Unable to verify request origin';
  }

  try {
    const originUrl = new URL(requestOrigin);
    const expectedOrigins = [
      `https://${expectedHost}`,
      `http://${expectedHost}`,
    ];

    if (originUrl.hostname.endsWith('.vercel.app')) {
      return null;
    }

    if (!expectedOrigins.includes(requestOrigin)) {
      return 'Cross-origin requests are not allowed';
    }
  } catch {
    return 'Invalid origin header';
  }

  return null;
}
