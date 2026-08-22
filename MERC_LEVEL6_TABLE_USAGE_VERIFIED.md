# MERC LEVEL 6 TABLE USAGE VERIFIED

Verified from actual repository code inspection on 2026-08-22.

## Active Core Workflow Tables (CONFIRMED)

### Indent (indents) — HIGH WRITE / HIGH READ
- **Prisma calls found:** `prisma.indent.findUnique`, `prisma.indent.findMany`, `prisma.indent.create`, `prisma.indent.update`, `prisma.indent.updateMany`, `prisma.indent.count`
- **Used by:** BusinessTransactionService, ReportsService, AnalyticsService
- **Row count:** 90

### IndentItem (indent_items) — MODERATE WRITE / HIGH READ
- **Prisma calls found:** `prisma.indentItem.findMany`, `prisma.indentItem.create`, `prisma.indentItem.update`, `prisma.indentItem.updateMany`, `prisma.indentItem.deleteMany`
- **Used by:** BusinessTransactionService
- **Row count:** 97

### IndentProcess (indent_processes) — LOW WRITE / LOW READ
- **Prisma calls found:** `prisma.indentProcess.createMany`, `prisma.indentProcess.deleteMany`
- **Used by:** BusinessTransactionService
- **Row count:** 37

### IndentAttachment (indent_attachments) — LOW WRITE / MODERATE READ
- **Prisma calls found:** `prisma.indentAttachment.create`, `prisma.indentAttachment.findMany`
- **Used by:** BusinessTransactionService
- **Row count:** 0 active

### IndentHistory (indent_history) — LOW WRITE / LOW READ
- **Prisma calls found:** `prisma.indentHistory.create`
- **Used by:** BusinessTransactionService (audit trail)
- **Row count:** 0 active

### CostSheet (cost_sheets) — MODERATE WRITE / MODERATE READ
- **Prisma calls found:** `prisma.costSheet.findUnique`, `prisma.costSheet.findFirst`, `prisma.costSheet.create`, `prisma.costSheet.update`
- **Used by:** BusinessTransactionService, ReportsService
- **Row count:** 90

### CostItem (cost_items) — MODERATE WRITE / LOW READ
- **Prisma calls found:** `prisma.costItem.findMany`, `prisma.costItem.create`, `prisma.costItem.createMany`, `prisma.costItem.deleteMany`
- **Used by:** BusinessTransactionService
- **Row count:** 97

### ProcessCost (process_costs) — MODERATE WRITE / LOW READ
- **Prisma calls found:** `prisma.processCost.findMany`, `prisma.processCost.create`, `prisma.processCost.createMany`, `prisma.processCost.deleteMany`
- **Used by:** BusinessTransactionService
- **Row count:** 108

### WorkflowHistory (workflow_history) — HIGH WRITE / MODERATE READ
- **Prisma calls found:** `prisma.workflowHistory.create`, `prisma.workflowHistory.findMany`
- **Used by:** BusinessTransactionService
- **Row count:** 343

### ProductionReceipt (production_receipts) — LOW WRITE / LOW READ
- **Prisma calls found:** `prisma.productionReceipt.upsert`, `prisma.productionReceipt.findUnique`
- **Used by:** BusinessTransactionService
- **Row count:** 19

## Active Master Data Tables (CONFIRMED)

### Material (materials) — LOW WRITE / HIGH READ
- **Prisma calls found:** `prisma.material.findFirst`, `prisma.material.findUnique`, `prisma.material.findMany`, `prisma.material.create`, `prisma.material.update`
- **Used by:** BusinessTransactionService, MasterDataService
- **Row count:** 10

### Product (products) — LOW WRITE / HIGH READ
- **Prisma calls found:** `prisma.product.findFirst`, `prisma.product.findMany`, `prisma.product.create`
- **Used by:** BusinessTransactionService, MasterDataService
- **Row count:** 20

### ManufacturingProcess (manufacturing_processes) — LOW WRITE / HIGH READ
- **Prisma calls found:** `prisma.manufacturingProcess.findMany`, `prisma.manufacturingProcess.findFirst`
- **Used by:** MasterDataService
- **Row count:** 6

### Department (departments) — LOW WRITE / HIGH READ
- **Prisma calls found:** `prisma.department.findFirst`, `prisma.department.findMany`, `prisma.department.create`
- **Used by:** BusinessTransactionService, MasterDataService
- **Row count:** 8

