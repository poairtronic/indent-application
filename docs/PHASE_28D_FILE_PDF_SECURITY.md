# ============================================================
# IMCMS PHASE 28D — FILE & PDF SECURITY HARDENING
# ============================================================

## 1. Vulnerability (ID-001)
Phase 28A identified a High (P1) vulnerability in the attachment upload pipeline. File validation relied exclusively on `path.extname(file.originalname)`. This permitted a potentially malicious file (e.g., an executable) to be renamed to a `.pdf` and successfully uploaded, bypassing structural and authorization intent.

## 2. Attack Scenario
A malicious actor could take a reverse-shell payload (`payload.exe`), rename it to `payload.pdf`, and submit it via the Design or Accounts upload workflow. Because the system only checked the string extension, the file would be accepted, stored in Supabase, and presented to other enterprise users, leading to potential malware distribution across the corporate network.

## 3. Implementation
1. **Content-Based Validation Utility (`file-validator.util.ts`)**: 
   - Introduced a new utility that uses the robust `file-type` library (v16.5.4) to perform magic-byte inspection on the uploaded `Buffer`.
   - Safely parses and validates binary signatures against the declared extension.
2. **DXF and DWG Legacy Support**:
   - Implemented specialized magic-byte inspection for `.dwg` (verifying the `AC10` ASCII header).
   - Implemented specialized structural inspection for plain-text `.dxf` CAD files (verifying `0\nSECTION` or `999` headers).
3. **Integration**:
   - Integrated `validateFileSignature` into `business-transaction.service.ts` (`uploadAttachmentToIndent`). Validation executes in-memory before any outbound network call to Supabase.

## 4. Validation Rules
- **Binary Signature Matching**: The detected magic bytes MUST match the client-provided extension. (e.g., a `.pdf` file must start with `%PDF-`).
- **Dangerous Type Rejection**: Signatures corresponding to `.exe`, `.elf`, `.bat`, `.sh`, `.php`, `.js` are aggressively rejected regardless of their filename.
- **Fail-Closed Verification**: If a binary file's signature cannot be parsed, it is rejected.
- **Supabase Integrity**: Since validation occurs prior to the `storageAdapter.saveFile()` call, malicious payloads are rejected synchronously and never reach the private Supabase bucket.

## 5. Test Matrix & Rejected Attack Cases
A comprehensive attack simulation script (`test-file-spoofing.ts`) was executed against the validator:
- ✅ **Valid PDF**: Accepted
- ❌ **Renamed executable -> .pdf**: Rejected (`File signature does not match PDF`)
- ❌ **Renamed text file -> .pdf**: Rejected (`Unable to verify .pdf file signature`)
- ❌ **Empty file -> .pdf**: Rejected (`Unable to verify .pdf file signature`)
- ✅ **Valid JPG / PNG / XLS**: Accepted
- ❌ **Malicious filename (.exe)**: Rejected (`Dangerous file signature detected: exe`)
- ✅ **Valid DWG**: Accepted
- ❌ **Fake DWG (Renamed Text)**: Rejected (`File signature does not match DWG`)
- ✅ **Valid DXF**: Accepted
- ❌ **Fake DXF**: Rejected (`File signature does not match DXF`)

## 6. Regression Results
- **Backend Test Suite**: All 185 tests **PASSED** (0 failures).
- **Backend Build**: Successful execution of `nest build`.
- Existing upload architecture (UUID generation, private bucket ACLs, RBAC download authorization) was completely preserved as requested.

## 7. Final Verdict

**FILE & PDF SECURITY HARDENING COMPLETE**
