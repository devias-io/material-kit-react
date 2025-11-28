import {
  CfRendaTurbinadaLesson,
  CfRendaTurbinadaLessonMaterial,
  CfRendaTurbinadaLiveEvent,
  CfRendaTurbinadaMentoria,
  CfRendaTurbinadaMentoriaMaterial,
  CfRendaTurbinadaModule,
  CfRendaTurbinadaTurma2LiveEvent
} from '@prisma/client';

type ModuleWithLessons = CfRendaTurbinadaModule & {
  lessons: (CfRendaTurbinadaLesson & { materials: CfRendaTurbinadaLessonMaterial[] })[];
};

type LessonWithMaterials = CfRendaTurbinadaLesson & {
  materials: CfRendaTurbinadaLessonMaterial[];
};

type MentoriaWithMaterials = CfRendaTurbinadaMentoria & {
  materials: CfRendaTurbinadaMentoriaMaterial[];
};

export function serializeLessonMaterial(material: CfRendaTurbinadaLessonMaterial) {
  return {
    id: material.id,
    title: material.title,
    fileUrl: material.fileUrl,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString()
  };
}

export function serializeLesson(lesson: LessonWithMaterials) {
  return {
    id: lesson.id,
    title: lesson.title,
    duration: lesson.duration,
    description: lesson.description ?? undefined,
    videoUrl: lesson.videoUrl ?? undefined,
    content: lesson.content ?? undefined,
    sortOrder: lesson.sortOrder ?? undefined,
    materials: lesson.materials.map(serializeLessonMaterial)
  };
}

export function serializeModule(module: ModuleWithLessons) {
  return {
    id: module.id,
    title: module.title,
    highlight: module.highlight ?? '',
    releaseDate: module.releaseDate.toISOString(),
    isHidden: module.isHidden,
    sortOrder: module.sortOrder ?? undefined,
    lessons: module.lessons.map(serializeLesson)
  };
}

export function serializeLiveEvent(
  event: CfRendaTurbinadaLiveEvent | CfRendaTurbinadaTurma2LiveEvent
) {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    eventDate: event.eventDate.toISOString(),
    durationMinutes: event.durationMinutes,
    meetingUrl: event.meetingUrl ?? undefined,
    isCancelled: event.isCancelled
  };
}

export function serializeMentoriaMaterial(material: CfRendaTurbinadaMentoriaMaterial) {
  return {
    id: material.id,
    title: material.title,
    fileUrl: material.fileUrl,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString()
  };
}

export function serializeMentoria(mentoria: MentoriaWithMaterials) {
  return {
    id: mentoria.id,
    title: mentoria.title,
    description: mentoria.description ?? undefined,
    content: mentoria.content ?? undefined,
    videoUrl: mentoria.videoUrl ?? undefined,
    recordedAt: mentoria.recordedAt.toISOString(),
    durationMinutes: mentoria.durationMinutes ?? undefined,
    materials: mentoria.materials.map(serializeMentoriaMaterial)
  };
}
