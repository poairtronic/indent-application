# Enterprise Manufacturing System Database Design

This document details the database schema design for the **Enterprise Manufacturing Indent & Costing Management System**. It covers both the **Master Data** layer (Phase 7A) and the **Business Transaction** layer (Phase 7B), designed to support a complex manufacturing workflow with Role-Based Access Control (RBAC), multi-department isolation, costing analysis, and production tracking.

---

## 1. ER Diagram (ASCII Representation)

```text
+------------------+          +------------------+          +-------------------+
|    Department    |          |       Role       |          |    Permission     |
+------------------+          +------------------+          +-------------------+
| PK id (Uuid)     |          | PK id (Uuid)     |          | PK id (Uuid)      |
|    departmentCode|<-\       |    roleName      |<-\       |    module         |
|    departmentName|  |       |    description   |  |       |    action         |
|    status        |  |       |    isSystem      |  |       |    code           |
+------------------+  |       +------------------+  |       +-------------------+
        |             |               |             |                 |
        | 1           |               | 1           |                 | 1
        |             |               |             |                 |
        | M           |               | M           | M               | M
+------------------+  |       +------------------+  |       +-------------------+
|       User       |  |       |  RolePermission  |  |       |  RolePermission   |
+------------------+  |       +------------------+  |       +-------------------+
| PK id (Uuid)     |  |       | PK/FK roleId ----/  |       | PK/FK permissionId|
|    employeeCode  |  |       | PK/FK permissId----------------/                 |
+------------------+  |       +------------------+
        |             |
        | 1           |
        |             |
        | M           |
+------------------+  |       +------------------+          +-------------------+
|      Indent      |--/       |    CostSheet     |          |   WorkflowStage   |
+------------------+          +------------------+          +-------------------+
| PK id (Uuid)     |<-------->| PK id (Uuid)     |          | PK id (Uuid)      |
|    indentNumber  | 1      1 | FK indentId      |          |    stageName      |
| FK productId     |          |    costNumber    |          |    sequence       |
| FK departmentId  |          |    predictedTotal|          +-------------------+
|    status        |          |    actualTotal   |                    |
|    version       |          +------------------+                    | 1
+------------------+                   |                              |
        |                              | 1                            | M
        | 1                            |                              |
        |                              | M                  +-------------------+
        | M                    +------------------+         |  WorkflowHistory  |
+------------------+           |     CostItem     |         +-------------------+
|    IndentItem    |           +------------------+         | PK id (Uuid)      |
+------------------+           | PK id (Uuid)     |         | FK indentId       |
| PK id (Uuid)     |<-\        | FK costSheetId   |         | FK fromDeptId     |
| FK indentId      |  |        | FK materialId    |         | FK toDeptId       |
| FK materialId    |  |        |    predictedRate |         | FK stageId        |
|    quantity      |  |        |    actualRate    |         +-------------------+
+------------------+  |        +------------------+
        |             |
        | 1           |
        |             |
        | M           |
+------------------+  |        +------------------+         +-------------------+
|  IndentProcess   |  \--------|     Material     |         |      Vendor       |
+------------------+           +------------------+         +-------------------+
| PK id (Uuid)     |           | PK id (Uuid)     |<------->| PK id (Uuid)      |
| FK indentItemId  |           |    materialCode  | M     M |    vendorCode     |
| FK processId     |           | FK unitId        |         |    vendorName     |
+------------------+           +------------------+         +-------------------+
                                       | 1
                                       |
                                       | M
                               +------------------+
                               |       Unit       |
                               +------------------+
                               | PK id (Uuid)     |
                               |    unitCode      |
                               +------------------+
```

---

## 2. Database Design Explanation

### Third Normal Form (3NF) Compliance
The system is fully normalized to **3NF**:
- **Master Data**: Entities like `User`, `Role`, `Material`, `Unit`, and `Vendor` are decoupled to prevent redundancy.
- **Transactions**: Core business documents like `Indent` and `CostSheet` are separated, with the `CostSheet` referencing the `Indent` in a 1:1 relationship to maintain financial history associated with a specific manufacturing request.
- **Line Items**: Details for indents and costing are handled through dedicated item tables (`IndentItem`, `CostItem`) ensuring atomic data storage.

