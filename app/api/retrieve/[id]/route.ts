import { NextRequest, NextResponse } from 'next/server';
import { retrieveAndDeleteSecret, checkRateLimit } from '@/lib/kv';
import { secretIdSchema } from '@/lib/schemas';
import { getClientIP } from '@/lib/utils';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get the actual values
    const { id } = await params;
    
    // DEBUG: Log the incoming ID
    console.log('DEBUG: Incoming secret ID:', JSON.stringify(id));
    console.log('DEBUG: ID length:', id.length);
    console.log('DEBUG: ID type:', typeof id);
    
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
    console.log('DEBUG: About to validate secret ID');
    const secretId = secretIdSchema.parse(id);
    console.log('DEBUG: Secret ID validation passed:', JSON.stringify(secretId));

    // Atomically retrieve and delete the secret
    console.log('DEBUG: About to retrieve secret with ID:', JSON.stringify(secretId));
    const secretData = await retrieveAndDeleteSecret(secretId);
    console.log('DEBUG: Secret data result:', secretData ? 'FOUND' : 'NOT_FOUND');
    
    if (secretData) {
      console.log('DEBUG: Secret data keys:', Object.keys(secretData));
    }

    if (!secretData) {
      console.log('DEBUG: Returning 404 - secret not found');
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

    console.log('DEBUG: Returning success');
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
    console.error('DEBUG: Error in retrieve route:', error);
    console.error('DEBUG: Error type:', error instanceof Error ? error.constructor.name : typeof error);
    if (error instanceof Error) {
      console.error('DEBUG: Error message:', error.message);
      console.error('DEBUG: Error name:', error.name);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error retrieving secret:', error);
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      console.log('DEBUG: Returning 400 - Zod validation error');
      return NextResponse.json(
        { error: 'Invalid secret ID format' },
        { status: 400 }
      );
    }

    console.log('DEBUG: Returning 500 - internal server error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 