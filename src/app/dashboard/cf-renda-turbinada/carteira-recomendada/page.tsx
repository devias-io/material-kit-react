'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface StepCard {
  title: string;
  description: string;
  items: string[];
}

const weeklySteps: StepCard[] = [
  {
    title: 'Segunda-feira – Preparação',
    description: 'Revise o panorama do índice, volatilidade implícita e o calendário da semana.',
    items: [
      'Checar agenda de eventos relevantes (resultados, dividendos, FED).',
      'Atualizar watchlist com ativos elegíveis e strikes preferenciais.',
      'Definir o capital disponível e a meta de prêmio para a semana.'
    ]
  },
  {
    title: 'Terça a Quinta-feira – Execução',
    description: 'Acompanhe as recomendações liberadas e ajuste o preço de entrada conforme o mercado.',
    items: [
      'Abrir posições recomendadas respeitando os limites de margem informados.',
      'Atualizar o controle de operações com preço de disparo, alvo e plano de ajuste.',
      'Configurar alertas no Profit para cada ponto de atenção (stop, ajuste, rolagem).'
    ]
  },
  {
    title: 'Sexta-feira – Revisão',
    description: 'Encerramento das operações e planejamento para o próximo ciclo.',
    items: [
      'Revisar posições abertas e decidir entre manter, ajustar ou encerrar.',
      'Registrar resultados, prêmios recebidos e lições aprendidas na semana.',
      'Enviar dúvidas com prints/timestamps das aulas para receber orientação personalizada.'
    ]
  }
];

const quickActions = [
  'Configurar alertas de margem para não ser pego de surpresa pelo corretor.',
  'Utilizar a planilha de controle (download disponível no grupo) para registrar cada operação.',
  'Rever a aula correspondente sempre que surgir uma situação não prevista.',
  'Avisar o suporte em até 30 minutos após um evento inesperado para receber plano de ação.'
];

export default function CfRendaTurbinadaCarteiraPage(): React.JSX.Element {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '24px'
      }}
    >
      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          type="button"
          onClick={() => router.push('/dashboard/cf-renda-turbinada')}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← Voltar para o plano
        </button>

        <div>
          <h1
            style={{
              fontSize: '42px',
              fontWeight: 800,
              color: '#1e293b',
              margin: '0 0 12px 0'
            }}
          >
            Carteira Recomendada
          </h1>
          <p
            style={{
              color: '#64748b',
              fontSize: '18px',
              margin: 0,
              maxWidth: '760px',
              lineHeight: 1.6
            }}
          >
            Aqui você acompanha as operações sugeridas semanalmente para gerar renda com opções. Use este painel como hub para
            a estratégia corrente, registro dos trades e próximos passos.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section
          style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Como funciona a carteira</h2>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.6 }}>
            Todo ciclo começa com a análise macro + técnica apresentada nas aulas. As recomendações ficam disponíveis nos canais
            oficiais do CF e são atualizadas sempre que houver oportunidade melhor ou necessidade de ajuste.
          </p>
          <ul style={{ margin: '12px 0 0 16px', padding: 0, fontSize: '14px', lineHeight: 1.6 }}>
            <li>Operações priorizam riscos conhecidos, com foco em geração de prêmio consistente.</li>
            <li>Você recebe aviso sempre que uma posição for aberta, ajustada ou encerrada.</li>
            <li>Atenção ao limite de contratos indicado para evitar alavancagem excessiva.</li>
          </ul>
        </section>

        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px',
            boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Rotina semanal sugerida</h2>
            <p style={{ margin: 0, color: '#475569', fontSize: '15px' }}>
              Siga este checklist para manter a disciplina e aproveitar cada operação com tranquilidade.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {weeklySteps.map((step) => (
              <div
                key={step.title}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#f8fafc'
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{step.title}</h3>
                <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>{step.description}</p>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#1f2937', fontSize: '14px', lineHeight: 1.5 }}>
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px',
            boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)'
          }}
        >
          <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Checklist rápido</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {quickActions.map((action) => (
              <div
                key={action}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  fontSize: '14px',
                  color: '#1f2937',
                  lineHeight: 1.5
                }}
              >
                {action}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Central de recomendações</h2>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.6 }}>
            As recomendações oficiais ficam no grupo fechado do CF Renda Turbinada. Sempre que uma nova operação for aberta você
            receberá:
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '15px', lineHeight: 1.6 }}>
            <li>Resumo do racional (por que estamos montando a estrutura).</li>
            <li>Ativo, vencimento, strike, prêmio alvo e plano de ajuste.</li>
            <li>Print do Profit com os pontos principais destacados.</li>
          </ul>
          <p style={{ margin: '12px 0 0 0', fontSize: '15px', lineHeight: 1.6 }}>
            Dica: mantenha um histórico das recomendações no Notion/Planilha para acompanhar a evolução da sua renda mensal e
            revisar rapidamente quando surgir um cenário parecido.
          </p>
        </section>
      </div>
    </div>
  );
}