### Soft Delete & Temporal Tracking
Every table in the system (Master & Transaction) contains standard soft-delete properties:
- `isDeleted`: Boolean flag (`default(false)`).
- `deletedAt`: Optional timestamp of deletion (`timestamptz`).
- `deletedBy`: Optional UUID of the actor who performed the deletion.

### Comprehensive Audit Trail
In compliance with enterprise governance standards, every table supports absolute audit tracking:
- `createdAt` / `updatedAt`: Automatic temporal tracking (`timestamptz`).
- `createdBy` / `updatedBy`: Tracks the operator responsible for record management.
- **Indent History**: Versions of indents are stored in `IndentHistory` using JSONB snapshots, allowing for complete document reconstruction at any point in time.

### Strict Data Types & Precision
- **Decimal Precision**: All stock levels, quantities, and rates utilize `decimal(18,4)` for high precision. Percentages use `decimal(5,2)`. Estimated and actual hours use `decimal(8,2)`.
- **UUID Keys**: All primary and foreign keys are UUID v4 to ensure global uniqueness and prevent sequence enumeration.

---

## 3. Transaction Table Descriptions

### 3.1 `indents` (Indent Header)
The primary document initiating the manufacturing request.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `indentNumber` | `varchar(50)` | Unique document number |
| `productId` | `uuid` | Product being manufactured |
| `departmentId` | `uuid` | Owning department |
| `priority` | `enum` | LOW, MEDIUM, HIGH, URGENT |
| `status` | `enum` | Lifecycle state (DRAFT, SUBMITTED, etc.) |
| `requiredDate` | `timestamptz`| Date when material is needed |
| `requiredDeliveryDate` | `timestamptz`| Expected/Actual delivery date |
| `purpose` | `text` | Business justification |
| `remarks` | `text` | Extra notes |
| `version` | `int` | Document version number |
| `isLocked` | `boolean` | Locked status |

### 3.2 `indent_items` (Indent Sourced Materials)
Material item rows belonging to an Indent.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `indentId` | `uuid` | Parent Indent relation |
| `materialId` | `uuid` | Sourced Material relation |
| `quantity` | `decimal(18,4)`| Quantity requested |
| `unitId` | `uuid` | Measurement unit relation |
| `remarks` | `text` | Remarks |
| `status` | `varchar(50)`| Item status |

### 3.3 `indent_attachments` (Engineering Drawings / Specifications)
Drawings, CAD, PDF, or Excel sheets attached to the Indent.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `indentId` | `uuid` | Parent Indent relation |
| `fileName` | `varchar(255)`| Filename |
| `fileUrl` | `varchar(500)`| Remote storage URI |
| `fileType` | `enum` | PDF, DRAWING, CAD, IMAGE, EXCEL, OTHER |
| `uploadedBy` | `uuid` | Uploader User relation |

### 3.4 `indent_processes` (Line Item Sourced Manufacturing Steps)
Undergoing process steps mapping items to manufacturing processes.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `indentItemId` | `uuid` | Parent IndentItem relation |
| `processId` | `uuid` | Sourced ManufacturingProcess relation |
| `sequence` | `int` | Sequential step execution order |
| `estimatedHours`| `decimal(8,2)`| Estimated process hours |
| `actualHours` | `decimal(8,2)`| Realized process hours |
| `status` | `enum` | Active/Inactive |

### 3.5 `cost_sheets` (Costing Header)
Financial companion to an Indent.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `costNumber` | `varchar(50)` | Unique costing number |
| `indentId` | `uuid` | Link to parent Indent (1:1) |
| `preparedBy` | `uuid` | Preparer User relation |
| `predictedTotal` | `decimal(18,4)`| Total estimated cost |
| `actualTotal` | `decimal(18,4)`| Total realized cost |
| `varianceAmount` | `decimal(18,4)`| Difference between predicted and actual |
| `variancePercentage` | `decimal(5,2)`| Percentage variance |
| `status` | `enum` | Cost sheet status (DRAFT, FINALIZED, CANCELLED) |

### 3.6 `cost_items` (Material Costs)
Detailed material rates and amounts.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `costSheetId` | `uuid` | Parent CostSheet relation |
| `materialId` | `uuid` | Sourced Material relation |
| `vendorId` | `uuid` | Selected Vendor relation |
| `predictedRate` | `decimal(18,4)`| Predicted unit rate |
| `predictedQuantity` | `decimal(18,4)`| Sourced quantity |
| `predictedAmount` | `decimal(18,4)`| Sourced quantity * predicted rate |
| `actualRate` | `decimal(18,4)`| Actual unit rate |
| `actualQuantity` | `decimal(18,4)`| Realized quantity |
| `actualAmount` | `decimal(18,4)`| Realized amount |

