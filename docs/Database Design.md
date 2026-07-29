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
