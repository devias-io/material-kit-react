// src/app/api/carteiras/modelo-excel/route.ts

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    console.log('Gerando modelo Excel...');
    
    const wb = XLSX.utils.book_new();
    
    // ABA AÇÕES
    const acoes = [
      ['ANÁLISE DE CARTEIRA - AÇÕES BRASILEIRAS'],
      [''],
      ['Preencha apenas as colunas: ATIVO, QUANTIDADE, PREÇO MÉDIO'],
      [''],
      ['ATIVO', 'QUANTIDADE', 'PREÇO MÉDIO', 'COTAÇÃO ATUAL', 'VALOR INVESTIDO', 'VALOR ATUAL', 'RENTABILIDADE %', '% CARTEIRA'],
      ['PETR4', 100, 25.50, '', '', '', '', ''],
      ['VALE3', 50, 85.00, '', '', '', '', ''],
      ['ITUB4', '', '', '', '', '', '', ''],
      ['BBAS3', '', '', '', '', '', '', ''],
      ['WEGE3', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];
    const wsAcoes = XLSX.utils.aoa_to_sheet(acoes);
    wsAcoes['!cols'] = [
      { width: 12 }, { width: 12 }, { width: 15 }, { width: 15 }, 
      { width: 18 }, { width: 15 }, { width: 15 }, { width: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsAcoes, 'Ações');
    
    // ABA FIIs
    const fiis = [
      ['ANÁLISE DE CARTEIRA - FUNDOS IMOBILIÁRIOS'],
      [''],
      ['Preencha apenas as colunas: ATIVO, QUANTIDADE, PREÇO MÉDIO'],
      [''],
      ['ATIVO', 'QUANTIDADE', 'PREÇO MÉDIO', 'COTAÇÃO ATUAL', 'VALOR INVESTIDO', 'VALOR ATUAL', 'RENTABILIDADE %', '% CARTEIRA'],
      ['HGLG11', 10, 150.00, '', '', '', '', ''],
      ['BCFF11', 20, 85.50, '', '', '', '', ''],
      ['XPML11', '', '', '', '', '', '', ''],
      ['MXRF11', '', '', '', '', '', '', ''],
      ['VISC11', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];
    const wsFiis = XLSX.utils.aoa_to_sheet(fiis);
    wsFiis['!cols'] = [
      { width: 12 }, { width: 12 }, { width: 15 }, { width: 15 }, 
      { width: 18 }, { width: 15 }, { width: 15 }, { width: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsFiis, 'FIIs');
    
    // ABA EXTERIOR
    const exterior = [
      ['ANÁLISE DE CARTEIRA - INVESTIMENTOS EXTERIOR'],
      [''],
      ['Preencha apenas as colunas: ATIVO, QUANTIDADE, PREÇO MÉDIO (USD)'],
      [''],
      ['ATIVO', 'QUANTIDADE', 'PREÇO MÉDIO (USD)', 'COTAÇÃO (USD)', 'VALOR INVEST. (R$)', 'VALOR ATUAL (R$)', 'RENTABILIDADE %', '% CARTEIRA'],
      ['AAPL', 5, 150.00, '', '', '', '', ''],
      ['MSFT', 3, 280.00, '', '', '', '', ''],
      ['GOOGL', '', '', '', '', '', '', ''],
      ['TSLA', '', '', '', '', '', '', ''],
      ['VTI', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];
    const wsExterior = XLSX.utils.aoa_to_sheet(exterior);
    wsExterior['!cols'] = [
      { width: 12 }, { width: 12 }, { width: 18 }, { width: 15 }, 
      { width: 18 }, { width: 18 }, { width: 15 }, { width: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsExterior, 'Exterior');
    
    // ABA RENDA FIXA
    const rendaFixa = [
      ['ANÁLISE DE CARTEIRA - RENDA FIXA'],
      [''],
      ['Preencha: PRODUTO, VALOR INVESTIDO, VENCIMENTO'],
      [''],
      ['PRODUTO', 'BANCO/CORRETORA', 'VALOR INVESTIDO', 'VALOR ATUAL', 'VENCIMENTO', 'RENTABILIDADE %', '% CARTEIRA'],
      ['CDB 120% CDI', 'Inter', 10000, '', '31/12/2025', '', ''],
      ['Tesouro IPCA+', 'Tesouro Direto', 15000, '', '15/05/2035', '', ''],
      ['LCI 95% CDI', 'Nubank', 5000, '', '20/08/2026', '', ''],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '']
    ];
    const wsRendaFixa = XLSX.utils.aoa_to_sheet(rendaFixa);
    wsRendaFixa['!cols'] = [
      { width: 25 }, { width: 20 }, { width: 18 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsRendaFixa, 'Renda Fixa');
    
    // ABA CRIPTOMOEDAS
    const cripto = [
      ['ANÁLISE DE CARTEIRA - CRIPTOMOEDAS'],
      [''],
      ['Preencha: CRIPTOMOEDA, QUANTIDADE, PREÇO MÉDIO (R$)'],
      [''],
      ['CRIPTOMOEDA', 'QUANTIDADE', 'PREÇO MÉDIO (R$)', 'COTAÇÃO ATUAL', 'VALOR ATUAL', 'EXCHANGE', 'RENTABILIDADE %', '% CARTEIRA'],
      ['Bitcoin (BTC)', 0.5, 150000, '', '', 'Binance', '', ''],
      ['Ethereum (ETH)', 2, 8000, '', '', 'Binance', '', ''],
      ['Solana (SOL)', '', '', '', '', '', '', ''],
      ['Cardano (ADA)', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];
    const wsCripto = XLSX.utils.aoa_to_sheet(cripto);
    wsCripto['!cols'] = [
      { width: 20 }, { width: 12 }, { width: 18 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsCripto, 'Cripto');
    
    // ABA RESERVA DE EMERGÊNCIA
    const reserva = [
      ['ANÁLISE DE CARTEIRA - RESERVA DE EMERGÊNCIA'],
      [''],
      ['Preencha: ONDE ESTÁ, VALOR'],
      [''],
      ['ONDE ESTÁ', 'BANCO/INSTITUIÇÃO', 'VALOR (R$)', 'OBSERVAÇÕES'],
      ['Conta Corrente', 'Banco do Brasil', 5000, 'Uso diário'],
      ['Poupança', 'Nubank', 10000, 'Reserva emergência'],
      ['CDB Liquidez Diária', 'Inter', 15000, 'Acesso rápido'],
      ['Tesouro Selic', 'Tesouro Direto', 8000, 'Baixo risco'],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', ''],
      ['', '', '', '']
    ];
    const wsReserva = XLSX.utils.aoa_to_sheet(reserva);
    wsReserva['!cols'] = [
      { width: 25 }, { width: 25 }, { width: 15 }, { width: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsReserva, 'Reserva');
    
    // ABA INSTRUÇÕES
    const instrucoes = [
      ['FATOS DA BOLSA - MODELO DE ANÁLISE DE CARTEIRA'],
      [''],
      ['INSTRUÇÕES DE PREENCHIMENTO:'],
      [''],
      ['1. PREENCHA APENAS OS CAMPOS INDICADOS:'],
      ['   • Ações: ATIVO, QUANTIDADE, PREÇO MÉDIO'],
      ['   • FIIs: ATIVO, QUANTIDADE, PREÇO MÉDIO'],
      ['   • Exterior: ATIVO, QUANTIDADE, PREÇO MÉDIO (USD)'],
      ['   • Renda Fixa: PRODUTO, VALOR INVESTIDO, VENCIMENTO'],
      ['   • Cripto: CRIPTOMOEDA, QUANTIDADE, PREÇO MÉDIO'],
      ['   • Reserva: ONDE ESTÁ, VALOR'],
      [''],
      ['2. NÃO PREENCHA campos como:'],
      ['   • Cotação atual, Valor atual, Rentabilidade'],
      ['   • % da carteira (calculado automaticamente)'],
      [''],
      ['3. FORMATOS:'],
      ['   • Use códigos oficiais: PETR4, VALE3, HGLG11'],
      ['   • Números com ponto: 25.50 (não 25,50)'],
      ['   • Datas: DD/MM/AAAA'],
      [''],
      ['4. O sistema calculará automaticamente:'],
      ['   • Cotações atuais via API'],
      ['   • Valores atuais da carteira'],
      ['   • Rentabilidades e percentuais'],
      ['   • Distribuição da carteira'],
      [''],
      ['Dúvidas? Entre em contato conosco!']
    ];
    const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
    wsInstrucoes['!cols'] = [{ width: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'INSTRUÇÕES');

    // Gerar o buffer do Excel
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    console.log('Modelo Excel gerado com sucesso');

    // Retornar como download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Modelo-Carteira-Completo.xlsx"'
      }
    });

  } catch (error) {
    console.error('Erro ao gerar modelo:', error);
    return NextResponse.json({
      error: 'Erro ao gerar modelo Excel',
      details: error.message
    }, { status: 500 });
  }
}