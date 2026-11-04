-- CreateTable
CREATE TABLE "rm_webhook_outbox" (
    "id" UUID NOT NULL,
    "indentId" UUID NOT NULL,
    "indentNumber" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rm_webhook_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rm_webhook_outbox_status_attemptCount_idx" ON "rm_webhook_outbox"("status", "attemptCount");

-- CreateIndex
CREATE INDEX "rm_webhook_outbox_createdAt_idx" ON "rm_webhook_outbox"("createdAt");

