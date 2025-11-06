import {
  CfRendaTurbinadaLesson,
  CfRendaTurbinadaLessonMaterial,
  CfRendaTurbinadaLiveEvent,
  CfRendaTurbinadaModule
} from '@prisma/client';

type ModuleWithLessons = CfRendaTurbinadaModule & {
  lessons: (CfRendaTurbinadaLesson & { materials: CfRendaTurbinadaLessonMaterial[] })[];
};

type LessonWithMaterials = CfRendaTurbinadaLesson & {
  materials: CfRendaTurbinadaLessonMaterial[];
};

export function serializeMaterial(material: CfRendaTurbinadaLessonMaterial) {
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
    materials: lesson.materials.map(serializeMaterial)
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

export function serializeLiveEvent(event: CfRendaTurbinadaLiveEvent) {
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
