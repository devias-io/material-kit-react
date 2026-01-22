// src/paths.ts
export const paths = {
  home: '/',
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    resetPassword: '/auth/reset-password'
  },
  dashboard: {
    // 🆕 NOVO: Relatório Semanal (primeiro item do menu)
    relatorioSemanal: '/dashboard/relatorio-semanal',
    
    overview: '/dashboard/overview',
    account: '/dashboard/account',
    customers: '/dashboard/customers',
    internacional: '/dashboard/internacional',
    recursosExclusivos: '/dashboard/recursos-exclusivos',
    integrations: '/dashboard/integrations',
    settings: '/dashboard/settings',
    rentabilidades: '/dashboard/rentabilidades',
    cfRendaTurbinada: '/dashboard/cf-renda-turbinada',
    cfRendaTurbinadaAulas: '/dashboard/cf-renda-turbinada/aulas',
    cfRendaTurbinadaBastidores: '/dashboard/cf-renda-turbinada/bastidores-da-bolsa',
    cfRendaTurbinadaCarteira: '/dashboard/cf-renda-turbinada/carteira-recomendada',
    cfRendaTurbinadaTurma2: '/dashboard/cf-renda-turbinada-turma-2',
    cfRendaTurbinadaTurma2Aulas: '/dashboard/cf-renda-turbinada-turma-2/aulas',
    cfRendaTurbinadaTurma2Bastidores: '/dashboard/cf-renda-turbinada-turma-2/bastidores-da-bolsa',
    cfRendaTurbinadaTurma2Carteira: '/dashboard/cf-renda-turbinada/carteira-recomendada',
    cfRendaTurbinadaTurma3: '/dashboard/cf-renda-turbinada-turma-3',
    cfRendaTurbinadaTurma3Aulas: '/dashboard/cf-renda-turbinada-turma-3/aulas',
    cfRendaTurbinadaTurma3Bastidores: '/dashboard/cf-renda-turbinada-turma-3/bastidores-da-bolsa',
    cfRendaTurbinadaTurma3Carteira: '/dashboard/cf-renda-turbinada/carteira-recomendada',
    
    // 🛡️ ROTAS ADMINISTRATIVAS
    admin: '/dashboard/admin',
    adminUsuarios: '/dashboard/admin/usuarios',
    adminRenovacoes: '/dashboard/admin/renovacoes',
    adminIntegracoesPlatformas: '/dashboard/admin/integracoes',
    adminEmpresas: '/dashboard/gerenciamento',
    adminProventos: '/dashboard/central-proventos',
    adminRelatorios: '/dashboard/central-relatorios',
    adminRelatorioSemanal: '/dashboard/admin/relatorio-semanal',
    adminMigracaoVip: '/dashboard/admin/migracao-vip',
    // 🆕 NOVO: Análises Trimestrais
    adminAnalisesTrimesestrais: '/dashboard/admin/analises-trimesestrais',
    // 🆕 NOVO: Análises Técnicas
    adminAnaliseTecnica: '/dashboard/admin/analise-tecnica',
    // 🆕 NOVO: Central de Dúvidas Admin
    adminCentralDuvidas: '/dashboard/admin/central-duvidas',
    // 🆕 NOVO: Analisar Carteiras (substitui Logs do Sistema)
    adminCarteiras: '/dashboard/admin/carteiras',
    adminIntegracoes: '/dashboard/central-agenda',
    adminSettings: '/dashboard/admin/settings',
    adminPlans: '/dashboard/admin/plans',
    adminProventosSync: '/admin/proventos/sincronizacao',
    adminProventosListagem: '/admin/proventos/listagem',
  },
  errors: {
    notFound: '/errors/not-found'
  },
} as const;

// Export default também para compatibilidade
export default paths;

// Export tipo para TypeScript
export type Paths = typeof paths;
