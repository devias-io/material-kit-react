'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface NavigationCard {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
}

const navigationCards: NavigationCard[] = [
  {
    title: 'Aulas',
    description: 'Domine as estratégias do CF Renda Turbinada - Turma 2 com vídeos e materiais escritos completos.',
    href: '/dashboard/cf-renda-turbinada-turma-2/aulas',
    icon: '🎥'
  },
  {
    title: 'Bastidores da Bolsa',
    description: 'Entre nos bastidores das aulas com materiais complementares, anexos e atualizações exclusivas.',
    href: '/dashboard/cf-renda-turbinada-turma-2/bastidores-da-bolsa',
    icon: '🗂️'
  },
  {
    title: 'Carteira Recomendada',
    description: 'Acompanhe as operações sugeridas e o plano mensal para gerar renda com consistência.',
    href: '/dashboard/cf-renda-turbinada-turma-2/carteira-recomendada',
    icon: '📊',
    badge: 'LIBERADO'
  }
];

const cardBaseStyles: React.CSSProperties = {
  position: 'relative',
  height: '280px',
  borderRadius: '12px',
  overflow: 'hidden',
  cursor: 'pointer',
  border: '1px solid #374151',
  background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease',
  transform: 'translateY(0)'
};

const cardHoverStyles: React.CSSProperties = {
  transform: 'translateY(-4px)',
  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)'
};

export default function CfRendaTurbinadaPage(): React.JSX.Element {
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    Object.assign(event.currentTarget.style, cardHoverStyles);
    const titleElement = event.currentTarget.querySelector('.card-title') as HTMLElement | null;
    if (titleElement) {
      titleElement.style.color = '#00ff41';
    }
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    Object.assign(event.currentTarget.style, cardBaseStyles, { transform: 'translateY(0)' });
    const titleElement = event.currentTarget.querySelector('.card-title') as HTMLElement | null;
    if (titleElement) {
      titleElement.style.color = '#ffffff';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '24px'
      }}
    >
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
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
            ← Voltar para o Dashboard
          </button>

          <div>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#1e293b',
                margin: '0 0 8px 0'
              }}
            >
              CF Renda Turbinada - Turma 2
            </h1>
            <p
              style={{
                color: '#64748b',
                fontSize: '18px',
                margin: 0,
                maxWidth: '760px',
                lineHeight: 1.5
              }}
            >
              Acesso exclusivo Renda Turbinada. Área destinada às nossas aulas.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}
      >
        {navigationCards.map((card) => (
          <div
            key={card.title}
            onClick={() => handleNavigation(card.href)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ ...cardBaseStyles }}
          >
            {card.badge && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#000'
                }}
              >
                {card.badge}
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, rgba(0,255,65,0) 0%, rgba(0,255,65,1) 50%, rgba(0,255,65,0) 100%)',
                zIndex: 30
              }}
            />

            <div
              style={{
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 20
              }}
            >
              <div
                style={{
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
                }}
              >
                {card.icon}
              </div>

              <h3
                className="card-title"
                style={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: '26px',
                  lineHeight: 1.2,
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  transition: 'color 0.3s ease',
                  margin: 0
                }}
              >
                {card.title}
              </h3>

              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  fontWeight: 400,
                  maxWidth: '240px',
                  margin: 0
                }}
              >
                {card.description}
              </p>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                opacity: 0.5,
                background: 'radial-gradient(circle, rgba(0,255,65,0.1) 0%, transparent 70%)'
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: '-32px',
                left: '-32px',
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                opacity: 0.8,
                background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
