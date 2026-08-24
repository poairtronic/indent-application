
CREATE TYPE "EmailJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'FAILED', 'DEAD_LETTER');

CREATE TABLE "email_jobs" (
    "id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailJobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 4,
    "lastError" TEXT,
    "availableAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMPTZ(6),
    "lockedBy" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "email_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_jobs_status_availableAt_priority_createdAt_idx" ON "email_jobs"("status", "availableAt", "priority", "createdAt");

