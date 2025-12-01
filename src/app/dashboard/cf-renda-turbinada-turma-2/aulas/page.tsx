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

interface MoveLessonFormState {
  moduleId: string;
  position: string;
}

interface NewModuleFormState {
  title: string;
  highlight: string;
  releaseDate: string;
}

// ========== INTERFACES PARA LIVES ==========
interface LiveEvent {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  durationMinutes: number;
  meetingUrl?: string;
  isCancelled: boolean;
}

interface LiveFormState {
  title: string;
  description: string;
  eventDate: string;
  durationMinutes: string;
  meetingUrl: string;
}

function createEmptyLiveForm(): LiveFormState {
  return {
    title: '',
    description: '',
    eventDate: '',
    durationMinutes: '60',
    meetingUrl: ''
  };
}

interface MentoriaMaterial {
  id: number;
  title: string;
  fileUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Mentoria {
  id: number;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  recordedAt: string;
  releaseDate?: string;
  durationMinutes?: number;
  sortOrder?: number;
  materials: MentoriaMaterial[];
  isReleased?: boolean;
}

interface MentoriaFormState {
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  recordedAt: string;
  releaseDate: string;
  durationMinutes: string;
}

function createEmptyMentoriaForm(): MentoriaFormState {
  return {
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    recordedAt: '',
    releaseDate: '',
    durationMinutes: ''
  };
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

const pageHorizontalPadding = 'clamp(8px, 2vw, 24px)';
const sectionHorizontalPadding = 'clamp(8px, 2vw, 24px)';
const cardHorizontalPadding = 'clamp(12px, 2vw, 28px)';
const blockHorizontalPadding = 'clamp(8px, 2vw, 20px)';
const pagePadding = `24px ${pageHorizontalPadding}`;
const sectionPadding = `24px ${sectionHorizontalPadding}`;
const cardPadding = `28px ${cardHorizontalPadding}`;
const blockPadding = `20px ${blockHorizontalPadding}`;
const compactVideoHorizontalOffset = `(${pageHorizontalPadding} + ${blockHorizontalPadding})`;

function renderTextWithLineBreaks(text: string): React.ReactNode {
  return text.split('\n').map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
}

function isBase64DataUrl(url: string): boolean {
  return /^data:[^;]+;base64,/i.test(url);
}

function openMaterialFileInNewTab(fileUrl: string) {
  if (typeof window === 'undefined' || !fileUrl) {
    return;
  }

  if (!isBase64DataUrl(fileUrl)) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const commaIndex = fileUrl.indexOf(',');

    if (commaIndex === -1) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const metadata = fileUrl.slice(0, commaIndex);
    const base64Payload = fileUrl.slice(commaIndex + 1);
    const mimeMatch = metadata.match(/^data:([^;]+)(;base64)?$/i);
    const mimeType = mimeMatch?.[1] ?? 'application/octet-stream';

    const binaryString = window.atob(base64Payload);
    const binaryLength = binaryString.length;
    const bytes = new Uint8Array(binaryLength);

    for (let index = 0; index < binaryLength; index += 1) {
      bytes[index] = binaryString.charCodeAt(index);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const openedWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');

    if (openedWindow) {
      const revokeObjectUrl = () => {
        URL.revokeObjectURL(blobUrl);
        openedWindow.removeEventListener('beforeunload', revokeObjectUrl);
      };

      openedWindow.addEventListener('beforeunload', revokeObjectUrl);
    } else {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('Erro ao abrir material em nova aba:', error);
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
}

// ========== FUNÇÃO HELPER PARA FORMATAR DATA/HORA ==========
function formatLiveDateTime(isoDate: string): { date: string; time: string; dayOfWeek: string } {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return { date: 'Data inválida', time: '', dayOfWeek: '' };
  }

  const dayOfWeek = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
  const timeStr = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return {
    date: dateStr,
    time: timeStr,
    dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)
  };
}

function formatMentoriaDate(isoDate: string): { date: string; dayOfWeek: string; time: string } {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return { date: 'Data inválida', dayOfWeek: '', time: '' };
  }

  const dayOfWeek = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date);
  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
  const timeStr = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return {
    date: dateStr,
    dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
    time: timeStr
  };
}

function toInputDateTimeValue(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function isLiveStarted(eventDate: string): boolean {
  const startDate = new Date(eventDate);

  if (Number.isNaN(startDate.getTime())) {
    return false;
  }

  return startDate <= new Date();
}

function isLivePast(eventDate: string, durationMinutes?: number): boolean {
  const startDate = new Date(eventDate);

  if (Number.isNaN(startDate.getTime())) {
    return false;
  }

  // Mantém o botão "Entrar na Live" visível por 2 horas após o início da live
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  const endDate = new Date(startDate.getTime() + twoHoursInMs);

  return endDate < new Date();
}

function isLiveToday(eventDate: string): boolean {
  const now = new Date();
  const liveDate = new Date(eventDate);
  return (
    liveDate.getDate() === now.getDate() &&
    liveDate.getMonth() === now.getMonth() &&
    liveDate.getFullYear() === now.getFullYear()
  );
}

function sortLiveEvents(events: LiveEvent[]): LiveEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.eventDate);
    const dateB = new Date(b.eventDate);
    const now = new Date();

    const isPastA = dateA < now;
    const isPastB = dateB < now;

    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;

    if (isPastA && isPastB) {
      return dateB.getTime() - dateA.getTime();
    }

    return dateA.getTime() - dateB.getTime();
  });
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

