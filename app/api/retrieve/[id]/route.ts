import { NextRequest, NextResponse } from 'next/server';
import { retrieveAndDeleteSecret, checkRateLimit } from '@/lib/kv';
import { secretIdSchema } from '@/lib/schemas';
import { getClientIP } from '@/lib/utils';

export const runtime = 'edge';

const RATE_LIMIT = 20;
const RATE_WINDOW = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format before rate limiting to avoid wasting quota
    const validationResult = secretIdSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid secret ID format' }, { status: 400 });
    }
    const secretId = validationResult.data;

    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, 'retrieve', RATE_LIMIT, RATE_WINDOW);

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

    const secretData = await retrieveAndDeleteSecret(secretId);

    if (!secretData) {
      return NextResponse.json(
        { error: 'Secret not found or already accessed' },
        { status: 404, headers: rateLimitHeaders }
      );
    }

    return NextResponse.json(
      { encryptedData: secretData.encryptedData, createdAt: secretData.createdAt },
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'Pragma': 'no-cache',
        }
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error retrieving secret:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
