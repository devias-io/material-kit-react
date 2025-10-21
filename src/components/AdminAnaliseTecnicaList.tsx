'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Eye,
  Loader2,
  PlusCircle,
  RefreshCcw,
  ShieldAlert,
  Star,
  Trash2,
} from 'lucide-react';

import { useAuthAccess } from '@/hooks/use-auth-access';
import { useMediaQuery } from '@/hooks/use-media-query';

interface AutorInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface AnaliseTecnica {
  id: string;
  ticker: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string;
  imagemCapa: string | null;
  fonte: string | null;
  publicado: boolean;
  destaque: boolean;
  createdAt: string;
  updatedAt: string;
  autor?: AutorInfo | null;
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const actionButtonStyle: React.CSSProperties = {
  borderRadius: '10px',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
};

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch (error) {
    return value;
  }
};

const getAutorNome = (autor?: AutorInfo | null) => {
  if (!autor) {
    return 'Autor não informado';
  }

  const partes = [autor.firstName, autor.lastName].filter(Boolean);
  if (partes.length === 0) {
    return autor.email ?? 'Autor não informado';
  }

  return partes.join(' ');
};

const skeletonItens = Array.from({ length: 4 });

const emptyStateMessage =
  'Nenhuma análise publicada foi encontrada. Publique uma nova análise técnica para visualizá-la aqui.';

