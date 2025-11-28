'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { RichTextEditor } from '@/components/rich-text-editor';
import { useAuthAccess } from '@/hooks/use-auth-access';

interface LessonMaterial {
  id: number;
  title: string;
  fileUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Lesson {
  id?: number;
  title: string;
  duration: string;
  description?: string;
  videoUrl?: string;
  content?: string;
  sortOrder?: number;
  materials: LessonMaterial[];
}

interface Module {
  id: string;
  title: string;
  highlight?: string;
  releaseDate: string;
  isHidden?: boolean;
  sortOrder?: number;
  lessons: Lesson[];
  isReleased?: boolean;
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

type VideoProvider = 'vimeo' | 'youtube';

interface VideoEmbedConfig {
  src: string;
  provider: VideoProvider;
}

function parseYouTubeStartParam(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^\d+$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const timePattern = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i;
  const match = trimmedValue.match(timePattern);

  if (!match || match[0].length === 0) {
    return null;
  }

  const hours = match[1] ? Number.parseInt(match[1], 10) : 0;
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  const seconds = match[3] ? Number.parseInt(match[3], 10) : 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return totalSeconds > 0 ? String(totalSeconds) : null;
}

function getVideoEmbedConfig(videoUrl?: string): VideoEmbedConfig | null {
  if (!videoUrl) {
    return null;
  }

  const trimmedUrl = videoUrl.trim();

  if (!trimmedUrl) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedUrl);
  } catch (error) {
    console.error('URL de vídeo inválida:', error);
    return null;
  }

  const host = parsedUrl.hostname.replace(/^www\./, '');

  // Vimeo: player.vimeo.com (já embedded)
  if (host === 'player.vimeo.com') {
    if (parsedUrl.pathname.includes('/video/')) {
      return {
        src: `https://player.vimeo.com${parsedUrl.pathname}${parsedUrl.search}`,
        provider: 'vimeo'
      };
    }
    return null;
  }

  // Vimeo: vimeo.com/event/XXX/embed/YYY (eventos privados)
  if (host.endsWith('vimeo.com')) {
    // Formato: /event/123456/embed/abcd1234
    const eventMatch = parsedUrl.pathname.match(/\/event\/\d+\/embed\/([a-zA-Z0-9]+)/);
    if (eventMatch) {
      return {
        src: `https://player.vimeo.com/video/${eventMatch[1]}${parsedUrl.search}`,
        provider: 'vimeo'
      };
    }

    // Formato padrão: /123456789
    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const videoId = segments.pop();

    if (videoId && /^\d+$/.test(videoId)) {
      return {
        src: `https://player.vimeo.com/video/${videoId}${parsedUrl.search}`,
        provider: 'vimeo'
      };
    }
  }

  // YouTube: youtu.be
  if (host === 'youtu.be') {
    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const videoId = segments.pop();

    if (videoId) {
      const params = new URLSearchParams();
      const startParam = parseYouTubeStartParam(parsedUrl.searchParams.get('t') ?? parsedUrl.searchParams.get('start'));

      if (startParam) {
        params.set('start', startParam);
      }

      const query = params.toString();

      return {
        src: `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ''}`,
        provider: 'youtube'
      };
    }
  }

  // YouTube: youtube.com
  if (host.endsWith('youtube.com')) {
    if (parsedUrl.pathname.startsWith('/embed/')) {
      return {
        src: `https://www.youtube.com${parsedUrl.pathname}${parsedUrl.search}`,
        provider: 'youtube'
      };
    }

    const videoId = parsedUrl.searchParams.get('v');

    if (videoId) {
      const params = new URLSearchParams();
      const listParam = parsedUrl.searchParams.get('list');
      const startParam = parseYouTubeStartParam(parsedUrl.searchParams.get('t') ?? parsedUrl.searchParams.get('start'));

      if (listParam) {
        params.set('list', listParam);
      }

      if (startParam) {
        params.set('start', startParam);
      }

      const query = params.toString();

      return {
        src: `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ''}`,
        provider: 'youtube'
      };
    }
  }

  return null;
}

function enhanceEmbedSrc(config: VideoEmbedConfig): string {
  try {
    const embedUrl = new URL(config.src);

    if (config.provider === 'vimeo') {
      embedUrl.searchParams.set('title', '0');
      embedUrl.searchParams.set('byline', '0');
      embedUrl.searchParams.set('portrait', '0');
      embedUrl.searchParams.set('transparent', '0');
    }

    if (config.provider === 'youtube') {
      if (!embedUrl.searchParams.has('rel')) {
        embedUrl.searchParams.set('rel', '0');
      }

      embedUrl.searchParams.set('modestbranding', '1');
    }

    return embedUrl.toString();
  } catch (error) {
    console.error('Não foi possível ajustar a URL de incorporação do vídeo:', error);
    return config.src;
  }
}


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

