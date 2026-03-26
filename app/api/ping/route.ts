import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: true });
}
