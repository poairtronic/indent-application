-- AlterTable: Add currentState column to indents table
ALTER TABLE "indents" ADD COLUMN "currentState" VARCHAR(50);

-- CreateIndex: Add index on currentState
CREATE INDEX "indents_currentState_idx" ON "indents"("currentState");

-- Backfill currentState based on status and remarks (domain WorkflowState keys)
-- Mapping: Prisma IndentStatus → domain WorkflowState with remarks disambiguation

-- DRAFT → DRAFT
UPDATE "indents" SET "currentState" = 'DRAFT' WHERE "status" = 'DRAFT';

-- SUBMITTED → DESIGN_COMPLETED
UPDATE "indents" SET "currentState" = 'DESIGN_COMPLETED' WHERE "status" = 'SUBMITTED';

-- PENDING_STORES → STORES_PROCESSING or MATERIALS_ISSUED (disambiguate by remarks)
UPDATE "indents" SET "currentState" = 'MATERIALS_ISSUED'
WHERE "status" = 'PENDING_STORES' AND "remarks" LIKE '%[MATERIALS_ISSUED]%';
UPDATE "indents" SET "currentState" = 'STORES_PROCESSING'
WHERE "status" = 'PENDING_STORES' AND ("remarks" IS NULL OR "remarks" NOT LIKE '%[MATERIALS_ISSUED]%');

-- IN_PRODUCTION → PRODUCTION_PROCESSING or PRODUCTION_COMPLETED (disambiguate by remarks)
UPDATE "indents" SET "currentState" = 'PRODUCTION_COMPLETED'
WHERE "status" = 'IN_PRODUCTION' AND "remarks" LIKE '%[PRODUCTION_COMPLETED]%';
UPDATE "indents" SET "currentState" = 'PRODUCTION_PROCESSING'
WHERE "status" = 'IN_PRODUCTION' AND ("remarks" IS NULL OR "remarks" NOT LIKE '%[PRODUCTION_COMPLETED]%');

-- APPROVED → CUSTOMER_DELIVERED
UPDATE "indents" SET "currentState" = 'CUSTOMER_DELIVERED' WHERE "status" = 'APPROVED';

-- PENDING_ACCOUNTS → ACCOUNTS_COST_VERIFICATION or ACTUAL_COST_UPDATED (disambiguate by remarks)
UPDATE "indents" SET "currentState" = 'ACTUAL_COST_UPDATED'
WHERE "status" = 'PENDING_ACCOUNTS' AND "remarks" LIKE '%[ACTUAL_COST_UPDATED]%';
UPDATE "indents" SET "currentState" = 'ACCOUNTS_COST_VERIFICATION'
WHERE "status" = 'PENDING_ACCOUNTS' AND ("remarks" IS NULL OR "remarks" NOT LIKE '%[ACTUAL_COST_UPDATED]%');

-- PENDING_SENIOR_MANAGER → ACCOUNTS_FINANCIAL_CLOSURE
UPDATE "indents" SET "currentState" = 'ACCOUNTS_FINANCIAL_CLOSURE' WHERE "status" = 'PENDING_SENIOR_MANAGER';

-- PENDING_GENERAL_MANAGER → ARCHIVED
UPDATE "indents" SET "currentState" = 'ARCHIVED' WHERE "status" = 'PENDING_GENERAL_MANAGER';

-- COMPLETED → COMPLETED
UPDATE "indents" SET "currentState" = 'COMPLETED' WHERE "status" = 'COMPLETED';

-- REJECTED → DRAFT (rejected indents return to draft state)
UPDATE "indents" SET "currentState" = 'DRAFT' WHERE "status" = 'REJECTED';

-- CANCELLED → DRAFT (cancelled indents return to draft state)
UPDATE "indents" SET "currentState" = 'DRAFT' WHERE "status" = 'CANCELLED';