### 3.7 `process_costs` (Process Costs)
Cost allocations for manufacturing steps.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `costSheetId` | `uuid` | Parent CostSheet relation |
| `processId` | `uuid` | Sourced ManufacturingProcess relation |
| `predictedCost` | `decimal(18,4)`| Predicted cost |
| `actualCost` | `decimal(18,4)`| Realized cost |
| `variance` | `decimal(18,4)`| Realized - predicted |
| `estimatedHours`| `decimal(8,2)`| Sourced process hours |
| `actualHours` | `decimal(8,2)`| Realized process hours |

### 3.8 `additional_material_requests` (AMR)
Handles requests for extra materials on an existing indent without creating a new document.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `parentIndentId`| `uuid` | Original Indent reference |
| `requestNumber` | `varchar(50)` | Unique AMR number |
| `requestedBy` | `uuid` | Requester User relation |
| `approvedBy` | `uuid` | Approver User relation |
| `reason` | `text` | Reason details |
| `status` | `enum` | DRAFT, PENDING, APPROVED, REJECTED |

### 3.9 `additional_material_items` (AMR Item Rows)
Material items requested in an AMR.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `requestId` | `uuid` | Parent AMR relation |
| `materialId` | `uuid` | Sourced Material relation |
| `quantity` | `decimal(18,4)`| Extra quantity requested |
| `unitId` | `uuid` | Measurement unit relation |

### 3.10 `approval_history` (Approval/Rejection Logs)
Audit logs of approval transitions.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `indentId` | `uuid` | Sourced Indent relation |
| `approvedBy` | `uuid` | Decision Maker relation |
| `roleId` | `uuid` | Role used for approval relation |
| `status` | `enum` | Transitioned IndentStatus |
| `remarks` | `text` | Decision comments |
| `approvedAt` | `timestamptz`| Decision timestamp |

### 3.11 `workflow_stages` (Logical Stages)
Lifecycle workflow stage configuration.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `stageName` | `varchar(100)`| Stage name (unique) |
| `sequence` | `int` | Execution order sequence |
| `description` | `varchar(255)`| Details |

### 3.12 `workflow_history` (Tracking)
Tracks the movement of an Indent through the organization.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `indentId` | `uuid` | Indent being moved |
| `fromDepartmentId`| `uuid` | Source department |
| `toDepartmentId` | `uuid` | Destination department |
| `stageId` | `uuid` | Logical workflow stage |
| `movedBy` | `uuid` | User who initiated the move |

### 3.13 `production_receipts` (Acknowledgement of Sourced Delivery)
Execution acknowledgment by production department.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `indentId` | `uuid` | Unique Indent relation (1:1) |
| `receivedBy` | `uuid` | Receiver User relation |
| `receivedDate` | `timestamptz`| Date of receipt |

### 3.14 `indent_history` (Version Control Audit Backups)
Snapshot backups of modified indents.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `indentId` | `uuid` | Sourced Indent relation |
| `version` | `int` | Snapshotted version number |
| `snapshot` | `jsonb` | Complete indent snapshot data |
| `changedBy` | `uuid` | User who modified relation |
| `changedAt` | `timestamptz`| Modify timestamp |

---

## 4. Lifecycle & Workflow

The Indent follows a linear approval and execution path:
1. **Design**: Creates Indent and Predicted Costing.
2. **Stores**: Verifies material availability and updates sourcing.
3. **Accounts**: Finalizes predicted costing and budget approval.
4. **Management**: (Senior/General Manager) Reviews and notifies.
5. **Production**: Executes manufacturing and acknowledges receipt (`ProductionReceipt`).

---

## 5. Constraints & Indexes

### Key Constraints
- **Uniqueness**: `indentNumber`, `costNumber`, and `requestNumber` are globally unique.
- **Composite Unique**: `IndentProcess` is unique on `(indentItemId, processId)`.
- **Integrity**: Deleting Master Data (Users, Materials) is **restricted** if transaction records exist.

