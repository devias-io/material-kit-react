'use client';

import React from 'react';

import { useAuthAccess } from '@/hooks/use-auth-access';

interface NavigationCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  permission: string;
  isNew?: boolean;
}

export default function DashboardOverview() {
  const { hasAccessSync, loading } = useAuthAccess();

  const rendaTurbinadaAccess = hasAccessSync('cf-renda-turbinada-turma-2')
    ? {
        title: 'CF Renda Turbinada - Turma 2',
        permission: 'cf-renda-turbinada-turma-2',
        href: '/dashboard/cf-renda-turbinada-turma-2',
      }
    : {
        title: 'CF Renda Turbinada',
        permission: 'cf-renda-turbinada',
        href: '/dashboard/cf-renda-turbinada',
      };

  const navigationCards: NavigationCard[] = [
    {
      title: 'Relatório Semanal',
      description: 'Resumo completo com as principais recomendações da semana',
      icon: '🗓️',
      href: '/dashboard/relatorio-semanal',
      permission: 'relatorio-semanal'
    },
    {
      title: 'Small Caps',
      description: 'Análise de ações de pequeno porte com alto potencial',
      icon: '📈',
      href: '/dashboard/overview',
      permission: 'small-caps'
    },
    {
      title: 'Micro Caps',
      description: 'Oportunidades em empresas de micro capitalização',
      icon: '📊',
      href: '/dashboard/customers',
      permission: 'micro-caps'
    },
    {
      title: 'Dividendos',
      description: 'Acompanhe os melhores pagadores de dividendos',
      icon: '💰',
      href: '/dashboard/integrations',
      permission: 'dividendos'
    },
    {
      title: 'Fundos Imobiliários',
      description: 'Carteira diversificada de FIIs com foco em renda',
      icon: '🏢',
      href: '/dashboard/settings',
      permission: 'fundos-imobiliarios'
    },
    {
      title: 'Rentabilidades',
      description: 'Performance detalhada de todas as carteiras',
      icon: '📋',
      href: '/dashboard/rentabilidades',
      permission: 'rentabilidades'
    },
    {
      title: 'Internacional',
      description: 'Mercados globais e oportunidades no exterior',
      icon: '🌍',
      href: '/dashboard/internacional',
      permission: 'internacional'
    },
    {
      title: 'Recursos Exclusivos',
      description: 'Ferramentas e análises premium para membros',
      icon: '🎁',
      href: '/dashboard/recursos-exclusivos',
      permission: 'recursos-exclusivos',
      isNew: true
    },
    {
      title: rendaTurbinadaAccess.title,
      description: 'Plano completo de opções com aulas guiadas e carteira mensal',
      icon: '⚡',
      href: rendaTurbinadaAccess.href,
      permission: rendaTurbinadaAccess.permission
    }
  ];

  const accessibleCards = navigationCards.filter(card => hasAccessSync(card.permission));

  const handleNavigation = (href: string) => {
    window.location.href = href;
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
            Dashboard
          </h1>
          <p style={{ 
            color: '#64748b', 
            fontSize: '18px',
            margin: '0'
          }}>
            Escolha sua carteira de investimentos
          </p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {accessibleCards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleNavigation(card.href)}
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
            {/* Badge "NOVO" se aplicável */}
            {card.isNew && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10
              }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#000000',
                  background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
                  boxShadow: '0 4px 12px rgba(0, 255, 65, 0.4)'
                }}>
                  NOVO
                </span>
              </div>
            )}

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
                {card.icon}
              </div>
              
              {/* Título principal */}
              <h3 
                className="card-title"
                style={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: '28px',
                  lineHeight: '1.2',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  transition: 'color 0.3s ease',
                  margin: '0 0 16px 0'
                }}
              >
                {card.title}
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
                {card.description}
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

      {!loading && accessibleCards.length === 0 && (
        <div style={{
          marginTop: '48px',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          maxWidth: '720px',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center'
        }}>
          <h3 style={{
            marginBottom: '12px',
            fontSize: '20px',
            fontWeight: '700',
            color: '#1e293b'
          }}>
            Acesso indisponível para o seu plano
          </h3>
          <p style={{
            margin: 0,
            color: '#64748b',
            fontSize: '16px'
          }}>
            Entre em contato com o suporte para conhecer planos que liberam estas carteiras.
          </p>
        </div>
      )}
    </div>
  );
}
