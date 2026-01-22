'use client';

import { useState, useEffect, useMemo } from 'react';

import { useAuthAccess } from '@/hooks/use-auth-access';

interface AdminCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  status: 'active' | 'development';
  permission: string;
  isNew?: boolean;
}

const ADMIN_CARDS: AdminCard[] = [
  {
    title: 'Gestão de Usuários',
    description: 'Administre contas de usuários, permissões e níveis de acesso ao sistema.',
    icon: '👥',
    href: '/dashboard/admin/usuarios',
    status: 'active',
    permission: 'admin-usuarios'
  },
  {
    title: 'Instagram Close Friends',
    description: 'Gerencie cadastros de Instagram dos usuários para conteúdos exclusivos do Close Friends.',
    icon: '📱',
    href: '/dashboard/admin/instagram-cadastros',
    status: 'active',
    permission: 'admin-instagram'
  },
  {
    title: 'Integrações',
    description: 'Central de gerenciamento das integrações com APIs externas e sistemas terceiros.',
    icon: '🔗',
    href: '/dashboard/admin/integracoes',
    status: 'active',
    permission: 'admin-integracoes'
  },
  {
    title: 'Renovações',
    description: 'Controle e monitore renovações de assinaturas, vencimentos e status de pagamentos.',
    icon: '🔄',
    href: '/dashboard/admin/renovacoes',
    status: 'active',
    permission: 'admin-renovacoes'
  },
  {
    title: 'Migração VIP',
    description: 'Administre produtos e regras de migração para o plano VIP.',
    icon: '🛡️',
    href: '/dashboard/admin/migracao-vip',
    status: 'active',
    permission: 'admin-migracao-vip'
  },
  {
    title: 'Gestão de Empresas',
    description: 'Gerencie cadastro de empresas listadas na bolsa, setores e informações corporativas.',
    icon: '🏭',
    href: '/dashboard/gerenciamento',
    status: 'active',
    permission: 'admin-empresas'
  },
  {
    title: 'Central de Proventos',
    description: 'Gerencie dividendos, JCP e outros proventos das empresas listadas na bolsa.',
    icon: '💰',
    href: '/dashboard/central-proventos',
    status: 'active',
    permission: 'admin-proventos'
  },
  {
    title: 'Gestão de Relatórios',
    description: 'Centralize publicações, relatórios e materiais estratégicos da plataforma.',
    icon: '📑',
    href: '/dashboard/central-relatorios',
    status: 'active',
    permission: 'admin-relatorios'
  },
  {
    title: 'Envio de Notificações',
    description: 'Dispare comunicados personalizados para planos específicos da base.',
    icon: '📣',
    href: '/dashboard/admin/notificacoes',
    status: 'active',
    permission: 'admin'
  },
  {
    title: 'Relatório Semanal',
    description: 'Produza e publique o relatório semanal com destaques e insights do mercado.',
    icon: '🗞️',
    href: '/dashboard/admin/relatorio-semanal',
    status: 'active',
    permission: 'admin-relatorio-semanal'
  },
  {
    title: 'Análises Trimestrais',
    description: 'Gerencie as análises trimestrais com dados financeiros e comentários estratégicos.',
    icon: '📆',
    href: '/dashboard/admin/analises-trimesestrais',
    status: 'active',
    permission: 'admin-analises-trimesestrais'
  },
  {
    title: 'Análises Técnicas',
    description: 'Cadastre e organize estudos técnicos, gráficos e sinais operacionais.',
    icon: '📈',
    href: '/dashboard/admin/analise-tecnica',
    status: 'active',
    permission: 'admin-analise-tecnica'
  },
  {
    title: 'Agenda Corporativa',
    description: 'Insira informações, notícias e eventos importantes sobre os ativos.',
    icon: '📅',
    href: '/dashboard/central-agenda',
    status: 'active',
    permission: 'admin-integracoes'
  },
  {
    title: 'Analisar Carteiras',
    description: 'Analise e monitore as carteiras de investimentos dos usuários com ferramentas avançadas.',
    icon: '🧾',
    href: '/dashboard/admin/carteiras',
    status: 'active',
    permission: 'admin-carteiras'
  },
  {
    title: 'Central de Dúvidas',
    description: 'Gerencie os conteúdos da base de conhecimento e acompanhe as dúvidas recebidas.',
    icon: '❓',
    href: '/dashboard/admin/central-duvidas',
    status: 'active',
    permission: 'admin-central-duvidas'
  }
];

