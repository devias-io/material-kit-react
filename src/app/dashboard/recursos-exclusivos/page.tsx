'use client';

import React from 'react';

import { useAuthAccess } from '@/hooks/use-auth-access';

type Recurso = {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  permission: string;
};

export default function RecursosExclusivos() {
  const { hasContentAccess, loading } = useAuthAccess();

  const recursos = React.useMemo<Recurso[]>(
    () => [
      {
        title: 'Dicas de Investimentos',
        description: 'Estratégias e insights exclusivos para maximizar seus retornos no mercado financeiro',
        href: '/dashboard/recursos-exclusivos/dicas-de-investimentos',
        icon: '💡',
        badge: 'NOVO',
        permission: 'recursos-dicas'
      },
      {
        title: 'Análise de Carteira',
        description: 'Relatórios detalhados e análises personalizadas da sua carteira de investimentos',
        href: '/dashboard/recursos-exclusivos/analise-de-carteira',
        icon: '📊',
        badge: 'NOVO',
        permission: 'recursos-analise'
      },
      {
        title: 'Reserva de Emergência',
        description: 'Guia completo com as melhores opções de investimento para sua reserva de emergência',
        href: '/dashboard/recursos-exclusivos/reserva-emergencia',
        icon: '🏦',
        permission: 'recursos-reserva'
      },
      {
        title: 'Imposto de Renda',
        description: 'Ferramentas, calculadoras e guias completos para declaração do IR com investimentos',
        href: '/dashboard/recursos-exclusivos/imposto-de-renda',
        icon: '📋',
        badge: 'NOVIDADE',
        permission: 'recursos-imposto'
      },
      {
        title: 'Telegram e Stories',
        description: 'Entre no nosso grupo exclusivo para dicas, análises e discussões sobre investimentos',
        href: '/dashboard/recursos-exclusivos/telegram',
        icon: '💬',
        badge: 'ATIVO',
        permission: 'recursos-telegram'
      },
      {
        title: 'Lives e Aulas',
        description: 'Biblioteca completa de vídeos educativos, webinars e aulas ao vivo gravadas',
        href: '/dashboard/recursos-exclusivos/lives-e-aulas',
        icon: '🎥',
        permission: 'recursos-lives'
      },
      {
        title: 'Milhas Aéreas',
        description: 'Estratégias e dicas para acumular milhas através de investimentos e cartões de crédito',
        href: '/dashboard/recursos-exclusivos/milhas-aereas',
        icon: '✈️',
        permission: 'recursos-milhas'
      },
      {
        title: 'Ebooks',
        description: 'Material de estudo em PDF sobre investimentos, análise fundamentalista e estratégias',
        href: '/dashboard/recursos-exclusivos/ebooks',
        icon: '📚',
        permission: 'recursos-ebooks'
      },
      {
        title: 'Planilhas',
        description: 'Templates exclusivos para controle de carteira, análise de ações e planejamento financeiro',
        href: '/dashboard/recursos-exclusivos/planilhas',
        icon: '📈',
        badge: 'POPULAR',
        permission: 'recursos-planilhas'
      },
      {
        title: 'Central de Suporte',
        description: 'Fale com nosso time, abra chamados e acompanhe respostas às suas dúvidas',
        href: '/dashboard/recursos-exclusivos/central-duvidas',
        icon: '🆘',
        permission: 'recursos-suporte'
      }
    ],
    []
  );

  const recursosDisponiveis = React.useMemo(
    () => recursos.filter((recurso) => hasContentAccess(recurso.permission)),
    [hasContentAccess, recursos]
  );

  const handleNavigation = (href: string) => {
    window.location.href = href;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Carregando recursos...
        </div>
      </div>
    );
  }

  if (recursosDisponiveis.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '12px',
            }}
          >
            Nenhum recurso disponível
          </h2>
          <p style={{ color: '#64748b', lineHeight: 1.5 }}>
            No momento, não encontramos recursos liberados para o seu plano. Caso acredite que isso é um engano, fale com a nossa equipe de suporte.
          </p>
        </div>
      </div>
    );
  }

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
        {recursosDisponiveis.map((recurso, index) => (
          <div
            key={index}
            onClick={() => handleNavigation(recurso.href)}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4)';
              const title = e.currentTarget.querySelector('.card-title');
              if (title) title.style.color = '#00ff41';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              const title = e.currentTarget.querySelector('.card-title');
              if (title) title.style.color = '#ffffff';
            }}
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