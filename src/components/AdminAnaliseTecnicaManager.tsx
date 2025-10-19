'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckCircle2,
  Edit3,
  Eye,
  FileImage,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Save,
  ShieldAlert,
  Star,
  Trash2,
  Underline,
  Upload,
} from 'lucide-react';

import { useAuthAccess } from '@/hooks/use-auth-access';
import { slugify } from '@/utils/slugify';

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

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escreva a análise técnica...',
  minHeight = '260px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = useCallback(
    (command: string, val?: string) => {
      document.execCommand(command, false, val);
      editorRef.current?.focus();
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange]
  );

  const insertLink = useCallback(() => {
    const url = prompt('Informe a URL do link');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const insertImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        const imageUrl = event.target?.result as string;
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        img.style.margin = '16px 0';

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          range.collapse(false);
        } else if (editorRef.current) {
          editorRef.current.appendChild(img);
        }

        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      };

      reader.readAsDataURL(file);
    };

    input.click();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div
      style={{
        border: isFocused ? '1px solid #2563eb' : '1px solid #d1d5db',
        borderRadius: '16px',
        background: '#ffffff',
        boxShadow: isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        <button type="button" onClick={() => execCommand('bold')} style={toolbarButtonStyle}>
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => execCommand('italic')} style={toolbarButtonStyle}>
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => execCommand('underline')} style={toolbarButtonStyle}>
          <Underline size={16} />
        </button>
        <span style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} style={toolbarButtonStyle}>
          <List size={16} />
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} style={toolbarButtonStyle}>
          <ListOrdered size={16} />
        </button>
        <span style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={() => execCommand('justifyLeft')} style={toolbarButtonStyle}>
          <AlignLeft size={16} />
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} style={toolbarButtonStyle}>
          <AlignCenter size={16} />
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} style={toolbarButtonStyle}>
          <AlignRight size={16} />
        </button>
        <span style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
        <button type="button" onClick={insertLink} style={toolbarButtonStyle}>
          <LinkIcon size={16} />
        </button>
        <button type="button" onClick={insertImage} style={toolbarButtonStyle}>
          <ImageIcon size={16} />
        </button>
      </div>

      <div
        ref={editorRef}
        style={{
          padding: '20px 22px',
          minHeight,
          outline: 'none',
          fontSize: '15px',
          lineHeight: 1.7,
        }}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
      />
    </div>
  );
};

const toolbarButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5f5',
  borderRadius: '10px',
  background: '#ffffff',
  padding: '6px 10px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#1e293b',
  cursor: 'pointer',
};

const emptyForm = {
  ticker: '',
  titulo: '',
  slug: '',
  resumo: '',
  conteudo: '',
  imagemCapa: '',
  fonte: '',
  publicado: true,
  destaque: false,
};

type FormState = typeof emptyForm & { id?: string };

const cardLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '6px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '12px',
  padding: '12px 14px',
  fontSize: '14px',
  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
};

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

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch (error) {
    return value;
  }
};

const defaultListPlaceholder =
  'Nenhuma análise técnica cadastrada ainda. Crie a primeira análise para este ativo.';