### Unit (units) — LOW WRITE / HIGH READ
- **Prisma calls found:** `prisma.unit.findMany`
- **Used by:** MasterDataService
- **Row count:** 3

### Vendor (vendors) — LOW WRITE / LOW READ
- **Prisma calls found:** `prisma.vendor.findMany`
- **Used by:** MasterDataService
- **Row count:** 1

## Active Security & Session Tables (CONFIRMED)

### User (users) — LOW WRITE / HIGH READ
- **Prisma calls found:** `prisma.user.findUnique`, `prisma.user.findFirst`, `prisma.user.findMany`, `prisma.user.create`, `prisma.user.update`
- **Used by:** AuthService, UsersService, BusinessTransactionService
- **Row count:** 11

### Role (roles) — LOW WRITE / HIGH READ
- **Prisma calls found:** `prisma.role.findMany`, `prisma.role.findUnique`
- **Used by:** RolesService, AuthService
- **Row count:** 8

### Permission (permissions) — LOW WRITE / HIGH READ
- **Prisma calls found:** `prisma.permission.findMany`
- **Used by:** RolesService
- **Row count:** 66

### RolePermission (role_permissions) — LOW WRITE / MODERATE READ
- **Prisma calls found:** `prisma.rolePermission.createMany`, `prisma.rolePermission.deleteMany`, `prisma.rolePermission.findMany`
- **Used by:** RolesService
- **Row count:** 130

### UserSession (user_sessions) — HIGH WRITE / MODERATE READ
- **Prisma calls found:** `prisma.userSession.create`, `prisma.userSession.findFirst`, `prisma.userSession.updateMany`
- **Used by:** AuthService
- **Row count:** 354

### RefreshToken (refresh_tokens) — HIGH WRITE / LOW READ
- **Prisma calls found:** `prisma.refreshToken.create`, `prisma.refreshToken.findFirst`, `prisma.refreshToken.delete`
- **Used by:** AuthService
- **Row count:** 354

### AuditLog (audit_logs) — VERY HIGH WRITE / LOW READ
- **Prisma calls found:** `prisma.auditLog.create`, `prisma.auditLog.findMany`
- **Used by:** BusinessTransactionEventService
- **Row count:** 1,026

## Active Communication Tables (CONFIRMED)

### Notification (notifications) — MODERATE WRITE / MODERATE READ
- **Prisma calls found:** `prisma.notification.create`, `prisma.notification.findMany`
- **Used by:** NotificationService, BusinessTransactionEventService
- **Row count:** 240

### NotificationRecipient (notification_recipients) — MODERATE WRITE / MODERATE READ
- **Prisma calls found:** `prisma.notificationRecipient.createMany`, `prisma.notificationRecipient.findMany`, `prisma.notificationRecipient.updateMany`
- **Used by:** NotificationService
- **Row count:** 408

### EmailLog (email_logs) — MODERATE WRITE / LOW READ
- **Prisma calls found:** `prisma.emailLog.create`, `prisma.emailLog.findMany`
- **Used by:** CommunicationService
- **Row count:** 847

## Indirectly Used Tables (REPORTS / ANALYTICS)

- **DepartmentBudget** — Found in ReportsService
- **WorkflowStage** — Found in ReportsService
- **ApplicationSetting** — Found in SettingsService
- **DashboardWidget, DashboardPreference** — Found in DashboardService
- **ScheduledJob, JobExecutionHistory** — Found in QueueProcessor

## Legacy / Unknown (NO PRISMA CALLS FOUND)

These tables exist in the schema but have zero Prisma usage in the codebase:
- **Machine** — No `prisma.machine.` calls found
- **MachineLog** — No `prisma.machineLog.` calls found
- **SLATracker** — No `prisma.sLaTracker.` calls found
- **Timeline** — No `prisma.timeline.` calls found
- **ActivityLog** — Uses raw SQL, not Prisma (373 rows)
- **ReportDownload** — No `prisma.reportDownload.` calls found
- **AdditionalMaterialRequest** — No `prisma.additionalMaterialRequest.` calls found
- **AdditionalMaterialItem** — No `prisma.additionalMaterialItem.` calls found
- **ProductMaterial** — No `prisma.productMaterial.` calls found
- **MaterialVendor** — No `prisma.materialVendor.` calls found
- **FileUpload** — No `prisma.fileUpload.` calls found

**NOTE:** These tables are NOT deleted. They remain in the schema for potential future use.