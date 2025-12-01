import {
  CfRendaTurbinadaTurma2Lesson,
  CfRendaTurbinadaTurma2LessonMaterial,
  CfRendaTurbinadaTurma2LiveEvent,
  CfRendaTurbinadaTurma2Module
} from '@prisma/client';

type ModuleWithLessons = CfRendaTurbinadaTurma2Module & {
  lessons: (CfRendaTurbinadaTurma2Lesson & {
    materials: CfRendaTurbinadaTurma2LessonMaterial[];
  })[];
};

type LessonWithMaterials = CfRendaTurbinadaTurma2Lesson & {
  materials: CfRendaTurbinadaTurma2LessonMaterial[];
};

export function serializeLessonMaterial(material: CfRendaTurbinadaTurma2LessonMaterial) {
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

export function serializeLiveEvent(event: CfRendaTurbinadaTurma2LiveEvent) {
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
