'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { useAuthAccess } from '@/hooks/use-auth-access';

interface Lesson {
  title: string;
  duration: string;
  description?: string;
  videoUrl?: string;
  content?: string;
}

interface Module {
  id: string;
  title: string;
  highlight: string;
  releaseDate: string;
  isHidden?: boolean;
  lessons: Lesson[];
}

interface LessonFormState {
  title: string;
  duration: string;
  description: string;
  videoUrl: string;
  content: string;
}

interface NewModuleFormState {
  title: string;
  highlight: string;
  releaseDate: string;
}

function createEmptyLessonForm(): LessonFormState {
  return {
    title: '',
    duration: '',
    description: '',
    videoUrl: '',
    content: ''
  };
}

const initialModules: Module[] = [
  {
    id: 'parte-1',
    title: 'Parte 1 – Fundamentos e Setup',
    highlight: 'Tudo o que você precisa para começar com segurança e dominar a base do mercado de opções.',
    releaseDate: '2024-08-05T09:00:00-03:00',
    lessons: [
      {
        title: 'Como abrir conta na corretora e acessar o Profit',
        duration: '10 min',
        description: 'Passo a passo completo para habilitar o home broker, configurar o Profit e operar sem travar.'
      },
      {
        title: 'O que são opções (call, put, vencimento, strike, exemplos práticos)',
        duration: '20 min',
        description: 'Entenda a lógica por trás das opções com exemplos reais e linguagem simples.'
      },
      {
        title: 'Fatores que influenciam no preço',
        duration: '20 min',
        description: 'Tempo, volatilidade, juros e preço do ativo explicados na prática para você precificar com confiança.'
      }
    ]
  },
  {
    id: 'parte-2',
    title: 'Parte 2 – Operações Básicas',
    highlight: 'Estratégias essenciais para gerar renda com risco controlado.',
    releaseDate: '2024-08-12T09:00:00-03:00',
    lessons: [
      {
        title: 'Como vender put (coberta e descoberta, quando usar cada uma)',
        duration: '10 min',
        description: 'Escolha a estrutura correta para receber prêmios com segurança e saber quando ficar de fora.'
      },
      {
        title: 'Como vender call (coberta e descoberta)',
        duration: '10 min',
        description: 'Passo a passo para operar calls e proteger sua carteira.'
      },
      {
        title: 'Riscos: margem, assignment, liquidez, ajuste de posição',
        duration: '15 min',
        description: 'Aprenda a calcular a margem exigida, lidar com exercício e ajustar operações antes do vencimento.'
      },
      {
        title: 'Pó e exercício (estratégia do pó, exercício automático/manual)',
        duration: '10 min',
        description: 'Entenda como funciona a estratégia do pó e como agir no dia do exercício.'
      }
    ]
  },
  {
    id: 'parte-3',
    title: 'Parte 3 – Estratégia e Análise',
    highlight: 'Combine leitura de mercado com estruturas para turbinar a renda mensal.',
    releaseDate: '2024-08-19T09:00:00-03:00',
    lessons: [
      {
        title: 'Análise técnica básica (suporte, resistência, candles de reversão)',
        duration: '20 min',
        description: 'Identifique zonas de oportunidade e pontos de saída com clareza.'
      },
      {
        title: 'Travas com opções',
        duration: '15 min',
        description: 'Como montar travas de alta e baixa para proteger lucro e reduzir risco.'
      },
      {
        title: '4 estruturas avançadas',
        duration: '15 min',
        description: 'Estratégias selecionadas para cenários específicos com exemplos reais.'
      }
    ]
  },
  {
    id: 'parte-4',
    title: 'Parte 4 – Execução e Diferencial',
    highlight: 'Transforme conhecimento em resultado seguindo o plano sem desviar do método.',
    releaseDate: '2024-08-26T09:00:00-03:00',
    lessons: [
      {
        title: 'Como seguir todas as recomendações (disciplina, gestão de risco, carteira mensal)',
        duration: '15 min',
        description: 'Organize sua rotina semanal, ajuste tamanho de posição e mantenha a consistência.'
      },
      {
        title: 'Como usar IA para analisar opções',
        duration: '10 min',
        description: 'Ferramentas de inteligência artificial para validar cenários e acelerar decisões.'
      }
    ]
  }
];

function formatReleaseDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'Data a definir';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default function CfRendaTurbinadaAulasPage(): React.JSX.Element {
  const router = useRouter();
  const { planInfo } = useAuthAccess();
  const isAdmin = planInfo.isAdmin;
  const [modules, setModules] = React.useState<Module[]>(initialModules);
  const [lessonForms, setLessonForms] = React.useState<Record<string, LessonFormState>>(() =>
    initialModules.reduce<Record<string, LessonFormState>>((acc, module) => {
      acc[module.id] = createEmptyLessonForm();
      return acc;
    }, {})
  );
  const [lessonErrors, setLessonErrors] = React.useState<Record<string, string | null>>({});
  const [openLessonModule, setOpenLessonModule] = React.useState<string | null>(null);
  const [newModuleForm, setNewModuleForm] = React.useState<NewModuleFormState>({
    title: '',
    highlight: '',
    releaseDate: ''
  });
  const [newModuleError, setNewModuleError] = React.useState<string | null>(null);
  const [viewAsStudent, setViewAsStudent] = React.useState(false);
  const [editingLessonKey, setEditingLessonKey] = React.useState<string | null>(null);
  const [editLessonForm, setEditLessonForm] = React.useState<LessonFormState>(createEmptyLessonForm());
  const [editLessonError, setEditLessonError] = React.useState<string | null>(null);

  const visibleModules = React.useMemo(() => {
    if (isAdmin && !viewAsStudent) {
      return modules;
    }

    const now = new Date();

    return modules.filter(module => {
      const releaseDate = new Date(module.releaseDate);
      const isReleased = !Number.isNaN(releaseDate.getTime()) && releaseDate <= now;
      return !module.isHidden && isReleased;
    });
  }, [isAdmin, modules, viewAsStudent]);

  const handleToggleModuleVisibility = React.useCallback((moduleId: string) => {
    setModules(prevModules =>
      prevModules.map(module =>
        module.id === moduleId
          ? {
              ...module,
              isHidden: !module.isHidden
            }
          : module
      )
    );
  }, []);

  const handleLessonFieldChange = React.useCallback((moduleId: string, field: keyof LessonFormState, value: string) => {
    setLessonForms(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] ?? createEmptyLessonForm()),
        [field]: value
      }
    }));
  }, []);

  const handleAddLesson = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>, moduleId: string) => {
      event.preventDefault();
      setLessonErrors(prev => ({ ...prev, [moduleId]: null }));

      const form = lessonForms[moduleId] ?? createEmptyLessonForm();

      if (!form.title.trim() || !form.duration.trim()) {
        setLessonErrors(prev => ({
          ...prev,
          [moduleId]: 'Título e duração são obrigatórios.'
        }));
        return;
      }

      const newLesson: Lesson = {
        title: form.title.trim(),
        duration: form.duration.trim(),
        description: form.description.trim() ? form.description.trim() : undefined,
        videoUrl: form.videoUrl.trim() ? form.videoUrl.trim() : undefined,
        content: form.content.trim() ? form.content.trim() : undefined
      };

      setModules(prevModules =>
        prevModules.map(module =>
          module.id === moduleId
            ? {
                ...module,
                lessons: [...module.lessons, newLesson]
              }
            : module
        )
      );

      setLessonForms(prev => ({
        ...prev,
        [moduleId]: createEmptyLessonForm()
      }));
      setOpenLessonModule(moduleId);
    },
    [lessonForms]
  );

  const handleAddModule = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setNewModuleError(null);

      if (!newModuleForm.title.trim() || !newModuleForm.releaseDate) {
        setNewModuleError('Título e data de liberação são obrigatórios.');
        return;
      }

      const parsedDate = new Date(newModuleForm.releaseDate);
      if (Number.isNaN(parsedDate.getTime())) {
        setNewModuleError('Informe uma data de liberação válida.');
        return;
      }

      const newModule: Module = {
        id: `module-${Date.now()}`,
        title: newModuleForm.title.trim(),
        highlight: newModuleForm.highlight.trim() || 'Conteúdo liberado recentemente.',
        releaseDate: parsedDate.toISOString(),
        isHidden: false,
        lessons: []
      };

      setModules(prevModules => {
        const updatedModules = [...prevModules, newModule];
        return updatedModules.sort((a, b) => {
          const aDate = new Date(a.releaseDate).getTime();
          const bDate = new Date(b.releaseDate).getTime();
          return aDate - bDate;
        });
      });

      setLessonForms(prev => ({
        ...prev,
        [newModule.id]: createEmptyLessonForm()
      }));

      setNewModuleForm({ title: '', highlight: '', releaseDate: '' });
      setOpenLessonModule(newModule.id);
    },
    [newModuleForm]
  );

  const handleNewModuleFieldChange = React.useCallback((field: keyof NewModuleFormState, value: string) => {
    setNewModuleForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleToggleViewMode = React.useCallback(() => {
    setViewAsStudent(prev => !prev);
  }, []);

  const handleDeleteModule = React.useCallback(
    (moduleId: string) => {
      setModules(prevModules => prevModules.filter(module => module.id !== moduleId));
      setLessonForms(prevForms => {
        const { [moduleId]: _deletedForm, ...remainingForms } = prevForms;
        return remainingForms;
      });
      setLessonErrors(prevErrors => {
        const { [moduleId]: _deletedError, ...remainingErrors } = prevErrors;
        return remainingErrors;
      });

      setOpenLessonModule(current => (current === moduleId ? null : current));

      if (editingLessonKey?.startsWith(`${moduleId}-`)) {
        handleCancelEditLesson();
      }
    },
    [editingLessonKey, handleCancelEditLesson]
  );

  const handleStartEditLesson = React.useCallback(
    (moduleId: string, lessonIndex: number) => {
      const module = modules.find(currentModule => currentModule.id === moduleId);
      if (!module) {
        return;
      }

      const lesson = module.lessons[lessonIndex];
      if (!lesson) {
        return;
      }

      setEditLessonForm({
        title: lesson.title,
        duration: lesson.duration,
        description: lesson.description ?? '',
        videoUrl: lesson.videoUrl ?? '',
        content: lesson.content ?? ''
      });
      setEditLessonError(null);
      setEditingLessonKey(`${moduleId}-${lessonIndex}`);
    },
    [modules]
  );

  const handleEditLessonFieldChange = React.useCallback((field: keyof LessonFormState, value: string) => {
    setEditLessonForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleCancelEditLesson = React.useCallback(() => {
    setEditingLessonKey(null);
    setEditLessonError(null);
    setEditLessonForm(createEmptyLessonForm());
  }, []);

  const handleUpdateLesson = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>, moduleId: string, lessonIndex: number) => {
      event.preventDefault();
      setEditLessonError(null);

      if (!editLessonForm.title.trim() || !editLessonForm.duration.trim()) {
        setEditLessonError('Título e duração são obrigatórios.');
        return;
      }

      const updatedLesson: Lesson = {
        title: editLessonForm.title.trim(),
        duration: editLessonForm.duration.trim(),
        description: editLessonForm.description.trim() ? editLessonForm.description.trim() : undefined,
        videoUrl: editLessonForm.videoUrl.trim() ? editLessonForm.videoUrl.trim() : undefined,
        content: editLessonForm.content.trim() ? editLessonForm.content.trim() : undefined
      };

      setModules(prevModules =>
        prevModules.map(module =>
          module.id === moduleId
            ? {
                ...module,
                lessons: module.lessons.map((lesson, index) => (index === lessonIndex ? updatedLesson : lesson))
              }
            : module
        )
      );

      handleCancelEditLesson();
    },
    [editLessonForm, handleCancelEditLesson]
  );

  const handleDeleteLesson = React.useCallback(
    (moduleId: string, lessonIndex: number) => {
      setModules(prevModules =>
        prevModules.map(module =>
          module.id === moduleId
            ? {
                ...module,
                lessons: module.lessons.filter((_, index) => index !== lessonIndex)
              }
            : module
        )
      );

      if (editingLessonKey === `${moduleId}-${lessonIndex}`) {
        handleCancelEditLesson();
      }
    },
    [editingLessonKey, handleCancelEditLesson]
  );

  const renderLesson = React.useCallback(
    (moduleId: string, lesson: Lesson, index: number) => {
      const lessonKey = `${moduleId}-${index}`;
      const isEditing = editingLessonKey === lessonKey;

      return (
        <div
          key={`lesson-${index}-${lesson.title}`}
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {isEditing ? (
            <form
              onSubmit={event => handleUpdateLesson(event, moduleId, index)}
              style={{
                display: 'grid',
                gap: '12px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                Título da aula
                <input
                  type="text"
                  value={editLessonForm.title}
                  onChange={event => handleEditLessonFieldChange('title', event.target.value)}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5f5',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                  required
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                Duração
                <input
                  type="text"
                  value={editLessonForm.duration}
                  onChange={event => handleEditLessonFieldChange('duration', event.target.value)}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5f5',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                  required
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '14px',
                  color: '#0f172a',
                  gridColumn: '1 / -1'
                }}
              >
                Descrição
                <textarea
                  value={editLessonForm.description}
                  onChange={event => handleEditLessonFieldChange('description', event.target.value)}
                  rows={3}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5f5',
                    padding: '10px 14px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                Link do vídeo (opcional)
                <input
                  type="url"
                  value={editLessonForm.videoUrl}
                  onChange={event => handleEditLessonFieldChange('videoUrl', event.target.value)}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5f5',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '14px',
                  color: '#0f172a',
                  gridColumn: '1 / -1'
                }}
              >
                Conteúdo escrito (opcional)
                <textarea
                  value={editLessonForm.content}
                  onChange={event => handleEditLessonFieldChange('content', event.target.value)}
                  rows={4}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5f5',
                    padding: '10px 14px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </label>
              {editLessonError && (
                <div style={{ gridColumn: '1 / -1', color: '#be123c', fontSize: '13px' }}>{editLessonError}</div>
              )}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteLesson(moduleId, index)}
                  style={{
                    border: '1px solid #ef4444',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Excluir aula
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditLesson}
                  style={{
                    border: '1px solid #cbd5f5',
                    backgroundColor: 'transparent',
                    color: '#0f172a',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Salvar alterações
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{lesson.title}</h3>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {lesson.duration}
                </span>
              </div>
              {lesson.description && (
                <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>{lesson.description}</p>
              )}
              {lesson.content && (
                <div
                  style={{
                    backgroundColor: '#e0f2fe',
                    borderRadius: '10px',
                    padding: '12px 16px'
                  }}
                >
                  <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', lineHeight: 1.6 }}>{lesson.content}</p>
                </div>
              )}
              {lesson.videoUrl && (
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0ea5e9'
                  }}
                >
                  Assistir vídeo da aula →
                </a>
              )}
            </>
          )}

          {isAdmin && !isEditing && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleStartEditLesson(moduleId, index)}
                style={{
                  border: '1px solid #0ea5e9',
                  backgroundColor: 'transparent',
                  color: '#0ea5e9',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Editar aula
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLesson(moduleId, index)}
                style={{
                  border: '1px solid #ef4444',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Excluir aula
              </button>
            </div>
          )}
        </div>
      );
    },
    [
      editLessonError,
      editLessonForm,
      editingLessonKey,
      handleCancelEditLesson,
      handleDeleteLesson,
      handleEditLessonFieldChange,
      handleStartEditLesson,
      handleUpdateLesson,
      isAdmin
    ]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '24px'
      }}
    >
      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          type="button"
          onClick={() => router.push('/dashboard/cf-renda-turbinada')}
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
          ← Voltar para o plano
        </button>

        <div>
          <h1
            style={{
              fontSize: '42px',
              fontWeight: 800,
              color: '#1e293b',
              margin: '0 0 12px 0'
            }}
          >
            Aulas do CF Renda Turbinada
          </h1>
          <p
            style={{
              color: '#64748b',
              fontSize: '18px',
              margin: 0,
              maxWidth: '780px',
              lineHeight: 1.6
            }}
          >
            Aulas em vídeo com conteúdo escrito também. Use este roteiro como checklist para acompanhar o plano, revisar conceitos e executar cada etapa com confiança.
          </p>
        </div>
      </div>

      {isAdmin && (
        <div
          style={{
            margin: '0 auto 32px',
            width: '100%',
            maxWidth: '1100px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ fontSize: '16px' }}>Painel do administrador</strong>
                <span style={{ fontSize: '14px', color: '#cbd5f5' }}>
                  Controle a liberação dos módulos conforme o cronograma e adicione aulas extras com vídeos ou materiais de apoio.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleViewMode}
                style={{
                  border: '1px solid #38bdf8',
                  backgroundColor: viewAsStudent ? '#38bdf8' : 'transparent',
                  color: viewAsStudent ? '#0f172a' : '#f8fafc',
                  borderRadius: '9999px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {viewAsStudent ? 'Visualizar como administrador' : 'Visualizar como aluno'}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5f5' }}>
              Os módulos ficam visíveis para os alunos somente a partir da data de liberação e quando o status estiver como "Mostrar conteúdo".
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
            }}
          >
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a' }}>Adicionar novo módulo</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569' }}>
              Informe a data prevista de liberação e um resumo do conteúdo. Depois de criado, você pode incluir aulas individualmente.
            </p>
            <form
              onSubmit={handleAddModule}
              style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                Título do módulo
                <input
                  type="text"
                  value={newModuleForm.title}
                  onChange={event => handleNewModuleFieldChange('title', event.target.value)}
                  placeholder="Ex.: Parte 5 – Estudos de caso"
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5f5',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                  required
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                Data de liberação
                <input
                  type="datetime-local"
                  value={newModuleForm.releaseDate}
                  onChange={event => handleNewModuleFieldChange('releaseDate', event.target.value)}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5f5',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                  required
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '14px',
                  color: '#0f172a',
                  gridColumn: '1 / -1'
                }}
              >
                Destaque do módulo
                <textarea
                  value={newModuleForm.highlight}
                  onChange={event => handleNewModuleFieldChange('highlight', event.target.value)}
                  placeholder="Descreva o principal objetivo e ganhos deste módulo."
                  rows={3}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5f5',
                    padding: '10px 14px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </label>
              {newModuleError && (
                <div style={{ gridColumn: '1 / -1', color: '#be123c', fontSize: '13px' }}>{newModuleError}</div>
              )}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Criar módulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto 48px' }}>
        {visibleModules.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              textAlign: 'center'
            }}
          >
            <h2 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '20px' }}>
              {isAdmin && !viewAsStudent ? 'Nenhum módulo cadastrado ainda.' : 'Os conteúdos serão liberados em breve.'}
            </h2>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
              {isAdmin && !viewAsStudent
                ? 'Utilize o formulário acima para criar novos módulos e adicionar aulas.'
                : 'Fique de olho! Assim que um novo módulo for liberado ele aparecerá automaticamente por aqui.'}
            </p>
          </div>
        ) : (
          visibleModules.map(module => {
            const now = new Date();
            const releaseDate = new Date(module.releaseDate);
            const releaseIsValid = !Number.isNaN(releaseDate.getTime());
            const isReleased = releaseIsValid && releaseDate <= now;
            const isHidden = Boolean(module.isHidden);

            return (
              <div
                key={module.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '28px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {module.title}
                    </span>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            backgroundColor: isHidden ? '#fee2e2' : isReleased ? '#dcfce7' : '#fef3c7',
                            color: isHidden ? '#b91c1c' : isReleased ? '#166534' : '#b45309',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          {isHidden ? 'Oculto para alunos' : isReleased ? 'Disponível para alunos' : 'Agendado'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#475569' }}>
                          Liberação: {formatReleaseDate(module.releaseDate)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleModuleVisibility(module.id)}
                          style={{
                            border: '1px solid #0f172a',
                            backgroundColor: isHidden ? '#0f172a' : 'transparent',
                            color: isHidden ? '#f8fafc' : '#0f172a',
                            borderRadius: '9999px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isHidden ? 'Mostrar conteúdo' : 'Ocultar conteúdo'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(module.id)}
                          style={{
                            border: '1px solid #ef4444',
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            borderRadius: '9999px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Excluir módulo
                        </button>
                      </div>
                    )}
                  </div>
                  <p style={{ margin: 0, color: '#1e293b', fontSize: '18px', lineHeight: 1.6 }}>{module.highlight}</p>
                  {!isAdmin && !isReleased && (
                    <div
                      style={{
                        borderRadius: '10px',
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        padding: '12px 16px',
                        fontSize: '14px'
                      }}
                    >
                      Este módulo ficará disponível em {formatReleaseDate(module.releaseDate)}.
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {module.lessons.length === 0 ? (
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px dashed #cbd5f5',
                        backgroundColor: '#f8fafc',
                        textAlign: 'center'
                      }}
                    >
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        Nenhuma aula cadastrada ainda.
                      </p>
                    </div>
                  ) : (
                    module.lessons.map((lesson, index) => renderLesson(module.id, lesson, index))
                  )}
                </div>

                {isAdmin && (
                  <div
                    style={{
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenLessonModule(current => (current === module.id ? null : module.id))}
                      style={{
                        alignSelf: 'flex-start',
                        border: '1px solid #0ea5e9',
                        backgroundColor: openLessonModule === module.id ? '#0ea5e9' : 'transparent',
                        color: openLessonModule === module.id ? '#0f172a' : '#0ea5e9',
                        borderRadius: '9999px',
                        padding: '10px 18px',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {openLessonModule === module.id ? 'Fechar formulário' : 'Adicionar aula a este módulo'}
                    </button>

                    {openLessonModule === module.id && (
                      <form
                        onSubmit={event => handleAddLesson(event, module.id)}
                        style={{
                          display: 'grid',
                          gap: '16px',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          backgroundColor: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #cbd5f5',
                          padding: '20px'
                        }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                          Título da aula
                          <input
                            type="text"
                            value={lessonForms[module.id]?.title ?? ''}
                            onChange={event => handleLessonFieldChange(module.id, 'title', event.target.value)}
                            placeholder="Ex.: Aula bônus com convidado"
                            style={{
                              borderRadius: '10px',
                              border: '1px solid #cbd5f5',
                              padding: '10px 14px',
                              fontSize: '14px'
                            }}
                            required
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                          Duração
                          <input
                            type="text"
                            value={lessonForms[module.id]?.duration ?? ''}
                            onChange={event => handleLessonFieldChange(module.id, 'duration', event.target.value)}
                            placeholder="Ex.: 12 min"
                            style={{
                              borderRadius: '10px',
                              border: '1px solid #cbd5f5',
                              padding: '10px 14px',
                              fontSize: '14px'
                            }}
                            required
                          />
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            fontSize: '14px',
                            color: '#0f172a',
                            gridColumn: '1 / -1'
                          }}
                        >
                          Descrição
                          <textarea
                            value={lessonForms[module.id]?.description ?? ''}
                            onChange={event => handleLessonFieldChange(module.id, 'description', event.target.value)}
                            placeholder="Explique o que será abordado nesta aula."
                            rows={3}
                            style={{
                              borderRadius: '10px',
                              border: '1px solid #cbd5f5',
                              padding: '10px 14px',
                              fontSize: '14px',
                              resize: 'vertical'
                            }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                          Link do vídeo (opcional)
                          <input
                            type="url"
                            value={lessonForms[module.id]?.videoUrl ?? ''}
                            onChange={event => handleLessonFieldChange(module.id, 'videoUrl', event.target.value)}
                            placeholder="https://..."
                            style={{
                              borderRadius: '10px',
                              border: '1px solid #cbd5f5',
                              padding: '10px 14px',
                              fontSize: '14px'
                            }}
                          />
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            fontSize: '14px',
                            color: '#0f172a',
                            gridColumn: '1 / -1'
                          }}
                        >
                          Conteúdo escrito (opcional)
                          <textarea
                            value={lessonForms[module.id]?.content ?? ''}
                            onChange={event => handleLessonFieldChange(module.id, 'content', event.target.value)}
                            placeholder="Cole aqui materiais de apoio, links e observações importantes."
                            rows={4}
                            style={{
                              borderRadius: '10px',
                              border: '1px solid #cbd5f5',
                              padding: '10px 14px',
                              fontSize: '14px',
                              resize: 'vertical'
                            }}
                          />
                        </label>
                        {lessonErrors[module.id] && (
                          <div style={{ gridColumn: '1 / -1', color: '#be123c', fontSize: '13px' }}>{lessonErrors[module.id]}</div>
                        )}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setLessonForms(prev => ({
                                ...prev,
                                [module.id]: createEmptyLessonForm()
                              }))
                            }
                            style={{
                              border: '1px solid #cbd5f5',
                              backgroundColor: 'transparent',
                              color: '#0f172a',
                              borderRadius: '10px',
                              padding: '10px 18px',
                              fontWeight: 600,
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            Limpar campos
                          </button>
                          <button
                            type="submit"
                            style={{
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '14px',
                              padding: '12px 20px',
                              borderRadius: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Adicionar aula
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 700 }}>Próximos passos</h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '16px', lineHeight: 1.6 }}>
          Após assistir às aulas, acesse a Carteira Recomendada para acompanhar as operações sugeridas e configure alertas no Profit
          para executar os movimentos com disciplina. Se pintar qualquer dúvida, marque os minutos da aula e envie para o suporte.
        </p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/cf-renda-turbinada/carteira-recomendada')}
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            border: 'none',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '14px',
            padding: '12px 20px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          Ver Carteira Recomendada →
        </button>
      </div>
    </div>
  );
}
