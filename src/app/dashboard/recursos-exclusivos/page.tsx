'use client';

import React, { useMemo } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import { useUser } from '@/hooks/use-user';

interface Recurso {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
}

const RECURSOS: Recurso[] = [
  {
    key: 'recursos-dicas',
    title: 'Dicas de Investimentos',
    description: 'Estratégias e insights exclusivos para maximizar seus retornos no mercado financeiro',
    href: '/dashboard/recursos-exclusivos/dicas-de-investimentos',
    icon: '💡',
    badge: 'NOVO'
  },
  {
    key: 'recursos-analise',
    title: 'Análise de Carteira',
    description: 'Relatórios detalhados e análises personalizadas da sua carteira de investimentos',
    href: '/dashboard/recursos-exclusivos/analise-de-carteira',
    icon: '📊',
    badge: 'NOVO'
  },
  {
    key: 'recursos-reserva',
    title: 'Reserva de Emergência',
    description: 'Guia completo com as melhores opções de investimento para sua reserva de emergência',
    href: '/dashboard/recursos-exclusivos/reserva-emergencia',
    icon: '🏦'
  },
  {
    key: 'recursos-imposto',
    title: 'Imposto de Renda',
    description: 'Ferramentas, calculadoras e guias completos para declaração do IR com investimentos',
    href: '/dashboard/recursos-exclusivos/imposto-de-renda',
    icon: '📋',
    badge: 'NOVIDADE'
  },
  {
    key: 'recursos-telegram',
    title: 'Acesso ao Telegram',
    description: 'Entre no nosso grupo exclusivo para dicas, análises e discussões sobre investimentos',
    href: '/dashboard/recursos-exclusivos/telegram',
    icon: '💬',
    badge: 'ATIVO'
  },
  {
    key: 'recursos-lives',
    title: 'Lives e Aulas',
    description: 'Biblioteca completa de vídeos educativos, webinars e aulas ao vivo gravadas',
    href: '/dashboard/recursos-exclusivos/lives-e-aulas',
    icon: '🎥'
  },
  {
    key: 'recursos-milhas',
    title: 'Milhas Aéreas',
    description: 'Estratégias e dicas para acumular milhas através de investimentos e cartões de crédito',
    href: '/dashboard/recursos-exclusivos/milhas-aereas',
    icon: '✈️'
  },
  {
    key: 'recursos-ebooks',
    title: 'Ebooks',
    description: 'Material de estudo em PDF sobre investimentos, análise fundamentalista e estratégias',
    href: '/dashboard/recursos-exclusivos/ebooks',
    icon: '📚'
  },
  {
    key: 'recursos-planilhas',
    title: 'Planilhas',
    description: 'Templates exclusivos para controle de carteira, análise de ações e planejamento financeiro',
    href: '/dashboard/recursos-exclusivos/planilhas',
    icon: '📈',
    badge: 'POPULAR'
  },
  {
    key: 'recursos-suporte',
    title: 'Suporte',
    description: 'Fale diretamente com o nosso time para tirar dúvidas e receber orientação personalizada.',
    href: '/dashboard/recursos-exclusivos/central-duvidas',
    icon: '🤝'
  }
];

export default function RecursosExclusivos(): React.JSX.Element {
  const { user } = useUser();

  const recursosFiltrados = useMemo(() => {
    if (user?.plan === 'RENDA_TURBINADA') {
      return RECURSOS.filter(recurso =>
        ['recursos-suporte', 'recursos-telegram'].includes(recurso.key)
      );
    }

    return RECURSOS;
  }, [user?.plan]);

  const handleNavigation = (href: string): void => {
    window.location.href = href;
  };

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>): void => {
    event.currentTarget.style.transform = 'translateY(-4px)';
    event.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4)';
    const title = event.currentTarget.querySelector<HTMLElement>('.card-title');
    if (title) {
      title.style.color = '#00ff41';
    }
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>): void => {
    event.currentTarget.style.transform = 'translateY(0)';
    event.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    const title = event.currentTarget.querySelector<HTMLElement>('.card-title');
    if (title) {
      title.style.color = '#ffffff';
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, href: string): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigation(href);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5', 
      padding: '24px' 
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Recursos Exclusivos
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '18px',
            margin: '0',
            maxWidth: '800px',
            lineHeight: '1.5'
          }}>
            Acesse ferramentas, conteúdos e recursos exclusivos para potencializar seus investimentos e conhecimento no mercado financeiro.
          </p>
        </div>
      </div>

      {/* Recursos Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {recursosFiltrados.map((recurso) => (
          <div
            key={recurso.key}
            onClick={() => { handleNavigation(recurso.href); }}
            style={{
              position: 'relative',
              height: '280px',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid #374151',
              background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
            }}
            tabIndex={0}
            role="button"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={(event) => { handleKeyDown(event, recurso.href); }}
          >
            {/* Badge - removido para manter o padrão original */}

            {/* Linha verde no topo */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: 'linear-gradient(90deg, rgba(0,255,65,0) 0%, rgba(0,255,65,1) 50%, rgba(0,255,65,0) 100%)',
              zIndex: 30
            }} />
            
            {/* Content */}
            <div style={{
              padding: '24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              zIndex: 20
            }}>
              {/* Ícone */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                transition: 'all 0.3s ease',
                marginBottom: '24px',
                fontSize: '36px'
              }}>
                {recurso.icon}
              </div>
              
              {/* Título principal */}
              <h3 
                className="card-title"
                style={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: '24px',
                  lineHeight: '1.2',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  transition: 'color 0.3s ease',
                  margin: '0 0 16px 0'
                }}
              >
                {recurso.title}
              </h3>
              
              {/* Descrição */}
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                lineHeight: '1.4',
                fontWeight: '400',
                maxWidth: '200px',
                margin: '0'
              }}>
                {recurso.description}
              </p>
            </div>

            {/* Elementos decorativos de fundo */}
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              opacity: 0.5,
              background: 'radial-gradient(circle, rgba(0,255,65,0.1) 0%, transparent 70%)'
            }} />
            
            <div style={{
              position: 'absolute',
              top: '-32px',
              left: '-32px',
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              opacity: 0.8,
              background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)'
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
