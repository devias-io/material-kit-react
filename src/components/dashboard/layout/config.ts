// src/components/dashboard/layout/config.ts
import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  // 🆕 RELATÓRIO SEMANAL - NOVO ITEM
  { 
    key: 'relatorio-semanal', 
    title: 'Relatório Semanal', 
    href: paths.dashboard.relatorioSemanal,
    icon: 'document-text',
    page: 'relatorio-semanal'
  },
  
  {
    key: 'integrations',
    title: 'Dividendos',
    href: paths.dashboard.integrations,
    icon: 'chart-line-up',
    page: 'dividendos'
  },
  {
    key: 'customers',
    title: 'Micro Caps',
    href: paths.dashboard.customers,
    icon: 'chart-bar',
    page: 'micro-caps'
  },
  {
    key: 'overview',
    title: 'Small Caps',
    href: paths.dashboard.overview,
    icon: 'chart-pie',
    page: 'small-caps'
  },
  {
    key: 'settings',
    title: 'Fundos Imobiliários',
    href: paths.dashboard.settings,
    icon: 'buildings',
    page: 'fundos-imobiliarios'
  },
  {
    key: 'cf-renda-turbinada',
    title: 'CF Renda Turbinada',
    href: paths.dashboard.cfRendaTurbinada,
    icon: 'star',
    page: 'cf-renda-turbinada',
    items: [
      {
        key: 'cf-renda-turbinada-aulas',
        title: 'Aulas',
        href: paths.dashboard.cfRendaTurbinadaAulas,
        icon: 'video',
        page: 'cf-renda-turbinada-aulas'
      },
      {
        key: 'cf-renda-turbinada-carteira',
        title: 'Carteira Recomendada',
        href: paths.dashboard.cfRendaTurbinadaCarteira,
        icon: 'chart-line',
        page: 'cf-renda-turbinada-carteira'
      }
    ]
  },
  {
    key: 'rentabilidades',
    title: 'Rentabilidades',
    href: paths.dashboard.rentabilidades,
    icon: 'chart-line',
    page: 'rentabilidades',
    requiresAdmin: true,
  },
  {
    key: 'internacional',
    title: 'Internacional',
    href: paths.dashboard.internacional,
    icon: 'globe',
    page: 'internacional',
    items: [
      {
        key: 'internacional-etfs',
        title: 'ETFs',
        href: paths.dashboard.internacional + '/etfs',
        icon: 'chart-bar',
        page: 'internacional-etfs'
      },
      {
        key: 'internacional-stocks',
        title: 'Stocks',
        href: paths.dashboard.internacional + '/stocks',
        icon: 'chart-line-up',
        page: 'internacional-stocks'
      },
      {
        key: 'internacional-dividendos',
        title: 'Dividendos',
        href: paths.dashboard.internacional + '/dividendos',
        icon: 'chart-pie',
        page: 'internacional-dividendos'
      },
      {
        key: 'internacional-projeto-america',
        title: 'Projeto América',
        href: paths.dashboard.internacional + '/projeto-america',
        icon: 'star',
        page: 'internacional-projeto-america'
      },
    ],
  },
  {
    key: 'recursos-exclusivos',
    title: 'Recursos Exclusivos',
    href: paths.dashboard.recursosExclusivos,
    icon: 'package',
    page: 'recursos-exclusivos',
    items: [
      {
        key: 'recursos-dicas',
        title: 'Dicas de Investimentos',
        href: paths.dashboard.recursosExclusivos + '/dicas-de-investimentos',
        icon: 'lightbulb',
        page: 'recursos-dicas'
      },
      {
        key: 'recursos-analise',
        title: 'Análise de Carteira',
        href: paths.dashboard.recursosExclusivos + '/analise-de-carteira',
        icon: 'chart-line',
        page: 'recursos-analise'
      },
      {
        key: 'recursos-ebooks',
        title: 'eBooks',
        href: paths.dashboard.recursosExclusivos + '/ebooks',
        icon: 'book',
        page: 'recursos-ebooks'
      },
      {
        key: 'recursos-imposto',
        title: 'Imposto de Renda',
        href: paths.dashboard.recursosExclusivos + '/imposto-de-renda',
        icon: 'receipt',
        page: 'recursos-imposto'
      },
      {
        key: 'recursos-lives',
        title: 'Lives e Aulas',
        href: paths.dashboard.recursosExclusivos + '/lives-e-aulas',
        icon: 'video',
        page: 'recursos-lives'
      },
      {
        key: 'recursos-milhas',
        title: 'Milhas Aéreas',
        href: paths.dashboard.recursosExclusivos + '/milhas-aereas',
        icon: 'airplane',
        page: 'recursos-milhas'
      },
      {
        key: 'recursos-planilhas',
        title: 'Planilhas',
        href: paths.dashboard.recursosExclusivos + '/planilhas',
        icon: 'table',
        page: 'recursos-planilhas'
      },
      {
        key: 'recursos-telegram',
        title: 'Stories e Telegram',
        href: paths.dashboard.recursosExclusivos + '/telegram',
        icon: 'chat',
        page: 'recursos-telegram'
      },
      {
        key: 'recursos-reserva',
        title: 'Reserva de Emergência',
        href: paths.dashboard.recursosExclusivos + '/reserva-emergencia',
        icon: 'shield',
        page: 'recursos-reserva'
      },
      // 🆕 NOVO ITEM: Suporte
      {
        key: 'recursos-suporte',
        title: 'Suporte',
        href: paths.dashboard.recursosExclusivos + '/central-duvidas',
        icon: 'support',
        page: 'recursos-suporte'
      },
    ],
  },

  // 🛡️ MENU ADMINISTRATIVO
  {
    key: 'administracao',
    title: 'Administração',
    href: paths.dashboard.admin,
    icon: 'gear',
    page: 'admin',
    items: [
      {
        key: 'admin-dashboard',
        title: 'Dashboard Admin',
        href: paths.dashboard.admin,
        icon: 'chart-pie',
        page: 'admin-dashboard'
      },
      {
        key: 'admin-usuarios',
        title: 'Gestão de Usuários',
        href: paths.dashboard.adminUsuarios,
        icon: 'users',
        page: 'admin-usuarios'
      },
      {
        key: 'admin-instagram',
        title: 'Instagram Close Friends',
        href: paths.dashboard.admin + '/instagram-cadastros',
        icon: 'instagram',
        page: 'admin-instagram'
      },
      {
        key: 'admin-integracoes-plataformas',
        title: 'Integrações',
        href: paths.dashboard.adminIntegracoesPlatformas,
        icon: 'link',
        page: 'admin-integracoes'
      },
      {
        key: 'admin-renovacoes',
        title: 'Renovações',
        href: paths.dashboard.adminRenovacoes,
        icon: 'chart-bar',
        page: 'admin-renovacoes'
      },
      {
        key: 'admin-empresas',
        title: 'Gestão de Empresas',
        href: paths.dashboard.adminEmpresas,
        icon: 'buildings',
        page: 'admin-empresas'
      },
      {
        key: 'admin-proventos',
        title: 'Central de Proventos',
        href: paths.dashboard.adminProventos,
        icon: 'chart-line-up',
        page: 'admin-proventos'
      },
      {
        key: 'admin-relatorios',
        title: 'Gestão de Relatórios',
        href: paths.dashboard.adminRelatorios,
        icon: 'chart-bar',
        page: 'admin-relatorios'
      },
      // 🆕 NOVO ITEM: Admin do Relatório Semanal
      {
        key: 'admin-relatorio-semanal',
        title: 'Relatório Semanal',
        href: paths.dashboard.admin + '/relatorio-semanal',
        icon: 'document-text',
        page: 'admin-relatorio-semanal'
      },
      // 🆕 NOVO ITEM: Análises Trimestrais
      {
        key: 'admin-analises-trimesestrais',
        title: 'Análises Trimestrais',
        href: paths.dashboard.admin + '/analises-trimesestrais',
        icon: 'chart-line', // ou 'calendar', 'article'
        page: 'admin-analises-trimesestrais'
      },
      // 🆕 NOVO ITEM: Análises Técnicas
      {
        key: 'admin-analise-tecnica',
        title: 'Análises Técnicas',
        href: paths.dashboard.adminAnaliseTecnica,
        icon: 'article',
        page: 'admin-analise-tecnica'
      },
      {
        key: 'admin-integracoes-agenda',
        title: 'Agenda Corporativa',
        href: paths.dashboard.adminIntegracoes,
        icon: 'calendar',
        page: 'admin-integracoes'
      },
      {
        key: 'admin-carteiras',
        title: 'Analisar Carteiras',
        href: paths.dashboard.adminCarteiras,
        icon: 'list',
        page: 'admin-carteiras'
      },
      // 🆕 NOVO ITEM: Central de Dúvidas Admin
      {
        key: 'admin-central-duvidas',
        title: 'Central de Dúvidas',
        href: paths.dashboard.admin + '/central-duvidas',
        icon: 'support',
        page: 'admin-central-duvidas'
      }
    ]
  },

] satisfies NavItemConfig[];