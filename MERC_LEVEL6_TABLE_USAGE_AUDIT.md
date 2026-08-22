# MERC LEVEL 6 TABLE USAGE AUDIT

As part of the Level 6 PostgreSQL optimization, all tables were audited for active usage to map query paths safely and identify orphaned data structures. **No tables have been deleted.**

## Active Core Workflow Tables
These tables form the backbone of the Loop 1 / Loop 2 transaction architecture.
- **Indent**, **IndentItem**, **IndentProcess**, **IndentAttachment**, **IndentHistory**
- **CostSheet**, **CostItem**, **ProcessCost**
- **WorkflowHistory**
- **ProductionReceipt**
- **Material**, **Product**, **ProductMaterial**, **ManufacturingProcess**
- **Department**, **Unit**, **Vendor**, **MaterialVendor**
- **DocumentSequence**

## Active Security & Session Tables
- **User**, **Role**, **Permission**, **RolePermission**
- **UserSession**, **RefreshToken**, **PasswordResetToken**
- **AuditLog**

## Active Communication & Async Tables
- **Notification**, **NotificationRecipient**
- **EmailLog**

## Unused / Legacy Candidates (No App Usage Found)
These tables were aggressively searched within the `backend/src`, `frontend/src`, and cron contexts. They show zero direct Prisma calls and no UI references, marking them as candidates for future schema deprecation (not deleted now).
- **Machine**: UNKNOWN (No `prisma.machine.` usage found)
- **MachineLog**: UNKNOWN (No `prisma.machineLog.` usage found)
- **SLATracker**: UNKNOWN (No `prisma.sLaTracker.` usage found)
- **Timeline**: UNKNOWN (No `prisma.timeline.` usage found)
- **ActivityLog**: UNKNOWN (Duplicated by `AuditLog`, zero direct references found)
- **ReportDownload**: UNKNOWN (No references found)
- **AdditionalMaterialRequest**: UNKNOWN (AMR loop is not implemented in core services)
- **AdditionalMaterialItem**: UNKNOWN

## Indirectly Used (Reports / Analytics)
- **DepartmentBudget**: INDIRECTLY USED (Query found in `ReportsService`)
- **WorkflowStage**: INDIRECTLY USED (Query found in `ReportsService` for metrics generation)
- **ScheduledJob**, **JobExecutionHistory**: ACTIVE (Likely accessed by `QueueProcessor` or BullMQ adapters implicitly)
- **ApplicationSetting**: INDIRECTLY USED
- **DashboardWidget**, **DashboardPreference**: INDIRECTLY USED
