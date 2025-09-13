-- CreateTable
CREATE TABLE "reports" (
  "id" TEXT NOT NULL,
  "canvaId" TEXT NOT NULL,
  "name" TEXT,
  "iframeUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");
