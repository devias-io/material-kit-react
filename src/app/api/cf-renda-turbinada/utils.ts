import { CfRendaTurbinadaLesson, CfRendaTurbinadaModule } from '@prisma/client';

type ModuleWithLessons = CfRendaTurbinadaModule & {
  lessons: CfRendaTurbinadaLesson[];
};

export function serializeLesson(lesson: CfRendaTurbinadaLesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    duration: lesson.duration,
    description: lesson.description ?? undefined,
    videoUrl: lesson.videoUrl ?? undefined,
    content: lesson.content ?? undefined,
    sortOrder: lesson.sortOrder ?? undefined
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
