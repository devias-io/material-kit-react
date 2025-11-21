// app/api/notifications/stream/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect(
    new URL('/api/notifications/fluxo', 'https://portal.fatosdabolsa.com.br'),
    308
  );
}
