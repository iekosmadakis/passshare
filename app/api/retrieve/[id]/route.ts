import { NextRequest, NextResponse } from 'next/server';
import { retrieveAndDeleteSecret, checkRateLimit } from '@/lib/kv';
import { secretIdSchema } from '@/lib/schemas';
import { getClientIP } from '@/lib/utils';

export const runtime = 'edge';

const RATE_LIMIT = 20;
const RATE_WINDOW = 60; // seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get the actual values
    const { id } = await params;
    
    // SECURITY: Validate secret ID format BEFORE rate limiting
    // This prevents invalid requests from consuming rate limit quota
    const validationResult = secretIdSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid secret ID format' },
        { status: 400 }
      );
    }
    const secretId = validationResult.data;
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit (20 requests per minute for retrieval)
    const rateLimit = await checkRateLimit(clientIP, 'retrieve', RATE_LIMIT, RATE_WINDOW);
    
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

    // Atomically retrieve and delete the secret
    const secretData = await retrieveAndDeleteSecret(secretId);

    if (!secretData) {
      return NextResponse.json(
        { error: 'Secret not found or already accessed' },
        { 
          status: 404,
          headers: rateLimitHeaders
        }
      );
    }

    return NextResponse.json(
      { 
        encryptedData: secretData.encryptedData,
        createdAt: secretData.createdAt
      },
      {
        headers: {
          ...rateLimitHeaders,
          // Prevent caching of secrets
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'Pragma': 'no-cache',
        }
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error retrieving secret:', error);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
