# MERC LEVEL 6 INDEX STATE

Verified from Neon PostgreSQL catalog on 2026-08-22.

## 1. Prisma-Defined Indexes (in schema.prisma)

These are defined in the Prisma schema and managed by migrations.

### Indent Table (indents)
| Index Name | Columns | Type |
|---|---|---|
| indents_pkey | id | UNIQUE |
| indents_indentNumber_key | indentNumber | UNIQUE |
| indents_indentNumber_idx | indentNumber | BTREE |
| indents_customerName_idx | customerName | BTREE |
| indents_layoutNumber_idx | layoutNumber | BTREE |
| indents_productId_idx | productId | BTREE |
| indents_departmentId_idx | departmentId | BTREE |
| indents_createdBy_idx | createdBy | BTREE |
| indents_status_idx | status | BTREE |
| indents_currentState_idx | currentState | BTREE |
| indents_currentStageId_idx | currentStageId | BTREE |
| indents_requiredDate_idx | requiredDate | BTREE |
| indents_createdAt_idx | createdAt | BTREE |

### AuditLog Table (audit_logs)
| Index Name | Columns | Type |
|---|---|---|
| audit_logs_pkey | id | UNIQUE |
| audit_logs_createdAt_idx | createdAt | BTREE |
| audit_logs_module_idx | module | BTREE |
| audit_logs_recordId_idx | recordId | BTREE |
| audit_logs_performedBy_idx | performedBy | BTREE |

### WorkflowHistory Table (workflow_history)
| Index Name | Columns | Type |
|---|---|---|
| workflow_history_pkey | id | UNIQUE |
| workflow_history_indentId_idx | indentId | BTREE |
| workflow_history_stageId_idx | stageId | BTREE |
| workflow_history_fromDepartmentId_idx | fromDepartmentId | BTREE |
| workflow_history_toDepartmentId_idx | toDepartmentId | BTREE |
| workflow_history_movedBy_idx | movedBy | BTREE |
| workflow_history_movedAt_idx | movedAt | BTREE |
| workflow_history_createdAt_idx | createdAt | BTREE |
| workflow_history_isDeleted_idx | isDeleted | BTREE |

### NotificationRecipient Table (notification_recipients)
| Index Name | Columns | Type |
|---|---|---|
| notification_recipients_pkey | notificationId, userId | UNIQUE |
| notification_recipients_userId_idx | userId | BTREE |
| notification_recipients_notificationId_idx | notificationId | BTREE |
| notification_recipients_isRead_idx | isRead | BTREE |
| notification_recipients_isDeleted_idx | isDeleted | BTREE |

## 2. Raw SQL Indexes (Level 6 — NOT in Prisma schema)

These exist in the database but are NOT defined in schema.prisma.

| Table | Index Name | Columns | Direction | Purpose |
|---|---|---|---|---|
| audit_logs | audit_logs_record_id_created_at_idx | recordId, createdAt | DESC | Audit trail per record |
| audit_logs | idx_audit_logs_created | createdAt | DESC | Audit log listing |
| audit_logs | idx_audit_logs_module_created | module, createdAt | DESC | Module-filtered audit |
| workflow_history | workflow_history_indent_id_created_at_idx | indentId, createdAt | DESC | Workflow history per indent |
| indent_history | indent_history_indent_id_created_at_idx | indentId, createdAt | DESC | Indent change history |
| notification_recipients | notification_recipients_created_at_idx | createdAt | DESC | Notification listing |
| notification_recipients | idx_recipients_user_read_deleted | userId, isRead, isDeleted | — | Notification inbox |
| notification_recipients | notification_recipients_userId_isRead_isDeleted_idx | userId, isRead, isDeleted | — | DUPLICATE of above |
| indents | idx_indents_deleted_created | isDeleted, createdAt | DESC | Soft-delete-safe listing |
| indents | idx_indents_deleted_state_created | isDeleted, currentState, createdAt | DESC | State-filtered listing |
| units | units_isDeleted_idx | isDeleted | — | Soft-delete filter |

## 3. Redundant Indexes (Candidates for Removal)

These single-column indexes are fully covered by composite indexes.

| Table | Redundant Index | Covered By |
|---|---|---|
| audit_logs | audit_logs_recordId_idx | audit_logs_record_id_created_at_idx |
| audit_logs | audit_logs_createdAt_idx | idx_audit_logs_created, idx_audit_logs_module_created |
| notification_recipients | notification_recipients_userId_idx | idx_recipients_user_read_deleted |
| notification_recipients | notification_recipients_isRead_idx | idx_recipients_user_read_deleted |
| notification_recipients | notification_recipients_isDeleted_idx | idx_recipients_user_read_deleted |

## 4. Recommended New Composite Indexes (Pending Analysis)

To be determined after EXPLAIN ANALYZE on key queries:
- `indent_items` for `storesIssueMaterials` queries
- `materials` for stock decrement queries
- `cost_sheet` for `findByIndentId` queries