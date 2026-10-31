# Business Flow Specification: MERC Application

**Document Version:** 1.0  
**Target Application:** MERC (Manufacturing Enterprise Resource & Costing System / IMCMS)  
**Date:** October 31, 2026  
**Audience:** Business Process Owners, Integration Architects, Engineering Teams  
**Rule:** No source code modifications. Every claim is strictly cited with file paths and line numbers or symbols.

---

## 1. Purpose of the Application and Daily Users

The **MERC (Manufacturing Enterprise Resource & Costing)** application is a specialized engineering, execution, and cost-variance ERP system designed for customized, made-to-order manufacturing jobs. Its core mission is to track the lifecycle of specialized manufacturing indents across two decoupled business loops:
1. **Loop 1 (Manufacturing Execution Loop):** Detailed engineering design, Bill of Materials (BOM) specification with custom dimensional cutting parameters, raw material stock verification and stores issue, shop-floor physical receipt, and manufacturing completion.
2. **Loop 2 (Financial Closure Loop):** Collection of actual supplier invoices, labor hours, and sub-contracting charges, automated variance calculation against planned engineering estimates, and executive financial closure.

**Daily Users by Department:**
- **Design Engineers:** Draft technical indent sheets, select raw materials, input cutting dimensions, assign manufacturing process sequences, estimate planned labor hours and costs, and attach technical drawings (`database/schema.prisma:L266-268`, `backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L15-38`).
- **Stores Executives:** Verify raw material availability against warehouse stock, decrement on-hand inventory balances, and issue materials to production (`database/schema.prisma:L355-388`, `backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L40-62`).
- **Production Executives:** Acknowledge physical receipt of materials at the shop floor, log production commencement and daily work-center status updates, and mark manufacturing complete (`database/schema.prisma:L913-937`, `backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L64-86`).
- **Accounts Executives:** Audit actual raw material and brought-out expenses, record outsourced vendor bills and in-house labor costs, compute variance percentages, and finalize financial closure (`database/schema.prisma:L687-789`, `backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L88-130`).
- **Senior Managers & General Managers:** Passively monitor transaction throughput, bottleneck stages, 48-hour material issue SLA alerts, and executive financial variance dashboards without administrative approval bottlenecks under MERC’s **Two-Loop Zero-Approval Architecture** (`PRD.md:L16-24`, `backend/src/business-transaction/definitions/notification-event.definition.ts:L1-124`).

---

## 2. Step-by-Step Business Flow

The following numbered sequence represents the true operational flow of an indent in MERC:

```
[Design Engineer] Drafts Indent & Cost Sheet (DRAFT)
       │
       ▼
[Design Engineer] Submits Design (DESIGN_COMPLETED)
       │
       ▼
[Stores Executive] Verifies Stock Availability (STORES_PROCESSING)
       │
       ▼
[Stores Executive] Issues Materials (MATERIALS_ISSUED)
       │
       ▼
[Production Executive] Confirms Physical Receipt (PRODUCTION_PROCESSING)
       │
       ├─► Logs Work Started & Daily Progress Notes
       │
       ▼
[Production Executive] Completes Manufacturing (PRODUCTION_COMPLETED)
       │  (Loop 1 Boundary: Manufacturing Closed)
       ▼
[Accounts Executive] Initiates Cost Verification (ACCOUNTS_COST_VERIFICATION)
       │
       ▼
[Accounts Executive] Enters Invoices & Computes Variance (ACTUAL_COST_UPDATED)
       │
       ▼
[Accounts Executive] Finalizes Financial Closure (ACCOUNTS_FINANCIAL_CLOSURE)
       │  (Loop 2 Boundary: Financial Closed)
       ▼
[System / Admin] Automated Archival & Record Lock (ARCHIVED)
       │
       ▼
[System / Admin] Terminal Completion (COMPLETED)
```

### Detailed Operational Steps

#### Step 1: Indent Drafting & Planned Costing
- **Actor Role:** Design Engineer (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L20-21`).
- **Screen / Route:** `/indents/create` (`frontend/src/app/router.tsx:L312-318`).
- **What Actor Does:** Fills the comprehensive indent header, line-item materials, dimensions, process routings, brought-out items, and planned overhead costs.
- **Data Entered / Selected:**
  - Header: Customer Name, Layout Number, Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), Required Date, Required Delivery Date, PO Number (captured in purpose field), General Remarks (`frontend/src/modules/indent/components/IndentForm.tsx:L124-132`).
  - Material Line Items: Product reference, Material SKU (chosen from master), Shape (`ROUND`, `RECTANGLE`, `SHEET`), cut dimensions (Diameter, Length, Width, Thickness in mm), Quantity, Unit of Measure, Procurement Source (`frontend/src/modules/indent/components/IndentForm.tsx:L133-147`).
  - Manufacturing Processes: Process Name (from master), Vendor Type (`In-house` or `Outsourced Vendor`), Work Center / Vendor ID, Estimated Hours, Planned Process Cost (`frontend/src/modules/indent/components/IndentForm.tsx:L148-163`).
  - Brought-Out Items: Name, Quantity, Specification, Planned Amount (`frontend/src/modules/indent/components/IndentForm.tsx:L166-177`).
  - Planned Cost Overheads: Estimated Material Rates, Design Cost, Overhead Cost, Contingency Cost (`frontend/src/modules/indent/components/IndentForm.tsx:L178-201`).
- **System Action Followed:**
  - Saves record in `indents` table with `status = 'DRAFT'` and `currentState = 'DRAFT'` (`backend/src/business-transaction/services/business-transaction.service.ts:L245-385`).
  - Auto-allocates annual document numbers: `AGIPL-IND-YYYY-XXX` and `AGIPL-CS-YYYY-XXX` (`backend/src/common/services/document-number.service.ts:L65-98`).
  - Auto-calculates planned totals:
    $$\text{Planned Total} = \sum \text{Item Amounts} + \sum \text{Brought Amounts} + \sum \text{Process Costs} + \text{Overhead Costs}$$
  - No stock change occurs; no notification dispatched (`backend/src/business-transaction/definitions/notification-event.definition.ts:L14`).
- **Next Actor:** Design Engineer (uploads drawings or submits).

#### Step 2: Drawing Attachment Upload
- **Actor Role:** Design Engineer (`backend/src/business-transaction/business-transaction.controller.ts:L294-296`).
- **Screen / Route:** `/indents/:id` -> Attachments Tab / Modal (`frontend/src/pages/documents/DocumentsPage.tsx`).
- **What Actor Does:** Uploads engineering drawings (PDF, CAD, DXF, or images) related to the indent.
- **Data Entered / Selected:** File binary, File Type (`PDF`, `DRAWING`, `CAD`, `IMAGE`, `EXCEL`, `OTHER`), Attachment Remarks.
- **System Action Followed:** Uploads file to Supabase Object Storage (`backend/src/storage/adapters/supabase-storage.adapter.ts:L40-60`) or local storage, stores metadata in `indent_attachments` table (`database/schema.prisma:L624-652`), writes audit log.
- **Next Actor:** Design Engineer.

#### Step 3: Design Submission
- **Actor Role:** Design Engineer (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L32-33`).
- **Screen / Route:** `/indents/:id` -> "Submit to Stores" action button (`frontend/src/modules/indent/IndentDetailsPage.tsx`).
- **What Actor Does:** Clicks submit and enters optional handover remarks (`backend/src/business-transaction/business-transaction.controller.ts:L97-105`).
- **System Action Followed:**
  - Transitions `currentState` to `DESIGN_COMPLETED` (mapped to persistence status `SUBMITTED`, `backend/src/business-transaction/mappers/workflow-state.mapper.ts:L11`).
  - Writes step record in `workflow_history` transferring responsibility to Stores Department (`backend/src/business-transaction/services/business-transaction.service.ts:L1576-1582`).
  - Dispatches in-app notification and queues email to Stores Department and broadcasts to SM & GM (`backend/src/business-transaction/definitions/notification-event.definition.ts:L16-24`).
