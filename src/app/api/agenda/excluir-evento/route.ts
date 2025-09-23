export async function DELETE(request: Request) {
  try {
    const { eventoIndex } = await request.json();
    
    // Buscar todos eventos ordenados para encontrar o correto pelo índice
    const eventos = await prisma.eventoCorporativo.findMany({
      orderBy: { data_evento: 'asc' }
    });
    
    if (eventoIndex < 0 || eventoIndex >= eventos.length) {
      return NextResponse.json(
        { error: 'Índice de evento inválido' }, 
        { status: 400 }
      );
    }
    
    const eventoParaExcluir = eventos[eventoIndex];
    
    await prisma.eventoCorporativo.delete({
      where: { id: eventoParaExcluir.id }
    });
    
    return NextResponse.json({
      success: true,
      eventoExcluido: eventoParaExcluir.titulo
    });
    
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir evento' }, 
      { status: 500 }
    );
  }
}