export default function AdminDashboard() {
  const [notification, setNotification] = useState('');
  const { loading: isAccessLoading, hasAccessSync } = useAuthAccess();

  const visibleAdminCards = useMemo(() => {
    if (isAccessLoading) {
      return ADMIN_CARDS;
    }

    return ADMIN_CARDS.filter(card => hasAccessSync(card.permission));
  }, [isAccessLoading, hasAccessSync]);

  const navigateTo = (url: string) => {
    if (url.startsWith('/')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
    showNotification(`Acessando ${getPageName(url)}`);
  };

  const getPageName = (url: string) => {
    if (url.includes('usuarios')) return 'Gestão de Usuários';
    if (url.includes('instagram-cadastros')) return 'Instagram Close Friends';
    if (url.includes('integracoes')) return 'Integrações';
    if (url.includes('renovacoes')) return 'Renovações';
    if (url.includes('gerenciamento') || url.includes('empresa')) return 'Gestão de Empresas';
    if (url.includes('central-proventos')) return 'Central de Proventos';
    if (url.includes('central-relatorios')) return 'Gestão de Relatórios';
    if (url.includes('relatorio-semanal')) return 'Relatório Semanal';
    if (url.includes('analises-trimesestrais')) return 'Análises Trimestrais';
    if (url.includes('analise-tecnica')) return 'Análises Técnicas';
    if (url.includes('central-agenda')) return 'Agenda Corporativa';
    if (url.includes('carteiras')) return 'Analisar Carteiras';
    if (url.includes('central-duvidas')) return 'Central de Dúvidas';
    return 'página solicitada';
  };

  const showComingSoon = (feature: string) => {
    showNotification(`${feature} - Em breve!`);
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const cards = document.querySelectorAll('.admin-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          (card as HTMLElement).style.opacity = '1';
          (card as HTMLElement).style.transform = 'translateY(0)';
        }, index * 100);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: '24px'
    },
    wrapper: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '48px',
      textAlign: 'center' as const
    },
    backButton: {
      background: 'none',
      border: 'none',
      color: '#64748b',
      fontWeight: 600,
      cursor: 'pointer',
      padding: '8px 16px',
      borderRadius: '8px',
      marginBottom: '24px',
      transition: 'all 0.3s ease',
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    title: {
      fontSize: '3rem',
      fontWeight: 800,
      color: '#1e293b',
      margin: '0 0 12px 0',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.02em'
    },
    subtitle: {
      fontSize: '1.125rem',
      color: '#64748b',
      fontWeight: 400,
      margin: 0
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '32px',
      marginBottom: '48px'
    },
    card: {
      position: 'relative' as const,
      height: '300px',
      borderRadius: '16px',
      overflow: 'hidden',
      cursor: 'pointer',
      background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      border: '1px solid #333333',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 0,
      transform: 'translateY(30px)'
    },
    cardTopLine: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '3px',
      background: 'linear-gradient(90deg, transparent 0%, #00ff41 50%, transparent 100%)'
    },
    cardContent: {
      padding: '32px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center' as const,
      position: 'relative' as const,
      zIndex: 2
    },
    cardIcon: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '36px',
      marginBottom: '24px',
      transition: 'all 0.3s ease'
    },
    cardTitle: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#ffffff',
      margin: '0 0 16px 0',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.02em',
      transition: 'color 0.3s ease',
      lineHeight: 1.2
    },
    cardDescription: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '0.9rem',
      lineHeight: 1.4,
      fontWeight: 400,
      maxWidth: '280px',
      marginBottom: '20px'
    },
    badge: {
      position: 'absolute' as const,
      top: '16px',
      right: '16px',
      background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
      borderRadius: '20px',
      padding: '6px 12px',
      zIndex: 3,
      boxShadow: '0 4px 12px rgba(0, 255, 65, 0.4)'
    },
    badgeText: {
      color: '#000000',
      fontWeight: 700,
      fontSize: '0.7rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em'
    },
    statusBadge: {
      position: 'absolute' as const,
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em'
    },
    statusActive: {
      background: 'rgba(0, 255, 65, 0.2)',
      color: '#00ff41',
      border: '1px solid rgba(0, 255, 65, 0.3)'
    },
    statusDevelopment: {
      background: 'rgba(255, 193, 7, 0.2)',
      color: '#ffc107',
      border: '1px solid rgba(255, 193, 7, 0.3)'
    },
    decorativeElement1: {
      position: 'absolute' as const,
      bottom: '-20px',
      right: '-20px',
      width: '80px',
      height: '80px',
      background: 'radial-gradient(circle, rgba(0,255,65,0.1) 0%, transparent 70%)',
      borderRadius: '50%',
      opacity: 0.5
    },
    decorativeElement2: {
      position: 'absolute' as const,
      top: '-30px',
      left: '-30px',
      width: '100px',
      height: '100px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',
      borderRadius: '50%',
      opacity: 0.8
    },

    footer: {
      textAlign: 'center' as const,
      marginTop: '48px',
      color: '#94a3b8',
      fontSize: '0.9rem'
    },
    notification: {
      position: 'fixed' as const,
      top: '24px',
      right: '24px',
      background: '#ffffff',
      color: '#1e293b',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e2e8f0',
      zIndex: 1000,
      transform: notification ? 'translateX(0)' : 'translateX(400px)',
      transition: 'transform 0.3s ease',
      fontSize: '0.9rem',
      fontWeight: 500
    }
  };

  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const title = card.querySelector('.card-title') as HTMLElement;
    const icon = card.querySelector('.card-icon') as HTMLElement;
    
    card.style.transform = 'translateY(-8px)';
    card.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4)';
    card.style.border = '1px solid #444444';
    
    if (title) title.style.color = '#00ff41';
    if (icon) {
      icon.style.backgroundColor = 'rgba(0, 255, 65, 0.1)';
      icon.style.border = '1px solid rgba(0, 255, 65, 0.3)';
    }
  };

  const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const title = card.querySelector('.card-title') as HTMLElement;
    const icon = card.querySelector('.card-icon') as HTMLElement;
    
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    card.style.border = '1px solid #333333';
    
    if (title) title.style.color = '#ffffff';
    if (icon) {
      icon.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      icon.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    }
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 65, 0.4)';
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 255, 65, 0.3)';
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => window.location.href = '/dashboard'}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ← Dashboard
          </button>
          <h1 style={styles.title}>Dashboard Administrativo</h1>
          <p style={styles.subtitle}>Centro de Gerenciamento - Fatos da Bolsa</p>
        </div>

        <div style={styles.grid}>
          {visibleAdminCards.length === 0 && !isAccessLoading && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px',
                borderRadius: '16px',
                background: 'rgba(0, 0, 0, 0.05)',
                border: '1px dashed rgba(15, 23, 42, 0.2)',
                textAlign: 'center',
                color: '#475569',
                fontWeight: 500
              }}
            >
              Você não possui permissões administrativas para acessar estas ferramentas.
            </div>
          )}
          {visibleAdminCards.map((card, index) => (
            <div
              key={index}
              className="admin-card"
              style={styles.card}
              onClick={() => navigateTo(card.href)}
              onMouseEnter={handleCardHover}
              onMouseLeave={handleCardLeave}
            >
              {/* Badge "NOVO" se aplicável */}
              {card.isNew && (
                <div style={styles.badge}>
                  <span style={styles.badgeText}>🚀 NOVO</span>
                </div>
              )}

              {/* Linha verde no topo */}
              <div style={styles.cardTopLine} />
              
              {/* Content */}
              <div style={styles.cardContent}>
                {/* Ícone */}
                <div className="card-icon" style={styles.cardIcon}>
                  {card.icon}
                </div>
                
                {/* Título */}
                <h3 className="card-title" style={styles.cardTitle}>
                  {card.title}
                </h3>
                
                {/* Descrição */}
                <p style={styles.cardDescription}>
                  {card.description}
                </p>

                {/* Status Badge */}
                <div style={{
                  ...styles.statusBadge,
                  ...(card.status === 'active' ? styles.statusActive : styles.statusDevelopment)
                }}>
                  {card.status === 'active' ? 'Ativo' : 'Desenvolvimento'}
                </div>
              </div>

              {/* Elementos decorativos */}
              <div style={styles.decorativeElement1} />
              <div style={styles.decorativeElement2} />
            </div>
          ))}
        </div>



        <div style={styles.footer}>
          <p>© 2025 Fatos da Bolsa - Dashboard Administrativo</p>
        </div>
      </div>

      {notification && (
        <div style={styles.notification}>
          {notification}
        </div>
      )}
    </div>
  );
}
