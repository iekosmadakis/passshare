import { NextRequest, NextResponse } from 'next/server';
import { storeSecret, checkRateLimit } from '@/lib/kv';
import { shareSecretSchema } from '@/lib/schemas';
import { getClientIP } from '@/lib/utils';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit (10 requests per minute)
    const rateLimit = await checkRateLimit(clientIP, 10, 60);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: rateLimit.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
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
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        }
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
