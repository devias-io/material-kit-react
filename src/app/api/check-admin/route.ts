import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true
      }
    });
    
    return NextResponse.json({
      success: true,
      users,
      jwtConfigured: !!process.env.JWT_SECRET
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}