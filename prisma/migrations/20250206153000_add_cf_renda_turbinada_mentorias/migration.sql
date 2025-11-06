-- CreateTable
CREATE TABLE "mentorias" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT,
  "video_url" TEXT,
  "recorded_at" TIMESTAMP(3) NOT NULL,
  "duration_minutes" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index to quickly sort or filter mentorias by recorded date
CREATE INDEX "mentorias_recorded_at_idx" ON "mentorias" ("recorded_at" DESC);

-- CreateTable
CREATE TABLE "mentoria_materials" (
  "id" SERIAL PRIMARY KEY,
  "mentoria_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "file_url" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index to speed up lookups of materials for a given mentoria
CREATE INDEX "mentoria_materials_mentoria_id_idx" ON "mentoria_materials" ("mentoria_id");

-- AddForeignKey
ALTER TABLE "mentoria_materials"
  ADD CONSTRAINT "mentoria_materials_mentoria_id_fkey"
  FOREIGN KEY ("mentoria_id") REFERENCES "mentorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
