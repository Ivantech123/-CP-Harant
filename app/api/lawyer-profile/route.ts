import { NextRequest, NextResponse } from 'next/server';
import { getLawyerProfile, HarantServiceError } from '@/src/harant/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const profileUrl = req.nextUrl.searchParams.get('profileUrl')?.trim();

  if (!profileUrl) {
    return NextResponse.json({ error: 'profileUrl parameter is required' }, { status: 400 });
  }

  try {
    const response = await getLawyerProfile({ profileUrl });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof HarantServiceError) {
      return NextResponse.json(
        { error: error.message, retryable: error.retryable },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message, retryable: false }, { status: 500 });
  }
}