function sortMaterialsByDate(materials: LessonMaterial[] = []): LessonMaterial[] {
  return [...materials].sort((materialA, materialB) => {
    const dateA = materialA.createdAt ? new Date(materialA.createdAt).getTime() : 0;
    const dateB = materialB.createdAt ? new Date(materialB.createdAt).getTime() : 0;

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    return materialA.title.localeCompare(materialB.title);
  });
}

function sortLessonsByOrder(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((lessonA, lessonB) => {
    const orderA = lessonA.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = lessonB.sortOrder ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return lessonA.title.localeCompare(lessonB.title);
  });
}

function sortModulesBySchedule(modules: Module[]): Module[] {
  return [...modules].sort((moduleA, moduleB) => {
    const releaseA = new Date(moduleA.releaseDate).getTime();
    const releaseB = new Date(moduleB.releaseDate).getTime();
    const hasValidReleaseA = !Number.isNaN(releaseA);
    const hasValidReleaseB = !Number.isNaN(releaseB);

    if (hasValidReleaseA && hasValidReleaseB && releaseA !== releaseB) {
      return releaseA - releaseB;
    }

    if (hasValidReleaseA && !hasValidReleaseB) {
      return -1;
    }

    if (!hasValidReleaseA && hasValidReleaseB) {
      return 1;
    }

    const orderA = moduleA.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = moduleB.sortOrder ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return moduleA.title.localeCompare(moduleB.title);
  });
}

// Data de liberação geral do conteúdo
const CONTENT_RELEASE_DATE = new Date('2025-12-10T00:00:00-03:00');

