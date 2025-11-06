-- CreateTable
CREATE TABLE "lesson_materials" (
  "id" SERIAL PRIMARY KEY,
  "lessonId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index to speed up material lookups by lesson
CREATE INDEX "lesson_materials_lessonId_idx" ON "lesson_materials" ("lessonId");

-- AddForeignKey
ALTER TABLE "lesson_materials"
  ADD CONSTRAINT "lesson_materials_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
