// app/api/auth/check/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    return NextResponse.json({ authenticated: true });
    
  } catch (error) {
    console.error('Erro na verificação de auth:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