- **Next Actor:** Stores Executive.

#### Step 4: Stores Stock Verification
- **Actor Role:** Stores Executive (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L44-45`).
- **Screen / Route:** `/indents/:id` -> "Verify Stock" button (`frontend/src/modules/indent/IndentDetailsPage.tsx`).
- **What Actor Does:** Reviews bill of materials against current on-hand warehouse inventory.
- **Data Entered / Selected:** None (system evaluates `Material.currentStock` vs `IndentItem.quantity`).
- **System Action Followed:**
  - Evaluates stock availability for each line item (`backend/src/business-transaction/services/business-transaction.service.ts:L1620-1660`).
  - Sets `currentState = 'STORES_PROCESSING'`.
  - Starts 48-hour SLA tracking timer (`backend/src/notifications/overdue-material.scheduler.ts:L56-65`).
  - Dispatches in-app notification to SM & GM (`notification-event.definition.ts:L26-33`).
- **Next Actor:** Stores Executive.

#### Step 5: Stores Material Issue
- **Actor Role:** Stores Executive (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L56-57`).
- **Screen / Route:** `/indents/:id` -> "Issue Materials" modal (`frontend/src/modules/indent/IndentDetailsPage.tsx`).
- **What Actor Does:** Issues full or partial material quantities from the warehouse to the shop floor.
- **Data Entered / Selected:** Issued quantity per material item, issue remarks (`backend/src/business-transaction/dto/stores-issue.dto.ts:L12-35`).
- **System Action Followed:**
  - **Stock Change:** Decrements `Material.currentStock` by issued quantity in PostgreSQL (`backend/src/business-transaction/services/business-transaction.service.ts:L1756-1763`).
  - Updates `IndentItem.issuedQuantity` and sets `status = 'ISSUED'` if fully fulfilled (`service.ts:L1770-1776`).
  - If all raw materials and brought-out materials are fully issued, advances `currentState` to `MATERIALS_ISSUED` (`service.ts:L1808-1818`).
  - Writes handover record in `workflow_history` routing to Production (`service.ts:L1821-1829`).
  - Dispatches in-app notification and email to Production Executive, SM, and GM (`notification-event.definition.ts:L35-43`).
- **Next Actor:** Production Executive.

#### Step 6: Production Material Receipt
- **Actor Role:** Production Executive (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L68-69`).
- **Screen / Route:** `/production` or `/indents/:id` -> "Acknowledge Receipt" button (`frontend/src/modules/production/ProductionDashboardPage.tsx`).
- **What Actor Does:** Verifies physical receipt of raw materials at the shop floor.
- **Data Entered / Selected:** Receipt verification notes / remarks (`backend/src/business-transaction/business-transaction.controller.ts:L135-143`).
- **System Action Followed:**
  - Creates/upserts a record in `production_receipts` table (`database/schema.prisma:L913-937`).
  - Advances `currentState` to `PRODUCTION_PROCESSING` (`backend/src/business-transaction/services/business-transaction.service.ts:L2080-2089`).
  - Writes `workflow_history` entry; notifies SM & GM (`notification-event.definition.ts:L45-52`).
- **Next Actor:** Production Executive.

#### Step 7: Manufacturing Work Logging
- **Actor Role:** Production Executive (`backend/src/business-transaction/business-transaction.controller.ts:L155-183`).
- **Screen / Route:** `/production` -> "Update Progress" (`frontend/src/modules/production/ProductionDashboardPage.tsx`).
- **What Actor Does:** Logs work start and intermediate progress notes during machining/assembly.
- **Data Entered / Selected:** `statusNotes: string`, `remarks: string` (`backend/src/business-transaction/dto/production-update.dto.ts:L9-17`).
- **System Action Followed:** Appends timestamped log entry to `Indent.remarks` column; writes `AuditLog` (`backend/src/business-transaction/services/business-transaction.service.ts:L2183-2196`). State remains `PRODUCTION_PROCESSING`.
- **Next Actor:** Production Executive.

#### Step 8: Production Completion (Loop 1 Boundary)
- **Actor Role:** Production Executive (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L80-81`).
- **Screen / Route:** `/production` -> "Mark Production Complete" (`frontend/src/modules/production/ProductionDashboardPage.tsx`).
- **What Actor Does:** Signs off on finished manufactured product and enters completion notes.
- **Data Entered / Selected:** Completion remarks (`business-transaction.controller.ts:L185-193`).
- **System Action Followed:**
  - Advances `currentState` to `PRODUCTION_COMPLETED` (`service.ts:L2220-2231`).
  - Closes **Loop 1 (Manufacturing Execution)** (`workflow-state-machine.definition.ts:L83`).
  - Writes `workflow_history` entry.
  - Dispatches notifications to Accounts Department, SM, and GM (`notification-event.definition.ts:L54-62`).
- **Next Actor:** Accounts Executive.

#### Step 9: Accounts Cost Verification Start
- **Actor Role:** Accounts Executive (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L92-93`).
- **Screen / Route:** `/cost-sheets` or `/indents/:id/edit` (`frontend/src/modules/costing/CostSheetDashboardPage.tsx`).
- **What Actor Does:** Acknowledges handover from manufacturing and opens financial books for expense collection.
- **Data Entered / Selected:** Audit remarks (`business-transaction.controller.ts:L199-207`).
- **System Action Followed:** Advances `currentState` to `ACCOUNTS_COST_VERIFICATION` (`service.ts:L2270-2290`). Opens cost entry interface. Notifies SM & GM.
- **Next Actor:** Accounts Executive.

#### Step 10: Actual Expense Entry & Variance Computation
- **Actor Role:** Accounts Executive (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L108-109`).
- **Screen / Route:** `/indents/:id/edit` (Accounts Mode) or `/cost-sheets/:id` (`frontend/src/modules/costing/CostSheetDetailsPage.tsx`).
- **What Actor Does:** Collects physical vendor bills, material invoices, and timesheets, and enters actual expenditures.
- **Data Entered / Selected:**
  - Material Line Items: `actualRate`, `actualQuantity` (`backend/src/business-transaction/dto/actual-cost-entry.dto.ts:L13-29`).
  - Brought-Out Materials: `actualAmount` (`actual-cost-entry.dto.ts:L31-43`).
  - Processes: `actualCost`, `actualHours` (`actual-cost-entry.dto.ts:L45-57`).
  - Overheads: `actualDesignCost`, `actualOverheadCost`, `actualContingencyCost` (`actual-cost-entry.dto.ts:L78-95`).
