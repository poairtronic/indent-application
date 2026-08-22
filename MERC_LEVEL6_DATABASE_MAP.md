# MERC LEVEL 6 DATABASE MAP

This map outlines the core transactional clusters and index landscapes as currently defined in Prisma. 

## 1. Core Workflow Cluster
### `indents` (Indent)
- **PK:** `id`
- **FK:** `departmentId` -> `departments(id)`, `createdBy` -> `users(id)`, `productId` -> `products(id)`
- **Filters/Order:** `currentState`, `status`, `createdAt`, `isDeleted`
- **Current Indexes:** 
  - `@@index([indentNumber])`
  - `@@index([departmentId])`
  - `@@index([customerId])`
  - `@@index([productId])`
  - `@@index([currentState])`
  - `@@index([status])`
  - `@@index([isDeleted])`
- **Workload Category:** HIGH WRITE / HIGH READ (Pagination + Mutations)

### `indent_items` (IndentItem)
- **PK:** `id`
- **FK:** `indentId` -> `indents(id)`, `materialId` -> `materials(id)`, `unitId` -> `units(id)`
- **Current Indexes:** `@@index([indentId])`, `@@index([materialId])`, `@@index([isDeleted])`
- **Workload Category:** MODERATE WRITE / HIGH READ

### `cost_sheets` (CostSheet)
- **PK:** `id`
- **FK:** `indentId` -> `indents(id)` (UNIQUE)
- **Current Indexes:** `@@index([indentId])`, `@@index([documentNumber])`, `@@index([status])`
- **Workload Category:** MODERATE WRITE / MODERATE READ

### `workflow_history` (WorkflowHistory)
- **PK:** `id`
- **FK:** `indentId` -> `indents(id)`
- **Current Indexes:** `@@index([indentId])`, `@@index([movedBy])`, `@@index([toDepartmentId])`, `@@index([createdAt])`
- **Workload Category:** HIGH WRITE / MODERATE READ

## 2. Master Data Cluster
### `materials` (Material)
- **PK:** `id`
- **Current Indexes:** `@@index([materialCode])`, `@@index([materialCategory])`, `@@index([status])`, `@@index([isDeleted])`
- **Workload Category:** LOW WRITE / VERY HIGH READ (Transactions map frequently)

### `products` (Product)
- **PK:** `id`
- **Current Indexes:** `@@index([productCode])`, `@@index([productCategory])`, `@@index([isDeleted])`
- **Workload Category:** LOW WRITE / VERY HIGH READ

### `departments` (Department)
- **PK:** `id`
- **Current Indexes:** `@@index([departmentCode])`, `@@index([isDeleted])`
- **Workload Category:** RARE WRITE / VERY HIGH READ

## 3. Security & Auditing Cluster
### `users` (User)
- **PK:** `id`
- **FK:** `roleId`, `departmentId`
- **Current Indexes:** `@@index([email])`, `@@index([departmentId])`, `@@index([roleId])`, `@@index([isDeleted])`

### `audit_logs` (AuditLog)
- **PK:** `id`
- **Current Indexes:** `@@index([recordId])`, `@@index([userId])`, `@@index([action])`, `@@index([module])`, `@@index([createdAt])`
- **Workload Category:** VERY HIGH WRITE (Append Only) / LOW READ

## 4. Unused / Deprecation Targets (Zero App References)
- `machines`
- `machine_logs`
- `sla_trackers`
- `timelines`
- `activity_logs`
- `report_downloads`
- `additional_material_requests`
- `additional_material_items`
