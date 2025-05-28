import { NextRequest, NextResponse } from 'next/server';
import { retrieveAndDeleteSecret, checkRateLimit } from '@/lib/kv';
import { secretIdSchema } from '@/lib/schemas';
import { getClientIP } from '@/lib/utils';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params to get the actual values
    const { id } = params;
    
    // Decode the secret ID from URL encoding
    const decodedId = decodeURIComponent(id);
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit (20 requests per minute for retrieval)
    const rateLimit = await checkRateLimit(clientIP, 20, 60);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: rateLimit.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    // Validate secret ID format
    const secretId = secretIdSchema.parse(decodedId);

    // Atomically retrieve and delete the secret
    const secretData = await retrieveAndDeleteSecret(secretId);

    if (!secretData) {
      return NextResponse.json(
        { error: 'Secret not found or already accessed' },
        { 
          status: 404,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
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
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        }
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error retrieving secret:', error);
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid secret ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 