function sortMentoriaMaterialsByDate(materials: MentoriaMaterial[] = []): MentoriaMaterial[] {
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

function sortMentoriasByOrder(mentorias: Mentoria[]): Mentoria[] {
  return [...mentorias].sort((mentoriaA, mentoriaB) => {
    const orderA = mentoriaA.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = mentoriaB.sortOrder ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const dateA = new Date(mentoriaA.releaseDate ?? mentoriaA.recordedAt).getTime();
    const dateB = new Date(mentoriaB.releaseDate ?? mentoriaB.recordedAt).getTime();

    if (dateA !== dateB) {
      return dateB - dateA;
    }

    return mentoriaA.title.localeCompare(mentoriaB.title);
  });
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function CfRendaTurbinadaAulasPage(): React.JSX.Element {
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
  const [moveLessonForms, setMoveLessonForms] = React.useState<Record<string, MoveLessonFormState>>({});
  const [moveLessonErrors, setMoveLessonErrors] = React.useState<Record<string, string | null>>({});
  const [openMoveLessonKey, setOpenMoveLessonKey] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [isCompactViewport, setIsCompactViewport] = React.useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(max-width: 640px)').matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 640px)');

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsCompactViewport(event.matches);
    };

    setIsCompactViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }

    mediaQuery.addListener?.(handleViewportChange);
    return () => mediaQuery.removeListener?.(handleViewportChange);
  }, []);

  const compactVideoStyles = React.useMemo<React.CSSProperties | null>(() => {
    if (!isCompactViewport) {
      return null;
    }

    return {
      width: `calc(100% + 2 * ${compactVideoHorizontalOffset})`,
      marginLeft: `calc(-1 * ${compactVideoHorizontalOffset})`,
      marginRight: `calc(-1 * ${compactVideoHorizontalOffset})`,
      maxWidth: '100vw'
    };
  }, [isCompactViewport]);

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
  
  const [liveEvents, setLiveEvents] = React.useState<LiveEvent[]>([]);
  const [showAllLives, setShowAllLives] = React.useState(false);
  const [liveForm, setLiveForm] = React.useState<LiveFormState>(createEmptyLiveForm());
  const [liveError, setLiveError] = React.useState<string | null>(null);
  const [showLiveForm, setShowLiveForm] = React.useState(false);
  const [editingLiveId, setEditingLiveId] = React.useState<number | null>(null);
  const [isLoadingLives, setIsLoadingLives] = React.useState(true);
  const isEditingLive = editingLiveId !== null;
  const hasMoreLiveEvents = liveEvents.length > 2;
  const visibleLiveEvents = showAllLives || !hasMoreLiveEvents ? liveEvents : liveEvents.slice(0, 2);

  React.useEffect(() => {
    if (!hasMoreLiveEvents && showAllLives) {
      setShowAllLives(false);
    }
  }, [hasMoreLiveEvents, showAllLives]);

  const [mentorias, setMentorias] = React.useState<Mentoria[]>([]);
  const [isLoadingMentorias, setIsLoadingMentorias] = React.useState(true);
  const [mentoriaFetchError, setMentoriaFetchError] = React.useState<string | null>(null);
  const [showMentoriaForm, setShowMentoriaForm] = React.useState(false);
  const [mentoriaForm, setMentoriaForm] = React.useState<MentoriaFormState>(createEmptyMentoriaForm());
  const [mentoriaFormError, setMentoriaFormError] = React.useState<string | null>(null);
  const [editingMentoriaId, setEditingMentoriaId] = React.useState<number | null>(null);
  const [editMentoriaForm, setEditMentoriaForm] = React.useState<MentoriaFormState>(createEmptyMentoriaForm());
  const [editMentoriaError, setEditMentoriaError] = React.useState<string | null>(null);
  const [mentoriaMaterialState, setMentoriaMaterialState] = React.useState<
    Record<number, { isUploading: boolean; error: string | null }>
  >({});
  const [isSavingMentoria, setIsSavingMentoria] = React.useState(false);
  const [mentoriaReorderForms, setMentoriaReorderForms] = React.useState<Record<number, string>>({});
  const [mentoriaReorderErrors, setMentoriaReorderErrors] = React.useState<Record<number, string | null>>({});
  const [openMentoriaReorderId, setOpenMentoriaReorderId] = React.useState<number | null>(null);
  const [reorderingMentoriaId, setReorderingMentoriaId] = React.useState<number | null>(null);
  const isEditingMentoria = editingMentoriaId !== null;

  const copyLinkToClipboard = React.useCallback((hash: string) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const normalizedHash = hash.startsWith('#') ? hash : `#${hash}`;
    const link = `${window.location.origin}${window.location.pathname}${normalizedHash}`;

    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      alert(`Copie manualmente este link: ${link}`);
      return;
    }

    navigator.clipboard
      .writeText(link)
      .then(() => {
        alert('Link copiado!');
      })
      .catch(() => {
        alert(`Não foi possível copiar automaticamente. Copie manualmente: ${link}`);
      });
  }, []);

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
        const response = await fetch('/api/cf-renda-turbinada-turma-2/modules');
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
    let isMounted = true;

    async function fetchLiveEvents(): Promise<void> {
      setIsLoadingLives(true);

      try {
        const response = await fetch('/api/cf-renda-turbinada-turma-2/live-events');
        const data = (await response.json().catch(() => null)) as { events?: LiveEvent[]; error?: string } | null;

        if (!response.ok || !data || !Array.isArray(data.events)) {
          throw new Error(data?.error ?? 'Erro ao carregar lives.');
        }

        if (!isMounted) return;

setLiveEvents(
  [...data.events].sort((a, b) => {
    const dateA = new Date(a.eventDate);
    const dateB = new Date(b.eventDate);
    const now = new Date();
    
    const isPastA = dateA < now;
    const isPastB = dateB < now;
    
    // Se uma é passada e outra não, passada vai pro final
    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;
    
    // Se ambas são passadas, ordena da mais recente pra mais antiga
    if (isPastA && isPastB) {
      return dateB.getTime() - dateA.getTime();
    }
    
    // Se ambas são futuras, ordena da mais próxima pra mais distante
    return dateA.getTime() - dateB.getTime();
  })
);
      } catch (error) {
        console.error('Erro ao carregar lives:', error);
        if (isMounted) {
          setLiveEvents([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingLives(false);
        }
      }
    }

    void fetchLiveEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchMentorias(): Promise<void> {
      setIsLoadingMentorias(true);
      setMentoriaFetchError(null);

      try {
        const response = await fetch('/api/cf-renda-turbinada-turma-2/mentorias');
        const data = (await response.json().catch(() => null)) as { mentorias?: Mentoria[]; error?: string } | null;

        if (!response.ok || !data || !Array.isArray(data.mentorias)) {
          throw new Error(data?.error ?? 'Erro ao carregar mentorias.');
        }

        if (!isMounted) {
          return;
        }

        setMentorias(sortMentoriasByOrder(data.mentorias));
      } catch (error) {
        console.error('Erro ao carregar mentorias gravadas:', error);

        if (isMounted) {
          setMentorias([]);
          setMentoriaFetchError(
            error instanceof Error ? error.message : 'Erro ao carregar mentorias gravadas.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingMentorias(false);
        }
      }
    }

    void fetchMentorias();

    return () => {
      isMounted = false;
    };
  }, []);

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

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.location.hash) {
      return;
    }

    const elementId = window.location.hash.substring(1);
    const element = document.getElementById(elementId);

    if (!element) {
      return;
    }

    let highlightCleanup: (() => void) | null = null;

    const scrollTimeout = window.setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const previousTransition = element.style.transition;
      const previousBoxShadow = element.style.boxShadow;

      element.style.transition = previousTransition
        ? `${previousTransition}, box-shadow 0.3s ease`
        : 'box-shadow 0.3s ease';
      element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.4)';

      const highlightTimeout = window.setTimeout(() => {
        element.style.boxShadow = previousBoxShadow;
        element.style.transition = previousTransition;
        highlightCleanup = null;
      }, 2000);

      highlightCleanup = () => {
        window.clearTimeout(highlightTimeout);
        element.style.boxShadow = previousBoxShadow;
        element.style.transition = previousTransition;
      };
    }, 300);

    return () => {
      window.clearTimeout(scrollTimeout);
      highlightCleanup?.();
    };
  }, [modules, mentorias, liveEvents]);

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

  const handleToggleShowAllLives = React.useCallback(() => {
    setShowAllLives(prev => !prev);
  }, []);

  const handleLiveFieldChange = React.useCallback((field: keyof LiveFormState, value: string) => {
    setLiveForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddLive = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLiveError(null);

      if (!liveForm.title.trim() || !liveForm.eventDate) {
        setLiveError('Título e data/hora são obrigatórios.');
        return;
      }

      const parsedDate = new Date(liveForm.eventDate);
      if (Number.isNaN(parsedDate.getTime())) {
        setLiveError('Informe uma data/hora válida.');
        return;
      }

      setIsSaving(true);

      try {
        const requestBody = {
          title: liveForm.title.trim(),
          description: liveForm.description.trim() || undefined,
          eventDate: parsedDate.toISOString(),
          durationMinutes: Number.parseInt(liveForm.durationMinutes, 10) || 60,
          meetingUrl: liveForm.meetingUrl.trim() || undefined
        };

        const endpoint = isEditingLive
          ? `/api/cf-renda-turbinada-turma-2/live-events/${editingLiveId}`
          : '/api/cf-renda-turbinada-turma-2/live-events';

        const response = await fetch(endpoint, {
          method: isEditingLive ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const data = (await response.json().catch(() => null)) as { event?: LiveEvent; error?: string } | null;

        if (!response.ok || !data?.event) {
          throw new Error(data?.error ?? 'Erro ao salvar live.');
        }

        setLiveEvents(prev =>
          sortLiveEvents(
            isEditingLive
              ? prev.map(event => (event.id === data.event.id ? data.event : event))
              : [...prev, data.event]
          )
        );
        setLiveForm(createEmptyLiveForm());
        setShowLiveForm(false);
        setEditingLiveId(null);
      } catch (error) {
        console.error('Erro ao salvar live:', error);
        setLiveError(error instanceof Error ? error.message : 'Erro ao salvar live. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    },
    [editingLiveId, isEditingLive, liveForm]
  );

  const handleEditLive = React.useCallback((live: LiveEvent) => {
    setLiveForm({
      title: live.title,
      description: live.description ?? '',
      eventDate: toInputDateTimeValue(live.eventDate),
      durationMinutes: String(live.durationMinutes ?? 60),
      meetingUrl: live.meetingUrl ?? ''
    });
    setShowLiveForm(true);
    setLiveError(null);
    setEditingLiveId(live.id);
  }, []);

  const handleDeleteLive = React.useCallback(
    async (liveId: number) => {
      if (!confirm('Tem certeza que deseja excluir esta live?')) {
        return;
      }

      setIsSaving(true);

      try {
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/live-events/${liveId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Erro ao excluir live.');
        }

        setLiveEvents(prev => prev.filter(event => event.id !== liveId));
      } catch (error) {
        console.error('Erro ao excluir live:', error);
        alert('Erro ao excluir live. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const handleToggleLiveCancellation = React.useCallback(
    async (liveId: number, currentIsCancelled: boolean) => {
      setIsSaving(true);

      try {
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/live-events/${liveId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCancelled: !currentIsCancelled })
        });

        const data = (await response.json().catch(() => null)) as { event?: LiveEvent; error?: string } | null;

        if (!response.ok || !data?.event) {
          throw new Error(data?.error ?? 'Erro ao atualizar live.');
        }

        setLiveEvents(prev => prev.map(event => (event.id === liveId ? data.event : event)));
      } catch (error) {
        console.error('Erro ao atualizar live:', error);
        alert('Erro ao atualizar live. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const handleMentoriaFieldChange = React.useCallback((field: keyof MentoriaFormState, value: string) => {
    setMentoriaForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCreateMentoria = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMentoriaFormError(null);

      if (!mentoriaForm.title.trim() || !mentoriaForm.recordedAt || !mentoriaForm.releaseDate) {
        setMentoriaFormError('Título, data da mentoria e data de liberação são obrigatórios.');
        return;
      }

      const recordedDate = new Date(mentoriaForm.recordedAt);

      if (Number.isNaN(recordedDate.getTime())) {
        setMentoriaFormError('Informe uma data válida.');
        return;
      }

      const releaseDate = new Date(mentoriaForm.releaseDate);

      if (Number.isNaN(releaseDate.getTime())) {
        setMentoriaFormError('Informe uma data de liberação válida.');
        return;
      }

      let parsedDuration: number | null = null;
      const durationValue = mentoriaForm.durationMinutes.trim();

      if (durationValue) {
        const durationNumber = Number.parseInt(durationValue, 10);

        if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
          setMentoriaFormError('Informe a duração em minutos usando apenas números positivos.');
          return;
        }

        parsedDuration = durationNumber;
      }

      setIsSavingMentoria(true);

      try {
        const response = await fetch('/api/cf-renda-turbinada-turma-2/mentorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: mentoriaForm.title.trim(),
            description: mentoriaForm.description.trim() || undefined,
            content: mentoriaForm.content.trim() || undefined,
            videoUrl: mentoriaForm.videoUrl.trim() || undefined,
            recordedAt: recordedDate.toISOString(),
            releaseDate: releaseDate.toISOString(),
            durationMinutes: parsedDuration ?? undefined
          })
        });

        const data = (await response.json().catch(() => null)) as { mentoria?: Mentoria; error?: string } | null;

        if (!response.ok || !data?.mentoria) {
          throw new Error(data?.error ?? 'Erro ao criar mentoria.');
        }

        setMentorias(prev => sortMentoriasByOrder([...prev, data.mentoria]));
        setMentoriaForm(createEmptyMentoriaForm());
        setShowMentoriaForm(false);
      } catch (error) {
        console.error('Erro ao criar mentoria gravada:', error);
        setMentoriaFormError(error instanceof Error ? error.message : 'Erro ao criar mentoria.');
      } finally {
        setIsSavingMentoria(false);
      }
    },
    [mentoriaForm]
  );

  const handleStartEditMentoria = React.useCallback((mentoria: Mentoria) => {
    setEditingMentoriaId(mentoria.id);
    setEditMentoriaForm({
      title: mentoria.title,
      description: mentoria.description ?? '',
      content: mentoria.content ?? '',
      videoUrl: mentoria.videoUrl ?? '',
      recordedAt: toInputDateTimeValue(mentoria.recordedAt),
      releaseDate: toInputDateTimeValue(mentoria.releaseDate ?? mentoria.recordedAt),
      durationMinutes: mentoria.durationMinutes ? String(mentoria.durationMinutes) : ''
    });
    setEditMentoriaError(null);
    setShowMentoriaForm(false);
  }, []);

  const handleEditMentoriaFieldChange = React.useCallback((field: keyof MentoriaFormState, value: string) => {
    setEditMentoriaForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCancelEditMentoria = React.useCallback(() => {
    setEditingMentoriaId(null);
    setEditMentoriaForm(createEmptyMentoriaForm());
    setEditMentoriaError(null);
  }, []);

  const handleToggleMentoriaReorder = React.useCallback(
    (mentoriaId: number) => {
      const currentIndex = mentorias.findIndex(item => item.id === mentoriaId);
      const fallbackPosition = currentIndex >= 0 ? currentIndex + 1 : 1;

      setMentoriaReorderForms(prev => ({
        ...prev,
        [mentoriaId]: prev[mentoriaId] ?? String(fallbackPosition)
      }));
      setMentoriaReorderErrors(prev => ({
        ...prev,
        [mentoriaId]: null
      }));
      setOpenMentoriaReorderId(prev => (prev === mentoriaId ? null : mentoriaId));
    },
    [mentorias]
  );

  const handleMentoriaPositionChange = React.useCallback(
    (mentoriaId: number, position: string) => {
      const totalMentorias = Math.max(1, mentorias.length);
      const currentIndex = mentorias.findIndex(item => item.id === mentoriaId);
      const fallbackPosition = currentIndex >= 0 ? currentIndex + 1 : 1;
      const parsedPosition = Number.parseInt(position, 10);
      const safePosition = clampNumber(Number.isNaN(parsedPosition) ? fallbackPosition : parsedPosition, 1, totalMentorias);

      setMentoriaReorderForms(prev => ({
        ...prev,
        [mentoriaId]: String(safePosition)
      }));
      setMentoriaReorderErrors(prev => ({
        ...prev,
        [mentoriaId]: null
      }));
    },
    [mentorias]
  );

  const handleSubmitMentoriaReorder = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>, mentoriaId: number) => {
      event.preventDefault();

      const totalMentorias = mentorias.length;
      const currentIndex = mentorias.findIndex(item => item.id === mentoriaId);
      const fallbackPosition = currentIndex >= 0 ? currentIndex + 1 : 1;
      const positionValue = mentoriaReorderForms[mentoriaId] ?? String(fallbackPosition);
      const parsedPosition = Number.parseInt(positionValue, 10);

      if (Number.isNaN(parsedPosition) || parsedPosition < 1 || parsedPosition > totalMentorias) {
        setMentoriaReorderErrors(prev => ({
          ...prev,
          [mentoriaId]: `Informe uma posição entre 1 e ${Math.max(totalMentorias, 1)}.`
        }));
        return;
      }

      setReorderingMentoriaId(mentoriaId);
      setMentoriaReorderErrors(prev => ({
        ...prev,
        [mentoriaId]: null
      }));

      try {
        const response = await fetch('/api/cf-renda-turbinada-turma-2/mentorias/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mentoriaId,
            targetPosition: parsedPosition
          })
        });

        const data = (await response.json().catch(() => null)) as { mentorias?: Mentoria[]; error?: string } | null;

        if (!response.ok || !data?.mentorias) {
          const message = data?.error ?? 'Erro ao reordenar mentoria.';
          throw new Error(message);
        }

        setMentorias(sortMentoriasByOrder(data.mentorias));
        setOpenMentoriaReorderId(null);
      } catch (error) {
        console.error('Erro ao reordenar mentoria:', error);
        setMentoriaReorderErrors(prev => ({
          ...prev,
          [mentoriaId]: error instanceof Error ? error.message : 'Erro ao reordenar. Tente novamente.'
        }));
      } finally {
        setReorderingMentoriaId(null);
      }
    },
    [mentoriaReorderForms, mentorias]
  );

  const handleUpdateMentoria = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>, mentoriaId: number) => {
      event.preventDefault();
      setEditMentoriaError(null);

      if (!editMentoriaForm.title.trim() || !editMentoriaForm.recordedAt || !editMentoriaForm.releaseDate) {
        setEditMentoriaError('Título, data da mentoria e data de liberação são obrigatórios.');
        return;
      }

      const recordedDate = new Date(editMentoriaForm.recordedAt);

      if (Number.isNaN(recordedDate.getTime())) {
        setEditMentoriaError('Informe uma data válida.');
        return;
      }

      const releaseDate = new Date(editMentoriaForm.releaseDate);

      if (Number.isNaN(releaseDate.getTime())) {
        setEditMentoriaError('Informe uma data de liberação válida.');
        return;
      }

      let parsedDuration: number | null = null;
      const durationValue = editMentoriaForm.durationMinutes.trim();

      if (durationValue) {
        const durationNumber = Number.parseInt(durationValue, 10);

        if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
          setEditMentoriaError('Informe a duração em minutos usando apenas números positivos.');
          return;
        }

        parsedDuration = durationNumber;
      }

      setIsSavingMentoria(true);

      try {
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/mentorias/${mentoriaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editMentoriaForm.title.trim(),
            description: editMentoriaForm.description.trim() || null,
            content: editMentoriaForm.content.trim() || null,
            videoUrl: editMentoriaForm.videoUrl.trim() || null,
            recordedAt: recordedDate.toISOString(),
            releaseDate: releaseDate.toISOString(),
            durationMinutes: parsedDuration ?? null
          })
        });

        const data = (await response.json().catch(() => null)) as { mentoria?: Mentoria; error?: string } | null;

        if (!response.ok || !data?.mentoria) {
          throw new Error(data?.error ?? 'Erro ao atualizar mentoria.');
        }

        setMentorias(prev => sortMentoriasByOrder(prev.map(item => (item.id === mentoriaId ? data.mentoria : item))));
        handleCancelEditMentoria();
      } catch (error) {
        console.error('Erro ao atualizar mentoria gravada:', error);
        setEditMentoriaError(error instanceof Error ? error.message : 'Erro ao atualizar mentoria.');
      } finally {
        setIsSavingMentoria(false);
      }
    },
    [editMentoriaForm, handleCancelEditMentoria]
  );

  const handleDeleteMentoria = React.useCallback(
    async (mentoriaId: number) => {
      if (!confirm('Tem certeza que deseja excluir esta mentoria gravada?')) {
        return;
      }

      setIsSavingMentoria(true);

      try {
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/mentorias/${mentoriaId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Erro ao excluir mentoria.');
        }

        setMentorias(prev => prev.filter(mentoria => mentoria.id !== mentoriaId));
        setMentoriaMaterialState(prev => {
          const { [mentoriaId]: _removed, ...remaining } = prev;
          return remaining;
        });

        if (editingMentoriaId === mentoriaId) {
          handleCancelEditMentoria();
        }
      } catch (error) {
        console.error('Erro ao excluir mentoria gravada:', error);
        alert(error instanceof Error ? error.message : 'Erro ao excluir mentoria. Tente novamente.');
      } finally {
        setIsSavingMentoria(false);
      }
    },
    [editingMentoriaId, handleCancelEditMentoria]
  );

  const handleUploadMentoriaMaterial = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>, mentoriaId: number) => {
      event.preventDefault();

      setMentoriaMaterialState(prev => ({
        ...prev,
        [mentoriaId]: { isUploading: true, error: null }
      }));

      try {
        const formData = new FormData(event.currentTarget);
        const file = formData.get('file');

        if (!(file instanceof File) || file.size === 0) {
          throw new Error('Selecione um arquivo para anexar.');
        }

        const title = formData.get('title');
        if (typeof title === 'string') {
          formData.set('title', title.trim());
        }

        const response = await fetch(`/api/cf-renda-turbinada-turma-2/mentorias/${mentoriaId}/materials`, {
          method: 'POST',
          body: formData
        });

        const data = (await response.json().catch(() => null)) as
          | { material?: MentoriaMaterial; error?: string }
          | null;

        if (!response.ok || !data?.material) {
          throw new Error(data?.error ?? 'Erro ao anexar material.');
        }

        setMentorias(prev =>
          prev.map(mentoria =>
            mentoria.id === mentoriaId
              ? {
                  ...mentoria,
                  materials: sortMentoriaMaterialsByDate([...mentoria.materials, data.material])
                }
              : mentoria
          )
        );

        event.currentTarget.reset();

        setMentoriaMaterialState(prev => ({
          ...prev,
          [mentoriaId]: { isUploading: false, error: null }
        }));
      } catch (error) {
        console.error('Erro ao anexar material da mentoria:', error);
        setMentoriaMaterialState(prev => ({
          ...prev,
          [mentoriaId]: {
            isUploading: false,
            error: error instanceof Error ? error.message : 'Erro ao anexar material. Tente novamente.'
          }
        }));
      }
    },
    []
  );

  const handleDeleteMentoriaMaterial = React.useCallback(
    async (mentoriaId: number, materialId: number) => {
      setMentoriaMaterialState(prev => ({
        ...prev,
        [mentoriaId]: { isUploading: true, error: null }
      }));

      try {
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/mentorias/materials/${materialId}`, {
          method: 'DELETE'
        });

        const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

        if (!response.ok || !data?.success) {
          throw new Error(data?.error ?? 'Erro ao remover material.');
        }

        setMentorias(prev =>
          prev.map(mentoria =>
            mentoria.id === mentoriaId
              ? {
                  ...mentoria,
                  materials: mentoria.materials.filter(material => material.id !== materialId)
                }
              : mentoria
          )
        );

        setMentoriaMaterialState(prev => ({
          ...prev,
          [mentoriaId]: { isUploading: false, error: null }
        }));
      } catch (error) {
        console.error('Erro ao remover material da mentoria:', error);
        setMentoriaMaterialState(prev => ({
          ...prev,
          [mentoriaId]: {
            isUploading: false,
            error: error instanceof Error ? error.message : 'Erro ao remover material. Tente novamente.'
          }
        }));
      }
    },
    []
  );

  const handleToggleModuleVisibility = React.useCallback(
    async (moduleId: string, currentIsHidden: boolean) => {
      setIsSaving(true);

      try {
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/modules/${moduleId}`, {
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

        const response = await fetch(`/api/cf-renda-turbinada-turma-2/lessons/${lessonId}/materials`, {
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

  const handlePreviewMaterial = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, material: LessonMaterial | MentoriaMaterial) => {
      if (!material.fileUrl) {
        event.preventDefault();
        return;
      }

      if (isBase64DataUrl(material.fileUrl)) {
        event.preventDefault();
        openMaterialFileInNewTab(material.fileUrl);
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
        const response = await fetch(`/api/cf-renda-turbinada/materials/${materialId}`, {
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
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/modules/${moduleId}/lessons`, {
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
        const response = await fetch('/api/cf-renda-turbinada-turma-2/modules', {
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
    setOpenMoveLessonKey(null);
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
      const response = await fetch(`/api/cf-renda-turbinada-turma-2/modules/${moduleId}`, {
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
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/modules/${moduleId}`, {
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
      setOpenMoveLessonKey(null);
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
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/lessons/${lesson.id}`, {
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
        const response = await fetch(`/api/cf-renda-turbinada-turma-2/lessons/${lesson.id}`, {
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
    [modules, editingLessonKey, handleCancelEditLesson]
  );

  const handleToggleMoveLesson = React.useCallback(
    (moduleId: string, lessonIndex: number) => {
      const key = `${moduleId}-${lessonIndex}`;
      const module = modules.find(currentModule => currentModule.id === moduleId);
      const lessonCount = module?.lessons.length ?? 0;
      const defaultPosition = clampNumber(
        lessonCount > 0 ? Math.min(lessonIndex + 1, lessonCount) : 1,
        1,
        Math.max(lessonCount, 1)
      );

      setMoveLessonForms(prev => ({
        ...prev,
        [key]: {
          moduleId,
          position: String(defaultPosition)
        }
      }));

      setMoveLessonErrors(prev => ({
        ...prev,
        [key]: null
      }));

      setOpenMoveLessonKey(currentKey => (currentKey === key ? null : key));
    },
    [modules]
  );

  const handleMoveLessonModuleChange = React.useCallback(
    (sourceModuleId: string, lessonIndex: number, destinationModuleId: string) => {
      const key = `${sourceModuleId}-${lessonIndex}`;
      const destinationModule = modules.find(currentModule => currentModule.id === destinationModuleId);
      const isSameModule = destinationModuleId === sourceModuleId;
      const destinationCount = destinationModule?.lessons.length ?? 0;
      const maxPosition = Math.max(1, isSameModule ? destinationCount : destinationCount + 1);

      setMoveLessonForms(prev => {
        const currentForm = prev[key];
        const parsedCurrentPosition = currentForm ? Number.parseInt(currentForm.position, 10) : Number.NaN;
        const fallbackPosition = isSameModule ? lessonIndex + 1 : destinationCount + 1;
        const safePosition = clampNumber(
          Number.isNaN(parsedCurrentPosition) ? fallbackPosition : parsedCurrentPosition,
          1,
          maxPosition
        );

        return {
          ...prev,
          [key]: {
            moduleId: destinationModuleId,
            position: String(safePosition)
          }
        };
      });

      setMoveLessonErrors(prev => ({
        ...prev,
        [key]: null
      }));
    },
    [modules]
  );

  const handleMoveLessonPositionChange = React.useCallback(
    (sourceModuleId: string, lessonIndex: number, position: string) => {
      const key = `${sourceModuleId}-${lessonIndex}`;

      setMoveLessonForms(prev => {
        const currentForm = prev[key] ?? { moduleId: sourceModuleId, position: String(lessonIndex + 1) };
        const targetModule = modules.find(currentModule => currentModule.id === currentForm.moduleId);
        const isSameModule = currentForm.moduleId === sourceModuleId;
        const targetCount = targetModule?.lessons.length ?? 0;
        const maxPosition = Math.max(1, isSameModule ? targetCount : targetCount + 1);
        const parsedPosition = Number.parseInt(position, 10);
        const fallbackPosition = isSameModule ? lessonIndex + 1 : targetCount + 1;
        const safePosition = clampNumber(
          Number.isNaN(parsedPosition) ? fallbackPosition : parsedPosition,
          1,
          maxPosition
        );

        return {
          ...prev,
          [key]: {
            moduleId: currentForm.moduleId,
            position: String(safePosition)
          }
        };
      });

      setMoveLessonErrors(prev => ({
        ...prev,
        [key]: null
      }));
    },
    [modules]
  );

  const handleSubmitMoveLesson = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>, moduleId: string, lessonIndex: number) => {
      event.preventDefault();

      const module = modules.find(currentModule => currentModule.id === moduleId);
      const lesson = module?.lessons[lessonIndex];

      if (!lesson || typeof lesson.id !== 'number') {
        return;
      }

      const key = `${moduleId}-${lessonIndex}`;
      const form = moveLessonForms[key] ?? { moduleId, position: String(lessonIndex + 1) };
      const targetModuleId = form.moduleId;
      const positionNumber = Number.parseInt(form.position, 10);

      const targetModule = modules.find(currentModule => currentModule.id === targetModuleId);

      if (!targetModule) {
        setMoveLessonErrors(prev => ({
          ...prev,
          [key]: 'Selecione um módulo válido.'
        }));
        return;
      }

      if (Number.isNaN(positionNumber) || positionNumber < 1) {
        setMoveLessonErrors(prev => ({
          ...prev,
          [key]: 'Informe uma posição válida.'
        }));
        return;
      }

      const isSameModule = targetModuleId === moduleId;
      const maxPosition = Math.max(1, isSameModule ? targetModule.lessons.length : targetModule.lessons.length + 1);

      if (positionNumber > maxPosition) {
        setMoveLessonErrors(prev => ({
          ...prev,
          [key]: `Posição deve ser entre 1 e ${maxPosition}.`
        }));
        return;
      }

      setIsSaving(true);
      setMoveLessonErrors(prev => ({
        ...prev,
        [key]: null
      }));

      try {
        const response = await fetch('/api/cf-renda-turbinada-turma-2/lessons/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: lesson.id,
            targetModuleId,
            targetPosition: positionNumber
          })
        });

        const data = (await response.json().catch(() => null)) as { modules?: Module[]; error?: string } | null;

        if (!response.ok || !data?.modules) {
          const message = data?.error ?? 'Erro ao mover aula.';
          throw new Error(message);
        }

        setModules(prevModules => {
          const updates = new Map(
            data.modules.map(moduleData => {
              const normalized = normalizeModule(moduleData);
              return [normalized.id, normalized] as const;
            })
          );

          const nextModules = prevModules.map(currentModule => updates.get(currentModule.id) ?? currentModule);

          updates.forEach((moduleValue, moduleKey) => {
            if (!nextModules.some(existingModule => existingModule.id === moduleKey)) {
              nextModules.push(moduleValue);
            }
          });

          return sortModulesBySchedule(nextModules);
        });

        setOpenMoveLessonKey(null);
        setMoveLessonForms(prev => {
          const { [key]: _removedForm, ...remainingForms } = prev;
          return remainingForms;
        });
        setMoveLessonErrors(prev => {
          const { [key]: _removedError, ...remainingErrors } = prev;
          return remainingErrors;
        });
      } catch (error) {
        console.error('Erro ao mover aula:', error);
        setMoveLessonErrors(prev => ({
          ...prev,
          [key]: error instanceof Error ? error.message : 'Erro ao mover aula. Tente novamente.'
        }));
      } finally {
        setIsSaving(false);
      }
    },
    [modules, moveLessonForms, normalizeModule]
  );

  const renderLesson = React.useCallback(
    (moduleId: string, lesson: Lesson, index: number) => {
      const lessonKey = `${moduleId}-${index}`;
      const isEditing = editingLessonKey === lessonKey;
      const embedConfig = getVideoEmbedConfig(lesson.videoUrl);
      const enhancedEmbedSrc = embedConfig ? enhanceEmbedSrc(embedConfig) : null;
      const moveForm = moveLessonForms[lessonKey] ?? { moduleId, position: String(index + 1) };
      const currentModule = modules.find(currentModule => currentModule.id === moduleId) ?? null;
      const selectedModule =
        modules.find(currentModule => currentModule.id === moveForm.moduleId) ?? currentModule;
      const targetCount = selectedModule?.lessons.length ?? 0;
      const isSameModuleTarget = selectedModule?.id === moduleId;
      const maxMovePosition = Math.max(1, isSameModuleTarget ? targetCount : targetCount + 1);
      const moveError = moveLessonErrors[lessonKey] ?? null;
      const uploadState =
        typeof lesson.id === 'number' ? materialUploadState[lesson.id] : undefined;
      const isMaterialUploading = uploadState?.isUploading ?? false;
      const materialError = uploadState?.error ?? null;

      return (
        <div
          key={lesson.id ? `lesson-${lesson.id}` : `lesson-${moduleId}-${index}`}
          style={{
            padding: blockPadding,
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#010101' }}>{lesson.title}</h3>
                <span
                  style={{
                    fontSize: '13px',
                    color: '#2563eb',
                    backgroundColor: '#dbeafe',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontWeight: 600
                  }}
                >
                  {lesson.duration}
                </span>
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
                      <li
                        key={material.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          justifyContent: 'space-between'
                        }}
                      >
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={event => handlePreviewMaterial(event, material)}
                          style={{
                            color: '#010101',
                            fontWeight: 600,
                            textDecoration: 'none',
                            flex: 1
                          }}
                        >
                          {material.title}
                        </a>
                        <a
                          href={material.fileUrl}
                          download={material.title}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '12px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          📥 Baixar
                        </a>
                        {isAdmin && !viewAsStudent && typeof lesson.id === 'number' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(lesson.id!, material.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              fontSize: '12px',
                              cursor: isMaterialUploading ? 'not-allowed' : 'pointer',
                              opacity: isMaterialUploading ? 0.6 : 1,
                              whiteSpace: 'nowrap'
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
              {isAdmin && !isEditing && !viewAsStudent && typeof lesson.id === 'number' && (
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
                      accept=".pdf,.ppt,.pptx,image/*"
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
                    color: '#010101'
                  }}
                >
                  Assistir vídeo da aula →
                </a>
              )}
            </>
          )}

          {isAdmin && !isEditing && !viewAsStudent && (
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
              <button
                type="button"
                onClick={() => handleToggleMoveLesson(moduleId, index)}
                style={{
                  border: '1px solid #010101',
                  backgroundColor: openMoveLessonKey === lessonKey ? '#010101' : 'transparent',
                  color: openMoveLessonKey === lessonKey ? '#ffffff' : '#010101',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
                disabled={isSaving}
              >
                {openMoveLessonKey === lessonKey ? 'Fechar movimentação' : 'Mover aula'}
              </button>
            </div>
          )}

          {isAdmin && !isEditing && !viewAsStudent && openMoveLessonKey === lessonKey && (
            <form
              onSubmit={event => handleSubmitMoveLesson(event, moduleId, index)}
              style={{
                marginTop: '12px',
                display: 'grid',
                gap: '12px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                backgroundColor: '#e0f2fe',
                borderRadius: '12px',
                border: '1px solid #bae6fd',
                padding: '16px'
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                Módulo de destino
                <select
                  value={moveForm.moduleId}
                  onChange={event => handleMoveLessonModuleChange(moduleId, index, event.target.value)}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #94a3b8',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                >
                  {modules.map(optionModule => (
                    <option key={optionModule.id} value={optionModule.id}>
                      {optionModule.title}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                Posição no módulo
                <input
                  type="number"
                  min={1}
                  max={maxMovePosition}
                  value={moveForm.position}
                  onChange={event => handleMoveLessonPositionChange(moduleId, index, event.target.value)}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #94a3b8',
                    padding: '10px 14px',
                    fontSize: '14px'
                  }}
                  required
                />
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  Valores permitidos: 1 até {maxMovePosition}
                </span>
              </label>
              {moveError && (
                <div style={{ gridColumn: '1 / -1', color: '#b91c1c', fontSize: '13px' }}>{moveError}</div>
              )}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleToggleMoveLesson(moduleId, index)}
                  style={{
                    border: '1px solid #0f172a',
                    backgroundColor: 'transparent',
                    color: '#0f172a',
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
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.85 : 1
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar nova posição'}
                </button>
              </div>
            </form>
          )}
        </div>
      );
    },
    [
      handleMoveLessonModuleChange,
      handleMoveLessonPositionChange,
      handleSubmitMoveLesson,
      editLessonError,
      editLessonForm,
      editingLessonKey,
      handleCancelEditLesson,
      handleDeleteLesson,
      handleDeleteMaterial,
      handleToggleMoveLesson,
      handleEditLessonFieldChange,
      handleStartEditLesson,
      handleUpdateLesson,
      handleUploadMaterial,
      compactVideoStyles,
      isAdmin,
      isSaving,
      materialUploadState,
      modules,
      moveLessonErrors,
      moveLessonForms,
      openMoveLessonKey,
      viewAsStudent
    ]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: pagePadding
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
            Aulas do CF Renda Turbinada - Turma 2
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
              backgroundColor: '#010101',
              color: '#f8fafc',
              borderRadius: '16px',
              padding: sectionPadding,
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
              padding: sectionPadding,
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
              padding: cardPadding,
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
              padding: cardPadding,
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
              padding: cardPadding,
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
      id={`modulo-${module.id}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: cardPadding,
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
            padding: blockPadding,
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
                onClick={() => copyLinkToClipboard(`modulo-${module.id}`)}
                style={{
                  border: '1px solid #3b82f6',
                  backgroundColor: 'transparent',
                  color: '#3b82f6',
                  borderRadius: '9999px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📋 Copiar link direto
              </button>
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
                      padding: blockPadding,
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
                      backgroundColor: openLessonModule === module.id ? '#010101' : 'transparent',
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
                        padding: blockPadding
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
                          minHeight="180px"
                          placeholder="Explique o que será abordado nesta aula."
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
                          minHeight="200px"
                          placeholder="Cole aqui materiais de apoio, links e observações importantes."
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

      {/* ========== SEÇÃO DE CALENDÁRIO DE LIVES ========== */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: cardPadding,
          maxWidth: '1100px',
          margin: '0 auto 48px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
            Calendário de Lives
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '16px', lineHeight: 1.6 }}>
            Participe das lives semanais com conteúdo exclusivo, análises de mercado e tire suas dúvidas em tempo real.
          </p>
        </div>

        {isAdmin && (
          <div style={{ marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => {
                setShowLiveForm(prev => !prev);
                if (showLiveForm) {
                  setLiveForm(createEmptyLiveForm());
                  setLiveError(null);
                  setEditingLiveId(null);
                }
              }}
              style={{
                border: '1px solid #010101',
                backgroundColor: showLiveForm ? '#010101' : 'transparent',
                color: showLiveForm ? '#ffffff' : '#010101',
                borderRadius: '9999px',
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1
              }}
              disabled={isSaving}
            >
              {showLiveForm ? 'Cancelar' : '+ Adicionar Live'}
            </button>

            {showLiveForm && (
              <form
                onSubmit={handleAddLive}
                style={{
                  marginTop: '20px',
                  display: 'grid',
                  gap: '16px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  backgroundColor: '#f8fafc',
                  padding: blockPadding,
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                  Título da live
                  <input
                    type="text"
                    value={liveForm.title}
                    onChange={event => handleLiveFieldChange('title', event.target.value)}
                    placeholder="Ex.: Live semanal - Análise de mercado"
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
                  Data e horário
                  <input
                    type="datetime-local"
                    value={liveForm.eventDate}
                    onChange={event => handleLiveFieldChange('eventDate', event.target.value)}
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
                  Duração (minutos)
                  <input
                    type="number"
                    value={liveForm.durationMinutes}
                    onChange={event => handleLiveFieldChange('durationMinutes', event.target.value)}
                    placeholder="60"
                    min="15"
                    max="240"
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
                  Descrição
                  <textarea
                    value={liveForm.description}
                    onChange={event => handleLiveFieldChange('description', event.target.value)}
                    placeholder="Descreva o que será abordado nesta live..."
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
                  Link da reunião (opcional)
                  <input
                    type="url"
                    value={liveForm.meetingUrl}
                    onChange={event => handleLiveFieldChange('meetingUrl', event.target.value)}
                    placeholder="https://zoom.us/..."
                    style={{
                      borderRadius: '10px',
                      border: '1px solid #cbd5f5',
                      padding: '10px 14px',
                      fontSize: '14px'
                    }}
                  />
                </label>

                {liveError && (
                  <div style={{ gridColumn: '1 / -1', color: '#be123c', fontSize: '13px' }}>{liveError}</div>
                )}

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLiveForm(false);
                      setLiveForm(createEmptyLiveForm());
                      setLiveError(null);
                      setEditingLiveId(null);
                    }}
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
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.85 : 1
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Salvando...' : isEditingLive ? 'Salvar alterações' : 'Criar Live'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          {isLoadingLives ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              Carregando calendário...
            </div>
          ) : liveEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
                {isAdmin ? 'Nenhuma live agendada ainda.' : 'Novas lives serão anunciadas em breve!'}
              </p>
            </div>
          ) : (
            <>
              {visibleLiveEvents.map(live => {
                const { date, time, dayOfWeek } = formatLiveDateTime(live.eventDate);
                const isPast = isLivePast(live.eventDate, live.durationMinutes);
                const isToday = isLiveToday(live.eventDate);

                return (
                  <div
                    key={live.id}
                    id={`live-${live.id}`}
                    style={{
                      padding: blockPadding,
                      borderRadius: '12px',
                      border: `2px solid ${
                        live.isCancelled ? '#fecaca' : isToday ? '#22c55e' : isPast ? '#e2e8f0' : '#d1d5db'
                      }`,
                      backgroundColor: live.isCancelled
                        ? '#fef2f2'
                        : isToday
                        ? '#f0fdf4'
                        : isPast
                        ? '#f8fafc'
                        : '#f9fafb',
                      opacity: isPast && !isToday ? 0.7 : 1
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div
                        className="live-card-header"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#0f172a',
                                wordBreak: 'break-word',
                                lineHeight: 1.3
                              }}
                            >
                              {live.title}
                            </h3>
                            {live.isCancelled && (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  backgroundColor: '#fee2e2',
                                  color: '#b91c1c',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                CANCELADA
                              </span>
                            )}
                            {isToday && !live.isCancelled && (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  backgroundColor: '#22c55e',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                HOJE
                              </span>
                            )}
                            {isPast && !isToday && !live.isCancelled && (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  backgroundColor: '#e2e8f0',
                                  color: '#475569',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                REALIZADA
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              marginBottom: '8px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <span style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>
                              📅 {dayOfWeek}, {date}
                            </span>
                            <span style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>
                              🕐 {time} ({live.durationMinutes} min)
                            </span>
                          </div>

                          {live.description && (
                            <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                              {renderTextWithLineBreaks(live.description)}
                            </p>
                          )}

{live.meetingUrl && isLiveStarted(live.eventDate) && !isPast && !live.isCancelled && (
                            <a
                              href={live.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                padding: '10px 18px',
                                borderRadius: '10px',
                                backgroundColor: '#010101',
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: 600,
                                textDecoration: 'none'
                              }}
                            >
                              🎥 Entrar na Live →
                            </a>
                          )}
                        </div>

                        {isAdmin && (
                          <div
                            className="live-card-actions"
                            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}
                          >
                            <button
                              type="button"
                              onClick={() => copyLinkToClipboard(`live-${live.id}`)}
                              style={{
                                border: '1px solid #3b82f6',
                                backgroundColor: 'transparent',
                                color: '#3b82f6',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              📋 Copiar link direto
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditLive(live)}
                              style={{
                                border: '1px solid #0ea5e9',
                                backgroundColor: 'transparent',
                                color: '#0ea5e9',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.7 : 1
                              }}
                              disabled={isSaving}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleLiveCancellation(live.id, live.isCancelled)}
                              style={{
                                border: `1px solid ${live.isCancelled ? '#22c55e' : '#f59e0b'}`,
                                backgroundColor: 'transparent',
                                color: live.isCancelled ? '#22c55e' : '#f59e0b',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.7 : 1
                              }}
                              disabled={isSaving}
                            >
                              {live.isCancelled ? 'Reativar' : 'Cancelar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLive(live.id)}
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
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMoreLiveEvents && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleToggleShowAllLives}
                    style={{
                      border: '1px solid #010101',
                      backgroundColor: showAllLives ? '#010101' : 'transparent',
                      color: showAllLives ? '#ffffff' : '#010101',
                      borderRadius: '9999px',
                      padding: '10px 22px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    aria-expanded={showAllLives}
                  >
                    {showAllLives ? 'Ver menos' : 'Ver mais'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========== SEÇÃO DE MENTORIAS GRAVADAS ========== */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: cardPadding,
          maxWidth: '1100px',
          margin: '0 auto 64px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
            Mentorias Gravadas
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '16px', lineHeight: 1.6 }}>
            Reviva encontros ao vivo com especialistas, acesse gravações completas e baixe os materiais extras
            compartilhados durante as mentorias.
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              type="button"
              onClick={() => {
                setShowMentoriaForm(prev => !prev);
                if (showMentoriaForm) {
                  setMentoriaForm(createEmptyMentoriaForm());
                  setMentoriaFormError(null);
                }
              }}
              style={{
                alignSelf: 'flex-start',
                border: '1px solid #010101',
                backgroundColor: showMentoriaForm ? '#010101' : 'transparent',
                color: showMentoriaForm ? '#ffffff' : '#010101',
                borderRadius: '9999px',
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isSavingMentoria ? 'not-allowed' : 'pointer',
                opacity: isSavingMentoria ? 0.7 : 1
              }}
              disabled={isSavingMentoria}
            >
              {showMentoriaForm ? 'Cancelar' : '+ Cadastrar mentoria gravada'}
            </button>

            {showMentoriaForm && (
              <form
                onSubmit={handleCreateMentoria}
                style={{
                  display: 'grid',
                  gap: '16px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  backgroundColor: '#f8fafc',
                  padding: blockPadding,
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                  Título da mentoria
                  <input
                    type="text"
                    value={mentoriaForm.title}
                    onChange={event => handleMentoriaFieldChange('title', event.target.value)}
                    placeholder="Ex.: Mentoria com especialista convidado"
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
                  Data e horário da gravação
                  <input
                    type="datetime-local"
                    value={mentoriaForm.recordedAt}
                    onChange={event => handleMentoriaFieldChange('recordedAt', event.target.value)}
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
                  Data de liberação para alunos
                  <input
                    type="datetime-local"
                    value={mentoriaForm.releaseDate}
                    onChange={event => handleMentoriaFieldChange('releaseDate', event.target.value)}
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
                  Duração (minutos)
                  <input
                    type="number"
                    min={10}
                    max={480}
                    value={mentoriaForm.durationMinutes}
                    onChange={event => handleMentoriaFieldChange('durationMinutes', event.target.value)}
                    placeholder="60"
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
                  Link do vídeo (opcional)
                  <input
                    type="url"
                    value={mentoriaForm.videoUrl}
                    onChange={event => handleMentoriaFieldChange('videoUrl', event.target.value)}
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
                  Resumo rápido (opcional)
                  <textarea
                    value={mentoriaForm.description}
                    onChange={event => handleMentoriaFieldChange('description', event.target.value)}
                    placeholder="Liste os principais tópicos abordados na mentoria."
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

                <div
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <RichTextEditor
                    value={mentoriaForm.content}
                    onChange={value => handleMentoriaFieldChange('content', value)}
                    label="Conteúdo complementar (opcional)"
                    placeholder="Cole a transcrição, notas ou links extras citados durante a mentoria."
                    minHeight="200px"
                  />
                </div>

                {mentoriaFormError && (
                  <div style={{ gridColumn: '1 / -1', color: '#be123c', fontSize: '13px' }}>{mentoriaFormError}</div>
                )}

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMentoriaForm(false);
                      setMentoriaForm(createEmptyMentoriaForm());
                      setMentoriaFormError(null);
                    }}
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
                      cursor: isSavingMentoria ? 'not-allowed' : 'pointer',
                      opacity: isSavingMentoria ? 0.85 : 1
                    }}
                    disabled={isSavingMentoria}
                  >
                    {isSavingMentoria ? 'Salvando...' : 'Salvar mentoria'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoadingMentorias ? (
            <div
              style={{
                padding: '40px 20px',
                borderRadius: '12px',
                border: '1px dashed #cbd5f5',
                backgroundColor: '#f8fafc',
                textAlign: 'center',
                color: '#64748b'
              }}
            >
              Carregando mentorias gravadas...
            </div>
          ) : mentoriaFetchError ? (
            <div
              style={{
                padding: '40px 20px',
                borderRadius: '12px',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                textAlign: 'center',
                color: '#b91c1c',
                fontSize: '14px'
              }}
            >
              {mentoriaFetchError}
            </div>
          ) : mentorias.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                borderRadius: '12px',
                border: '1px dashed #cbd5f5',
                backgroundColor: '#f8fafc',
                textAlign: 'center',
                color: '#475569'
              }}
            >
              {isAdmin
                ? 'Nenhuma mentoria gravada cadastrada ainda. Utilize o botão acima para adicionar a primeira gravação.'
                : 'As mentorias gravadas ficarão disponíveis aqui assim que forem publicadas.'}
            </div>
          ) : (
            mentorias.map(mentoria => {
              const embedConfig = getVideoEmbedConfig(mentoria.videoUrl);
              const enhancedEmbedSrc = embedConfig ? enhanceEmbedSrc(embedConfig) : null;
              const releaseDateValue = mentoria.releaseDate ?? mentoria.recordedAt;
              const { date, dayOfWeek, time } = formatMentoriaDate(releaseDateValue);
              const recordedDateInfo = formatMentoriaDate(mentoria.recordedAt);
              const releaseTimestamp = new Date(releaseDateValue).getTime();
              const isReleased = mentoria.isReleased ?? (!Number.isNaN(releaseTimestamp) && releaseTimestamp <= Date.now());
              const canViewContent = isReleased || isAdmin;
              const uploadState = mentoriaMaterialState[mentoria.id] ?? { isUploading: false, error: null };
              const isMaterialUploading = uploadState.isUploading;
              const materialError = uploadState.error;
              const isEditing = editingMentoriaId === mentoria.id;
              const currentPosition = mentorias.findIndex(item => item.id === mentoria.id) + 1;
              const reorderFormValue = mentoriaReorderForms[mentoria.id] ?? String(currentPosition > 0 ? currentPosition : 1);
              const reorderError = mentoriaReorderErrors[mentoria.id] ?? null;
              const isReorderingThisMentoria = reorderingMentoriaId === mentoria.id;

              return (
                <div
                  key={mentoria.id}
                  id={`mentoria-${mentoria.id}`}
                  style={{
                    padding: blockPadding,
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  {isEditing ? (
                    <form
                      onSubmit={event => handleUpdateMentoria(event, mentoria.id)}
                      style={{
                        display: 'grid',
                        gap: '16px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                      }}
                    >
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                        Título da mentoria
                        <input
                          type="text"
                          value={editMentoriaForm.title}
                          onChange={event => handleEditMentoriaFieldChange('title', event.target.value)}
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
                        Data e horário
                        <input
                          type="datetime-local"
                          value={editMentoriaForm.recordedAt}
                          onChange={event => handleEditMentoriaFieldChange('recordedAt', event.target.value)}
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
                        Liberação para alunos
                        <input
                          type="datetime-local"
                          value={editMentoriaForm.releaseDate}
                          onChange={event => handleEditMentoriaFieldChange('releaseDate', event.target.value)}
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
                        Duração (minutos)
                        <input
                          type="number"
                          min={10}
                          max={480}
                          value={editMentoriaForm.durationMinutes}
                          onChange={event => handleEditMentoriaFieldChange('durationMinutes', event.target.value)}
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
                        Link do vídeo (opcional)
                        <input
                          type="url"
                          value={editMentoriaForm.videoUrl}
                          onChange={event => handleEditMentoriaFieldChange('videoUrl', event.target.value)}
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
                        Resumo rápido (opcional)
                        <textarea
                          value={editMentoriaForm.description}
                          onChange={event => handleEditMentoriaFieldChange('description', event.target.value)}
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

                      <div
                        style={{
                          gridColumn: '1 / -1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <RichTextEditor
                          value={editMentoriaForm.content}
                          onChange={value => handleEditMentoriaFieldChange('content', value)}
                          label="Conteúdo complementar (opcional)"
                          minHeight="200px"
                        />
                      </div>

                      {editMentoriaError && (
                        <div style={{ gridColumn: '1 / -1', color: '#be123c', fontSize: '13px' }}>{editMentoriaError}</div>
                      )}

                      <div
                        style={{
                          gridColumn: '1 / -1',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleCancelEditMentoria}
                          style={{
                            border: '1px solid #cbd5f5',
                            backgroundColor: 'transparent',
                            color: '#0f172a',
                            borderRadius: '10px',
                            padding: '10px 18px',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: isSavingMentoria ? 'not-allowed' : 'pointer',
                            opacity: isSavingMentoria ? 0.7 : 1
                          }}
                          disabled={isSavingMentoria}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            border: 'none',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '14px',
                            padding: '12px 20px',
                            borderRadius: '10px',
                            cursor: isSavingMentoria ? 'not-allowed' : 'pointer',
                            opacity: isSavingMentoria ? 0.85 : 1
                          }}
                          disabled={isSavingMentoria}
                        >
                          {isSavingMentoria ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                            {mentoria.title}
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#475569' }}>
                            <span>
                              📅 Liberação: {dayOfWeek}, {date}
                            </span>
                            <span>
                              🕑 {time}
                              {mentoria.durationMinutes ? ` • ${mentoria.durationMinutes} min` : ''}
                            </span>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 10px',
                                  borderRadius: '9999px',
                                  backgroundColor: isReleased ? '#dcfce7' : '#fef3c7',
                                  color: isReleased ? '#15803d' : '#b45309',
                                  fontWeight: 600
                                }}
                              >
                                {isReleased ? 'Disponível' : 'Agendada'}
                              </span>
                              <span style={{ color: '#0f172a' }}>
                                Gravada em {recordedDateInfo.dayOfWeek}, {recordedDateInfo.date} às {recordedDateInfo.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => copyLinkToClipboard(`mentoria-${mentoria.id}`)}
                              style={{
                                border: '1px solid #3b82f6',
                                backgroundColor: 'transparent',
                                color: '#3b82f6',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              📋 Copiar link direto
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleMentoriaReorder(mentoria.id)}
                              style={{
                                border: '1px solid #0ea5e9',
                                backgroundColor: 'transparent',
                                color: '#0ea5e9',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: isSavingMentoria ? 'not-allowed' : 'pointer',
                                opacity: isSavingMentoria ? 0.7 : 1
                              }}
                              disabled={isSavingMentoria}
                            >
                              ↕️ Reordenar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEditMentoria(mentoria)}
                              style={{
                                border: '1px solid #2563eb',
                                backgroundColor: 'transparent',
                                color: '#2563eb',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: isSavingMentoria ? 'not-allowed' : 'pointer',
                                opacity: isSavingMentoria ? 0.7 : 1
                              }}
                              disabled={isSavingMentoria}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMentoria(mentoria.id)}
                              style={{
                                border: '1px solid #ef4444',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                borderRadius: '9999px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: isSavingMentoria ? 'not-allowed' : 'pointer',
                                opacity: isSavingMentoria ? 0.7 : 1
                              }}
                              disabled={isSavingMentoria}
                            >
                              Excluir
                          </button>
                        </div>
                      )}
                    </div>

                    {openMentoriaReorderId === mentoria.id && (
                      <form
                        onSubmit={event => handleSubmitMentoriaReorder(event, mentoria.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: '12px',
                          padding: '12px',
                          border: '1px dashed #bae6fd',
                          borderRadius: '10px',
                          background: '#f0f9ff'
                        }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#0f172a' }}>
                          Nova posição na lista
                          <input
                            type="number"
                            min={1}
                            max={Math.max(mentorias.length, 1)}
                            value={reorderFormValue}
                            onChange={event => handleMentoriaPositionChange(mentoria.id, event.target.value)}
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #bae6fd',
                              padding: '8px 12px',
                              fontSize: '14px'
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#475569' }}>
                            Posição atual: {currentPosition > 0 ? currentPosition : '-'} de {mentorias.length}
                          </span>
                        </label>

                        {reorderError && (
                          <div style={{ gridColumn: '1 / -1', color: '#be123c', fontSize: '13px' }}>{reorderError}</div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setOpenMentoriaReorderId(null)}
                            style={{
                              border: '1px solid #cbd5f5',
                              backgroundColor: 'transparent',
                              color: '#0f172a',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: isReorderingThisMentoria ? 'not-allowed' : 'pointer',
                              opacity: isReorderingThisMentoria ? 0.7 : 1
                            }}
                            disabled={isReorderingThisMentoria}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            style={{
                              border: 'none',
                              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                              color: '#ffffff',
                              borderRadius: '8px',
                              padding: '10px 16px',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: isReorderingThisMentoria ? 'not-allowed' : 'pointer',
                              opacity: isReorderingThisMentoria ? 0.85 : 1
                            }}
                            disabled={isReorderingThisMentoria}
                          >
                            {isReorderingThisMentoria ? 'Reordenando...' : 'Salvar nova posição'}
                          </button>
                        </div>
                      </form>
                    )}

                    {mentoria.description && mentoria.description.trim().length > 0 && (
                      <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                        {renderTextWithLineBreaks(mentoria.description)}
                        </p>
                      )}

                      {!canViewContent && (
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px dashed #f59e0b',
                            backgroundColor: '#fffbeb',
                            color: '#92400e',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}
                        >
                          🔒 Conteúdo liberado em {dayOfWeek}, {date} às {time}.
                        </div>
                      )}

                      {canViewContent && enhancedEmbedSrc && (
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
                              title={`Mentoria ${mentoria.title}`}
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                            />
                          </div>
                        </div>
                      )}

                      {canViewContent && !enhancedEmbedSrc && mentoria.videoUrl && (
                        <a
                          href={mentoria.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            alignSelf: 'flex-start',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            backgroundColor: '#010101',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          ▶️ Assistir gravação
                        </a>
                      )}

                      {canViewContent && mentoria.content && mentoria.content.trim().length > 0 && (
                        <div
                          style={{
                            backgroundColor: '#e0f2fe',
                            borderRadius: '10px',
                            padding: '12px 16px'
                          }}
                        >
                          <div
                            style={{ margin: 0, color: '#0f172a', fontSize: '14px', lineHeight: 1.6 }}
                            dangerouslySetInnerHTML={{ __html: mentoria.content }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {canViewContent && mentoria.materials.length > 0 && (
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
                        Materiais compartilhados
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
                        {mentoria.materials.map(material => (
                          <li
                            key={material.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              justifyContent: 'space-between'
                            }}
                          >
                            <a
                              href={material.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={event => handlePreviewMaterial(event, material)}
                              style={{
                                color: '#010101',
                                fontWeight: 600,
                                textDecoration: 'none',
                                flex: 1
                              }}
                            >
                              {material.title}
                            </a>
                            <a
                              href={material.fileUrl}
                              download={material.title}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '12px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              📥 Baixar
                            </a>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMentoriaMaterial(mentoria.id, material.id)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#ef4444',
                                  fontSize: '12px',
                                  cursor: isMaterialUploading ? 'not-allowed' : 'pointer',
                                  opacity: isMaterialUploading ? 0.6 : 1,
                                  whiteSpace: 'nowrap'
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

                  {isAdmin && !isEditing && (
                    <form
                      onSubmit={event => handleUploadMentoriaMaterial(event, mentoria.id)}
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
                          placeholder="Ex.: Slides da mentoria"
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
                          accept=".pdf,.ppt,.pptx,image/*"
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
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .live-card-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .live-card-header > div:first-of-type {
            width: 100%;
          }

          .live-card-actions {
            width: 100%;
            justify-content: flex-start;
            gap: 12px;
          }

          .live-card-actions button {
            flex: 1 1 100%;
          }
        }
      `}</style>
    </div>
  );
}
