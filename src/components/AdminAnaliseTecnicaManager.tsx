'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckCircle2,
  Eye,
  FileImage,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  PlusCircle,
  Save,
  ShieldAlert,
  Star,
  Trash2,
  Underline,
  Upload,
} from 'lucide-react';

import Link from 'next/link';

import { useAuthAccess } from '@/hooks/use-auth-access';
import { slugify } from '@/utils/slugify';
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
  const selectionToolbarRef = useRef<HTMLDivElement>(null);
  const imageToolbarRef = useRef<HTMLDivElement>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState({
    visible: false,
    top: 0,
    left: 0,
  });
  const [imageToolbar, setImageToolbar] = useState({
    visible: false,
    top: 0,
    left: 0,
    widthPercent: 100,
  });

  const hideSelectionToolbar = useCallback(() => {
    setSelectionToolbar(prev => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const hideImageToolbar = useCallback(() => {
    selectedImageRef.current = null;
    setImageToolbar(prev => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const applyImageEnhancements = useCallback(() => {
    if (!editorRef.current) return;

    const images = Array.from(editorRef.current.querySelectorAll('img'));
    images.forEach(img => {
      img.style.maxWidth = '100%';
      if (!img.style.borderRadius) {
        img.style.borderRadius = '12px';
      }
      if (!img.style.margin) {
        img.style.margin = '16px 0';
      }
      if (!img.dataset.widthPercent) {
        if (img.style.width.endsWith('%')) {
          img.dataset.widthPercent = img.style.width.replace('%', '') || '100';
        } else {
          img.dataset.widthPercent = '100';
          img.style.width = '100%';
        }
      }
      img.setAttribute('data-editor-image', 'true');
    });
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      applyImageEnhancements();
    }
  }, [value, applyImageEnhancements]);

  const updateSelectionToolbarPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!editorRef.current || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
      hideSelectionToolbar();
      return;
    }

    const anchorNode = selection.anchorNode;
    if (!anchorNode || !editorRef.current.contains(anchorNode)) {
      hideSelectionToolbar();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      hideSelectionToolbar();
      return;
    }

    const top = Math.max(rect.top, 12);
    const left = rect.left + rect.width / 2;

    setSelectionToolbar({
      visible: true,
      top,
      left,
    });
  }, [hideSelectionToolbar]);

  const updateImageToolbarPosition = useCallback(() => {
    const img = selectedImageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const top = Math.max(rect.top, 12);
    const left = rect.left + rect.width / 2;

    setImageToolbar(prev => ({
      ...prev,
      visible: true,
      top,
      left,
    }));
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateSelectionToolbarPosition();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('scroll', handleSelectionChange, { passive: true });
    window.addEventListener('resize', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('scroll', handleSelectionChange);
      window.removeEventListener('resize', handleSelectionChange);
    };
  }, [updateSelectionToolbarPosition]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target?.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        selectedImageRef.current = img;

        if (!img.dataset.widthPercent) {
          if (img.style.width.endsWith('%')) {
            img.dataset.widthPercent = img.style.width.replace('%', '') || '100';
          } else {
            img.dataset.widthPercent = '100';
            img.style.width = '100%';
          }
        }

        const rect = img.getBoundingClientRect();
        const top = Math.max(rect.top, 12);
        const left = rect.left + rect.width / 2;
        const widthPercent = parseFloat(img.dataset.widthPercent || '100');

        setImageToolbar({
          visible: true,
          top,
          left,
          widthPercent: Number.isFinite(widthPercent) ? widthPercent : 100,
        });
        return;
      }

      hideImageToolbar();
    };

    editor.addEventListener('click', handleClick);

    return () => {
      editor.removeEventListener('click', handleClick);
    };
  }, [hideImageToolbar]);

  useEffect(() => {
    const handleVisibilityUpdate = () => {
      if (selectionToolbar.visible) {
        updateSelectionToolbarPosition();
      }
      if (selectedImageRef.current) {
        updateImageToolbarPosition();
      }
    };

    window.addEventListener('scroll', handleVisibilityUpdate, { passive: true });
    window.addEventListener('resize', handleVisibilityUpdate);

    return () => {
      window.removeEventListener('scroll', handleVisibilityUpdate);
      window.removeEventListener('resize', handleVisibilityUpdate);
    };
  }, [selectionToolbar.visible, updateImageToolbarPosition, updateSelectionToolbarPosition]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (selectionToolbarRef.current?.contains(target) || imageToolbarRef.current?.contains(target)) {
        return;
      }

      if (editorRef.current?.contains(target)) {
        if (!(target instanceof HTMLImageElement)) {
          hideImageToolbar();
        }
        return;
      }

      hideSelectionToolbar();
      hideImageToolbar();
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [hideImageToolbar, hideSelectionToolbar]);

  const execCommand = useCallback(
    (command: string, val?: string) => {
      document.execCommand(command, false, val);
      editorRef.current?.focus();
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      updateSelectionToolbarPosition();
    },
    [onChange, updateSelectionToolbarPosition]
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
        img.style.width = '100%';
        img.dataset.widthPercent = '100';

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
        applyImageEnhancements();
      };

      reader.readAsDataURL(file);
    };

    input.click();
  }, [applyImageEnhancements, onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    applyImageEnhancements();
  }, [applyImageEnhancements, onChange]);

  const handleImageWidthChange = useCallback(
    (value: number) => {
      const img = selectedImageRef.current;
      if (!img) return;

      img.style.width = `${value}%`;
      img.dataset.widthPercent = String(value);

      setImageToolbar(prev => ({
        ...prev,
        widthPercent: value,
      }));

      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }

      requestAnimationFrame(() => {
        updateImageToolbarPosition();
      });
    },
    [onChange, updateImageToolbarPosition]
  );

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
          padding: 'clamp(16px, 3vw, 20px) clamp(18px, 3.2vw, 22px)',
          minHeight,
          outline: 'none',
          fontSize: '15px',
          lineHeight: 1.7,
          wordBreak: 'break-word',
        }}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
      />
      {selectionToolbar.visible && (
        <div
          ref={selectionToolbarRef}
          style={{
            position: 'fixed',
            top: selectionToolbar.top,
            left: selectionToolbar.left,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: '#0f172a',
            color: '#ffffff',
            borderRadius: '9999px',
            padding: '8px 12px',
            display: 'flex',
            gap: '8px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.18)',
            zIndex: 1000,
            border: '1px solid rgba(148, 163, 184, 0.35)',
          }}
          onMouseDown={event => event.preventDefault()}
        >
          <button type="button" onClick={() => execCommand('bold')} style={floatingButtonStyle}>
            <Bold size={15} />
          </button>
          <button type="button" onClick={() => execCommand('italic')} style={floatingButtonStyle}>
            <Italic size={15} />
          </button>
          <button type="button" onClick={() => execCommand('underline')} style={floatingButtonStyle}>
            <Underline size={15} />
          </button>
          <span style={{ width: '1px', background: 'rgba(148, 163, 184, 0.45)' }} />
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            style={floatingButtonStyle}
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            style={floatingButtonStyle}
          >
            <ListOrdered size={15} />
          </button>
          <span style={{ width: '1px', background: 'rgba(148, 163, 184, 0.45)' }} />
          <button type="button" onClick={insertLink} style={floatingButtonStyle}>
            <LinkIcon size={15} />
          </button>
        </div>
      )}
      {imageToolbar.visible && (
        <div
          ref={imageToolbarRef}
          style={{
            position: 'fixed',
            top: imageToolbar.top,
            left: imageToolbar.left,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: '#0f172a',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.18)',
            zIndex: 1000,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            minWidth: '220px',
          }}
          onMouseDown={event => event.preventDefault()}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em' }}>
            Ajustar tamanho
          </span>
          <input
            type="range"
            min={20}
            max={100}
            step={5}
            value={imageToolbar.widthPercent}
            onChange={event => handleImageWidthChange(Number(event.target.value))}
            style={{ cursor: 'pointer' }}
          />
        </div>
      )}
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

const floatingButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#ffffff',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '8px',
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

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '14px',
  transition: 'all 0.2s ease-in-out',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '12px',
  padding: 'clamp(10px, 1.8vw, 12px) clamp(12px, 2vw, 14px)',
  fontSize: '14px',
  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
};

export default function AdminAnaliseTecnicaManager() {
  const { planInfo, loading: authLoading } = useAuthAccess();
  const [analises, setAnalises] = useState<AnaliseTecnica[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [slugManual, setSlugManual] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const isEditando = Boolean(formState.id);

  const carregarAnalises = useCallback(async () => {
    if (!planInfo.isAdmin) {
      return;
    }

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
    }
  }, [planInfo.isAdmin]);

  const resetForm = useCallback(() => {
    setFormState(emptyForm);
    setSlugManual(false);
    router.replace('/dashboard/admin/analise-tecnica');
  }, [router]);

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

  const analiseIdFromQuery = searchParams.get('analiseId');

  useEffect(() => {
    if (!analiseIdFromQuery || analises.length === 0) {
      return;
    }

    const analiseSelecionada = analises.find(item => item.id === analiseIdFromQuery);
    if (analiseSelecionada && formState.id !== analiseSelecionada.id) {
      handleEdit(analiseSelecionada);
    }
  }, [analises, analiseIdFromQuery, formState.id, handleEdit]);

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

  const pagePadding = isMobile ? '16px' : isTablet ? '24px' : '32px';
  const headerTitleSize = isMobile ? '26px' : '32px';
  const actionsGap = isMobile ? '8px' : '12px';

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
          margin: isMobile ? '60px auto' : '80px auto',
          padding: isMobile ? '24px' : '32px',
          borderRadius: isMobile ? '16px' : '18px',
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
    <div style={{ padding: pagePadding, background: '#f8fafc', minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          flexDirection: isTablet ? 'column' : 'row',
          alignItems: isTablet ? 'stretch' : 'center',
          justifyContent: isTablet ? 'flex-start' : 'space-between',
          gap: isMobile ? '16px' : '18px',
          marginBottom: isMobile ? '24px' : '32px',
        }}
      >
        <div style={{ display: 'grid', gap: isMobile ? '4px' : '6px' }}>
          <span style={{ fontSize: '12px', letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase' }}>
            Administração
          </span>
          <h1 style={{ margin: 0, fontSize: headerTitleSize, fontWeight: 700 }}>Gestão de Análises Técnicas</h1>
          <p style={{ margin: 0, color: '#475569', fontSize: isMobile ? '14px' : '15px' }}>
            Cadastre e publique análises técnicas profissionais para exibição nos detalhes de ativos.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: actionsGap,
            flexWrap: 'wrap',
            justifyContent: isTablet ? 'flex-start' : 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={resetForm}
            style={{
              border: '1px solid #cbd5f5',
              borderRadius: '12px',
              padding: isMobile ? '10px 14px' : '12px 16px',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            <PlusCircle size={18} /> Nova análise
          </button>

          <Link
            href="/dashboard/admin/analise-tecnica/publicadas"
            style={{
              border: '1px solid #0f172a',
              borderRadius: '12px',
              padding: isMobile ? '10px 14px' : '12px 16px',
              background: '#0f172a',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            Ver análises publicadas
          </Link>
        </div>
      </header>

      {(error || success) && (
        <div style={{ display: 'grid', gap: '12px', marginBottom: isMobile ? '20px' : '24px' }}>
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
          gap: isMobile ? '20px' : '24px',
          gridTemplateColumns: 'minmax(0, 1fr)',
          alignItems: 'flex-start',
        }}
      >
        <form
          onSubmit={salvarAnalise}
          style={{
            background: '#ffffff',
            borderRadius: isMobile ? '18px' : '20px',
            padding: isMobile ? '20px' : '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
            display: 'grid',
            gap: isMobile ? '18px' : '20px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: isMobile ? '12px' : '14px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
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
                borderRadius: isMobile ? '14px' : '16px',
                padding: isMobile ? '16px' : '18px',
                background: '#f8fafc',
                display: 'grid',
                gap: isMobile ? '12px' : '14px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <FileImage size={20} />
                <span style={{ color: '#475569', fontSize: isMobile ? '13px' : '14px' }}>
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
                    padding: isMobile ? '10px 14px' : '10px 16px',
                    borderRadius: '12px',
                    background: '#0f172a',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    fontWeight: 600,
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center',
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
                    padding: isMobile ? '10px 14px' : '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5f5',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center',
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
                    maxHeight: isMobile ? '200px' : '220px',
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
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
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
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
              }}
            >
              <Star size={16} /> {formState.destaque ? 'Em destaque' : 'Marcar destaque'}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: actionsGap,
              justifyContent: isTablet ? 'flex-start' : 'flex-end',
              flexWrap: 'wrap',
            }}
          >
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
                  padding: isMobile ? '10px 14px' : '12px 16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: 'center',
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
                padding: isMobile ? '12px 20px' : '12px 24px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
              }}
            >
              {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
              {saving ? 'Salvando...' : isEditando ? 'Atualizar análise' : 'Publicar análise'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
