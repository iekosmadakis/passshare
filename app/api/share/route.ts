import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { storeSecret, checkRateLimit } from '@/lib/kv';
import { BODY_TOO_LARGE, declaredLengthExceeds, readBoundedText } from '@/lib/request-body';
import { MAX_ENCRYPTED_DATA_LENGTH, shareSecretSchema } from '@/lib/schemas';
import { getClientIP, validateOrigin } from '@/lib/utils';

export const runtime = 'edge';

const RATE_LIMIT = 10;
const RATE_WINDOW = 60;

/**
 * Hard ceiling on the raw request body, enforced before we buffer or parse it.
 * The zod schema caps encryptedData itself, but that only runs after the whole
 * body has been read into memory — so without this an attacker could stream an
 * arbitrarily large payload and have it fully parsed before being rejected.
 * Generous headroom over the JSON envelope around a max-length ciphertext.
 */
const MAX_BODY_BYTES = MAX_ENCRYPTED_DATA_LENGTH + 1024;

const tooLarge = () =>
  NextResponse.json({ error: 'Request body too large' }, { status: 413 });

export async function POST(request: NextRequest) {
  try {
    const originError = validateOrigin(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

    // Cheap header-only precheck ahead of the rate limiter, so an obviously
    // oversized payload costs us nothing — not even a KV round-trip. A missing
    // or lying Content-Length is still caught by the bounded read below.
    if (declaredLengthExceeds(request, MAX_BODY_BYTES)) {
      return tooLarge();
    }

    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, 'share', RATE_LIMIT, RATE_WINDOW);

    const rateLimitHeaders = {
      'X-RateLimit-Limit': RATE_LIMIT.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString(),
    };

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.', resetTime: rateLimit.resetTime },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    const rawBody = await readBoundedText(request, MAX_BODY_BYTES);
    if (rawBody === BODY_TOO_LARGE) {
      return tooLarge();
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const validatedData = shareSecretSchema.parse(body);
    const secretId = await storeSecret(validatedData.encryptedData);

    return NextResponse.json(
      { id: secretId },
      { status: 201, headers: rateLimitHeaders }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error storing secret:', error);
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