- **System Action Followed:**
  - Updates `cost_items`, `process_costs`, and `indent_brought_materials` in PostgreSQL (`backend/src/business-transaction/services/business-transaction.service.ts:L2400-2445`).
  - **Auto-Calculates Variances (`backend/src/business-transaction/utils/financial-math.util.ts:L48-67`):**
    $$\text{Actual Total} = \sum \text{Actual Materials} + \sum \text{Actual Brought} + \sum \text{Actual Processes} + \text{Actual Overheads}$$
    $$\text{varianceAmount} = \text{Actual Total} - \text{Planned Total}$$
    $$\text{variancePercentage} = \operatorname{round}\left(\frac{\text{varianceAmount}}{\text{Planned Total}} \times 100, 2\right)$$
  - Updates `CostSheet.varianceAmount` and `CostSheet.variancePercentage`.
  - Advances `currentState` to `ACTUAL_COST_UPDATED` (`service.ts:L2501-2508`).
  - Dispatches notification to Design, Accounts, SM, and GM (`notification-event.definition.ts:L74-81`).
- **Next Actor:** Accounts Executive (can repeat iteratively if bills arrive in batches).

#### Step 11: Accounts Financial Closure (Loop 2 Boundary)
- **Actor Role:** Accounts Executive (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L123-124`).
- **Screen / Route:** `/cost-sheets/:id` -> "Final Financial Close" button (`frontend/src/modules/costing/CostSheetDetailsPage.tsx`).
- **What Actor Does:** Validates that all vendor bills and internal expenses have been accounted for and signs off.
- **Data Entered / Selected:** `closureNotes: string`, `remarks: string` (`backend/src/business-transaction/dto/actual-cost-entry.dto.ts:L98-106`).
- **System Action Followed:**
  - Sets `CostSheet.status = 'FINALIZED'` (`backend/src/business-transaction/services/business-transaction.service.ts:L2665-2671`).
  - Advances `currentState` to `ACCOUNTS_FINANCIAL_CLOSURE` (`service.ts:L2656-2658`).
  - Closes **Loop 2 (Financial Closure)** (`workflow-state-machine.definition.ts:L126`).
  - Dispatches notification and email to SM & GM (`notification-event.definition.ts:L83-91`).
- **Next Actor:** System / Admin.

#### Step 12: Archival and Record Lock
- **Actor Role:** System / Admin (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L135-136`).
- **Screen / Route:** Automated service trigger or `/indents/:id` -> "Archive" (`backend/src/business-transaction/business-transaction.controller.ts:L270-278`).
- **What Actor Does:** Triggers archival of closed transaction.
- **System Action Followed:**
  - Sets `Indent.isLocked = true` (`backend/src/business-transaction/services/business-transaction.service.ts:L2721`). Prevents any further edits by any user.
  - Advances `currentState` to `ARCHIVED`. Notifies SM & GM (`notification-event.definition.ts:L93-100`).
- **Next Actor:** System / Admin.

#### Step 13: Terminal Completion
- **Actor Role:** System / Admin (`backend/src/business-transaction/definitions/workflow-state-machine.definition.ts:L147-148`).
- **Screen / Route:** Automated or Admin action (`business-transaction.controller.ts:L280-288`).
- **What Actor Does:** Marks transaction completely closed.
- **System Action Followed:** Sets `currentState = 'COMPLETED'` and persistence `status = 'COMPLETED'` (`service.ts:L2768-2776`). Terminal state. Notifies SM & GM (`notification-event.definition.ts:L103-111`).
- **Next Actor:** None (Process Ended).

---

### Process Branches & Edge Cases

| Branch | Trigger Condition | System Behavior | Recovery / Next Step |
| :--- | :--- | :--- | :--- |
| **Branch A: Draft Modification** | Design Engineer modifies an indent while in `DRAFT` state. | Form remains fully editable via `PATCH /api/business-transactions/:id`. Cost recalculations update live in UI (`IndentForm.tsx:L1005-1008`). | Design Engineer eventually executes Step 3 (Submit). |
| **Branch B: Partial Material Issue** | Stores has only a portion of the required material quantity on hand. | Stores issues available quantity (`StoresIssueDto`). `Material.currentStock` decrements by partial quantity. `IndentItem.issuedQuantity` updates, but item remains unfulfilled. Indent `currentState` stays `STORES_PROCESSING` (`service.ts:L1804-1806`). | Stores re-opens indent when remaining stock arrives and executes another issue until `isFullyIssued = true`. |
| **Branch C: 48-Hour Stores Overdue Alert** | Indent remains in `STORES_PROCESSING` for $> 48\text{ hours}$. | Background scheduler (`OverdueMaterialScheduler` running every 15 min at `backend/src/notifications/overdue-material.scheduler.ts:L17`) detects stalled state. Dispatches high-priority in-app alert and email `material_issue_overdue.hbs` to Stores, SM, and GM. | Stores issues material or escalates procurement. |
| **Branch D: Iterative Actual Costing** | Supplier bills or machining expenses arrive in separate batches. | Accounts saves partial costs via `POST /api/business-transactions/:id/accounts/actual-cost`. System transitions to `ACTUAL_COST_UPDATED`. Form allows repeated updates (`workflow-state-machine.definition.ts:L111`). | Accounts enters additional costs until ready for final closure. |
| **Branch E: Rejection / Cancellation** | Transaction error, design flaw, or customer order cancellation. | **In Two-Loop Architecture, there is NO manual reject button.** If an indent is in `DRAFT`, it can be deleted (`DELETE /api/business-transactions/:id` by user with `indent.delete`). If active, Admin cancels record via direct administrative status update (`database/schema.prisma:L108`). | Process terminates; record soft-deleted. |

---

## 3. Role x Screen Matrix

MERC enforces Role-Based Access Control (RBAC) across 7 system roles (`database/seed.ts:L163-199`) mapped to frontend protected routes (`frontend/src/app/router.tsx:L253-527`):

