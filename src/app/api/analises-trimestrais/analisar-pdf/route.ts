import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Prompt para análises trimestrais
const PROMPT_ANALISE_TRIMESTRAL = `
Você é um analista financeiro especialista em análise fundamentalista de empresas brasileiras.

Analise o texto do relatório trimestral fornecido e retorne APENAS um JSON válido seguindo a estrutura abaixo. Capture **todas** as métricas financeiras e operacionais relevantes encontradas, incluindo números, margens, indicadores de produtividade, eficiência e alavancagem.

{
  "empresa": "Nome da empresa",
  "ticker": "Código da ação (ex: VALE3)",
  "trimestre": "Período (ex: 3T24)",
  "dataReferencia": "Data de referência",

  "metricas": [
    {
      "raw_label": "Rótulo exatamente como encontrado no PDF",
      "normalized_label": "Rótulo padronizado (ex: Receita Líquida)",
      "slug": "versão em kebab-case do normalized_label ou raw_label",
      "value": "valor textual com contexto (ex: R$ 1,25 bi)",
      "unit": "unidade padronizada (ex: R$ bi, %, p.p., toneladas)",
      "delta_value": "valor da variação quando existir (número ou string)",
      "delta_unit": "unidade da variação (%, p.p., etc)",
      "delta_basis": "base da variação (yoy, qoq, pp, abs)",
      "value_num": "valor numérico puro após conversões (usar number, não string)",
      "parse_confidence": "high | medium | low",
      "evidence": "trecho curto do PDF ou explicação da métrica"
    }
  ],
  "metricas_map": {
    "slug": {
      "raw_label": "...",
      "normalized_label": "...",
      "slug": "...",
      "value": "...",
      "unit": "...",
      "delta_value": "...",
      "delta_unit": "...",
      "delta_basis": "...",
      "value_num": "...",
      "parse_confidence": "high | medium | low",
      "evidence": "..."
    }
  },

  "relatorioGerado": {
    "titulo": "Título profissional da análise",
    "resumoExecutivo": "Resumo de 2-3 parágrafos sobre os principais resultados",
    "destaques": [
      "Lista de 4-6 pontos positivos principais"
    ],
    "pontosAtencao": [
      "Lista de 4-6 pontos de atenção ou riscos"
    ],
    "conclusao": "Conclusão detalhada em 3-4 parágrafos sobre a situação da empresa, perspectivas e posicionamento competitivo",
    "recomendacao": "COMPRA" | "MANTER" | "VENDA",
    "precoAlvo": número (preço alvo em R$)
  }
}

REGRAS DE EXTRAÇÃO E CONVERSÃO:
- Converta números formatados no padrão PT-BR para números puros: vírgula como decimal, ponto como separador de milhar.
- Interprete sufixos: "mi" = milhões (multiplique por 1.000.000), "bi" = bilhões (multiplique por 1.000.000.000), "mil" = mil (multiplique por 1.000). Aplique o mesmo raciocínio para unidades em inglês quando aparecerem (million, billion, thousand).
- Se o valor vier com unidade monetária (R$, US$) e sufixo, aplique os multiplicadores mantendo o valor final em value_num.
- Remova ruídos do texto (asteriscos, notas de rodapé, símbolos irrelevantes) antes de calcular value_num, mas preserve-os em evidence quando forem úteis para contexto.
- Sempre gere slug em kebab-case consistente.
- Quando houver mais de uma variação (YoY, QoQ, p.p.), registre cada uma separadamente se possível.
- Preserve evidências citando o trecho ou número bruto do PDF utilizado para gerar cada métrica.
- Inclua métricas específicas do setor (produção, reservas, NIM, inadimplência, consumo, etc.) sempre que aparecerem.
- parse_confidence deve refletir a confiança na interpretação numérica (high, medium, low).
- Se não encontrar alguma informação, use null explicitamente.

Texto do relatório:
`;

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Iniciando análise com OpenAI...');
    
    const { textoPDF } = await request.json();
    
    if (!textoPDF) {
      return NextResponse.json(
        { error: 'Texto do PDF é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Chave da OpenAI não configurada');
      return NextResponse.json(
        { error: 'Serviço de IA temporariamente indisponível' },
        { status: 500 }
      );
    }
    
    console.log('📊 Enviando texto para OpenAI...');
    console.log(`📄 Tamanho do texto: ${textoPDF.length} caracteres`);
    
    // Truncar texto se muito grande (OpenAI tem limite de tokens)
    let textoParaAnalise = textoPDF;
    if (textoPDF.length > 15000) {
      console.log('✂️ Truncando texto devido ao tamanho...');
      textoParaAnalise = textoPDF.substring(0, 15000) + "\n\n[TEXTO TRUNCADO DEVIDO AO TAMANHO]";
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um analista financeiro especialista em análise fundamentalista. Retorne APENAS um JSON válido, sem comentários adicionais."
        },
        {
          role: "user",
          content: PROMPT_ANALISE_TRIMESTRAL + textoParaAnalise
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const respostaIA = completion.choices[0].message.content;
    console.log('✅ Resposta recebida da OpenAI');
    
    if (!respostaIA) {
      throw new Error('Resposta vazia da OpenAI');
    }

    let analiseJSON;
    try {
      analiseJSON = JSON.parse(respostaIA);
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON da OpenAI:', parseError);
      throw new Error('Resposta da IA em formato inválido');
    }

    console.log('📋 Análise parseada com sucesso');

    const metricasListRaw = Array.isArray(analiseJSON.metricas)
      ? analiseJSON.metricas
      : Array.isArray(analiseJSON.metricasExtraidas)
        ? analiseJSON.metricasExtraidas
        : [];

    const metricasList = metricasListRaw
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any, index: number) => {
        const rawLabel = typeof item.raw_label === 'string' && item.raw_label.trim()
          ? item.raw_label.trim()
          : typeof item.label === 'string' && item.label.trim()
            ? item.label.trim()
            : `Métrica ${index + 1}`;

        const normalizedLabel = typeof item.normalized_label === 'string' && item.normalized_label.trim()
          ? item.normalized_label.trim()
          : rawLabel;

        const baseSlug = typeof item.slug === 'string' && item.slug.trim()
          ? item.slug.trim()
          : normalizedLabel
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || `metrica-${index + 1}`;

        const parseConfidenceRaw = typeof item.parse_confidence === 'string'
          ? item.parse_confidence
          : typeof item.parseConfidence === 'string'
            ? item.parseConfidence
            : undefined;

        const normalizedConfidence = (parseConfidenceRaw ?? 'medium').toString().trim().toLowerCase();
        const parseConfidence = ['high', 'medium', 'low'].includes(normalizedConfidence)
          ? normalizedConfidence
          : 'medium';

        let valueNum = typeof item.value_num === 'number'
          ? item.value_num
          : typeof item.valueNum === 'number'
            ? item.valueNum
            : null;

        if (valueNum === null && typeof item.value_num === 'string') {
          const parsed = Number(item.value_num.toString().replace(/[^0-9,.-]/g, '').replace(/,(?=\d{3}(\D|$))/g, '').replace(/,/g, '.'));
          valueNum = Number.isFinite(parsed) ? parsed : null;
        }

        return {
          raw_label: rawLabel,
          normalized_label: normalizedLabel,
          slug: baseSlug,
          value: item.value ?? item.formattedValue ?? null,
          unit: item.unit ?? null,
          delta_value: item.delta_value ?? item.deltaValue ?? null,
          delta_unit: item.delta_unit ?? item.deltaUnit ?? null,
          delta_basis: item.delta_basis ?? item.deltaBasis ?? null,
          value_num: valueNum,
          parse_confidence: parseConfidence,
          evidence: item.evidence ?? null
        };
      });

    const metricasMap = (analiseJSON.metricas_map && typeof analiseJSON.metricas_map === 'object')
      ? analiseJSON.metricas_map
      : metricasList.reduce((acc: Record<string, any>, item: any) => {
          if (item?.slug) {
            acc[item.slug] = item;
          }
          return acc;
        }, {} as Record<string, any>);

    const resultado = {
      empresa: analiseJSON.empresa,
      ticker: analiseJSON.ticker,
      trimestre: analiseJSON.trimestre,
      dataReferencia: analiseJSON.dataReferencia,
      dadosFinanceiros: analiseJSON.dadosFinanceiros,
      metricas: metricasList,
      metricasMap,
      relatorioGerado: analiseJSON.relatorioGerado,
      contextoMercado: `Análise gerada via OpenAI GPT-4o em ${new Date().toLocaleString('pt-BR')}`,
      outlook: "Baseado em dados do relatório trimestral processado",
      success: true
    };

    console.log('🎯 Análise OpenAI finalizada com sucesso');
    return NextResponse.json(resultado, { status: 200 });

  } catch (error) {
    console.error('❌ Erro na análise OpenAI:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Erro de autenticação com IA';
        statusCode = 401;
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        errorMessage = 'Limite de uso da IA atingido. Tente novamente em alguns minutos.';
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout na análise da IA. Tente novamente.';
        statusCode = 408;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: statusCode }
    );
  }
}