import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Questions API working!', timestamp: new Date().toISOString() });
}
