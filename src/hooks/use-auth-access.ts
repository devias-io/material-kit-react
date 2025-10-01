'use client';

import { useState, useEffect } from 'react';
import { useUser } from './use-user'; // Assumindo que você tem este hook

export function useAuthAccess() {
  const { user } = useUser(); // Pega usuário real do banco
  const [planInfo, setPlanInfo] = useState<{ displayName: string; pages: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlanInfo = async () => {
      try {
        console.log('🔍 Carregando permissões para usuário:', user?.email, 'Plano:', user?.plan);

        // Se não tem usuário, usar authClient original
        if (!user) {
          console.log('⚠️ Sem usuário logado, usando authClient padrão');
          const { authClient } = await import('@/lib/auth/client');
          
          if (typeof authClient.getPlanInfo === 'function') {
            const info = await authClient.getPlanInfo();
            setPlanInfo(info);
          } else {
            // Fallback
            setPlanInfo({
              displayName: 'Close Friends VIP',
              pages: ['relatorio-semanal', 'small-caps', 'micro-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades', 'internacional', 'recursos-exclusivos', 'recursos-suporte']
            });
          }
          setLoading(false);
          return;
        }

        // Importar authClient para pegar permissões base do plano
        const { authClient } = await import('@/lib/auth/client');
        
        // Simular um usuário temporário com o plano atual para o authClient
        const tempUserEmail = localStorage.getItem('user-email');
        if (tempUserEmail) {
          localStorage.setItem('user-email', tempUserEmail);
        }

        // Pegar permissões base do plano usando authClient
        let basePlanInfo = null;
        try {
          // Se o authClient funcionar, pegar as permissões base
          basePlanInfo = await authClient.getPlanInfo();
        } catch (error) {
          console.log('⚠️ AuthClient falhou, usando mapeamento interno');
        }

        // 🔥 MAPEAMENTO INTERNO ATUALIZADO - Relatório Semanal em TODOS os planos + Suporte
        const internalPlanPermissions = {
          'VIP': [
            'relatorio-semanal', // 📋 NOVO: Disponível para VIP
            'small-caps', 'micro-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
            'internacional', 'internacional-etfs', 'internacional-stocks', 'internacional-dividendos', 'internacional-projeto-america',
            'recursos-exclusivos', 'recursos-dicas', 'recursos-analise', 'recursos-ebooks',
            'recursos-imposto', 'recursos-lives', 'recursos-milhas', 'recursos-planilhas', 'recursos-telegram', 'recursos-suporte' // 🆕 NOVO: Suporte
          ],
          'LITE': [
            'relatorio-semanal', // 📋 NOVO: Disponível para LITE
            'small-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
            'internacional', 'internacional-etfs', 'internacional-stocks',
            'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram', 'recursos-suporte' // 🆕 NOVO: Suporte
          ],
          // ✅ ADICIONADO: Close Friends LITE 2.0
          'LITE_V2': [
            'relatorio-semanal', // 📋 NOVO: Disponível para LITE V2
            'small-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
            'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram', 'recursos-suporte' // 🆕 NOVO: Suporte
            // Nota: Não inclui 'internacional' (diferença do LITE original)
          ],
          'RENDA_PASSIVA': [
            'relatorio-semanal', // 📋 NOVO: Disponível para Renda Passiva
            'dividendos', 'fundos-imobiliarios', 'rentabilidades',
            'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram', 'recursos-suporte' // 🆕 NOVO: Suporte
          ],
          'FIIS': [
            'relatorio-semanal', // 📋 NOVO: Disponível para FIIs
            'fundos-imobiliarios', 'rentabilidades',
            'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-planilhas', 'recursos-telegram', 'recursos-suporte' // 🆕 NOVO: Suporte
          ],
          'AMERICA': [
            'relatorio-semanal', // 📋 NOVO: Disponível para América
            'internacional', 'internacional-etfs', 'internacional-stocks', 'internacional-dividendos', 'internacional-projeto-america',
            'recursos-exclusivos', 'recursos-dicas', 'recursos-ebooks', 'recursos-lives', 'recursos-planilhas', 'recursos-telegram', 'recursos-suporte' // 🆕 NOVO: Suporte
          ],
          'ADMIN': [
            'relatorio-semanal', // 📋 NOVO: Disponível para Admin
            'small-caps', 'micro-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades',
            'internacional', 'internacional-etfs', 'internacional-stocks', 'internacional-dividendos', 'internacional-projeto-america',
            'recursos-exclusivos', 'recursos-dicas', 'recursos-analise', 'recursos-ebooks',
            'recursos-imposto', 'recursos-lives', 'recursos-milhas', 'recursos-planilhas', 'recursos-telegram', 'recursos-suporte', // 🆕 NOVO: Suporte
            'admin', 'admin-dashboard', 'admin-usuarios', 'admin-instagram', 'admin-empresas', 'admin-proventos',
            'admin-relatorios', 'admin-relatorio-semanal', 'admin-analises-trimesestrais', 'admin-integracoes', 'admin-renovacoes', 'admin-settings', 'admin-carteiras', 'admin-central-duvidas' // 🆕 NOVO: admin-central-duvidas
          ]
        };

        // Pegar permissões base do plano
        const basePlanPages = basePlanInfo?.pages || internalPlanPermissions[user.plan] || ['relatorio-semanal', 'recursos-suporte']; // 📋 Fallback: pelo menos relatório + suporte
        
        // Pegar permissões customizadas do usuário
        const customPermissions = user.customPermissions || [];
        
        // 🔥 GARANTIR que 'relatorio-semanal' e 'recursos-suporte' estejam sempre presentes
        const guaranteedPages = ['relatorio-semanal', 'recursos-suporte'];
        
        // Combinar todas as permissões (sem duplicatas)
        const allPermissions = [...new Set([...guaranteedPages, ...basePlanPages, ...customPermissions])];
        
        console.log('📋 Permissões base do plano:', basePlanPages);
        console.log('🎯 Permissões customizadas:', customPermissions);
        console.log('✅ Permissões finais:', allPermissions);

        // Mapear nome do plano
        const planNames = {
          'VIP': 'Close Friends VIP',
          'LITE': 'Close Friends LITE', 
          'LITE_V2': 'Close Friends LITE 2.0', // ✅ ADICIONADO
          'RENDA_PASSIVA': 'Projeto Renda Passiva',
          'FIIS': 'Projeto FIIs',
          'AMERICA': 'Projeto América',
          'ADMIN': 'Administrador'
        };

        setPlanInfo({
          displayName: planNames[user.plan] || user.plan,
          pages: allPermissions
        });

      } catch (error) {
        console.error('❌ Erro ao carregar info do plano:', error);
        
        // 🔥 FALLBACK ATUALIZADO - Sempre incluir relatório semanal + suporte
        setPlanInfo({
          displayName: 'Close Friends VIP',
          pages: ['relatorio-semanal', 'small-caps', 'micro-caps', 'dividendos', 'fundos-imobiliarios', 'rentabilidades', 'internacional', 'recursos-exclusivos', 'recursos-suporte']
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlanInfo();
  }, [user]); // Recarregar quando usuário mudar

  const hasAccessSync = (page: string): boolean => {
    if (!planInfo) {
      console.log('⏳ PlanInfo ainda carregando...');
      return true; // Se não carregou ainda, mostra tudo
    }
    
    if (!user) {
      console.log('❌ Usuário não logado');
      // 🔥 EXCEÇÃO: Relatório semanal e suporte disponíveis mesmo sem login
      if (page === 'relatorio-semanal' || page === 'recursos-suporte') {
        console.log(`📋 ${page} - acesso público`);
        return true;
      }
      return false;
    }

    // Admin sempre tem acesso (incluindo Instagram, Renovações, Relatório Semanal, Análises Trimestrais Admin e Central de Dúvidas)
    if (user.plan === 'ADMIN') {
      console.log('✅ Admin - acesso liberado para:', page);
      return true;
    }

    // 📱 Verificação específica para Instagram Admin
    if (page === 'admin-instagram') {
      const isInstagramAdmin = user.plan === 'ADMIN' || user.email === 'jacbdias@gmail.com';
      console.log(`📱 Verificando acesso Instagram Admin para ${user.email}:`, isInstagramAdmin);
      return isInstagramAdmin;
    }

    // 📊 Verificação específica para Renovações Admin
    if (page === 'admin-renovacoes') {
      const isRenovacoesAdmin = user.plan === 'ADMIN';
      console.log(`📊 Verificando acesso Renovações Admin para ${user.email}:`, isRenovacoesAdmin);
      return isRenovacoesAdmin;
    }

    // 📋 Verificação específica para Relatório Semanal Admin
    if (page === 'admin-relatorio-semanal') {
      const isRelatorioAdmin = user.plan === 'ADMIN';
      console.log(`📋 Verificando acesso Relatório Semanal Admin para ${user.email}:`, isRelatorioAdmin);
      return isRelatorioAdmin;
    }

    // 📊 NOVA: Verificação específica para Análises Trimestrais Admin
    if (page === 'admin-analises-trimesestrais') {
      const isAnalisesTrimesestraisAdmin = user.plan === 'ADMIN';
      console.log(`📊 Verificando acesso Análises Trimestrais Admin para ${user.email}:`, isAnalisesTrimesestraisAdmin);
      return isAnalisesTrimesestraisAdmin;
    }

    // 🆕 NOVA: Verificação específica para Central de Dúvidas Admin
    if (page === 'admin-central-duvidas') {
      const isCentralDuvidasAdmin = user.plan === 'ADMIN';
      console.log(`🆕 Verificando acesso Central de Dúvidas Admin para ${user.email}:`, isCentralDuvidasAdmin);
      return isCentralDuvidasAdmin;
    }

    // 📋 GARANTIR acesso ao relatório semanal para todos os usuários logados
    if (page === 'relatorio-semanal') {
      console.log('📋 Relatório semanal - acesso garantido para usuário logado');
      return true;
    }

    // 🆕 GARANTIR acesso ao suporte para todos os usuários logados
    if (page === 'recursos-suporte') {
      console.log('🆕 Suporte - acesso garantido para usuário logado');
      return true;
    }

    const hasAccess = planInfo.pages.includes(page);
    console.log(`🔍 Verificando acesso para "${page}":`, hasAccess);
    
    return hasAccess;
  };

  // Nova função específica para verificar conteúdos individuais
  const hasContentAccess = (contentId: string): boolean => {
    if (!user) {
      console.log('❌ Usuário não logado');
      return false;
    }
    
    if (user.plan === 'ADMIN') {
      console.log('✅ Admin - acesso liberado para conteúdo:', contentId);
      return true;
    }
    
    if (!planInfo) {
      console.log('⏳ PlanInfo ainda carregando...');
      return false;
    }

    const hasAccess = planInfo.pages.includes(contentId);
    console.log(`🔍 Verificando acesso para conteúdo "${contentId}":`, hasAccess);
    
    return hasAccess;
  };

  // 📱 Função específica para verificar acesso ao Instagram Admin
  const hasInstagramAdminAccess = (): boolean => {
    if (!user) {
      console.log('❌ Usuário não logado - sem acesso Instagram');
      return false;
    }

    const isInstagramAdmin = user.plan === 'ADMIN' || user.email === 'jacbdias@gmail.com';
    console.log(`📱 Verificando acesso Instagram Admin para ${user.email}:`, isInstagramAdmin);
    
    return isInstagramAdmin;
  };

  // 📊 Função para verificar acesso às Renovações
  const hasRenovacoesAdminAccess = (): boolean => {
    if (!user) {
      console.log('❌ Usuário não logado - sem acesso Renovações');
      return false;
    }

    const isRenovacoesAdmin = user.plan === 'ADMIN';
    console.log(`📊 Verificando acesso Renovações Admin para ${user.email}:`, isRenovacoesAdmin);
    
    return isRenovacoesAdmin;
  };

  // 📋 Função para verificar acesso ao Relatório Semanal Admin
  const hasRelatorioSemanalAdminAccess = (): boolean => {
    if (!user) {
      console.log('❌ Usuário não logado - sem acesso Relatório Semanal Admin');
      return false;
    }

    const isRelatorioAdmin = user.plan === 'ADMIN';
    console.log(`📋 Verificando acesso Relatório Semanal Admin para ${user.email}:`, isRelatorioAdmin);
    
    return isRelatorioAdmin;
  };

  // 📊 NOVA: Função para verificar acesso às Análises Trimestrais Admin
  const hasAnalisesTrimesestraisAdminAccess = (): boolean => {
    if (!user) {
      console.log('❌ Usuário não logado - sem acesso Análises Trimestrais Admin');
      return false;
    }

    const isAnalisesTrimesestraisAdmin = user.plan === 'ADMIN';
    console.log(`📊 Verificando acesso Análises Trimestrais Admin para ${user.email}:`, isAnalisesTrimesestraisAdmin);
    
    return isAnalisesTrimesestraisAdmin;
  };

  // 🆕 NOVA: Função para verificar acesso à Central de Dúvidas Admin
  const hasCentralDuvidasAdminAccess = (): boolean => {
    if (!user) {
      console.log('❌ Usuário não logado - sem acesso Central de Dúvidas Admin');
      return false;
    }

    const isCentralDuvidasAdmin = user.plan === 'ADMIN';
    console.log(`🆕 Verificando acesso Central de Dúvidas Admin para ${user.email}:`, isCentralDuvidasAdmin);
    
    return isCentralDuvidasAdmin;
  };

  return {
    planInfo,
    loading,
    hasAccessSync,
    hasContentAccess, // Nova função para conteúdos específicos
    hasInstagramAdminAccess, // 📱 FUNÇÃO PARA INSTAGRAM
    hasRenovacoesAdminAccess, // 📊 FUNÇÃO PARA RENOVAÇÕES
    hasRelatorioSemanalAdminAccess, // 📋 FUNÇÃO PARA RELATÓRIO SEMANAL ADMIN
    hasAnalisesTrimesestraisAdminAccess, // 📊 NOVA FUNÇÃO PARA ANÁLISES TRIMESTRAIS ADMIN
    hasCentralDuvidasAdminAccess, // 🆕 NOVA FUNÇÃO PARA CENTRAL DE DÚVIDAS ADMIN
    user,
    debugInfo: {
      userPlan: user?.plan,
      customPermissions: user?.customPermissions,
      allPages: planInfo?.pages,
      isAdmin: user?.plan === 'ADMIN',
      hasInstagramAccess: user?.plan === 'ADMIN' || user?.email === 'jacbdias@gmail.com', // 📱 DEBUG INFO
      hasRenovacoesAccess: user?.plan === 'ADMIN', // 📊 DEBUG INFO RENOVAÇÕES
      hasRelatorioSemanalAdminAccess: user?.plan === 'ADMIN', // 📋 DEBUG INFO RELATÓRIO SEMANAL ADMIN
      hasAnalisesTrimesestraisAdminAccess: user?.plan === 'ADMIN', // 📊 DEBUG INFO ANÁLISES TRIMESTRAIS ADMIN
      hasCentralDuvidasAdminAccess: user?.plan === 'ADMIN' // 🆕 DEBUG INFO CENTRAL DE DÚVIDAS ADMIN
    }
  };
}