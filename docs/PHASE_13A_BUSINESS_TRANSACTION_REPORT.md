# PHASE 13A — BUSINESS TRANSACTION OPERATIONS REPORT
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Business Transaction Operations & Architecture Audit Report  
**Phase:** Phase 13A — Business Transaction Operations  
**Version:** 1.0  
**Status:** Approved & Completed  

---

# 1. Implementation Report

Phase 13A implements all **Business Transaction Operations performed by the Design Department** before the workflow progresses to Stores.

This includes:
- Create Business Transaction (DRAFT)
- Create Indent, Create Process Cost Sheet
- Manufacturing Process estimating
- In-house vs vendor process assignment
- Planned cost estimation and total planned cost calculation
- Drawing and document attachments management
- Saving drafts and design submission (`DESIGN_COMPLETED`)

---

# 2. API Report (Design Operations)

| Method | Endpoint | RBAC Guard | Required Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/business-transactions` | `JwtAuthGuard` | `indent.create` | Create composite transaction draft (Indent + Process Cost Sheet) |
| `PUT` | `/business-transactions/:id` | `JwtAuthGuard` | `indent.edit` | Update draft details |
| `POST` | `/business-transactions/:id/submit` | `JwtAuthGuard` | `indent.submit` | Submit design & dispatch to Stores (`DESIGN_COMPLETED`) |
| `POST` | `/business-transactions/:id/attachments` | `JwtAuthGuard` | `indent.edit` | Upload drawing or document attachment |
| `DELETE`/`/business-transactions/:id/attachments/:attId`| `JwtAuthGuard` | `indent.edit` | Remove attachment from draft indent |

---

# 3. Workflow Report

```
CUSTOMER REQUIREMENT ──► Design Engineer Logs In ──► POST /business-transactions (DRAFT)
                                                          │
                                                          ├──► Add material specs & estimating processes
                                                          ├──► Define planned hours & vendor vs in-house
                                                          ├──► POST /attachments (Upload Drawings / CAD / PDFs)
                                                          │
                                                          ▼
                                                  POST /submit
                                                          │
                                                          ▼
                                                [DESIGN_COMPLETED]
                                                          │
                                                          ├──► Locks design fields / rejects further edits
                                                          ├──► Triggers real-time notification to Stores
                                                          ├──► Broadcasts in-app alerts to SM & GM
                                                          └──► Writes Audit Log record
```

---

# 4. Business Validation Report

- **Indent Sheet Validation:** Enforces product selection, material items presence, quantity > 0, unit consistency, priority, and required date validation.
- **Process Cost Sheet Validation:** Enforces sequence continuity, non-negative estimated hours, non-negative predicted rates/costs, and vendor/in-house classification.
- **Synchronicity Validation:** Ensures that all materials and processes specified in the Indent Sheet are aligned with planned costs in the Process Cost Sheet.
- **State Transition Guard:** Restricts edits and attachment changes strictly to the `DRAFT` state. Any updates to drawings or specifications in advanced states are rejected with `400 Bad Request`.

---

# 5. Architecture Report & Consistency Check

- **Attachment Inconsistency Solved:** While the documentation (`SOFTWARE_IMPLEMENTATION_REPORT.md` §11) suggests storing binary attachment data in a `BYTEA` column `fileData` in `IndentAttachment`, the database schema (`schema.prisma`) does not contain this column. Respecting **Phase 1-8C Immutability Rules**, we manage attachments as metadata records linking to file storage URLs (`fileUrl`), ensuring 100% database compatibility.
- **0 Compile Errors:** verified via `npm run build` success.
- **0 Formatting Issues:** verified via `npx prettier --check` success.
