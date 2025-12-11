/**
 * General utility functions
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format time remaining
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
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
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Get client IP address from request headers
 * 
 * SECURITY: When deployed behind Vercel's edge network, we trust specific headers
 * that Vercel sets. The x-forwarded-for header from Vercel contains the real client IP
 * as the first entry, with Vercel's own IPs appended.
 * 
 * For other platforms (Cloudflare, etc.), appropriate headers are checked in order of trust.
 * 
 * @param request The incoming request
 * @returns The client IP address or a hash for unknown clients
 */
export function getClientIP(request: Request): string {
  // Vercel-specific header (most trusted when on Vercel)
  // This is set by Vercel's edge network and cannot be spoofed by clients
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    const ip = vercelForwardedFor.split(',')[0].trim();
    if (isValidIP(ip)) return ip;
  }
  
  // Vercel's IP header
  const vercelIP = request.headers.get('x-real-ip');
  if (vercelIP && isValidIP(vercelIP)) {
    return vercelIP;
  }
  
  // Cloudflare's connecting IP (trusted when behind Cloudflare)
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP && isValidIP(cfConnectingIP)) {
    return cfConnectingIP;
  }
  
  // Standard forwarded-for header (less trusted, validate the format)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (isValidIP(ip)) return ip;
  }
  
  // Fallback: Generate a consistent identifier based on available headers
  // This prevents all unknown clients from sharing the same rate limit bucket
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLang = request.headers.get('accept-language') || '';
  const fingerprint = `unknown:${simpleHash(userAgent + acceptLang)}`;
  
  return fingerprint;
}

/**
 * Validate IP address format (IPv4 or IPv6)
 * This prevents header injection attacks with malformed values
 */
function isValidIP(ip: string): boolean {
  if (!ip || ip.length > 45) return false; // Max IPv6 length is 45 chars
  
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }
  
  // IPv6 pattern (simplified - allows valid IPv6 formats)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv6Pattern.test(ip)) return true;
  
  // IPv6 with IPv4 suffix
  const ipv6v4Pattern = /^([0-9a-fA-F]{0,4}:){2,6}(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv6v4Pattern.test(ip)) return true;
  
  return false;
}

/**
 * Simple hash function for generating consistent fingerprints
 * Not cryptographically secure, but sufficient for rate limit bucketing
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate request origin for CSRF protection
 * 
 * @param request The incoming request
 * @returns Error message if validation fails, null if valid
 */
export function validateOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // For same-origin requests, the origin header should be present
  // If not, check referer as fallback
  const requestOrigin = origin || (referer ? new URL(referer).origin : null);
  
  if (!requestOrigin) {
    // Allow requests without origin (e.g., from server-side or non-browser clients)
    // but only if it's not a fetch/XHR request
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
      return 'Cross-origin requests are not allowed';
    }
    return null;
  }
  
  // Get the expected host from the request
  const host = request.headers.get('host');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const expectedHost = forwardedHost || host;
  
  if (!expectedHost) {
    return 'Unable to verify request origin';
  }
  
  try {
    const originUrl = new URL(requestOrigin);
    const expectedOrigins = [
      `https://${expectedHost}`,
      `http://${expectedHost}`, // Allow for local development
    ];
    
    // Also allow Vercel preview URLs
    if (expectedHost.includes('.vercel.app') || originUrl.hostname.includes('.vercel.app')) {
      // Both are Vercel deployments, allow
      if (originUrl.hostname.endsWith('.vercel.app')) {
        return null;
      }
    }
    
    if (!expectedOrigins.includes(requestOrigin)) {
      return 'Cross-origin requests are not allowed';
    }
  } catch {
    return 'Invalid origin header';
  }
  
  return null;
}
