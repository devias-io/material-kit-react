import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Tentar importar CacheService
    const { CacheService } = await import('@/lib/redis');
    
    // Invalidar tags
    const tags = [
      'proventos:list',
      'proventos:stats',
      'central-proventos',
      'proventos',
    ];
    
    for (const tag of tags) {
      await CacheService.invalidateTags([tag]);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Cache Redis invalidado!',
      tags,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Também aceitar POST
export async function POST() {
  return GET();
}
