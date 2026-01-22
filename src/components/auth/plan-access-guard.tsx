'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuthAccess } from '@/hooks/use-auth-access';
import { paths } from '@/paths';

interface PlanAccessGuardProps {
  children: React.ReactNode;
}

const ROUTE_PERMISSIONS: Array<{ matcher: RegExp; permission: string }> = [
  { matcher: /^\/dashboard\/admin\/usuarios(\/|$)/, permission: 'admin-usuarios' },
  { matcher: /^\/dashboard\/admin\/renovacoes(\/|$)/, permission: 'admin-renovacoes' },
  { matcher: /^\/dashboard\/admin\/migracao-vip(\/|$)/, permission: 'admin-migracao-vip' },
  { matcher: /^\/dashboard\/admin\/integracoes(\/|$)/, permission: 'admin-integracoes' },
  { matcher: /^\/dashboard\/admin\/relatorio-semanal(\/|$)/, permission: 'admin-relatorio-semanal' },
  { matcher: /^\/dashboard\/admin\/analises-trimesestrais(\/|$)/, permission: 'admin-analises-trimesestrais' },
  { matcher: /^\/dashboard\/admin\/analise-tecnica(\/|$)/, permission: 'admin-analise-tecnica' },
  { matcher: /^\/dashboard\/admin\/central-duvidas(\/|$)/, permission: 'admin-central-duvidas' },
  { matcher: /^\/dashboard\/admin\/carteiras(\/|$)/, permission: 'admin-carteiras' },
  { matcher: /^\/dashboard\/admin\/settings(\/|$)/, permission: 'admin-settings' },
  { matcher: /^\/dashboard\/admin\/plans(\/|$)/, permission: 'admin' },
  { matcher: /^\/dashboard\/admin(\/|$)/, permission: 'admin' },
  { matcher: /^\/dashboard\/central-proventos(\/|$)/, permission: 'admin-proventos' },
  { matcher: /^\/dashboard\/central-relatorios(\/|$)/, permission: 'admin-relatorios' },
  { matcher: /^\/dashboard\/central-agenda(\/|$)/, permission: 'admin-integracoes' },
  { matcher: /^\/dashboard\/gerenciamento(\/|$)/, permission: 'admin-empresas' },
  { matcher: /^\/dashboard\/relatorio-semanal(\/|$)/, permission: 'relatorio-semanal' },
  { matcher: /^\/dashboard\/overview(\/|$)/, permission: 'small-caps' },
  { matcher: /^\/dashboard\/customers(\/|$)/, permission: 'micro-caps' },
  { matcher: /^\/dashboard\/integrations(\/|$)/, permission: 'dividendos' },
  { matcher: /^\/dashboard\/settings(\/|$)/, permission: 'fundos-imobiliarios' },
  { matcher: /^\/dashboard\/rentabilidades(\/|$)/, permission: 'rentabilidades' },
  { matcher: /^\/dashboard\/internacional\/etfs(\/|$)/, permission: 'internacional-etfs' },
  { matcher: /^\/dashboard\/internacional\/stocks(\/|$)/, permission: 'internacional-stocks' },
  { matcher: /^\/dashboard\/internacional\/dividendos(\/|$)/, permission: 'internacional-dividendos' },
  { matcher: /^\/dashboard\/internacional\/projeto-america(\/|$)/, permission: 'internacional-projeto-america' },
  { matcher: /^\/dashboard\/internacional(\/|$)/, permission: 'internacional' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/dicas-de-investimentos(\/|$)/, permission: 'recursos-dicas' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/analise-de-carteira(\/|$)/, permission: 'recursos-analise' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/ebooks(\/|$)/, permission: 'recursos-ebooks' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/imposto-de-renda(\/|$)/, permission: 'recursos-imposto' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/lives-e-aulas(\/|$)/, permission: 'recursos-lives' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/milhas-aereas(\/|$)/, permission: 'recursos-milhas' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/planilhas(\/|$)/, permission: 'recursos-planilhas' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/telegram(\/|$)/, permission: 'recursos-telegram' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/reserva-emergencia(\/|$)/, permission: 'recursos-reserva' },
  { matcher: /^\/dashboard\/recursos-exclusivos\/central-duvidas(\/|$)/, permission: 'recursos-suporte' },
  { matcher: /^\/dashboard\/recursos-exclusivos(\/|$)/, permission: 'recursos-exclusivos' },
  { matcher: /^\/dashboard\/cf-renda-turbinada\/aulas(\/|$)/, permission: 'cf-renda-turbinada-aulas' },
  { matcher: /^\/dashboard\/cf-renda-turbinada\/bastidores-da-bolsa(\/|$)/, permission: 'cf-renda-turbinada-bastidores' },
  { matcher: /^\/dashboard\/cf-renda-turbinada\/carteira-recomendada(\/|$)/, permission: 'cf-renda-turbinada-carteira' },
  { matcher: /^\/dashboard\/cf-renda-turbinada(\/|$)/, permission: 'cf-renda-turbinada' },
  { matcher: /^\/dashboard\/cf-renda-turbinada-turma-2\/aulas(\/|$)/, permission: 'cf-renda-turbinada-turma-2-aulas' },
  { matcher: /^\/dashboard\/cf-renda-turbinada-turma-2\/bastidores-da-bolsa(\/|$)/, permission: 'cf-renda-turbinada-turma-2-bastidores' },
  { matcher: /^\/dashboard\/cf-renda-turbinada-turma-2(\/|$)/, permission: 'cf-renda-turbinada-turma-2' },
  { matcher: /^\/dashboard\/cf-renda-turbinada-turma-3\/aulas(\/|$)/, permission: 'cf-renda-turbinada-turma-3-aulas' },
  { matcher: /^\/dashboard\/cf-renda-turbinada-turma-3\/bastidores-da-bolsa(\/|$)/, permission: 'cf-renda-turbinada-turma-3-bastidores' },
  { matcher: /^\/dashboard\/cf-renda-turbinada-turma-3(\/|$)/, permission: 'cf-renda-turbinada-turma-3' },
];

function getRequiredPermission(pathname: string | null): string | null {
  if (!pathname) {
    return null;
  }

  const match = ROUTE_PERMISSIONS.find(({ matcher }) => matcher.test(pathname));
  return match?.permission ?? null;
}

function LoadingAccess(): React.JSX.Element {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '16px',
      }}
    >
      Verificando permissões...
    </div>
  );
}

function BlockedAccess({ planName }: { planName: string }): React.JSX.Element {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          background: 'white',
          padding: '40px 32px',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
          maxWidth: '520px',
        }}
      >
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          Acesso restrito pelo seu plano
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
          Seu plano atual não inclui esta página. Para liberar o acesso, faça o upgrade da sua assinatura.
        </p>
        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>
          Plano atual: <strong>{planName}</strong>
        </p>
        <Link
          href={paths.dashboard.overview}
          style={{
            display: 'inline-block',
            backgroundColor: '#0ea5e9',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Voltar para o dashboard
        </Link>
      </div>
    </div>
  );
}

export function PlanAccessGuard({ children }: PlanAccessGuardProps): React.JSX.Element {
  const pathname = usePathname();
  const { hasAccessSync, loading, planInfo } = useAuthAccess();

  const requiredPermission = React.useMemo(() => getRequiredPermission(pathname), [pathname]);

  if (!requiredPermission) {
    return <>{children}</>;
  }

  if (loading) {
    return <LoadingAccess />;
  }

  if (hasAccessSync(requiredPermission)) {
    return <>{children}</>;
  }

  return <BlockedAccess planName={planInfo.displayName || 'Plano não identificado'} />;
}