### Performance Indexing
- **Lookups**: Indexes on all code fields (`indentNumber`, `costNumber`, `materialCode`).
- **Workflow**: Indexes on `status` and `currentStageId` for dashboard filtering.
- **Temporal**: Indexes on `createdAt` and `movedAt` for reporting and audit logs.
- **Soft Deletes**: Indexes on `isDeleted` to filter out deleted entries quickly.

---

## 6. Infrastructure Table Descriptions (Phase 7C)

### 6.1 `notifications` (In-App Notifications)
Stores system alerts for users.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `title` | `varchar(150)` | Title of alert |
| `message` | `text` | Alert body message |
| `type` | `enum` | Type of notification (INFO, SUCCESS, WARNING, etc.) |
| `priority` | `enum` | Priority (LOW, MEDIUM, HIGH, URGENT) |
| `referenceId` | `uuid` | Optional ID of linked record (e.g. Indent id) |
| `referenceModule`| `varchar(100)`| Optional name of linked module |
| `createdBy` | `uuid` | User ID of sender |

### 6.2 `notification_recipients` (Delivery tracking)
Maps alerts to individual users.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `notificationId`| `uuid` | Parent notification reference (Composite PK) |
| `userId` | `uuid` | Recipient user reference (Composite PK) |
| `isRead` | `boolean` | Read status |
| `readAt` | `timestamptz`| Timestamp when read |
| `deliveryStatus` | `varchar(50)` | Senders status (DELIVERED, PENDING, FAILED) |

### 6.3 `email_logs` (Outbound emails log)
Tracks status of SMTP transactional messages.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `userId` | `uuid` | Target User reference (optional) |
| `to` | `varchar(150)` | To address |
| `cc` | `text` | CC addresses list |
| `bcc` | `text` | BCC addresses list |
| `subject` | `varchar(255)` | Subject |
| `body` | `text` | HTML or text body |
| `status` | `varchar(50)` | Status (SENT, FAILED, PENDING) |
| `errorMessage` | `text` | Reason on delivery failures |
| `sentAt` | `timestamptz`| Sent timestamp |
| `retryCount` | `int` | Retries count |

### 6.4 `audit_logs` (Security updates history)
Stores changes in records state (creation, modifications, deletions).

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `module` | `varchar(100)`| Target table name |
| `recordId` | `varchar(100)`| Affected row UUID |
| `action` | `varchar(50)` | CREATE, UPDATE, DELETE |
| `oldValue` | `jsonb` | State details before change |
| `newValue` | `jsonb` | State details after change |
| `performedBy` | `uuid` | Actor User reference |
| `ipAddress` | `varchar(45)` | Source IP address |
| `browser` | `varchar(150)`| Source user agent browser |
| `operatingSystem`| `varchar(100)`| Source user agent OS |
| `device` | `varchar(100)`| Source device model |
| `createdAt` | `timestamptz`| Log creation timestamp |

### 6.5 `activity_logs` (User activity)
Monitors user actions like logins, exports, views.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `userId` | `uuid` | Actor User reference |
| `activity` | `varchar(100)`| Action performed |
| `module` | `varchar(100)`| Context module name |
| `description` | `text` | Descriptive narrative |
| `createdAt` | `timestamptz`| Log creation timestamp |

### 6.6 `reports` (Stored reports)
Keeps track of documents (PDF, Excel) compiled by users.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `reportName` | `varchar(150)`| Report filename |
| `reportType` | `varchar(50)` | Format (PDF, EXCEL, CSV) |
| `generatedBy` | `uuid` | User who ran the compilation |
| `fileUrl` | `varchar(500)`| Document location path |
| `fileSize` | `bigint` | Bytes size |
| `generatedAt` | `timestamptz`| Generation timestamp |

### 6.7 `report_downloads` (Download trackers)
Audit downloads history.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `reportId` | `uuid` | Parent Report reference |
| `downloadedBy` | `uuid` | User who downloaded |
| `downloadedAt` | `timestamptz`| Download timestamp |

### 6.8 `user_sessions` (Active logins)
Maintains session state for concurrent sessions check and security validations.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `userId` | `uuid` | Owner User reference |
| `sessionToken` | `varchar(255)`| Token signature (unique) |
| `refreshToken` | `varchar(255)`| Extension token (unique) |
| `ipAddress` | `varchar(45)` | Source IP address |
| `browser` | `varchar(150)`| User browser agent |
| `device` | `varchar(100)`| User device agent |
| `loginAt` | `timestamptz`| Login timestamp |
| `logoutAt` | `timestamptz`| Logout timestamp |
| `expiresAt` | `timestamptz`| Expiration limit timestamp |