| Screen / Menu Item | Route | Admin | Design Engineer | Stores Executive | Production Executive | Accounts Executive | Senior Manager | General Manager | What Role Can Do on Screen | Citation |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Dashboard** | `/dashboard` | View/Edit | View | View | View | View | View | View | High-level metrics, active indents summary, queue status | `router.tsx:L253` |
| **Indents Dashboard** | `/indents` | All | View/Delete | View | View | View | View | View | List indents, filter by state/department, view details | `router.tsx:L305` |
| **Create Indent** | `/indents/create` | Create | **Create** | No | No | No | No | No | Fill new indent form, BOM, process routings, planned costs | `router.tsx:L313` |
| **Indent Details** | `/indents/:id` | All | View/Submit | View/Issue | View/Receive | View | View | View | View full indent, submit design, verify/issue stock, receive | `router.tsx:L321` |
| **Edit Indent / Cost** | `/indents/:id/edit` | All | Edit (Draft) | No | No | **Enter Actuals**| No | No | Edit draft specifications (Design) or enter actual costs (Accounts)| `router.tsx:L329` |
| **Cost Sheets Dashboard**| `/cost-sheets` | All | View | No | No | **Manage** | View | View | List cost sheets, view planned vs actual cost, margins | `router.tsx:L339` |
| **Cost Sheet Details** | `/cost-sheets/:id` | All | View | No | No | **Close** | View | View | Enter actual invoices, view variance, execute financial closure | `router.tsx:L347` |
| **Production Dashboard**| `/production` | All | No | No | **Update/Done** | No | View | View | Production queue, start work, log progress, complete | `router.tsx:L372` |
| **Workflow Tracking** | `/workflow` | All | View | View | View | View | **Audit** | **Audit** | Two-loop pipeline visualization, bottleneck inspection | `router.tsx:L364` |
| **Documents Archive** | `/documents` | All | Upload/View | View | View | Upload/View | View | View | Search, download, replace drawings and specification files | `router.tsx:L412` |
| **Materials Master** | `/materials` | All | View | **Manage** | View | View | View | View | View/create raw materials, assign units, view stock balances | `router.tsx:L380` |
| **Products Master** | `/products` | All | View | No | No | View | View | View | View product codes, drawing numbers, revisions | `router.tsx:L388` |
| **Processes Master** | `/manufacturing-processes`| All| View | No | No | View | View | View | View manufacturing operation catalog (turning, milling, etc.)| `router.tsx:L436` |
| **Units Master** | `/units` | All | View | View | View | View | View | View | Units of measure catalog (KG, M, PCS, SHT) | `router.tsx:L444` |
| **Vendors Master** | `/vendors` | All | View | No | View | **Manage** | View | View | Vendor catalog, outsourced process rates, GST/PAN records | `router.tsx:L450` |
| **Reports Suite** | `/reports` | All | No | No | No | Export | **Export** | **Export** | Daily production, process yield, material variance reports | `router.tsx:L396` |
| **Executive Analytics** | `/analytics` | All | No | No | No | View | **Deep Dive**| **Deep Dive**| Cost variance, cycle time, department workload KPIs | `router.tsx:L480` |
| **Notifications** | `/notifications` | All | View/Read | View/Read | View/Read | View/Read | View/Read | View/Read | In-app alerts drawer, mark read, clear notifications | `router.tsx:L356` |
| **Users & Roles** | `/users`, `/roles` | All | No | No | No | No | No | No | Manage employee credentials, assign roles and permissions | `router.tsx:L420,L456` |
| **Settings & Logs** | `/settings`, `/audit-logs`| All | No | No | No | No | No | No | SMTP settings, audit log inspection, system health | `router.tsx:L269,L277` |

---

## 4. Designer Data-Entry Map

Every field on the main indent form (`frontend/src/modules/indent/components/IndentForm.tsx:L1132-2001`) in exact visual layout order:

| Section | Field Label | Technical Name | Input Type | Required? | Source / Master Data | Default Value | Validation Rule | When Needed | Code Citation |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **Header** | **Customer Name** | `indent.customerName` | Text | Optional | Free text | Empty | Max 150 chars | At creation | `IndentForm.tsx:L1142` |
| **Header** | **Priority** | `indent.priority` | Dropdown | **Yes** | Fixed list (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) | `MEDIUM` | Valid enum | At creation | `IndentForm.tsx:L1155` |
| **Header** | **Required Date** | `indent.requiredDate` | Date | **Yes** | Date Picker | Empty | Valid date string | At creation | `IndentForm.tsx:L1168` |
| **Header** | **Delivery Date** | `indent.requiredDeliveryDate`| Date | Optional | Date Picker | Empty | Valid date string | At creation | `IndentForm.tsx:L1176` |
| **Header** | **PO Number** | `indent.purpose` | Text | **Yes** | Free text (Stored in purpose) | Empty | `min(1, 'PO number is required')` | At creation | `IndentForm.tsx:L1146` |
| **Header** | **Layout Number** | `indent.layoutNumber` | Text | Optional | Free text | Empty | Max 100 chars | At creation | `IndentForm.tsx:L1150` |
| **Header** | **Remarks / Notes**| `indent.remarks` | Textarea | Optional | Free text | Empty | Free text | At creation | `IndentForm.tsx:L1182` |
| **Material Item** | **Product Reference**| `item.product` | Text | Optional | Free text / Lookup | Empty | Free text | At creation | `IndentForm.tsx:L1233` |
| **Material Item** | **Material SKU** | `item.materialName` | Combobox | **Yes** | `materials` Master | Empty | `min(1, 'Material is required')` | At creation | `IndentForm.tsx:L1246` |
| **Material Item** | **Cutting Shape** | `item.shape` | Dropdown | Optional | Fixed (`ROUND`, `RECTANGLE`, `SHEET`) | Empty | Valid shape enum | At creation | `IndentForm.tsx:L1390` |
| **Material Item** | **Diameter (mm)** | `item.diameterMm` | Number | Cond. | Free number (Shown for `ROUND`) | Empty | Min 0, numeric | At creation | `IndentForm.tsx:L1453` |
| **Material Item** | **Length (mm)** | `item.lengthMm` | Number | Cond. | Free number (All shapes) | Empty | Min 0, numeric | At creation | `IndentForm.tsx:L1464` |
| **Material Item** | **Width (mm)** | `item.widthMm` | Number | Cond. | Free number (`RECTANGLE`/`SHEET`)| Empty | Min 0, numeric | At creation | `IndentForm.tsx:L1475` |
| **Material Item** | **Thickness/Height**| `item.heightMm` | Number | Cond. | Free number (`RECTANGLE`/`SHEET`)| Empty | Min 0, numeric | At creation | `IndentForm.tsx:L1486` |
| **Material Item** | **Quantity** | `item.quantity` | Number | **Yes** | Free number | `1` | `min(0.0001)` | At creation | `IndentForm.tsx:L1518` |
| **Material Item** | **Unit of Measure**| `item.unitId` | Dropdown | **Yes** | `units` Master | Empty | `min(1, 'Select valid unit')` | At creation | `IndentForm.tsx:L1539` |
| **Material Item** | **Unit Weight (kg)**| `item.unitWeightKg` | Number | Auto | Auto-calculated / Override | `0.00` | Min 0, numeric | At creation | `IndentForm.tsx:L1610` |
| **Material Item** | **Total Weight (kg)**| `item.totalWeightKg`| Number | Auto | Auto-calculated (`unit * qty`) | `0.00` | Min 0, numeric | At creation | `IndentForm.tsx:L1636` |
| **Material Item** | **Procurement Source**| `item.source` | Text | Optional | Free text | Empty | Free text | At creation | `IndentForm.tsx:L1660` |
| **Material Item** | **Work Center** | `item.productionSource`| Text | Optional | Free text | Empty | Free text | At creation | `IndentForm.tsx:L1680` |
| **Material Item** | **Item Remarks** | `item.remarks` | Text | Optional | Free text | Empty | Free text | At creation | `IndentForm.tsx:L1700` |
| **Material Item** | **Planned Unit Rate**| `costItem.predictedRate`| Number | Optional | Free number | `0` | Min 0, numeric | Before submit | `IndentForm.tsx:L1320` |
| **Material Item** | **Planned Amount**| `costItem.predictedAmount`| Number | Auto | Auto (`rate * qty`) | `0` | Calculated | Before submit | `IndentForm.tsx:L1340` |
| **Item Process** | **Process Name** | `process.processId` | Dropdown | **Yes** | `manufacturing_processes` Master| Empty | `min(1, 'Process required')` | Before submit | `IndentForm.tsx:L310` |
| **Item Process** | **Vendor Type** | `process.vendorType` | Dropdown | Optional | Fixed (`In-house`, `Outsourced Vendor`) | `In-house` | Valid string | Before submit | `IndentForm.tsx:L340` |
| **Item Process** | **Vendor / Center**| `process.productionSource`| Combobox | Optional | `vendors` Master / Free text | Empty | Free text / UUID | Before submit | `IndentForm.tsx:L360` |
| **Item Process** | **Estimated Hours**| `process.estimatedHours`| Number | Optional | Free number | `0` | Min 0, numeric | Before submit | `IndentForm.tsx:L380` |
| **Item Process** | **Planned Cost (₹)**| `process.predictedCost`| Number | Optional | Free number | `0` | Min 0, numeric | Before submit | `IndentForm.tsx:L400` |
| **Brought Material**| **Item Name** | `broughtMaterial.name`| Text | **Yes** | Free text | Empty | `min(1, 'Name required')` | At creation | `IndentForm.tsx:L1810` |
| **Brought Material**| **Quantity** | `broughtMaterial.quantity`| Number | **Yes** | Free number | `1` | `min(0.0001)` | At creation | `IndentForm.tsx:L1825` |
| **Brought Material**| **Specification** | `broughtMaterial.specification`| Text | Optional | Free text | Empty | Free text | At creation | `IndentForm.tsx:L1840` |
| **Brought Material**| **Planned Cost (₹)**| `broughtMaterial.amount`| Number | Optional | Free number | `0` | Min 0, numeric | Before submit | `IndentForm.tsx:L1855` |
| **Overhead Cost** | **Design Cost** | `costSheet.designCost` | Number | Optional | Free number | `0` | Min 0, numeric | Before submit | `IndentForm.tsx:L1920` |
| **Overhead Cost** | **Overhead Cost** | `costSheet.overheadCost`| Number | Optional | Free number | `0` | Min 0, numeric | Before submit | `IndentForm.tsx:L1940` |
| **Overhead Cost** | **Contingency Cost**| `costSheet.contingencyCost`| Number | Optional | Free number | `0` | Min 0, numeric | Before submit | `IndentForm.tsx:L1960` |
| **Overhead Cost** | **Predicted Total** | `costSheet.predictedTotal`| Number | Auto | Auto-calculated grand total | `0` | Sum of all sections | Before submit | `IndentForm.tsx:L1980` |
| **Attachments** | **Drawings / Specs**| `file` (binary) | File | Optional | File chooser (PDF, DWG, CAD, XLSX)| None | Max 20MB | Before submit | `IndentForm.tsx:L2010` |