export default function AdminAnaliseTecnicaManager() {
  const { planInfo, loading: authLoading } = useAuthAccess();
  const [analises, setAnalises] = useState<AnaliseTecnica[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [slugManual, setSlugManual] = useState<boolean>(false);

  const isEditando = Boolean(formState.id);

  const carregarAnalises = useCallback(async () => {
    if (!planInfo.isAdmin) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analises-tecnicas');
      if (!response.ok) {
        throw new Error('Falha ao carregar análises técnicas');
      }

      const data = await response.json();
      setAnalises(Array.isArray(data?.analises) ? data.analises : []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar análises técnicas');
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

  const resetForm = useCallback(() => {
    setFormState(emptyForm);
    setSlugManual(false);
  }, []);

  const handleEdit = useCallback((analise: AnaliseTecnica) => {
    setFormState({
      id: analise.id,
      ticker: analise.ticker,
      titulo: analise.titulo,
      slug: analise.slug,
      resumo: analise.resumo ?? '',
      conteudo: analise.conteudo,
      imagemCapa: analise.imagemCapa ?? '',
      fonte: analise.fonte ?? '',
      publicado: analise.publicado,
      destaque: analise.destaque,
    });
    setSlugManual(true);
  }, []);

  const handleDelete = useCallback(
    async (analise: AnaliseTecnica) => {
      const confirmar = window.confirm(
        `Tem certeza que deseja remover a análise técnica "${analise.titulo}"?`
      );
      if (!confirmar) return;

      try {
        const response = await fetch(`/api/analises-tecnicas/${analise.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Não foi possível remover a análise técnica');
        }

        setAnalises(prev => prev.filter(item => item.id !== analise.id));
        if (formState.id === analise.id) {
          resetForm();
        }
        setSuccess('Análise técnica removida com sucesso.');
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao remover análise técnica');
      }
    },
    [formState.id, resetForm]
  );

  const handleInputChange = useCallback(
    (field: keyof FormState, value: string | boolean) => {
      setFormState(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleTickerChange = useCallback(
    (value: string) => {
      handleInputChange('ticker', value.toUpperCase());
    },
    [handleInputChange]
  );

  const handleTituloChange = useCallback(
    (value: string) => {
      handleInputChange('titulo', value);
      if (!slugManual) {
        handleInputChange('slug', slugify(value));
      }
    },
    [handleInputChange, slugManual]
  );

  const handleSlugChange = useCallback(
    (value: string) => {
      setSlugManual(true);
      handleInputChange('slug', slugify(value));
    },
    [handleInputChange]
  );

  const handleUploadImagemCapa = useCallback(
    (file: File | null) => {
      if (!file) {
        handleInputChange('imagemCapa', '');
        return;
      }

      const reader = new FileReader();
      reader.onload = event => {
        const base64 = event.target?.result as string;
        handleInputChange('imagemCapa', base64);
      };
      reader.readAsDataURL(file);
    },
    [handleInputChange]
  );

  const salvarAnalise = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!formState.ticker || !formState.titulo || !formState.conteudo) {
        setError('Preencha os campos obrigatórios: ticker, título e conteúdo.');
        return;
      }

      setSaving(true);
      setError('');

      try {
        const payload = {
          ticker: formState.ticker.trim().toUpperCase(),
          titulo: formState.titulo.trim(),
          slug: formState.slug?.trim() || slugify(formState.titulo),
          resumo: formState.resumo?.trim() || null,
          conteudo: formState.conteudo,
          imagemCapa: formState.imagemCapa?.trim() || null,
          fonte: formState.fonte?.trim() || null,
          publicado: formState.publicado,
          destaque: formState.destaque,
        };

        const response = await fetch(
          formState.id ? `/api/analises-tecnicas/${formState.id}` : '/api/analises-tecnicas',
          {
            method: formState.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const message = await response.json().catch(() => null);
          throw new Error(message?.error || 'Não foi possível salvar a análise técnica');
        }

        const data = await response.json();
        const analiseSalva: AnaliseTecnica | null = data?.analise ?? null;

        if (analiseSalva) {
          setAnalises(prev => {
            const semAtual = prev.filter(item => item.id !== analiseSalva.id);
            return [analiseSalva, ...semAtual].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
          });
        } else {
          void carregarAnalises();
        }

        setSuccess('Análise técnica salva com sucesso.');
        resetForm();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao salvar análise técnica');
      } finally {
        setSaving(false);
      }
    },
    [carregarAnalises, formState, resetForm]
  );

  const atualizarStatus = useCallback(
    async (analise: AnaliseTecnica, changes: Partial<Pick<AnaliseTecnica, 'publicado' | 'destaque'>>) => {
      try {
        const response = await fetch(`/api/analises-tecnicas/${analise.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...changes }),
        });

        if (!response.ok) {
          throw new Error('Falha ao atualizar status da análise.');
        }

        const data = await response.json();
        if (data?.analise) {
          setAnalises(prev => prev.map(item => (item.id === analise.id ? data.analise : item)));
          if (formState.id === analise.id) {
            setFormState(prev => ({ ...prev, ...changes }));
          }
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao atualizar status da análise');
      }
    },
    [formState.id]
  );

  const listaOrdenada = useMemo(() => {
    return [...analises].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [analises]);

  if (authLoading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#475569', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /> Autenticando...
      </div>
    );
  }

  if (!planInfo.isAdmin) {
    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '80px auto',
          padding: '32px',
          borderRadius: '18px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          textAlign: 'center',
          display: 'grid',
          gap: '12px',
        }}
      >
        <ShieldAlert size={36} style={{ margin: '0 auto' }} />
        <h2 style={{ margin: 0 }}>Acesso restrito</h2>
        <p style={{ margin: 0 }}>
          Apenas administradores podem gerenciar análises técnicas. Verifique com a equipe de suporte.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '18px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '12px', letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase' }}>
            Administração
          </span>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>Gestão de Análises Técnicas</h1>
          <p style={{ margin: 0, color: '#475569' }}>
            Cadastre e publique análises técnicas profissionais para exibição nos detalhes de ativos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={resetForm}
            style={{
              border: '1px solid #cbd5f5',
              borderRadius: '12px',
              padding: '12px 16px',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
          >
            <PlusCircle size={18} /> Nova análise
          </button>

          <button
            type="button"
            onClick={() => void carregarAnalises()}
            style={{
              border: '1px solid #0f172a',
              borderRadius: '12px',
              padding: '12px 16px',
              background: '#0f172a',
              color: '#f8fafc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
          >
            <RefreshCcw size={18} /> Atualizar lista
          </button>
        </div>
      </header>

      {(error || success) && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
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

      <div
        style={{
          display: 'grid',
          gap: '24px',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          alignItems: 'flex-start',
        }}
      >
        <form
          onSubmit={salvarAnalise}
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
            display: 'grid',
            gap: '20px',
          }}
        >
          <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div>
              <label style={cardLabelStyle} htmlFor="ticker-input">
                Ticker*
              </label>
              <input
                id="ticker-input"
                value={formState.ticker}
                onChange={event => handleTickerChange(event.target.value)}
                placeholder="VALE3"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={cardLabelStyle} htmlFor="titulo-input">
                Título*
              </label>
              <input
                id="titulo-input"
                value={formState.titulo}
                onChange={event => handleTituloChange(event.target.value)}
                placeholder="Título da análise"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={cardLabelStyle} htmlFor="slug-input">
                Slug (URL)
              </label>
              <input
                id="slug-input"
                value={formState.slug}
                onChange={event => handleSlugChange(event.target.value)}
                placeholder="analise-tecnica-vale"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={cardLabelStyle} htmlFor="resumo-input">
              Resumo profissional
            </label>
            <textarea
              id="resumo-input"
              value={formState.resumo}
              onChange={event => handleInputChange('resumo', event.target.value)}
              placeholder="Resumo executivo da análise"
              style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={cardLabelStyle}>Imagem de capa</label>
            <div
              style={{
                border: '2px dashed #94a3b8',
                borderRadius: '16px',
                padding: '18px',
                background: '#f8fafc',
                display: 'grid',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <FileImage size={20} />
                <span style={{ color: '#475569', fontSize: '14px' }}>
                  Faça upload de uma imagem (JPEG ou PNG) ou cole uma URL abaixo.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <label
                  htmlFor="upload-capa"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: '#0f172a',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Upload size={16} /> Carregar arquivo
                </label>
                <input
                  id="upload-capa"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={event => handleUploadImagemCapa(event.target.files?.[0] ?? null)}
                />

                <button
                  type="button"
                  onClick={() => handleInputChange('imagemCapa', '')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5f5',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Remover imagem
                </button>
              </div>

              <input
                value={formState.imagemCapa}
                onChange={event => handleInputChange('imagemCapa', event.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />

              {formState.imagemCapa && (
                <img
                  src={formState.imagemCapa}
                  alt="Pré-visualização da capa"
                  style={{
                    width: '100%',
                    maxHeight: '220px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                />
              )}
            </div>
          </div>

          <div>
            <label style={cardLabelStyle}>Conteúdo da análise*</label>
            <RichTextEditor value={formState.conteudo} onChange={value => handleInputChange('conteudo', value)} />
          </div>

          <div>
            <label style={cardLabelStyle} htmlFor="fonte-input">
              Fonte / Referência
            </label>
            <input
              id="fonte-input"
              value={formState.fonte}
              onChange={event => handleInputChange('fonte', event.target.value)}
              placeholder="Fonte utilizada na análise (opcional)"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                handleInputChange('publicado', !formState.publicado);
              }}
              style={{
                ...badgeStyle,
                background: formState.publicado ? '#ecfccb' : '#f1f5f9',
                color: formState.publicado ? '#14532d' : '#475569',
                border: formState.publicado ? '1px solid #bef264' : '1px solid #cbd5f5',
              }}
            >
              <Eye size={16} /> {formState.publicado ? 'Publicado' : 'Rascunho'}
            </button>

            <button
              type="button"
              onClick={() => {
                handleInputChange('destaque', !formState.destaque);
              }}
              style={{
                ...badgeStyle,
                background: formState.destaque ? '#fef3c7' : '#f1f5f9',
                color: formState.destaque ? '#92400e' : '#475569',
                border: formState.destaque ? '1px solid #f59e0b' : '1px solid #cbd5f5',
              }}
            >
              <Star size={16} /> {formState.destaque ? 'Em destaque' : 'Marcar destaque'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {isEditando && (
              <button
                type="button"
                onClick={() => {
                  const analise = analises.find(item => item.id === formState.id);
                  if (analise) {
                    handleDelete(analise);
                  }
                }}
                style={{
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={18} /> Excluir
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                border: 'none',
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
              {saving ? 'Salvando...' : isEditando ? 'Atualizar análise' : 'Publicar análise'}
            </button>
          </div>
        </form>

        <aside
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.05)',
            display: 'grid',
            gap: '18px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>Análises recentes</h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{listaOrdenada.length} itens</span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {Array.from({ length: 3 }).map((_, index) => (
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
          ) : listaOrdenada.length === 0 ? (
            <div
              style={{
                border: '2px dashed #cbd5f5',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                color: '#475569',
              }}
            >
              {defaultListPlaceholder}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {listaOrdenada.map(analise => (
                <div
                  key={analise.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '18px',
                    background: '#ffffff',
                    display: 'grid',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'grid', gap: '6px', flex: 1 }}>
                      <span style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {analise.ticker}
                      </span>
                      <strong style={{ fontSize: '16px' }}>{analise.titulo}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span
                        style={{
                          ...badgeStyle,
                          background: analise.publicado ? '#ecfccb' : '#f1f5f9',
                          color: analise.publicado ? '#14532d' : '#475569',
                          border: analise.publicado ? '1px solid #bef264' : '1px solid #cbd5f5',
                        }}
                      >
                        <Eye size={14} /> {analise.publicado ? 'Publicado' : 'Rascunho'}
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
                  </div>

                  <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.5 }}>
                    {analise.resumo || analise.conteudo.replace(/<[^>]+>/g, ' ').slice(0, 160)}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Atualizado em {formatDateTime(analise.updatedAt)}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => atualizarStatus(analise, { publicado: !analise.publicado })}
                        style={{
                          border: '1px solid #cbd5f5',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          background: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Alternar publicação
                      </button>

                      <button
                        type="button"
                        onClick={() => atualizarStatus(analise, { destaque: !analise.destaque })}
                        style={{
                          border: '1px solid #fde68a',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          background: analise.destaque ? '#fef3c7' : '#ffffff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Alternar destaque
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(analise)}
                        style={{
                          border: '1px solid #cbd5f5',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          background: '#f1f5f9',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Edit3 size={14} /> Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
