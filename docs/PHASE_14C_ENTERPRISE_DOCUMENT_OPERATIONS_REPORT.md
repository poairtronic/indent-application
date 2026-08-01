# PHASE 14C — ENTERPRISE DOCUMENT OPERATIONS REPORT
## Enterprise Manufacturing Indent & Costing Management System (IMCMS)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Enterprise Document Operations & Lifecycle Audit Report  
**Phase:** Phase 14C — Enterprise Document Operations & Lifecycle Management  
**Version:** 1.0  
**Status:** Approved & Completed  

---

# 1. Enterprise Document Operations Report
Phase 14C completes the Enterprise Document lifecycle. We implemented full operational capabilities: download, view tracking, document replacement, soft deletes, dynamic search & filtering, metadata resolution, and dynamic summaries for Business Transactions, Indents, and Cost Sheets.

---

# 2. Document Retrieval Report
Retrieval filters query and fetch attachments dynamically. Uploader details (first/last name, email) are resolved using database relation joins, and all uploader metadata attributes (mimetype, size, remarks, cost sheet mappings) are deserialized in-memory before returning records to the consumer.

---

# 3. Document Search Report
Supports combined search and query filtering:
- Query by: `businessTransactionId` (Indent ID), `costSheetId`, `documentType` (`FileType` enum), `department`, `uploadedBy`, `uploadDate`, and partial `fileName` matching.
- Implementation leverages database filter clauses coupled with dynamic post-query in-memory filters for metadata attributes stored inside the JSON columns.

---

# 4. Document Summary Report
Exposes dynamic statistical summaries of transaction attachments:
- Total documents count.
- Count of Design vs. Accounts documents.
- Categorized file counts (CAD, PDF, Excel, Invoices, Drawings, Vouchers, etc.).
- Total combined file size in bytes.

---

# 5. Attachment History Report
Access and modification histories are tracked using the central `AuditLog` table. We fetch all audit records matching the Business Transaction ID and filter entries dynamically based on `attachmentId` tags inside values:
- Logs events for: `DOCUMENT_UPLOAD`, `DOCUMENT_DOWNLOAD`, `DOCUMENT_VIEW`, `DOCUMENT_REPLACE`, and `DOCUMENT_DELETE`.

---

# 6. API Matrix

| Method | Endpoint | Query / Body Filters | Permission Guard | Target State | Description |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/business-transactions/:id/attachments` | Multipart file, `remarks` | `indent.edit` OR `accounts.verify` | DRAFT (Design) / cost verification (Accounts) | Uploads drawings / bills |
| `GET` | `/business-transactions/attachments/download/:fileName` | Path: `fileName` | Authenticated (JwtAuthGuard) | Any state | Downloads file & logs download audit trail |
| `GET` | `/business-transactions/:id/attachments/summary` | Path: `id` | `indent.view` OR `accounts.verify` | Any state | Generates document statistics summary |
| `GET` | `/business-transactions/:id/attachments/:attachmentId/history` | Path: `attachmentId` | `indent.view` OR `accounts.verify` | Any state | Fetches audit access history for attachment |
| `PUT` | `/business-transactions/:id/attachments/:attachmentId` | Multipart file, `remarks` | `indent.edit` OR `accounts.verify` | Upload state lock | Replaces physical file and updates metadata JSON |
| `DELETE` | `/business-transactions/:id/attachments/:attachmentId` | Path: `attachmentId` | `indent.edit` OR `accounts.verify` | Upload state lock | Soft-deletes attachment metadata and deletes physical file |
| `GET` | `/business-transactions/attachments/search` | Filters: `costSheetId`, `department`, `fileName`, etc. | `indent.view` OR `accounts.verify` | Any state | Searches attachments across all transactions |

---

# 7. Notification Matrix

| Action Trigger | Action Performed | Recipient Role | Notification Title | Message Template |
| --- | --- | --- | --- | --- |
| Document Replace | Replaces drawing/bill file | Senior Manager, General Manager | **Document Replaced** | Document '{oldName}' has been replaced with '{newName}' on Indent #{indentNumber}. |
| Document Delete | Deletes drawing/bill file | Senior Manager, General Manager | **Document Deleted** | Document '{fileName}' has been deleted from Indent #{indentNumber}. |

---

# 8. Audit Matrix

| Audit Action Code | Event Type | Target Transaction | oldValue Context | newValue Context |
| --- | --- | --- | --- | --- |
| `DOCUMENT_DOWNLOAD` | `PRODUCTION_UPDATE` | Business Transaction | `null` | `{ action: 'DOCUMENT_DOWNLOAD', fileName, attachmentId }` |
| `DOCUMENT_REPLACE` | `PRODUCTION_UPDATE` | Business Transaction | `{ oldFileName }` | `{ action: 'DOCUMENT_REPLACE', replacedAttachmentId, newFileName }` |
| `DOCUMENT_DELETE` | `PRODUCTION_UPDATE` | Business Transaction | `{ deletedAttachment: attachmentId }` | `{ action: 'DOCUMENT_DELETE', attachmentId }` |

---

# 9. Business Validation Report
Constraints validated and enforced:
- **Design Locks:** Drawing modifications/replacements are locked post `DESIGN_COMPLETED`.
- **Accounts Locks:** Invoice/billing modifications are locked post `FINANCIAL_CLOSURE` or archival.
- **Access Gating:** Downloads of deleted attachments are blocked, throwing `404 Not Found` errors.
- **Ownership Verification:** File deletion or replacement is rejected if user department does not match uploader department.

---

# 10. Architecture Compliance Report
- **Prisma Schema Compliance:** 100% compliant. No database schema changes, mapping uploader attributes inside the existing `fileName` string.
- **Code Separation:** Thin controllers delegate all operations to service components. File storage handles disk operations.

---

# 11. Integration Report
Integration validation completed successfully:
- Exposes `GET /attachments/search` endpoint (properly declared above parameterized routes) which parses uploader metadata dynamically.
- Triggers notifications to GM & SM on uploads.
- Audit logs record all file changes.

---

# 12. Production Readiness Report
- **NestJS Build:** ✅ **PASS** (Zero warnings, compiles via `npm run build`).
- **Formatting Standard:** ✅ **PASS** (Prettier code alignment verified).
- **Storage Guards:** ✅ **PASS** (10MB size limits and department filters working).