---

## 5. Standard vs. Special Jobs

### Codebase Decision Rule:
**MERC DOES NOT HAVE A TOGGLE, ENUM, OR FLAG TO DISTINGUISH BETWEEN STANDARD AND SPECIAL JOBS.**  
In the current code, **100% of indents are treated as special, custom-engineered manufacturing jobs**. Every single indent rendered by `IndentForm.tsx` requires or presents the full complex specification suite.

### Minimal Standard Core vs. Special/Complex Set:

| Feature / Section | Minimal Standard Set (What standard jobs need) | Special / Complex Set (What MERC actually captures) | Code Status |
| :--- | :--- | :--- | :--- |
| **Job Header** | PO Number, Product Name, Quantity, Required Date | Customer Name, Layout Number, Delivery Date, Priority, Detailed Purpose | All rendered unconditionally on the form |
| **Raw Material Specs** | Material SKU name, Standard Unit, Bulk Quantity | **Custom Cut Geometry:** `shape` (`ROUND`, `RECTANGLE`, `SHEET`), `diameterMm`, `lengthMm`, `widthMm`, `heightMm`, unit weight, total calculated weight | Form shows dimensional fields dynamically when shape is chosen (`IndentForm.tsx:L1453`) |
| **Manufacturing Routings**| Simple handover to shop floor | **Detailed Step-by-Step Operations:** Multi-step sequences (`Turning`, `Milling`, `Grinding`), In-house vs Outsourced vendor assignment, estimated machine hours | Nested process builder rendered under every single line item (`IndentForm.tsx:L214-410`) |
| **Brought-Out Items** | None | Hardware items, fasteners, bearings, proprietary components with separate specification and costing | Dedicated brought-out items table on form (`IndentForm.tsx:L1742`) |
| **Cost Modeling** | Flat budget | Granular planned material unit rates, outsourced process charges, in-house hourly costs, design engineering cost, factory overhead, contingency buffer | Dedicated 4-tier cost breakdown (`IndentForm.tsx:L1890`) |
| **Documentation** | Optional delivery slip | CAD files, DWG drawings, dimensional PDFs with version tracking | Dedicated attachment management service (`backend/src/storage/`) |

---

## 6. Shared-Field Overlap Check

Cross-system analysis for candidate shared data items between MERC and sibling applications:

| Candidate Shared Item | Captured in MERC? | Table & Column Name | Format / Type | Free-Text vs Master Data | Sibling Integration Recommendation |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Customer** | **YES** | `indents.customerName` (`schema.prisma:L505`) | `VarChar(150)?` | **Free text** | Standardize by linking to central CRM/Customer master table |
| **PO Number** | **YES** | `indents.purpose` (`schema.prisma:L509`) | `Text?` | **Free text** (overloaded in purpose) | Add dedicated `purchaseOrderNumber` column |
| **SC Number (Sales Contract)**| **NO** | **NONE** (`schema.prisma:L496-553`) | `UNKNOWN` | Not captured anywhere | Add dedicated `salesContractNumber` column |
| **Job / Indent Number** | **YES** | `indents.indentNumber` (`schema.prisma:L498`) | `VarChar(50)` (`AGIPL-IND-YYYY-XXX`) | **Auto-generated system sequence** | Use as correlation key or adopt sibling Job Order ID |
| **Product Name / Code** | **YES** | `products.productName`, `products.productCode` (`schema.prisma:L417-418`) | `VarChar(150)`, `VarChar(50)` | **Master table** (`products`) | Sync canonical Product SKU from central master |
| **Drawing Number** | **YES** | `products.drawingNumber` (`schema.prisma:L419`) | `VarChar(100)?` | Master table (`products`) | Pull from central engineering document repository |
| **Material Name** | **YES** | `materials.materialName`, `materials.materialCode` (`schema.prisma:L356-357`) | `VarChar(150)`, `VarChar(50)` | **Master table** (`materials`) | **PULL DIRECTLY FROM SIBLING RM MASTER** |
| **Grade** | **NO** | **NONE** (no dedicated column) | `UNKNOWN` | Free-text inside material name or remarks | Add `grade` column in RM master |
| **Shape** | **YES** | `indent_items.shape` (`schema.prisma:L562`) | `VarChar(50)?` (`ROUND`, `RECTANGLE`, `SHEET`) | **Fixed UI dropdown** | Remain local to MERC (special cutting geometry) |
| **Size / Dimensions** | **YES** | `indent_items.diameterMm`, `lengthMm`, `widthMm`, `heightMm` (`schema.prisma:L563-566`) | `Decimal(18,4)?` (millimeters) | **Free numbers** | Remain local to MERC (special cutting geometry) |
| **Quantity** | **YES** | `indent_items.quantity` (`schema.prisma:L559`) | `Decimal(18,4)` | **Free number** | Mirror in RM app for warehouse reservation |
| **Unit** | **YES** | `units.unitCode` (`schema.prisma:L332`) | `VarChar(20)` (`KG`, `M`, `PCS`, `SHT`) | **Master table** (`units`) | Standardize units mapping between apps |
| **Weight** | **YES** | `indent_items.unitWeightKg`, `totalWeightKg` (`schema.prisma:L567-568`) | `Decimal(18,4)?` (kg) | **Auto-calculated in UI** | Provide to RM app for bulk freight / weight verification |
| **Required Date** | **YES** | `indents.requiredDate` (`schema.prisma:L507`) | `Timestamptz(6)` | **Date picker** | Sync to RM app for material procurement scheduling |
| **Priority** | **YES** | `indents.priority` (`schema.prisma:L501`) | Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) | **Fixed UI dropdown** | Sync to RM app for warehouse picking priority |
| **Department** | **YES** | `departments.departmentCode` (`schema.prisma:L139`) | `VarChar(50)` | **Master table** (`departments`) | Map to organizational department codes |
| **Attachments / Drawings** | **YES** | `indent_attachments.fileUrl`, `fileName` (`schema.prisma:L629-630`) | Supabase Object Key & URL | File upload | Share URL / object key with shop floor app |
| **Remarks** | **YES** | `indents.remarks`, `indent_items.remarks` (`schema.prisma:L510,L569`) | `Text?` | Free text / **Packed JSON string** | Cleanse: parse packed JSON into separate API fields |
| **User Name / Email** | **YES** | `users.firstName`, `lastName`, `email`, `employeeCode` (`schema.prisma:L238-241`) | Strings | **Master table** (`users`) | Map by `email` or `employeeCode` across all sibling apps |

