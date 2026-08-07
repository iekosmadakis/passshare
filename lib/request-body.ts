/**
 * Server-side helpers for reading request bodies with a hard size ceiling.
 *
 * Kept out of lib/utils.ts because that module is also pulled into client
 * bundles; nothing here should ship to the browser.
 */

/** Sentinel returned when a body exceeds the allowed size. */
export const BODY_TOO_LARGE = Symbol('BODY_TOO_LARGE');

/**
 * True when the declared Content-Length already exceeds `maxBytes`.
 * A cheap header-only check callers can run before doing any other work —
 * it lets an obviously oversized request be rejected without touching I/O.
 * Content-Length may be absent (chunked) or simply lie, so this is only a
 * fast path: `readBoundedText` still enforces the limit on actual bytes.
 */
export function declaredLengthExceeds(request: Request, maxBytes: number): boolean {
  const declared = request.headers.get('content-length');
  if (!declared) return false;
  const parsed = Number(declared);
  return Number.isFinite(parsed) && parsed > maxBytes;
}

/**
 * Read a request body as text, aborting as soon as it exceeds `maxBytes`.
 * Returns BODY_TOO_LARGE instead of throwing so callers can map it to a 413.
 *
 * The point is to never buffer an unbounded payload: `request.json()` reads the
 * whole stream into memory before any schema can reject it, so a large POST is
 * fully materialized before being thrown away.
 */
export async function readBoundedText(
  request: Request,
  maxBytes: number
): Promise<string | typeof BODY_TOO_LARGE> {
  if (declaredLengthExceeds(request, maxBytes)) return BODY_TOO_LARGE;

  const reader = request.body?.getReader();
  if (!reader) return '';

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return BODY_TOO_LARGE;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}
