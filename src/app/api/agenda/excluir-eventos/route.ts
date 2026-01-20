// ==========================================
// 🗑️ DELETE /api/agenda/excluir-eventos
// ==========================================

export async function DELETE(request: Request) {
  try {
    const { indices } = await request.json();
    
    if (!Array.isArray(indices) || indices.length === 0) {
      return NextResponse.json(
        { error: 'Índices inválidos' }, 
        { status: 400 }
      );
    }
    
    // Buscar eventos ordenados
    const eventos = await prisma.eventoCorporativo.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' }
    });
    
    // Obter IDs dos eventos a serem excluídos
    const idsParaExcluir = indices
      .filter(index => index >= 0 && index < eventos.length)
      .map(index => eventos[index].id);
    
    const resultado = await prisma.eventoCorporativo.deleteMany({
      where: { 
        id: { in: idsParaExcluir } 
      }
    });
    
    return NextResponse.json({
      success: true,
      eventosExcluidos: resultado.count
    });
    
  } catch (error) {
    console.error('Erro ao excluir eventos:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir eventos' }, 
      { status: 500 }
    );
  }
}