---

## 7. Material and Stock Touchpoints

Every point in MERC where material is requested, issued, received, or adjusted:

```
[Design Engineer] Requests Material Qty
       │  (Recorded in indent_items.quantity; 0 stock change)
       ▼
[Stores Executive] Verifies Warehouse Stock
       │  (Compares Material.currentStock vs IndentItem.quantity; 0 stock change)
       ▼
[Stores Executive] Issues Material
       │  (DECREMENTS Material.currentStock in DB; IndentItem.issuedQuantity increments)
       ▼
[Production Executive] Confirms Physical Receipt
       │  (Upserts production_receipts table; 0 stock change)
       ▼
[Production Executive] Consumes Material during Machining
          (Implicit consumption; NO database stock change on completion)
```

| Step & Lifecycle Phase | Action Performed | Screen & Route | Actor Role | Database Tables Modified | What User Sees Afterwards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Request** | Material quantity specified on indent line item | `/indents/create` | Design Engineer | `indent_items.quantity` set (`database/schema.prisma:L559`) | Item shows quantity required; `issuedQuantity = 0`. **Zero stock change.** |
| **2. Stock Verification**| Compares required quantity to warehouse balance | `/indents/:id` -> "Verify Stock" | Stores Executive | `indents.currentState = 'STORES_PROCESSING'` | System displays badge: `AVAILABLE` (if stock $\ge$ required) or `TO_BE_PURCHASED`. **Zero stock change.** |
| **3. Stock Issue** | Stores transfers raw material to shop floor | `/indents/:id` -> "Issue Materials" | Stores Executive | **`materials.currentStock` decremented by issued qty** (`service.ts:L1756-1763`); `indent_items.issuedQuantity` updated | `Material.currentStock` drops immediately. Item status changes to `ISSUED` when fulfilled. Indent state updates to `MATERIALS_ISSUED`. |
| **4. Physical Receipt**| Shop floor receives material delivery | `/production` or `/indents/:id` | Production Executive | `production_receipts` record created (`schema.prisma:L913`); `indents.currentState = 'PRODUCTION_PROCESSING'` | Production receipt badge shows green: "Materials received by [User]". **Zero stock change.** |
| **5. Material Return** | Return unused material to warehouse | **NONE** | **N/A** | **DOES NOT EXIST IN CODE** | **UNKNOWN / NOT IMPLEMENTED** |
| **6. Extra Material** | Request scrap replacement / extra material | **NONE** | **N/A** | `additional_material_requests` exists in schema, but **no API or UI exists** | **UNKNOWN / NOT IMPLEMENTED** |
| **7. Consumption** | Machining and fabrication of product | `/production` | Production Executive | `Indent.remarks` appended with status notes | Progress notes recorded. **No secondary stock decrement occurs upon manufacturing completion.** |

---

## 8. Money Touchpoints

Every step where planned costs, actual invoices, or financial closures occur:

### Touchpoint 1: Engineering Cost Estimation (Planned Cost Sheet)
- **Role:** Design Engineer (`backend/src/business-transaction/services/business-transaction.service.ts:L245-385`).
- **Screen:** `/indents/create` -> Costing Section (`frontend/src/modules/indent/components/IndentForm.tsx:L1890-2001`).
- **Action:** Enters estimated unit rates for raw materials, estimated costs for processes, and global administrative overheads.
- **Formula in Words:**
  > **Planned Material Cost** equals the sum of each item's planned unit rate multiplied by its required quantity, plus the sum of all brought-out item costs.  
  > **Planned Process Cost** equals the sum of all estimated manufacturing operation costs.  
  > **Planned Grand Total** equals Planned Material Cost, plus Planned Process Cost, plus Design Engineering Cost, plus Factory Overhead Cost, plus Contingency Cost.

$$\text{Planned Grand Total} = \sum (\text{Rate}_{\text{est}} \times \text{Qty}) + \sum \text{Brought Cost} + \sum \text{Process Cost}_{\text{est}} + \text{Design Cost} + \text{Overhead Cost} + \text{Contingency Cost}$$

### Touchpoint 2: Actual Expense Data Entry
- **Role:** Accounts Executive (`backend/src/business-transaction/services/business-transaction.service.ts:L2323-2525`).
- **Screen:** `/indents/:id/edit` (Accounts Mode) or `/cost-sheets/:id` (`frontend/src/modules/costing/CostSheetDetailsPage.tsx`).
- **Action:** Enters final vendor invoice prices, actual material quantities used, supplier machining bills, and actual in-house labor costs.
- **Formula in Words:**
  > **Actual Material Cost** equals the sum of each raw material's verified invoice rate multiplied by its actual received quantity, plus the verified invoice cost of brought-out items.  
  > **Actual Process Cost** equals the sum of all verified in-house and outsourced process invoices.  
  > **Actual Grand Total** equals Actual Material Cost, plus Actual Process Cost, plus actual design expenses, plus actual factory overhead, plus actual contingency expenses.

$$\text{Actual Grand Total} = \sum (\text{Rate}_{\text{act}} \times \text{Qty}_{\text{act}}) + \sum \text{Brought Cost}_{\text{act}} + \sum \text{Process Cost}_{\text{act}} + \text{Design Cost}_{\text{act}} + \text{Overhead Cost}_{\text{act}} + \text{Contingency Cost}_{\text{act}}$$