### 6.9 `refresh_tokens` (Refresh token rotation storage)
Maintains secure rotation tokens list.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `userId` | `uuid` | Owner User reference |
| `token` | `varchar(255)`| Refresh token hash (unique) |
| `expiresAt` | `timestamptz`| Expiration date |
| `revokedAt` | `timestamptz`| Cancellation timestamp |

### 6.10 `password_reset_tokens` (Pass reset security)
Used for single use user identity resets.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `userId` | `uuid` | Target User reference |
| `token` | `varchar(255)`| Single use token hash (unique) |
| `expiresAt` | `timestamptz`| Expiration timestamp |
| `usedAt` | `timestamptz`| Reset verification timestamp |

### 6.11 `application_settings` (Dynamic configuration settings)
Allows editing SMTP settings, SLA limits, portal configurations on-the-fly.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `key` | `varchar(100)`| Setting key identifier (unique) |
| `value` | `text` | Value |
| `category` | `varchar(100)`| Categories group (SMTP, SLA, etc.) |
| `description` | `varchar(255)`| Context details |

### 6.12 `file_uploads` (Documents storage index)
Keeps details on uploaded drawings or PDFs in remote buckets (S3 / Cloudinary).

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `fileName` | `varchar(255)`| Saved filename |
| `originalName` | `varchar(255)`| Original filename on upload |
| `extension` | `varchar(20)` | File format extension |
| `mimeType` | `varchar(100)`| Sourced file mime-type |
| `size` | `bigint` | Files bytes size |
| `storageProvider`| `varchar(50)` | Location type (LOCAL, S3, etc.) |
| `url` | `varchar(500)`| Uploaded path url |
| `uploadedBy` | `uuid` | Sourced User ID |

### 6.13 `dashboard_widgets` (Widgets repository)
Logical widget metadata.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `widgetCode` | `varchar(100)`| Code identifier (unique) |
| `widgetName` | `varchar(150)`| Display label |
| `icon` | `varchar(50)` | Display icon |
| `description` | `varchar(255)`| Context details |

### 6.14 `dashboard_preferences` (Dashboard layout configurations)
Saves specific widget position and toggle status per operator.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `userId` | `uuid` | Operator reference (Unique combination) |
| `widgetId` | `uuid` | Sourced widget reference (Unique combination) |
| `position` | `int` | Layout display rank sequence |
| `visible` | `boolean` | Visible state toggle |

### 6.15 `scheduled_jobs` (Background crons configuration)
Background scheduled cron settings.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `jobName` | `varchar(150)`| Cron name identifier (unique) |
| `cronExpression`| `varchar(100)`| Standard expression (e.g. `0 0 * * *`) |
| `enabled` | `boolean` | Run status state |

### 6.16 `job_execution_history` (Background processing log)
Executions history metadata (cron logs).

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `jobId` | `uuid` | Sourced ScheduledJob reference |
| `status` | `varchar(50)` | RUNNING, SUCCESS, FAILED |
| `startedAt` | `timestamptz`| Execute start timestamp |
| `completedAt` | `timestamptz`| Execute end timestamp |
| `error` | `text` | Failure trace log details |

### 6.17 `sla_trackers` (SLA deadlines logs)
Monitors tasks resolution windows (e.g., 2-day delivery escalation).

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `referenceId` | `uuid` | Sourced row reference (Indent, AMR) |
| `referenceModule`| `varchar(100)`| Target table reference name |
| `startTime` | `timestamptz`| Sourced start time |
| `endTime` | `timestamptz`| Sourced resolution time |
| `status` | `varchar(50)` | Sourced SLA status (PENDING, MET, BREACHED) |
| `breached` | `boolean` | Breach toggle |
| `breachTime` | `timestamptz`| Escalate time |

### 6.18 `timelines` (Timelines dashboard logging)
Shared timeline feeds for workflow movements tracking.

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `module` | `varchar(100)`| Target context category |
| `recordId` | `uuid` | Target UUID |
| `title` | `varchar(150)`| Headline visual card title |
| `description` | `text` | Expanded details text |
| `performedBy` | `uuid` | Performer User reference |
