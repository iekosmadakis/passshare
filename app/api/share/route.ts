import { NextRequest, NextResponse } from 'next/server';
import { storeSecret, checkRateLimit } from '@/lib/kv';
import { shareSecretSchema } from '@/lib/schemas';
import { getClientIP, validateOrigin } from '@/lib/utils';

export const runtime = 'edge';

const RATE_LIMIT = 10;
const RATE_WINDOW = 60; // seconds

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection: Validate Origin header
    const originError = validateOrigin(request);
    if (originError) {
      return NextResponse.json(
        { error: originError },
        { status: 403 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit (10 requests per minute for sharing)
    const rateLimit = await checkRateLimit(clientIP, 'share', RATE_LIMIT, RATE_WINDOW);
    
    const rateLimitHeaders = {
      'X-RateLimit-Limit': RATE_LIMIT.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString(),
    };
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: rateLimit.resetTime 
        },
        { 
          status: 429,
          headers: rateLimitHeaders
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = shareSecretSchema.parse(body);

    // Store encrypted data in KV
    const secretId = await storeSecret(validatedData.encryptedData);

    return NextResponse.json(
      { id: secretId },
      {
        status: 201,
        headers: rateLimitHeaders
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error storing secret:', error);
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