### Touchpoint 3: Automated Cost Variance Calculation
- **Role:** System Engine (`backend/src/business-transaction/utils/financial-math.util.ts:L48-67`).
- **Screen:** Displayed live on `/cost-sheets/:id` and Executive Analytics (`frontend/src/modules/costing/CostSheetDetailsPage.tsx`).
- **Action:** Executes automatically whenever actual costs are saved.
- **Formulas in Words:**
  > **Variance Amount** equals the Actual Grand Total minus the Planned Grand Total. (A positive variance indicates cost overrun; a negative variance indicates cost savings).  
  > **Variance Percentage** equals the Variance Amount divided by the Planned Grand Total, multiplied by one hundred, rounded to two decimal places (clamped between $-999.99\%$ and $+999.99\%$; evaluates to $0.00\%$ if planned total is zero or negative).

$$\text{Variance Amount} = \text{Actual Grand Total} - \text{Planned Grand Total}$$

$$\text{Variance Percentage} = \begin{cases} 0.00\% & \text{if } \text{Planned Total} \le 0 \\ \operatorname{round}\left(\frac{\text{Variance Amount}}{\text{Planned Total}} \times 100, 2\right) & \text{clamped to } [-999.99\%, +999.99\%] \end{cases}$$

### Touchpoint 4: Financial Closure & Freezing
- **Role:** Accounts Executive (`backend/src/business-transaction/services/business-transaction.service.ts:L2636-2694`).
- **Screen:** `/cost-sheets/:id` -> "Final Financial Close" button.
- **Action:** Freezes the cost sheet. Sets `CostSheet.status = 'FINALIZED'`. The financial books for this indent are officially locked.

---

## 9. Notification Delivery Table

Configured in `backend/src/business-transaction/definitions/notification-event.definition.ts:L13-124` and `backend/src/communication/templates/items/`:

| Step / Trigger Event | Recipient Roles | Notification Channel | What It Says (One-Line Summary) | Citation |
| :--- | :--- | :--- | :--- | :--- |
| **Indent Drafted** | None | None | *No notifications sent while indent is in draft mode.* | `notification-event.definition.ts:L14` |
| **Design Submitted** (`DESIGN_COMPLETED`) | Stores Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`design_completed.hbs`) | "Design department has submitted Indent #[Number] for product [Name]. Stores processing required." | `notification-event.definition.ts:L16-24` |
| **Stores Verifying Stock** (`STORES_PROCESSING`) | Stores Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`stores_pending.hbs`) | "Stores stock verification has begun for Indent #[Number]." | `notification-event.definition.ts:L26-33` |
| **Stores Overdue Alert** (48h Stalled in Stores) | Stores Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`material_issue_overdue.hbs`) | "Indent [Number] has [Count] material items/quantities still pending after 48 hours in Stores processing." | `notification-event.definition.ts:L115-123` |
| **Material Issued** (`MATERIALS_ISSUED`) | Production Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`material_issued.hbs`) | "Stores has issued raw materials for Indent #[Number]. Production manufacturing can proceed." | `notification-event.definition.ts:L35-43` |
| **Production Started** (`PRODUCTION_PROCESSING`) | Production Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`production_started.hbs`) | "Production manufacturing has started for Indent #[Number]." | `notification-event.definition.ts:L45-52` |
| **Production Complete** (`PRODUCTION_COMPLETED`) | Accounts Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`production_completed.hbs`) | "Production department has completed manufacturing for Indent #[Number]. Ready for Accounts cost verification." | `notification-event.definition.ts:L54-62` |
| **Cost Verification Start** (`ACCOUNTS_COST_VERIFICATION`)| Accounts Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`cost_verification.hbs`) | "Accounts is verifying actual vendor and in-house costs for Indent #[Number]." | `notification-event.definition.ts:L64-72` |
| **Actual Costs Updated** (`ACTUAL_COST_UPDATED`) | Design Engineer, Accounts Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`actual_cost_updated.hbs`) | "Actual costs and variance calculations updated for Indent #[Number]." | `notification-event.definition.ts:L74-81` |
| **Financial Closed** (`ACCOUNTS_FINANCIAL_CLOSURE`) | Accounts Executive, Senior Manager, General Manager, Admin | In-App Alert + Email (`financial_closure.hbs`) | "Financial closure and variance calculations completed for Indent #[Number]. Ready for archival." | `notification-event.definition.ts:L83-91` |
| **Transaction Archived** (`ARCHIVED`) | Senior Manager, General Manager, Admin | In-App Alert + Email (`transaction_archived.hbs`) | "Transaction documents and history for Indent #[Number] have been archived." | `notification-event.definition.ts:L93-100` |
| **Transaction Complete** (`COMPLETED`) | Senior Manager, General Manager, Admin | In-App Alert + Email (`transaction_completed.hbs`) | "Indent #[Number] has been successfully closed across both Manufacturing and Financial loops." | `notification-event.definition.ts:L103-111` |

---

## 10. Functional Modules List & Implementation Status

| Module / Menu Group | Route Prefix | One-Line Description | Status | Completeness & Dead Code Notes | Citation |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Indents** | `/indents` | Indent drafting, dimensional BOM definition, and design submission | **Complete** | Full UI, DTO validation, and state machine transitions. | `frontend/src/modules/indent/` |
| **Cost Sheets** | `/cost-sheets` | Planned cost modeling, actual bill recording, and variance analysis | **Complete** | Fully functional two-step financial verification and closure. | `frontend/src/modules/costing/` |
| **Production** | `/production` | Shop-floor material receipt, work center updates, and completion | **Complete** | Functional receipt and progress logging; note that process hours remain in text remarks. | `frontend/src/modules/production/` |
| **Workflow Pipeline** | `/workflow` | Interactive visual board tracking indents across the 11 workflow states | **Complete** | Real-time Kanban board with state drag/view integration. | `frontend/src/modules/workflow/` |
| **Documents Archive** | `/documents` | Supabase object storage file repository for engineering drawings & CAD | **Complete** | Upload, secure presigned download, replace, and audit logging. | `frontend/src/pages/documents/` |
| **Materials Master** | `/materials` | Raw material SKU catalog, stock levels, and unit assignments | **Complete** | Full CRUD; target to become read-only once RM app integrates. | `frontend/src/modules/materials/` |
| **Products Master** | `/products` | Finished goods catalog, drawing numbers, and revisions | **Complete** | Full CRUD with document sequence auto-numbering. | `frontend/src/modules/products/` |
| **Processes Master** | `/manufacturing-processes`| Manufacturing operations catalog (Turning, Milling, Heat Treatment)| **Complete** | Full CRUD with soft-delete and dependency checks. | `frontend/src/modules/processes/` |
| **Units Master** | `/units` | Engineering units of measurement (`KG`, `METERS`, `PCS`, `SHEETS`) | **Complete** | Full CRUD with deletion protection if referenced by materials. | `frontend/src/modules/units/` |
| **Vendors Master** | `/vendors` | Subcontracting and raw material supplier catalog with GST/PAN | **Complete** | Full CRUD with tax number regex validation. | `frontend/src/modules/vendors/` |
| **Reports Suite** | `/reports` | Exportable operational, inventory, production, and cost reports | **Half-Built**| Daily production and cost reports work (Excel/PDF); **Process Yield & Machine Utilization return HTTP 501 Not Implemented** (`reports.controller.ts:L78,L100`). | `backend/src/reports/` |
| **Executive Analytics**| `/analytics` | Strategic intelligence dashboards, cycle time, and variance metrics | **Complete** | 6 dedicated sub-pages with SQL-level aggregated data. | `frontend/src/modules/analytics/` |
| **Notifications** | `/notifications` | In-app notification inbox, unread badges, and delivery tracking | **Complete** | Polling drawer, read/unread status, and audit logging. | `frontend/src/modules/notifications/` |
| **Users & Security** | `/users`, `/roles` | User credentials, RBAC permissions, active sessions, login history | **Complete** | Complete Phase 8C security suite with device tracking. | `frontend/src/modules/users/` |
| **System Settings** | `/settings` | Global toggle configurations (email, overdue alerts, theme) | **Complete** | Dynamic application settings stored in PostgreSQL. | `frontend/src/pages/SettingsPage.tsx` |
| **Additional Material (AMR)**| `None` | Extra material requests and approvals | **DEAD / NO UI**| Schema models `AdditionalMaterialRequest` and `AdditionalMaterialItem` exist (`schema.prisma:L791-850`), but **zero API routes and zero UI screens exist**. | `database/schema.prisma:L791` |
| **Machine Telemetry**| `None` | Machine operation logs, downtime tracking, and maintenance | **DEAD / NO UI**| `Machine` and `MachineLog` tables exist in database (`schema.prisma:L1145-1192`), but **no UI screen exists** to enter logs. | `database/schema.prisma:L1145` |
| **Department Budgets**| `None` | Annual departmental budget caps vs actual spending allocations | **HALF-BUILT** | Table exists (`schema.prisma:L1194`); queried by reports, but **no UI exists to edit or create budgets**. | `database/schema.prisma:L1194` |

