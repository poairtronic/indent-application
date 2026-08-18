-- Phase 2 Foundation Schema Migration
-- 1. Alter Table indents to add customerName and layoutNumber columns
ALTER TABLE "indents" ADD COLUMN IF NOT EXISTS "customerName" VARCHAR(150);
ALTER TABLE "indents" ADD COLUMN IF NOT EXISTS "layoutNumber" VARCHAR(100);

-- Create Indexes for customerName and layoutNumber on indents
CREATE INDEX IF NOT EXISTS "indents_customerName_idx" ON "indents"("customerName");
CREATE INDEX IF NOT EXISTS "indents_layoutNumber_idx" ON "indents"("layoutNumber");

-- 2. Alter Table cost_sheets to add global cost breakdown columns
ALTER TABLE "cost_sheets" ADD COLUMN IF NOT EXISTS "designCost" DECIMAL(18, 4) NOT NULL DEFAULT 0;
ALTER TABLE "cost_sheets" ADD COLUMN IF NOT EXISTS "overheadCost" DECIMAL(18, 4) NOT NULL DEFAULT 0;
ALTER TABLE "cost_sheets" ADD COLUMN IF NOT EXISTS "contingencyCost" DECIMAL(18, 4) NOT NULL DEFAULT 0;
ALTER TABLE "cost_sheets" ADD COLUMN IF NOT EXISTS "actualDesignCost" DECIMAL(18, 4);
ALTER TABLE "cost_sheets" ADD COLUMN IF NOT EXISTS "actualOverheadCost" DECIMAL(18, 4);
ALTER TABLE "cost_sheets" ADD COLUMN IF NOT EXISTS "actualContingencyCost" DECIMAL(18, 4);

-- 3. Drop legacy approval_history table and related constraints if exists (Zero-Approval architecture)
DROP TABLE IF EXISTS "approval_history" CASCADE;
