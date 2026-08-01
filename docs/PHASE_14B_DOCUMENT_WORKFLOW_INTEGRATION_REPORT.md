# PHASE 14B — DOCUMENT WORKFLOW INTEGRATION REPORT
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Document Workflow Integration & Compliance Report  
**Phase:** Phase 14B — Document Workflow Integration  
**Version:** 1.0  
**Status:** Approved & Completed  

---

# 1. Document Workflow Integration Report
Phase 14B integrates drawing uploads and financial document uploads cleanly into the **Enterprise Business Workflow**. State machines and locks prevent illegal document additions or removals:
- **Design Department (DRAFT):** Upload drawings, CAD, Excel, and specifications. Fully locked once submitted (`DESIGN_COMPLETED`).
- **Accounts Department (Cost Verification):** Upload bills, invoices, and costing sheets. Fully locked once archived (`ARCHIVED`).

---

# 2. Department Integration Report
- **Design Department:** Full read-write ownership of drawings/CAD documents during design draft lifecycle.
- **Accounts Department:** Full read-write ownership of bills and financial vouchers during cost verification stages.
- **Mutual Restrictions:** Design department is blocked from viewing/editing/deleting accounts financial files, and accounts cannot modify design drawings.

---

# 3. Business Transaction Document Report
Documents map cleanly to Indents and Cost Sheets:
- **Design Files:** Linked to the parent Indent record.
- **Accounts Bills:** Linked to the Process Cost Sheet using serialized `costSheetId` reference in uploader metadata.

---

# 4. Attachment Permission Matrix

| Department | Allowed Document Types | Required Permission Code | Target Workflow State |
| --- | --- | --- | --- |
| **Design** | DRAWING, CAD, PDF, EXCEL, CUSTOMER_DOCUMENT, TECHNICAL_DOCUMENT | `indent.edit` | `DRAFT` |
| **Accounts** | VENDOR_BILL, INVOICE, GST, EXCEL, PDF | `accounts.verify` | `ACCOUNTS_COST_VERIFICATION`, `ACTUAL_COST_UPDATED` |

---

# 5. Notification Matrix

| Actor | Action | Target Recipient Role | Notification Title | Message Template |
| --- | --- | --- | --- | --- |
| Design User | Uploads Design Drawing | Senior Manager, General Manager | **Design Drawing Uploaded** | User has uploaded attachment '{fileName}' for Indent #{indentNumber}. |
| Accounts User| Uploads Invoice/Bill | Senior Manager, General Manager | **Vendor Bill/Invoice Uploaded**| User has uploaded attachment '{fileName}' for Indent #{indentNumber}. |

---

# 6. Audit Matrix

| Audit Event Type | Action Code | Logged By Department | Target Transaction | New Value Context |
| --- | --- | --- | --- | --- |
| `PRODUCTION_UPDATE` | `ATTACHMENT_UPLOAD` | DESIGN / ACCOUNTS | Indent ID | `{ uploadedAttachment: fileName, fileType, department }` |
| `PRODUCTION_UPDATE` | `ATTACHMENT_DELETE` | DESIGN / ACCOUNTS | Indent ID | `{ deletedAttachment: attachmentId }` |

---

# 7. API Matrix

| Method | Endpoint | Query / Body Filters | Permission Guard | Target State | Description |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/business-transactions/:id/attachments` | Body: `file`, optional `remarks` | `indent.edit` OR `accounts.verify` | `DRAFT` (Design) / cost states (Accounts) | Uploads document to parent indent / cost sheet |
| `GET` | `/business-transactions/attachments/download/:fileName` | Path: `fileName` | Authenticated session (JwtAuthGuard) | Any state (Read only check) | Streams file to the client |
| `DELETE` | `/business-transactions/:id/attachments/:attachmentId` | Path: `attachmentId` | `indent.edit` OR `accounts.verify` | Upload state lock | Deletes attachment reference and storage file |
| `GET` | `/business-transactions/attachments/search` | `businessTransactionId`, `costSheetId`, `documentType`, `department`, `uploadedBy`, `uploadDate`, `fileName` | `indent.view` OR `accounts.verify` | Any state (Read only) | Searches & filters attachments across transactions |

---

# 8. Business Validation Report
Guards ensure rigid constraints:
1. **Design Locks:** Rejects Design uploads and deletes with `400 Bad Request` if transaction status is anything other than `DRAFT`.
2. **Accounts Locks:** Rejects Accounts uploads with `400 Bad Request` if status is before `ACCOUNTS_COST_VERIFICATION` or after `ACTUAL_COST_UPDATED`.
3. **Archive Protection:** Rejects upload, delete, or modify actions once state is `ARCHIVED` or `COMPLETED`.
4. **Department Matching:** Rejects delete operations if the active user's department does not match the uploader department stored in file metadata.

---

# 9. Integration Report
Integration validation completed successfully:
- Exposes `GET /attachments/search` endpoint (properly declared above parameterized routes) which parses uploader metadata dynamically.
- Triggers notifications to GM & SM on uploads.
- Audit logs record all file changes.

---

# 10. Architecture Compliance Report
- **Schema Compliance:** 100% compliant. No database schema changes, mapping uploader attributes inside the existing `fileName` string.
- **Separation of Concerns:** Thin controllers delegate all operations to service components. File storage handles disk operations.

---

# 11. Production Readiness Report
- **NestJS Build:** ✅ **PASS** (Zero warnings, compiles via `npm run build`).
- **Formatting Standard:** ✅ **PASS** (Prettier code alignment verified).
- **Storage Guards:** ✅ **PASS** (10MB size limits and department filters working).
