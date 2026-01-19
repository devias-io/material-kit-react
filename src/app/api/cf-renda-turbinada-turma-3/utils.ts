import {
  CfRendaTurbinadaTurma3Lesson,
  CfRendaTurbinadaTurma3LessonMaterial,
  CfRendaTurbinadaTurma3LiveEvent,
  CfRendaTurbinadaTurma3Mentoria,
  CfRendaTurbinadaTurma3MentoriaMaterial,
  CfRendaTurbinadaTurma3Module
} from '@prisma/client';

type ModuleWithLessons = CfRendaTurbinadaTurma3Module & {
  lessons: (CfRendaTurbinadaTurma3Lesson & {
    materials: CfRendaTurbinadaTurma3LessonMaterial[];
  })[];
};

type LessonWithMaterials = CfRendaTurbinadaTurma3Lesson & {
  materials: CfRendaTurbinadaTurma3LessonMaterial[];
};

type MentoriaWithMaterials = CfRendaTurbinadaTurma3Mentoria & {
  materials: CfRendaTurbinadaTurma3MentoriaMaterial[];
};

export function serializeLessonMaterial(material: CfRendaTurbinadaTurma3LessonMaterial) {
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

export function serializeLiveEvent(event: CfRendaTurbinadaTurma3LiveEvent) {
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

export function serializeMentoriaMaterial(material: CfRendaTurbinadaTurma3MentoriaMaterial) {
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
    releaseDate: mentoria.releaseDate?.toISOString(),
    durationMinutes: mentoria.durationMinutes ?? undefined,
    sortOrder: mentoria.sortOrder ?? undefined,
    materials: mentoria.materials.map(serializeMentoriaMaterial)
  };
}
