import { NextRequest, NextResponse } from 'next/server';
import { HarantServiceError, searchLawyers } from '@/src/harant/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  try {
    const response = await searchLawyers({
      city: value(searchParams, 'city'),
      specialization: value(searchParams, 'specialization'),
      name: value(searchParams, 'name'),
      limit: numberValue(searchParams, 'limit'),
      page: numberValue(searchParams, 'page'),
    });

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}

function value(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key)?.trim() || undefined;
}

function numberValue(searchParams: URLSearchParams, key: string) {
  const raw = searchParams.get(key);
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function errorResponse(error: unknown) {
  if (error instanceof HarantServiceError) {
    return NextResponse.json(
      { error: error.message, retryable: error.retryable },
      { status: error.status }
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message, retryable: false }, { status: 500 });
}
