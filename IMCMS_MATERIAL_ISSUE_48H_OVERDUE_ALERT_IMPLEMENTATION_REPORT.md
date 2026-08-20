# IMCMS Material Issue 48-Hour Overdue Alert System
## Implementation Audit Report

### 1. Requirements Validation
- **Requirement:** Track partial material issues correctly and alert if required materials remain unissued for >48 hours in Stores.
- **Validation:** Implemented `issuedQuantity` in Prisma schema to enable partial issue tracking. The Overdue Scheduler filters out items where `issuedQuantity >= quantity`.

### 2. Database Changes
- **Model:** `IndentItem`
- **Field Added:** `issuedQuantity Decimal @default(0) @db.Decimal(18, 4)`
- **Impact:** Allows granular tracking of partially issued materials, instead of relying on a binary `status = ISSUED` toggle at the item level.

### 3. Core Workflow Engine (`business-transaction.service.ts`)
- Modified `storesIssueMaterials` to process `StoresIssueDto.issueItems`.
- It now increments `issuedQuantity`. The Indent only transitions to `MATERIALS_ISSUED` when all items are fully issued (i.e. `issuedQuantity >= quantity`).
- Added partial issue audit logging (`AuditEventType.STORES_ISSUE` with `partial: true`).

### 4. Background Job & Scheduling
- Implemented `OverdueMaterialScheduler` in `backend/src/notifications/overdue-material.scheduler.ts`.
- It uses `@nestjs/schedule` (`@Cron(CronExpression.EVERY_15_MINUTES)`) to evaluate outstanding indents.
- Retrieves all indents in `STORES_PROCESSING` state.
- Checks if >48 hours have elapsed since the indent entered the stores processing stage.
- Triggers `CommunicationEventType.MATERIAL_ISSUE_OVERDUE`.

### 5. Notifications & Alerts
- Added `MATERIAL_ISSUE_OVERDUE` to `CommunicationEventType`.
- Updated `NOTIFICATION_EVENT_RULES` with target configuration (executives & stores).
- Created Handlebars template `material_issue_overdue.hbs` displaying required, issued, and remaining quantities per material in a table format.

### 6. Settings Integration
- Added `MATERIAL_ISSUE_OVERDUE_ALERTS_ENABLED` setting functionality via a new Backend API (`/settings`).
- Integrated API call with the Frontend (`SettingsPage.tsx`) replacing local Zustand storage for this feature, enabling global admin control over the alerts.

### 7. Constraints Preserved
- **Two-Loop Zero-Approval Architecture:** Unchanged. The alert is purely passive monitoring and notification, generating no approval gates.
- **No Redesign of Email System:** Piggybacked seamlessly onto the existing BullMQ/Nodemailer/Handlebars pipeline.

---
**Status:** COMPLETE & AUDITED.
