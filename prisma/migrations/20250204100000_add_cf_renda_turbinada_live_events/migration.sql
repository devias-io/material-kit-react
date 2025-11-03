-- CreateTable
CREATE TABLE "live_events" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "event_date" TIMESTAMP(3) NOT NULL,
  "duration_minutes" INTEGER NOT NULL DEFAULT 60,
  "meeting_url" TEXT,
  "is_cancelled" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index to quickly fetch upcoming events by date
CREATE INDEX "live_events_event_date_idx" ON "live_events" ("event_date");