---

## 11. Gap Check Against Intended Flow

Comparison of MERC against the intended business workflow:

| Intended Business Workflow Step | MERC Implementation Status | Verification Citation | One-Sentence Gap Description |
| :--- | :---: | :--- | :--- |
| **1. Designer fills detailed indent for special job with planned costing; shared data will come from RM.** | **MATCHES** | `frontend/src/modules/indent/components/IndentForm.tsx:L123-203` | MERC currently renders this exact comprehensive form for all indents, capturing planned material, process, brought-out, and overhead costs. |
| **2. Stores issues material and production receives it (RM is source of truth; results show in both).** | **DIFFERS** | `backend/src/business-transaction/services/business-transaction.service.ts:L1756-1763` | MERC currently decrements its own local PostgreSQL `Material.currentStock` balance on issue, which must be disconnected once RM becomes the inventory master. |
| **3. Production works and completes.** | **MATCHES** | `backend/src/business-transaction/services/business-transaction.service.ts:L2205-2245` | Production logs progress notes and successfully triggers `productionCompleteWork()`, advancing the state to `PRODUCTION_COMPLETED` and closing Loop 1. |
| **4. Accounts enters actual costs, calculates variance, and submits locally in MERC.** | **MATCHES** | `backend/src/business-transaction/services/business-transaction.service.ts:L2323-2525` | Accounts enters actual supplier bills, the system computes variance percentages using exact mathematical utilities, and the workflow is completely local to MERC. |
| **5. SM and GM are notified at every stage with zero approval bottlenecks.** | **MATCHES** | `backend/src/business-transaction/definitions/notification-event.definition.ts:L8,L20` | SM and GM have zero write permissions and receive automatic in-app alerts and email broadcasts at every state transition. |
| **6. MERC has no extra-material request or return features; those happen in RM.** | **MATCHES** | `database/schema.prisma:L791-850`, `backend/src/business-transaction/` | Material returns are completely absent from MERC, and while dormant AMR schema tables exist, zero API routes or UI screens are implemented. |

---

## 12. Top Questions for Process Owner & Special Fields Breakdown

### 12.1 Indent Fields Breakdown: "Special" vs. Sibling RM Sync
When integrating with the sibling Raw Material (RM) system, the indent form fields divide cleanly into:

#### A. Fields to Pre-populate / Sync from Sibling RM App (Do not retype):
1. `indent.purpose` $\rightarrow$ Map from canonical **Purchase Order (PO) Number**.
2. `indent.customerName` $\rightarrow$ Map from central **Customer Master**.
3. `indent.requiredDate` $\rightarrow$ Map from **Order Delivery Schedule**.
4. `item.materialName` $\rightarrow$ Map from **RM Material Catalog SKU**.
5. `item.unitId` $\rightarrow$ Map from **RM Standard Unit of Measure**.
6. `item.quantity` $\rightarrow$ Map from **Base Bill of Materials Quantity**.
7. `item.source` $\rightarrow$ Map from **RM Procurement Source** (In-Stock vs Purchase).

#### B. "Special" Engineering Fields that MUST Remain Local to MERC:
1. `indent.layoutNumber` $\rightarrow$ Specialized factory layout drawing reference.
2. `item.shape` $\rightarrow$ Cut stock geometry (`ROUND`, `RECTANGLE`, `SHEET`).
3. `item.diameterMm`, `item.lengthMm`, `item.widthMm`, `item.heightMm` $\rightarrow$ Dimensional cutting sizes for raw bar/billet/plate stock.
4. `item.unitWeightKg` & `item.totalWeightKg` $\rightarrow$ Specialized density-based weight computations.
5. `item.processes` $\rightarrow$ Multi-step machining routings (`Turning`, `Milling`, `Heat Treatment`) with in-house vs outsourced vendor selections.
6. `broughtMaterials` $\rightarrow$ Specialized hardware, fasteners, and non-inventory components.
7. `costSheet` $\rightarrow$ Planned hourly process rates, design cost, factory overhead, and contingency markup.
8. `attachments` $\rightarrow$ Technical engineering CAD/PDF drawings.

---

### 12.2 Top 10 Questions for the Process Owner

1. Should the `Indent.indentNumber` (e.g. `AGIPL-IND-2026-001`) be replaced by the sibling app’s Job Order Number, or should both numbers be stored side-by-side?
2. When the sibling RM app issues material, should it push issued quantities to MERC via a REST webhook, or will MERC poll RM?
3. Should MERC completely remove the local `materials` table, or keep it as a read-only cache synchronized from RM?
4. When production receives materials on the shop floor in the sibling app, should MERC automatically advance to `PRODUCTION_PROCESSING` without human clicking?
5. How should Customer Name be standardized—will the sibling apps provide a master `customerId` (UUID), or a standardized customer code?
6. Should the PO Number have its own dedicated database column instead of overloading the `Indent.purpose` text field?
7. Does the sibling RM app track custom cut dimensions (Length, Diameter, Width, Thickness), or does RM only track bulk weight (e.g., kilograms/meters)?
8. When Accounts enters actual costs, does MERC need to push final product costs or variance back to an external Accounting/ERP system (e.g. Tally or SAP)?
9. Should the dormant `AdditionalMaterialRequest` schema tables be deleted from MERC since extra materials will be requested in RM?
10. If an indent is cancelled in the sibling app, should it automatically trigger a cancellation in MERC, and what should happen if production has already begun?

---
*End of Business Flow Specification.*

