'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Lesson {
  title: string;
  duration: string;
  description?: string;
}

interface Module {
  title: string;
  highlight: string;
  lessons: Lesson[];
}

const modules: Module[] = [
  {
    title: 'Parte 1 – Fundamentos e Setup',
    highlight: 'Tudo o que você precisa para começar com segurança e dominar a base do mercado de opções.',
    lessons: [
      {
        title: 'Como abrir conta na corretora e acessar o Profit',
        duration: '10 min',
        description: 'Passo a passo completo para habilitar o home broker, configurar o Profit e operar sem travar.'
      },
      {
        title: 'O que são opções (call, put, vencimento, strike, exemplos práticos)',
        duration: '20 min',
        description: 'Entenda a lógica por trás das opções com exemplos reais e linguagem simples.'
      },
      {
        title: 'Fatores que influenciam no preço',
        duration: '20 min',
        description: 'Tempo, volatilidade, juros e preço do ativo explicados na prática para você precificar com confiança.'
      }
    ]
  },
  {
    title: 'Parte 2 – Operações Básicas',
    highlight: 'Estratégias essenciais para gerar renda com risco controlado.',
    lessons: [
      {
        title: 'Como vender put (coberta e descoberta, quando usar cada uma)',
        duration: '10 min',
        description: 'Escolha a estrutura correta para receber prêmios com segurança e saber quando ficar de fora.'
      },
      {
        title: 'Como vender call (coberta e descoberta)',
        duration: '10 min',
        description: 'Passo a passo para operar calls e proteger sua carteira.'
      },
      {
        title: 'Riscos: margem, assignment, liquidez, ajuste de posição',
        duration: '15 min',
        description: 'Aprenda a calcular a margem exigida, lidar com exercício e ajustar operações antes do vencimento.'
      },
      {
        title: 'Pó e exercício (estratégia do pó, exercício automático/manual)',
        duration: '10 min',
        description: 'Entenda como funciona a estratégia do pó e como agir no dia do exercício.'
      }
    ]
  },
  {
    title: 'Parte 3 – Estratégia e Análise',
    highlight: 'Combine leitura de mercado com estruturas para turbinar a renda mensal.',
    lessons: [
      {
        title: 'Análise técnica básica (suporte, resistência, candles de reversão)',
        duration: '20 min',
        description: 'Identifique zonas de oportunidade e pontos de saída com clareza.'
      },
      {
        title: 'Travas com opções',
        duration: '15 min',
        description: 'Como montar travas de alta e baixa para proteger lucro e reduzir risco.'
      },
      {
        title: '4 estruturas avançadas',
        duration: '15 min',
        description: 'Estratégias selecionadas para cenários específicos com exemplos reais.'
      }
    ]
  },
  {
    title: 'Parte 4 – Execução e Diferencial',
    highlight: 'Transforme conhecimento em resultado seguindo o plano sem desviar do método.',
    lessons: [
      {
        title: 'Como seguir todas as recomendações (disciplina, gestão de risco, carteira mensal)',
        duration: '15 min',
        description: 'Organize sua rotina semanal, ajuste tamanho de posição e mantenha a consistência.'
      },
      {
        title: 'Como usar IA para analisar opções',
        duration: '10 min',
        description: 'Ferramentas de inteligência artificial para validar cenários e acelerar decisões.'
      }
    ]
  }
];

export default function CfRendaTurbinadaAulasPage(): React.JSX.Element {
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
            Aulas do CF Renda Turbinada
          </h1>
          <p
            style={{
              color: '#64748b',
              fontSize: '18px',
              margin: 0,
              maxWidth: '780px',
              lineHeight: 1.6
            }}
          >
            Aulas em vídeo com conteúdo escrito também. Use este roteiro como checklist para acompanhar o plano, revisar conceitos
            e executar cada etapa com confiança.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto 48px' }}>
        {modules.map((module) => (
          <div
            key={module.title}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {module.title}
              </span>
              <p style={{ margin: 0, color: '#1e293b', fontSize: '18px', lineHeight: 1.6 }}>{module.highlight}</p>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.title}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{lesson.title}</h3>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {lesson.duration}
                    </span>
                  </div>
                  {lesson.description && (
                    <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>{lesson.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 700 }}>Próximos passos</h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '16px', lineHeight: 1.6 }}>
          Após assistir às aulas, acesse a Carteira Recomendada para acompanhar as operações sugeridas e configure alertas no Profit
          para executar os movimentos com disciplina. Se pintar qualquer dúvida, marque os minutos da aula e envie para o suporte.
        </p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/cf-renda-turbinada/carteira-recomendada')}
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            border: 'none',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '14px',
            padding: '12px 20px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          Ver Carteira Recomendada →
        </button>
      </div>
    </div>
  );
}
