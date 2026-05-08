import { NextResponse } from 'next/server';
import { getHealth } from '@/src/harant/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET() {
  const health = await getHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