export default function BastidoresDaBolsaPage(): React.JSX.Element {
  const router = useRouter();
  const { planInfo } = useAuthAccess();
  const isAdmin = planInfo.isAdmin;
  const [modules, setModules] = React.useState<Module[]>([]);
  const [lessonForms, setLessonForms] = React.useState<Record<string, LessonFormState>>({});
  const [lessonErrors, setLessonErrors] = React.useState<Record<string, string | null>>({});
  const [materialUploadState, setMaterialUploadState] = React.useState<
    Record<number, { isUploading: boolean; error: string | null }>
  >({});
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [editingModuleId, setEditingModuleId] = React.useState<string | null>(null);
const [editModuleForm, setEditModuleForm] = React.useState<{
  title: string;
  highlight: string;
  releaseDate: string;
}>({
  title: '',
  highlight: '',
  releaseDate: ''
});
const [editModuleError, setEditModuleError] = React.useState<string | null>(null);
  
  const normalizeModule = React.useCallback((module: Module): Module => ({
    ...module,
    highlight: module.highlight ?? '',
    isHidden: Boolean(module.isHidden),
    lessons: sortLessonsByOrder(module.lessons ?? []).map(lesson => ({
      ...lesson,
      description: lesson.description ?? '',
      content: lesson.content ?? '',
      materials: sortMaterialsByDate(lesson.materials ?? [])
    }))
  }), []);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchModulesData(): Promise<void> {
      setIsLoading(true);
      setFetchError(null);

      try {
        const response = await fetch('/api/bastidores-da-bolsa/modules');
        const data = (await response.json().catch(() => null)) as { modules?: Module[]; error?: string } | null;

        if (!response.ok || !data || !Array.isArray(data.modules)) {
          const message = data?.error ?? 'Erro ao carregar módulos.';
          throw new Error(message);
        }

        if (!isMounted) {
          return;
        }

        setModules(sortModulesBySchedule(data.modules.map(normalizeModule)));
      } catch (error) {
        console.error('Erro ao carregar módulos:', error);

        if (isMounted) {
          setFetchError(error instanceof Error ? error.message : 'Erro ao carregar módulos.');
          setModules([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchModulesData();

    return () => {
      isMounted = false;
    };
  }, [normalizeModule]);

  React.useEffect(() => {
    setLessonForms(prevForms => {
      const nextForms: Record<string, LessonFormState> = {};

      modules.forEach(module => {
        nextForms[module.id] = prevForms[module.id] ?? createEmptyLessonForm();
      });

      return nextForms;
    });

    setLessonErrors(prevErrors => {
      const nextErrors: Record<string, string | null> = {};

      modules.forEach(module => {
        if (prevErrors[module.id]) {
          nextErrors[module.id] = prevErrors[module.id];
        }
      });

      return nextErrors;
    });
  }, [modules]);

  const visibleModules = React.useMemo(() => {
    if (isAdmin && !viewAsStudent) {
      return modules;
    }

    const now = new Date();

    return modules
      .filter(module => !module.isHidden) // Remove apenas os ocultos
      .map(module => {
        const releaseDate = new Date(module.releaseDate);
        const isReleased = !Number.isNaN(releaseDate.getTime()) && releaseDate <= now;

        return {
          ...module,
          isReleased // Adiciona flag para saber se está liberado
        };
      });
  }, [isAdmin, modules, viewAsStudent]);

  const handleToggleModuleVisibility = React.useCallback(
    async (moduleId: string, currentIsHidden: boolean) => {
      setIsSaving(true);

      try {
        const response = await fetch(`/api/bastidores-da-bolsa/modules/${moduleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isHidden: !currentIsHidden })
        });

        const data = (await response.json().catch(() => null)) as { module?: Module; error?: string } | null;

        if (!response.ok || !data?.module) {
          const message = data?.error ?? 'Erro ao atualizar módulo.';
          throw new Error(message);
        }

        setModules(prevModules =>
          sortModulesBySchedule(
            prevModules.map(module => (module.id === moduleId ? normalizeModule(data.module) : module))
          )
        );
      } catch (error) {
        console.error('Erro ao atualizar visibilidade:', error);
        alert(error instanceof Error ? error.message : 'Erro ao atualizar módulo. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    },
    [normalizeModule]
  );

  const handleLessonFieldChange = React.useCallback((moduleId: string, field: keyof LessonFormState, value: string) => {
    setLessonForms(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] ?? createEmptyLessonForm()),
        [field]: value
      }
    }));
  }, []);

  const handleUploadMaterial = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>, lessonId: number) => {
      event.preventDefault();
      const form = event.currentTarget;

      setMaterialUploadState(prev => ({
        ...prev,
        [lessonId]: { isUploading: true, error: null }
      }));

      try {
        const formData = new FormData(form);
        const file = formData.get('file');

        if (!(file instanceof File) || file.size === 0) {
          throw new Error('Selecione um arquivo para anexar.');
        }

        const title = formData.get('title');
        if (typeof title === 'string') {
          formData.set('title', title.trim());
        }

        const response = await fetch(`/api/bastidores-da-bolsa/lessons/${lessonId}/materials`, {
          method: 'POST',
          body: formData
        });

        const data = (await response.json().catch(() => null)) as
          | { material?: LessonMaterial; error?: string }
          | null;

        if (!response.ok || !data?.material) {
          const message = data?.error ?? 'Erro ao anexar material.';
          throw new Error(message);
        }

        const normalizedMaterial: LessonMaterial = {
          ...data.material
        };

        setModules(prevModules =>
          prevModules.map(module => ({
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    materials: sortMaterialsByDate([...lesson.materials, normalizedMaterial])
                  }
                : lesson
            )
          }))
        );

        form.reset();

        setMaterialUploadState(prev => ({
          ...prev,
          [lessonId]: { isUploading: false, error: null }
        }));
      } catch (error) {
        console.error('Erro ao anexar material:', error);
        setMaterialUploadState(prev => ({
          ...prev,
          [lessonId]: {
            isUploading: false,
            error: error instanceof Error ? error.message : 'Erro ao anexar material. Tente novamente.'
          }
        }));
      }
    },
    []
  );

  const handleDeleteMaterial = React.useCallback(
    async (lessonId: number, materialId: number) => {
      setMaterialUploadState(prev => ({
        ...prev,
        [lessonId]: { isUploading: true, error: null }
      }));

      try {
        const response = await fetch(`/api/bastidores-da-bolsa/materials/${materialId}`, {
          method: 'DELETE'
        });

        const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

        if (!response.ok || !data?.success) {
          const message = data?.error ?? 'Erro ao remover material.';
          throw new Error(message);
        }

        setModules(prevModules =>
          prevModules.map(module => ({
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    materials: lesson.materials.filter(material => material.id !== materialId)
                  }
                : lesson
            )
          }))
        );

        setMaterialUploadState(prev => ({
          ...prev,
          [lessonId]: { isUploading: false, error: null }
        }));
      } catch (error) {
        console.error('Erro ao remover material:', error);
        setMaterialUploadState(prev => ({
          ...prev,
          [lessonId]: {
            isUploading: false,
            error: error instanceof Error ? error.message : 'Erro ao remover material. Tente novamente.'
          }
        }));
      }
    },
    []
  );

  const handleAddLesson = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>, moduleId: string) => {
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

      setIsSaving(true);

      try {
        const response = await fetch(`/api/bastidores-da-bolsa/modules/${moduleId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            duration: form.duration.trim(),
            description: form.description.trim() || undefined,
            videoUrl: form.videoUrl.trim() || undefined,
            content: form.content.trim() || undefined
          })
        });

        const data = (await response.json().catch(() => null)) as { lesson?: Lesson; error?: string } | null;

        if (!response.ok || !data?.lesson) {
          const message = data?.error ?? 'Erro ao adicionar aula.';
          throw new Error(message);
        }

        const normalizedLesson: Lesson = {
          ...data.lesson,
          description: data.lesson.description ?? '',
          content: data.lesson.content ?? '',
          materials: sortMaterialsByDate(data.lesson.materials ?? [])
        };

        setModules(prevModules =>
          prevModules.map(module =>
            module.id === moduleId
              ? {
                  ...module,
                  lessons: sortLessonsByOrder([...module.lessons, normalizedLesson])
                }
              : module
          )
        );

        setLessonForms(prev => ({
          ...prev,
          [moduleId]: createEmptyLessonForm()
        }));
        setOpenLessonModule(moduleId);
      } catch (error) {
        console.error('Erro ao adicionar aula:', error);
        setLessonErrors(prev => ({
          ...prev,
          [moduleId]: error instanceof Error ? error.message : 'Erro ao adicionar aula. Tente novamente.'
        }));
      } finally {
        setIsSaving(false);
      }
    },
    [lessonForms]
  );

  const handleAddModule = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
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

      setIsSaving(true);

      try {
        const response = await fetch('/api/bastidores-da-bolsa/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newModuleForm.title.trim(),
            highlight: newModuleForm.highlight.trim(),
            releaseDate: parsedDate.toISOString()
          })
        });

        const data = (await response.json().catch(() => null)) as { module?: Module; error?: string } | null;

        if (!response.ok || !data?.module) {
          const message = data?.error ?? 'Erro ao criar módulo.';
          throw new Error(message);
        }

        setModules(prevModules => sortModulesBySchedule([...prevModules, normalizeModule(data.module)]));
        setNewModuleForm({ title: '', highlight: '', releaseDate: '' });
        setOpenLessonModule(data.module.id);
      } catch (error) {
        console.error('Erro ao criar módulo:', error);
        setNewModuleError(error instanceof Error ? error.message : 'Erro ao criar módulo. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    },
    [newModuleForm, normalizeModule]
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

  const handleStartEditModule = React.useCallback(
  (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const releaseDate = new Date(module.releaseDate);
    const localDateTime = new Date(releaseDate.getTime() - releaseDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setEditModuleForm({
      title: module.title,
      highlight: module.highlight || '',
      releaseDate: localDateTime
    });
    setEditModuleError(null);
    setEditingModuleId(moduleId);
  },
  [modules]
);

const handleEditModuleFieldChange = React.useCallback((field: keyof typeof editModuleForm, value: string) => {
  setEditModuleForm(prev => ({
    ...prev,
    [field]: value
  }));
}, []);

const handleCancelEditModule = React.useCallback(() => {
  setEditingModuleId(null);
  setEditModuleError(null);
  setEditModuleForm({ title: '', highlight: '', releaseDate: '' });
}, []);

const handleUpdateModule = React.useCallback(
  async (event: React.FormEvent<HTMLFormElement>, moduleId: string) => {
    event.preventDefault();
    setEditModuleError(null);

    if (!editModuleForm.title.trim() || !editModuleForm.releaseDate) {
      setEditModuleError('Título e data de liberação são obrigatórios.');
      return;
    }

    const parsedDate = new Date(editModuleForm.releaseDate);
    if (Number.isNaN(parsedDate.getTime())) {
      setEditModuleError('Informe uma data de liberação válida.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/bastidores-da-bolsa/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editModuleForm.title.trim(),
          highlight: editModuleForm.highlight.trim(),
          releaseDate: parsedDate.toISOString()
        })
      });

      const data = (await response.json().catch(() => null)) as { module?: Module; error?: string } | null;

      if (!response.ok || !data?.module) {
        const message = data?.error ?? 'Erro ao atualizar módulo.';
        throw new Error(message);
      }

      setModules(prevModules =>
        sortModulesBySchedule(
          prevModules.map(module => (module.id === moduleId ? normalizeModule(data.module) : module))
        )
      );

      handleCancelEditModule();
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      setEditModuleError(error instanceof Error ? error.message : 'Erro ao atualizar módulo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  },
  [editModuleForm, handleCancelEditModule, normalizeModule]
);

  const handleCancelEditLesson = React.useCallback(() => {
    setEditingLessonKey(null);
    setEditLessonError(null);
    setEditLessonForm(createEmptyLessonForm());
  }, []);

  const handleDeleteModule = React.useCallback(
    async (moduleId: string) => {
      if (!confirm('Tem certeza que deseja excluir este módulo e todas as suas aulas?')) {
        return;
      }

      setIsSaving(true);

      try {
        const response = await fetch(`/api/bastidores-da-bolsa/modules/${moduleId}`, {
          method: 'DELETE'
        });

        const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

        if (!response.ok) {
          const message = data?.error ?? 'Erro ao excluir módulo.';
          throw new Error(message);
        }

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
      } catch (error) {
        console.error('Erro ao excluir módulo:', error);
        alert(error instanceof Error ? error.message : 'Erro ao excluir módulo. Tente novamente.');
      } finally {
        setIsSaving(false);
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

  const handleUpdateLesson = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>, moduleId: string, lessonIndex: number) => {
      event.preventDefault();
      setEditLessonError(null);

      if (!editLessonForm.title.trim() || !editLessonForm.duration.trim()) {
        setEditLessonError('Título e duração são obrigatórios.');
        return;
      }

      const module = modules.find(currentModule => currentModule.id === moduleId);
      const lesson = module?.lessons[lessonIndex];

      if (!lesson || typeof lesson.id !== 'number') {
        setEditLessonError('Aula não encontrada.');
        return;
      }

      setIsSaving(true);

      try {
        const response = await fetch(`/api/bastidores-da-bolsa/lessons/${lesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editLessonForm.title.trim(),
            duration: editLessonForm.duration.trim(),
            description: editLessonForm.description.trim() || undefined,
            videoUrl: editLessonForm.videoUrl.trim() || undefined,
            content: editLessonForm.content.trim() || undefined
          })
        });

        const data = (await response.json().catch(() => null)) as { lesson?: Lesson; error?: string } | null;

        if (!response.ok || !data?.lesson) {
          const message = data?.error ?? 'Erro ao atualizar aula.';
          throw new Error(message);
        }

        const normalizedLesson: Lesson = {
          ...data.lesson,
          description: data.lesson.description ?? '',
          content: data.lesson.content ?? '',
          materials: sortMaterialsByDate(data.lesson.materials ?? [])
        };

        setModules(prevModules =>
          prevModules.map(currentModule =>
            currentModule.id === moduleId
              ? {
                  ...currentModule,
                  lessons: sortLessonsByOrder(
                    currentModule.lessons.map(existingLesson =>
                      existingLesson.id === lesson.id ? normalizedLesson : existingLesson
                    )
                  )
                }
              : currentModule
          )
        );

        handleCancelEditLesson();
      } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        setEditLessonError(error instanceof Error ? error.message : 'Erro ao atualizar aula. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    },
    [editLessonForm, handleCancelEditLesson, modules]
  );

  const handleDeleteLesson = React.useCallback(
    async (moduleId: string, lessonIndex: number) => {
      if (!confirm('Tem certeza que deseja excluir esta aula?')) {
        return;
      }

      const module = modules.find(currentModule => currentModule.id === moduleId);
      const lesson = module?.lessons[lessonIndex];

      if (!lesson || typeof lesson.id !== 'number') {
        return;
      }

      setIsSaving(true);

      try {
        const response = await fetch(`/api/bastidores-da-bolsa/lessons/${lesson.id}`, {
          method: 'DELETE'
        });

        const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

        if (!response.ok) {
          const message = data?.error ?? 'Erro ao excluir aula.';
          throw new Error(message);
        }

        setModules(prevModules =>
          prevModules.map(currentModule =>
            currentModule.id === moduleId
              ? {
                  ...currentModule,
                  lessons: currentModule.lessons.filter(existingLesson => existingLesson.id !== lesson.id)
                }
              : currentModule
          )
        );

        setMaterialUploadState(prevState => {
          const nextState = { ...prevState };
          delete nextState[lesson.id];
          return nextState;
        });

        if (editingLessonKey === `${moduleId}-${lessonIndex}`) {
          handleCancelEditLesson();
        }
      } catch (error) {
        console.error('Erro ao excluir aula:', error);
        alert(error instanceof Error ? error.message : 'Erro ao excluir aula. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    },
    [modules, editingLessonKey, handleCancelEditLesson, setMaterialUploadState]
  );

  const renderLesson = React.useCallback(
    (moduleId: string, lesson: Lesson, index: number) => {
      const lessonKey = `${moduleId}-${index}`;
      const isEditing = editingLessonKey === lessonKey;
      const embedConfig = getVideoEmbedConfig(lesson.videoUrl);
      const enhancedEmbedSrc = embedConfig ? enhanceEmbedSrc(embedConfig) : null;
      const uploadState =
        typeof lesson.id === 'number' ? materialUploadState[lesson.id] : undefined;
      const isMaterialUploading = uploadState?.isUploading ?? false;
      const materialError = uploadState?.error ?? null;

      return (
        <div
          key={lesson.id ? `lesson-${lesson.id}` : `lesson-${moduleId}-${index}`}
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
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
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
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
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
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <RichTextEditor
                  value={editLessonForm.description}
                  onChange={value => handleEditLessonFieldChange('description', value)}
                  label="Descrição"
                  minHeight="180px"
                />
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
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
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <RichTextEditor
                  value={editLessonForm.content}
                  onChange={value => handleEditLessonFieldChange('content', value)}
                  label="Conteúdo escrito (opcional)"
                  minHeight="200px"
                />
              </div>
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
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1
                  }}
                  disabled={isSaving}
                >
                  Excluir aula
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditLesson}
                  style={{
                    border: '1px solid #cbd5f5',
                    backgroundColor: 'transparent',
                    color: '#010101',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1
                  }}
                  disabled={isSaving}
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
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.85 : 1
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#010101' }}>{lesson.title}</h3>
              </div>
              {lesson.description && lesson.description.trim().length > 0 && (
                <div
                  style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: lesson.description }}
                />
              )}
              {enhancedEmbedSrc && (
                <div
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#010101'
                  }}
                >
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={enhancedEmbedSrc}
                      title={`Vídeo da aula ${lesson.title}`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0
                      }}
                    />
                  </div>
                </div>
              )}
              {lesson.content && lesson.content.trim().length > 0 && (
                <div
                  style={{
                    backgroundColor: '#e0f2fe',
                    borderRadius: '10px',
                    padding: '12px 16px'
                  }}
                >
                  <div
                    style={{ margin: 0, color: '#010101', fontSize: '14px', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                  />
                </div>
              )}
              {lesson.materials.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '10px',
                    padding: '12px 16px'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    Materiais para download
                  </span>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      color: '#0369a1',
                      fontSize: '14px'
                    }}
                  >
                    {lesson.materials.map(material => (
                      <li key={material.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {material.title}
                        </a>
                        {isAdmin && typeof lesson.id === 'number' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(lesson.id!, material.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              fontSize: '12px',
                              cursor: isMaterialUploading ? 'not-allowed' : 'pointer',
                              opacity: isMaterialUploading ? 0.6 : 1
                            }}
                            disabled={isMaterialUploading}
                          >
                            Remover
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {isAdmin && typeof lesson.id === 'number' && (
                <form
                  onSubmit={event => handleUploadMaterial(event, lesson.id!)}
                  style={{
                    display: 'grid',
                    gap: '12px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    border: '1px dashed #93c5fd'
                  }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#010101' }}>
                    Título do material (opcional)
                    <input
                      type="text"
                      name="title"
                      placeholder="Ex.: PDF de apoio da aula"
                      style={{
                        borderRadius: '10px',
                        border: '1px solid #cbd5f5',
                        padding: '10px 14px',
                        fontSize: '14px'
                      }}
                      disabled={isMaterialUploading}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#010101' }}>
                    Arquivo
                    <input
                      type="file"
                      name="file"
                      accept=".pdf,image/*"
                      style={{
                        borderRadius: '10px',
                        border: '1px solid #cbd5f5',
                        padding: '10px 14px',
                        fontSize: '14px',
                        backgroundColor: '#f8fafc'
                      }}
                      required
                      disabled={isMaterialUploading}
                    />
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                    <button
                      type="submit"
                      style={{
                        alignSelf: 'flex-start',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '14px',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        cursor: isMaterialUploading ? 'not-allowed' : 'pointer',
                        opacity: isMaterialUploading ? 0.7 : 1
                      }}
                      disabled={isMaterialUploading}
                    >
                      {isMaterialUploading ? 'Enviando material...' : 'Anexar material'}
                    </button>
                    {materialError && (
                      <span style={{ color: '#dc2626', fontSize: '13px' }}>{materialError}</span>
                    )}
                  </div>
                </form>
              )}
              {!enhancedEmbedSrc && lesson.videoUrl && (
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
                  border: '1px solid #010101',
                  backgroundColor: 'transparent',
                  color: '#010101',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
                disabled={isSaving}
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
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
                disabled={isSaving}
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
      handleDeleteMaterial,
      handleEditLessonFieldChange,
      handleStartEditLesson,
      handleUpdateLesson,
      handleUploadMaterial,
      isAdmin,
      isSaving,
      materialUploadState
    ]
  );

  // Se o conteúdo não foi liberado, mostrar mensagem de bloqueio para todos
  if (!isContentReleased) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '48px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            textAlign: 'center',
            maxWidth: '600px'
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#1e293b',
              margin: '0 0 16px 0'
            }}
          >
            Conteúdo em breve
          </h1>
          <p
            style={{
              color: '#64748b',
              fontSize: '18px',
              margin: '0 0 24px 0',
              lineHeight: 1.6
            }}
          >
            As aulas do Bastidores da Bolsa serão liberadas em:
          </p>
          <div
            style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              padding: '20px 24px',
              borderRadius: '12px',
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '24px'
            }}
          >
            {formatReleaseDate(CONTENT_RELEASE_DATE.toISOString())}
          </div>
          <p
            style={{
              color: '#64748b',
              fontSize: '16px',
              margin: 0,
              lineHeight: 1.6
            }}
          >
            Fique de olho! Assim que a data chegar, todo o conteúdo estará disponível automaticamente.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/cf-renda-turbinada-turma-2')}
            style={{
              marginTop: '32px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '16px',
              padding: '14px 28px',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Voltar para o CF Renda Turbinada
          </button>
        </div>
      </div>
    );
  }

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
          onClick={() => router.push('/dashboard/cf-renda-turbinada-turma-2')}
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
          ← Voltar para o CF Renda Turbinada - Turma 2
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
            Aulas do Bastidores da Bolsa
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
            Explore as aulas em vídeo com textos ricos, materiais complementares e bastidores exclusivos para aprofundar o plano. Use os anexos para baixar PDFs, imagens e recursos de apoio sempre que precisar.
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
              backgroundColor: '#010101',
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
                {isSaving && (
                  <span style={{ fontSize: '13px', color: '#38bdf8' }}>Salvando alterações...</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleToggleViewMode}
                style={{
                  border: '1px solid #38bdf8',
                  backgroundColor: viewAsStudent ? '#38bdf8' : 'transparent',
                  color: viewAsStudent ? '#010101' : '#f8fafc',
                  borderRadius: '9999px',
                  padding: '10px 18px',
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
                disabled={isSaving}
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
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#010101' }}>Adicionar novo módulo</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569' }}>
              Informe a data prevista de liberação e um resumo do conteúdo. Depois de criado, você pode incluir aulas individualmente.
            </p>
            <form
              onSubmit={handleAddModule}
              style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
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
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
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
                  color: '#010101',
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
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.85 : 1
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Criar módulo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto 48px' }}>
        {isLoading ? (
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
            <h2 style={{ margin: '0 0 12px 0', color: '#010101', fontSize: '20px' }}>Carregando módulos...</h2>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>Aguarde um instante enquanto buscamos os conteúdos mais recentes.</p>
          </div>
        ) : fetchError ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #fecaca',
              padding: '28px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              textAlign: 'center'
            }}
          >
            <h2 style={{ margin: '0 0 12px 0', color: '#b91c1c', fontSize: '20px' }}>Não foi possível carregar os módulos</h2>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px', lineHeight: 1.6 }}>
              {fetchError}
            </p>
          </div>
        ) : visibleModules.length === 0 ? (
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
            <h2 style={{ margin: '0 0 12px 0', color: '#010101', fontSize: '20px' }}>
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
  const isReleased = module.isReleased ?? (releaseIsValid && releaseDate <= now);
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
        gap: '20px',
        opacity: !isAdmin && !isReleased ? 0.7 : 1
      }}
    >
      {editingModuleId === module.id ? (
        // ========== FORMULÁRIO DE EDIÇÃO DO MÓDULO ==========
        <form
          onSubmit={event => handleUpdateModule(event, module.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#010101' }}>
            Editar Módulo
          </h3>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
            Título do módulo
            <input
              type="text"
              value={editModuleForm.title}
              onChange={e => handleEditModuleFieldChange('title', e.target.value)}
              style={{
                borderRadius: '10px',
                border: '1px solid #cbd5f5',
                padding: '10px 14px',
                fontSize: '14px'
              }}
              required
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
            Data de liberação
            <input
              type="datetime-local"
              value={editModuleForm.releaseDate}
              onChange={e => handleEditModuleFieldChange('releaseDate', e.target.value)}
              style={{
                borderRadius: '10px',
                border: '1px solid #cbd5f5',
                padding: '10px 14px',
                fontSize: '14px'
              }}
              required
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
            Descrição do módulo
            <textarea
              value={editModuleForm.highlight}
              onChange={e => handleEditModuleFieldChange('highlight', e.target.value)}
              placeholder="Descreva o principal objetivo e ganhos deste módulo."
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

          {editModuleError && (
            <div style={{ color: '#be123c', fontSize: '13px' }}>{editModuleError}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCancelEditModule}
              style={{
                border: '1px solid #cbd5f5',
                backgroundColor: 'transparent',
                color: '#010101',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1
              }}
              disabled={isSaving}
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
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.85 : 1
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      ) : (
        // ========== VISUALIZAÇÃO NORMAL DO MÓDULO ==========
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#010101', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                    onClick={() => handleStartEditModule(module.id)}
                    style={{
                      border: '1px solid #3b82f6',
                      backgroundColor: 'transparent',
                      color: '#3b82f6',
                      borderRadius: '9999px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.7 : 1
                    }}
                    disabled={isSaving}
                  >
                    Editar módulo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleModuleVisibility(module.id, isHidden)}
                    style={{
                      border: '1px solid #010101',
                      backgroundColor: isHidden ? '#010101' : 'transparent',
                      color: isHidden ? '#f8fafc' : '#010101',
                      borderRadius: '9999px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.7 : 1
                    }}
                    disabled={isSaving}
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
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.7 : 1
                    }}
                    disabled={isSaving}
                  >
                    Excluir módulo
                  </button>
                </div>
              )}
            </div>

            {/* MOSTRA HIGHLIGHT APENAS SE LIBERADO OU SE FOR ADMIN */}
            {(isReleased || isAdmin) && (
              <p style={{ margin: 0, color: '#1e293b', fontSize: '18px', lineHeight: 1.6 }}>
                {module.highlight && module.highlight.trim().length > 0
                  ? module.highlight
                  : 'Conteúdo liberado recentemente.'}
              </p>
            )}

            {/* AVISO PARA MÓDULOS NÃO LIBERADOS */}
            {!isAdmin && !isReleased && (
              <div
                style={{
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  padding: '16px 20px',
                  fontSize: '15px',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                🔒 Este módulo será liberado em {formatReleaseDate(module.releaseDate)}
              </div>
            )}
          </div>

          {/* MOSTRA AULAS APENAS SE LIBERADO OU SE FOR ADMIN */}
          {(isReleased || isAdmin) && (
            <>
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

              {/* SEÇÃO ADMIN - ADICIONAR AULAS */}
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
                      border: '1px solid #010101',
                      backgroundColor: openLessonModule === module.id ? '#0ea5e9' : 'transparent',
                      color: openLessonModule === module.id ? '#010101' : '#010101',
                      borderRadius: '9999px',
                      padding: '10px 18px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.7 : 1
                    }}
                    disabled={isSaving}
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
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
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
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
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
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <RichTextEditor
                          value={lessonForms[module.id]?.description ?? ''}
                          onChange={value => handleLessonFieldChange(module.id, 'description', value)}
                          label="Descrição"
                          placeholder="Explique o que será abordado nesta aula."
                          minHeight="180px"
                        />
                      </div>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#010101' }}>
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
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <RichTextEditor
                          value={lessonForms[module.id]?.content ?? ''}
                          onChange={value => handleLessonFieldChange(module.id, 'content', value)}
                          label="Conteúdo escrito (opcional)"
                          placeholder="Cole aqui materiais de apoio, links e observações importantes."
                          minHeight="200px"
                        />
                      </div>
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
                            color: '#010101',
                            borderRadius: '10px',
                            padding: '10px 18px',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            opacity: isSaving ? 0.7 : 1
                          }}
                          disabled={isSaving}
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
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            opacity: isSaving ? 0.85 : 1
                          }}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Salvando...' : 'Adicionar aula'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
          })
        )}
      </div>



    </div>
  );
}
