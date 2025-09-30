import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { DadosExtraidosPDF, MetricExtractionItem } from '@/types/quarterly-metrics';
import {
  buildMetricCollectionsFromPDF,
  normalizeConfidenceLevel,
  normalizeDeltaBasisValue,
  normalizeNumericString,
  normalizeUnitString,
  slugifyMetric,
  stripOriginalMetric
} from '@/utils/quarterly-metrics';

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

    const sanitizeMetric = (item: any, index: number): MetricExtractionItem => {
      const rawLabelSource = typeof item.raw_label === 'string' && item.raw_label.trim()
        ? item.raw_label.trim()
        : typeof item.label === 'string' && item.label.trim()
          ? item.label.trim()
          : `Métrica ${index + 1}`;

        const normalizedLabelSource = typeof item.normalized_label === 'string' && item.normalized_label.trim()
          ? item.normalized_label.trim()
          : rawLabelSource;

        const slugCandidate = typeof item.slug === 'string' && item.slug.trim()
          ? item.slug.trim()
          : slugifyMetric(normalizedLabelSource) || slugifyMetric(rawLabelSource) || `metrica-${index + 1}`;

        let valueNum: number | null = null;
        if (typeof item.value_num === 'number' && Number.isFinite(item.value_num)) {
          valueNum = item.value_num;
        } else if (typeof item.valueNum === 'number' && Number.isFinite(item.valueNum)) {
          valueNum = item.valueNum;
        } else if (typeof item.value_num === 'string') {
          const parsed = parseFloat(normalizeNumericString(item.value_num));
          valueNum = Number.isFinite(parsed) ? parsed : null;
        }

        const unit = normalizeUnitString(item.unit ?? item.unidade ?? null);
        const deltaUnit = normalizeUnitString(item.delta_unit ?? item.deltaUnit ?? null);
        const deltaBasis = normalizeDeltaBasisValue(item.delta_basis ?? item.deltaBasis ?? null);

        return {
          raw_label: rawLabelSource,
          normalized_label: normalizedLabelSource,
          slug: slugCandidate,
          value: item.value ?? item.valorFormatado ?? item.formattedValue ?? null,
          unit: unit,
          delta_value: item.delta_value ?? item.deltaValue ?? null,
          delta_unit: deltaUnit,
          delta_basis: deltaBasis,
          value_num: valueNum,
          parse_confidence: normalizeConfidenceLevel(item.parse_confidence ?? item.parseConfidence ?? null),
          evidence: item.evidence ?? (typeof item.value === 'string' ? item.value : null)
        };
    };

    const metricasList: MetricExtractionItem[] = metricasListRaw
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any, index: number) => sanitizeMetric(item, index));

    const metricasMapEntries: Array<[string, MetricExtractionItem]> = [];
    if (analiseJSON.metricas_map && typeof analiseJSON.metricas_map === 'object') {
      Object.entries(analiseJSON.metricas_map).forEach(([slug, value], mapIndex) => {
        if (value && typeof value === 'object') {
          metricasMapEntries.push([
            slug,
            sanitizeMetric({ slug, ...value }, metricasList.length + mapIndex)
          ]);
        }
      });
    }

    metricasList.forEach(item => {
      metricasMapEntries.push([item.slug, item]);
    });

    const metricasMap: Record<string, MetricExtractionItem> = Object.fromEntries(metricasMapEntries);

    const dadosExtraidos: DadosExtraidosPDF = {
      empresa: analiseJSON.empresa,
      ticker: analiseJSON.ticker,
      trimestre: analiseJSON.trimestre,
      dataReferencia: analiseJSON.dataReferencia,
      dadosFinanceiros: analiseJSON.dadosFinanceiros,
      metricas: metricasList,
      metricasExtraidas: metricasList,
      metricasMap
    };

    const collections = buildMetricCollectionsFromPDF(dadosExtraidos);

    const normalizedMetricMap = Object.fromEntries(
      Object.entries(collections.metricMap).map(([slug, metric]) => [slug, stripOriginalMetric(metric)])
    );

    const resultado = {
      ...dadosExtraidos,
      metricasNormalizadas: collections.normalizedMetrics,
      metricasMap: normalizedMetricMap,
      relatorioGerado: analiseJSON.relatorioGerado,
      contextoMercado: `Análise gerada via OpenAI GPT-4o em ${new Date().toLocaleString('pt-BR')}`,
      outlook: 'Baseado em dados do relatório trimestral processado',
      canonicalMetrics: collections.canonicalMetrics,
      otherMetrics: collections.dynamicEntries,
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