export default function AdminAnaliseTecnicaList() {
  const { planInfo, loading: authLoading } = useAuthAccess();
  const [analises, setAnalises] = useState<AnaliseTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const carregarAnalises = useCallback(async () => {
    if (!planInfo.isAdmin) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analises-tecnicas');
      if (!response.ok) {
        throw new Error('Falha ao carregar análises técnicas.');
      }

      const data = await response.json();
      setAnalises(Array.isArray(data?.analises) ? data.analises : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar análises técnicas.');
    } finally {
      setLoading(false);
    }
  }, [planInfo.isAdmin]);

  useEffect(() => {
    if (!authLoading && planInfo.isAdmin) {
      void carregarAnalises();
    }
  }, [authLoading, planInfo.isAdmin, carregarAnalises]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [success]);

  const analisesPublicadas = useMemo(() => {
    return analises
      .filter(analise => analise.publicado)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [analises]);

  const atualizarStatus = useCallback(
    async (
      analise: AnaliseTecnica,
      changes: Partial<Pick<AnaliseTecnica, 'publicado' | 'destaque'>>,
      successMessage: string
    ) => {
      setProcessingId(analise.id);
      setError('');

      try {
        const response = await fetch(`/api/analises-tecnicas/${analise.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes),
        });

        if (!response.ok) {
          throw new Error('Não foi possível atualizar a análise técnica.');
        }

        const data = await response.json();
        if (data?.analise) {
          setAnalises(prev => prev.map(item => (item.id === data.analise.id ? data.analise : item)));
          setSuccess(successMessage);
        } else {
          await carregarAnalises();
          setSuccess(successMessage);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao atualizar a análise técnica.');
      } finally {
        setProcessingId(null);
      }
    },
    [carregarAnalises]
  );

  const handleTogglePublicacao = useCallback(
    (analise: AnaliseTecnica) =>
      atualizarStatus(
        analise,
        { publicado: !analise.publicado },
        analise.publicado
          ? 'Análise convertida em rascunho com sucesso.'
          : 'Análise publicada com sucesso.'
      ),
    [atualizarStatus]
  );

  const handleToggleDestaque = useCallback(
    (analise: AnaliseTecnica) =>
      atualizarStatus(
        analise,
        { destaque: !analise.destaque },
        analise.destaque ? 'Análise removida dos destaques.' : 'Análise marcada como destaque.'
      ),
    [atualizarStatus]
  );

  const handleDelete = useCallback(
    async (analise: AnaliseTecnica) => {
      const confirmar = window.confirm(
        `Tem certeza que deseja remover a análise técnica "${analise.titulo}"?`
      );

      if (!confirmar) {
        return;
      }

      setProcessingId(analise.id);
      setError('');

      try {
        const response = await fetch(`/api/analises-tecnicas/${analise.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Não foi possível remover a análise técnica.');
        }

        setAnalises(prev => prev.filter(item => item.id !== analise.id));
        setSuccess('Análise técnica removida com sucesso.');
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao remover a análise técnica.');
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  const handleEdit = useCallback(
    (analise: AnaliseTecnica) => {
      router.push(`/dashboard/admin/analise-tecnica?analiseId=${analise.id}`);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    void carregarAnalises();
  }, [carregarAnalises]);

  const pagePadding = isMobile ? '16px' : isTablet ? '24px' : '32px';
  const headerTitleSize = isMobile ? '26px' : '32px';
  const contentGap = isMobile ? '18px' : '24px';

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
        }}
      >
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!planInfo.isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: pagePadding,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            maxWidth: '480px',
            textAlign: 'center',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          }}
        >
          <ShieldAlert size={28} style={{ color: '#b91c1c', marginBottom: '12px' }} />
          <h2 style={{ margin: '0 0 12px', fontSize: '20px' }}>Acesso restrito</h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '15px' }}>
            Somente administradores podem visualizar as análises técnicas publicadas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: pagePadding,
        display: 'grid',
        gap: contentGap,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: isTablet ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isTablet ? 'flex-start' : 'center',
          gap: isMobile ? '16px' : '18px',
        }}
      >
        <div style={{ display: 'grid', gap: isMobile ? '4px' : '6px' }}>
          <span style={{ fontSize: '12px', letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase' }}>
            Administração
          </span>
          <h1 style={{ margin: 0, fontSize: headerTitleSize, fontWeight: 700 }}>
            Análises técnicas publicadas
          </h1>
          <p style={{ margin: 0, color: '#475569', fontSize: isMobile ? '14px' : '15px' }}>
            Acompanhe as análises já publicadas, ajuste destaques e gerencie a visibilidade dos conteúdos.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: isMobile ? '10px' : '12px',
            flexWrap: 'wrap',
            justifyContent: isTablet ? 'flex-start' : 'flex-end',
          }}
        >
          <Link
            href="/dashboard/admin/analise-tecnica"
            style={{
              border: '1px solid #cbd5f5',
              borderRadius: '12px',
              padding: isMobile ? '10px 14px' : '12px 16px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              color: '#0f172a',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            <PlusCircle size={18} /> Nova análise
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            style={{
              border: '1px solid #0f172a',
              borderRadius: '12px',
              padding: isMobile ? '10px 14px' : '12px 16px',
              background: '#0f172a',
              color: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCcw size={18} />}
            {loading ? 'Atualizando...' : 'Atualizar lista'}
          </button>
        </div>
      </header>

      {(error || success) && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {error && (
            <div
              style={{
                borderRadius: '14px',
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                padding: '12px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <ShieldAlert size={18} /> {error}
            </div>
          )}

          {success && (
            <div
              style={{
                borderRadius: '14px',
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                color: '#15803d',
                padding: '12px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <CheckCircle2 size={18} /> {success}
            </div>
          )}
        </div>
      )}

      <section
        style={{
          background: '#ffffff',
          borderRadius: isMobile ? '18px' : '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
          padding: isMobile ? '20px' : '24px',
          display: 'grid',
          gap: isMobile ? '16px' : '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'grid', gap: '4px' }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px' }}>Conteúdos publicados</h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {analisesPublicadas.length} {analisesPublicadas.length === 1 ? 'análise ativa' : 'análises ativas'}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {skeletonItens.map((_, index) => (
              <div
                key={index}
                style={{
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  background: '#f8fafc',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '10px' }} />
                <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', width: '60%' }} />
              </div>
            ))}
          </div>
        ) : analisesPublicadas.length === 0 ? (
          <div
            style={{
              border: '2px dashed #cbd5f5',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              color: '#475569',
              background: '#f8fafc',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '8px' }}>Nada por aqui ainda</strong>
            <span style={{ fontSize: '13px', display: 'block', marginBottom: '12px' }}>{emptyStateMessage}</span>
            <Link
              href="/dashboard/admin/analise-tecnica"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: '#0f172a',
                color: '#f8fafc',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <PlusCircle size={18} /> Criar nova análise
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: isMobile ? '14px' : '16px' }}>
            {analisesPublicadas.map(analise => (
              <article
                key={analise.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: isMobile ? '18px' : '20px',
                  background: '#ffffff',
                  display: 'grid',
                  gap: isMobile ? '12px' : '14px',
                  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)',
                }}
              >
                <header
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ display: 'grid', gap: '6px', flex: 1, minWidth: '220px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {analise.ticker}
                    </span>
                    <strong style={{ fontSize: isMobile ? '16px' : '18px', lineHeight: 1.3 }}>{analise.titulo}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        ...badgeStyle,
                        background: '#ecfccb',
                        color: '#14532d',
                        border: '1px solid #bef264',
                      }}
                    >
                      <Eye size={14} /> Publicado
                    </span>
                    {analise.destaque && (
                      <span
                        style={{
                          ...badgeStyle,
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #f59e0b',
                        }}
                      >
                        <Star size={14} /> Destaque
                      </span>
                    )}
                  </div>
                </header>

                <p style={{ margin: 0, color: '#475569', fontSize: isMobile ? '13px' : '14px', lineHeight: 1.6 }}>
                  {analise.resumo || analise.conteudo.replace(/<[^>]+>/g, ' ').slice(0, 200)}
                </p>

                <footer
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexWrap: 'wrap',
                    gap: isMobile ? '10px' : '12px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', display: 'grid', gap: '4px' }}>
                    <span>Atualizado em {formatDateTime(analise.updatedAt)}</span>
                    <span>Responsável: {getAutorNome(analise.autor)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleTogglePublicacao(analise)}
                      disabled={processingId === analise.id}
                      style={{
                        ...actionButtonStyle,
                        border: '1px solid #cbd5f5',
                        background: '#ffffff',
                        minWidth: isMobile ? '100%' : 'unset',
                        opacity: processingId === analise.id ? 0.7 : 1,
                      }}
                    >
                      {processingId === analise.id ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : null}
                      Alternar publicação
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleDestaque(analise)}
                      disabled={processingId === analise.id}
                      style={{
                        ...actionButtonStyle,
                        border: '1px solid #fde68a',
                        background: analise.destaque ? '#fef3c7' : '#ffffff',
                        color: '#92400e',
                        minWidth: isMobile ? '100%' : 'unset',
                        opacity: processingId === analise.id ? 0.7 : 1,
                      }}
                    >
                      {processingId === analise.id ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : null}
                      Alternar destaque
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(analise)}
                      style={{
                        ...actionButtonStyle,
                        border: '1px solid #cbd5f5',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        minWidth: isMobile ? '100%' : 'unset',
                      }}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(analise)}
                      disabled={processingId === analise.id}
                      style={{
                        ...actionButtonStyle,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        minWidth: isMobile ? '100%' : 'unset',
                        opacity: processingId === analise.id ? 0.7 : 1,
                      }}
                    >
                      {processingId === analise.id ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Remover
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
