# 02 — Complete API Documentation

> Enterprise Manufacturing Indent & Costing Management System (MERC)

---

## Base URL

- **Production:** `https://indent-application.onrender.com/api`
- **Development:** `http://localhost:3001/api`

## Global Headers

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes (except `@Public()`) | `Bearer <accessToken>` |
| `Content-Type` | Yes | `application/json` |
| `x-correlation-id` | Auto | Request correlation (server-generated if absent) |
| `x-client-version` | Auto | Frontend version |
| `x-app-name` | Auto | Application name |
| `x-timezone` | Auto | Client timezone |

## Response Envelope

All responses are wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-08-24T12:00:00.000Z",
  "path": "/api/resource"
}
```

## Rate Limiting

Global: **300 requests per minute** per user ID (or IP for unauthenticated requests).

| Endpoint Category | Limit |
|---|---|
| Auth endpoints | 5/60s (login, refresh) or 3/60s (password reset) |
| File upload | 20/60s |
| File download | 30/60s |
| Analytics | 50/60s |
| All other | 300/60s (default) |

---

## 1. Authentication APIs

### POST `/auth/login`

**Purpose:** Authenticate user and obtain tokens.

**Authentication:** `@Public()` — No JWT required.

**Rate Limit:** 5/60s

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

| Field | Type | Validation | Required |
|---|---|---|---|
| `email` | string | `@IsEmail`, `@IsNotEmpty` | Yes |
| `password` | string | `@IsNotEmpty`, `@MinLength(8)` | Yes |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "employeeCode": "AGIPL-EMP-001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "department": { "id": "uuid", "departmentName": "Design", "departmentCode": "DSN" },
      "role": { "id": "uuid", "roleName": "Design Engineer", "permissions": [...] }
    }
  }
}
```

**Error Responses:**
- `401` — Invalid credentials
- `401` — Account locked (5 failed attempts → 30min lockout)
- `429` — Rate limit exceeded

**Side Effects:** Creates `UserSession` + `RefreshToken` records. Audit log entry.

---

### POST `/auth/logout`

**Purpose:** Invalidate current session and refresh token.

**Authentication:** Bearer JWT required.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": { "message": "Logged out successfully" }
}
```

**Side Effects:** Revokes `RefreshToken`, updates `UserSession.status` to `REVOKED`.

---

### POST `/auth/refresh`

**Purpose:** Rotate tokens (issue new access + refresh token pair).

**Authentication:** `@Public()` + `JwtRefreshGuard`

**Rate Limit:** 5/60s

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Side Effects:** Old `RefreshToken` revoked, new pair created. Old `UserSession` updated.

**Error Responses:**
- `401` — Invalid or expired refresh token

---

### POST `/auth/forgot-password`

**Purpose:** Request password reset email.

**Authentication:** `@Public()`

**Rate Limit:** 3/60s

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent",
  "data": { "message": "If the email exists, a reset link has been sent" }
}
```

**Side Effects:** Creates `PasswordResetToken` (1hr expiry). Sends email via queue.

---

### POST `/auth/reset-password`

**Purpose:** Reset password using token from email.

**Authentication:** `@Public()`

**Rate Limit:** 3/60s

**Request Body:**
```json
{
  "token": "uuid-token-from-email",
  "password": "NewPassword123!"
}
```

| Field | Type | Validation | Required |
|---|---|---|---|
| `token` | string | `@IsNotEmpty` | Yes |
| `password` | string | `@IsNotEmpty`, `@MinLength(8)`, `@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)` | Yes |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": { "message": "Password reset successful" }
}
```

**Side Effects:** Password hashed and updated. All sessions revoked. All refresh tokens revoked. Sends `PASSWORD_CHANGED` email.

---

### POST `/auth/change-password`

**Purpose:** Change password while authenticated.

**Authentication:** Bearer JWT required.

**Rate Limit:** 3/60s

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": { "message": "Password changed successfully" }
}
```

**Side Effects:** Sends `PASSWORD_CHANGED` email.

---

### GET `/auth/profile`

**Purpose:** Get current user profile.

**Authentication:** Bearer JWT required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeCode": "AGIPL-EMP-001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "phone": "+1234567890",
    "status": "ACTIVE",
    "department": { "id": "uuid", "departmentName": "Design", "departmentCode": "DSN" },
    "role": { "id": "uuid", "roleName": "Design Engineer" },
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

## 2. Session & Security APIs

### GET `/auth/sessions`

**Purpose:** List all active sessions for current user.

**Authentication:** Bearer JWT required.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "status": "ACTIVE",
      "createdAt": "2026-08-24T12:00:00.000Z",
      "lastAccessedAt": "2026-08-24T12:05:00.000Z"
    }
  ]
}
```

---

### GET `/auth/login-history`

**Purpose:** Get login history for current user.

**Authentication:** Bearer JWT required.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "status": "SUCCESS",
      "createdAt": "2026-08-24T12:00:00.000Z"
    }
  ]
}
```

---

### DELETE `/auth/session/:id`

**Purpose:** Revoke a specific session.

**Authentication:** Bearer JWT required.

**Path Parameters:**
- `id` (UUID) — Session ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session revoked",
  "data": { "message": "Session revoked" }
}
```

---

### POST `/auth/logout-other-sessions`

**Purpose:** Revoke all sessions except current.

**Authentication:** Bearer JWT required.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Other sessions logged out",
  "data": { "message": "Other sessions logged out" }
}
```

---

### POST `/auth/logout-all`

**Purpose:** Revoke all sessions including current.

**Authentication:** Bearer JWT required.

**Success Response (200):**
```json
{
  "success": true,
  "message": "All sessions logged out",
  "data": { "message": "All sessions logged out" }
}
```

---

### GET `/auth/security-status`

**Purpose:** Get account security status.

**Authentication:** Bearer JWT required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isLocked": false,
    "failedLoginAttempts": 0,
    "lastLoginAt": "2026-08-24T12:00:00.000Z",
    "activeSessions": 2
  }
}
```

---

### POST `/auth/unlock-account`

**Purpose:** Unlock a locked account.

**Authentication:** Bearer JWT required.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account unlocked",
  "data": { "message": "Account unlocked" }
}
```

---

## 3. User Management APIs

### POST `/users`

**Purpose:** Create a new user.

**Authentication:** Bearer JWT required.

**Permission:** `users.create`

**Request Body:**
```json
{
  "employeeCode": "AGIPL-EMP-002",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "password": "Password123!",
  "departmentId": "uuid",
  "roleId": "uuid",
  "status": "ACTIVE",
  "profileImage": "https://..."
}
```

| Field | Type | Validation | Required |
|---|---|---|---|
| `employeeCode` | string | `@IsString`, `@IsNotEmpty`, `@MaxLength(50)` | Yes |
| `firstName` | string | `@IsString`, `@IsNotEmpty`, `@MaxLength(100)` | Yes |
| `lastName` | string | `@IsString`, `@IsNotEmpty`, `@MaxLength(100)` | Yes |
| `email` | string | `@IsEmail`, `@IsNotEmpty`, `@MaxLength(150)` | Yes |
| `phone` | string | `@IsString`, `@MaxLength(20)` | No |
| `password` | string | `@IsString`, `@IsNotEmpty`, `@MinLength(8)`, `@MaxLength(100)` | Yes |
| `departmentId` | string (UUID) | `@IsUUID('4')` | Yes |
| `roleId` | string (UUID) | `@IsUUID('4')` | Yes |
| `status` | enum | `ACTIVE`, `INACTIVE`, `SUSPENDED` | No |
| `profileImage` | string | `@IsString`, `@MaxLength(255)` | No |

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "employeeCode": "AGIPL-EMP-002",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "department": { "id": "uuid", "departmentName": "Design" },
    "role": { "id": "uuid", "roleName": "Design Engineer" },
    "status": "ACTIVE",
    "createdAt": "2026-08-24T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `409` — Email already exists
- `409` — Employee code already exists
- `404` — Department not found
- `404` — Role not found

**Side Effects:** Password hashed via bcrypt. Audit log (CREATE). Sends `USER_REGISTERED` email.

---

### GET `/users`

**Purpose:** List users with pagination and filters.

**Authentication:** Bearer JWT required.

**Permission:** `users.view`

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number (`@Min(1)`) |
| `limit` | number | 10 | Items per page (`@Min(1)`) |
| `search` | string | — | Search by name/email |
| `departmentId` | UUID | — | Filter by department |
| `roleId` | UUID | — | Filter by role |
| `status` | enum | — | `ACTIVE`, `INACTIVE`, `SUSPENDED` |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "employeeCode": "AGIPL-EMP-001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "department": { "id": "uuid", "departmentName": "Design", "departmentCode": "DSN" },
        "role": { "id": "uuid", "roleName": "Design Engineer" },
        "status": "ACTIVE",
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET `/users/profile`

**Purpose:** Get current user's own profile (same as `/auth/profile`).

**Authentication:** Bearer JWT required.

---

### GET `/users/:id`

**Purpose:** Get user by ID.

**Authentication:** Bearer JWT required.

**Permission:** `users.view`

**Path Parameters:**
- `id` (UUID) — User ID

---

### PATCH `/users/:id`

**Purpose:** Update user details.

**Authentication:** Bearer JWT required.

**Permission:** `users.update`

**Request Body:** Partial `CreateUserDto` (without `password` and `employeeCode`).

---

### PATCH `/users/:id/status`

**Purpose:** Update user status (ACTIVE, INACTIVE, SUSPENDED).

**Authentication:** Bearer JWT required.

**Permission:** `users.update`

**Request Body:**
```json
{
  "status": "SUSPENDED"
}
```

**Side Effects:** All active sessions revoked. All refresh tokens revoked. Sends `ACCOUNT_DISABLED` email.

---

### DELETE `/users/:id`

**Purpose:** Soft delete a user.

**Authentication:** Bearer JWT required.

**Permission:** `users.delete`

**Side Effects:** Sets `isDeleted = true`, `deletedAt`, `deletedBy`. Audit log (DELETE).

---

### PATCH `/users/:id/restore`

**Purpose:** Restore a soft-deleted user.

**Authentication:** Bearer JWT required.

**Permission:** `users.update`

**Side Effects:** Clears `isDeleted`, `deletedAt`, `deletedBy`. Audit log (RESTORE).

---

## 4. Role Management APIs

### POST `/roles`

**Purpose:** Create a new role.

**Permission:** `roles.create`

**Request Body:**
```json
{
  "roleName": "Quality Inspector",
  "description": "Quality inspection role",
  "isSystem": false,
  "permissionIds": ["uuid1", "uuid2"]
}
```

---

### GET `/roles`

**Purpose:** List all roles with permission counts.

**Permission:** `roles.view`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "roleName": "Design Engineer",
      "description": "Design and drafting role",
      "isSystem": false,
      "permissions": [...],
      "_count": { "users": 5 },
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/roles/:id`

**Purpose:** Get role by ID with permissions.

---

### PUT `/roles/:id`

**Purpose:** Update role (full replacement of permissions).

**Permission:** `roles.update`

**Business Rules:**
- System roles (`isSystem: true`) cannot be deleted
- `permissionIds` replaces all existing permissions (not additive)
- Role name uniqueness enforced

---

### DELETE `/roles/:id`

**Purpose:** Soft delete role.

**Permission:** `roles.delete`

**Error:** `409` if attempting to delete a system role.

---

### GET `/roles/:id/permissions`

**Purpose:** Get permissions assigned to a role.

---

### PUT `/roles/:id/permissions`

**Purpose:** Assign permissions to a role (full replacement).

**Request Body:** Array of permission UUIDs:
```json
["uuid1", "uuid2", "uuid3"]
```

---

## 5. Permission Management APIs

### POST `/permissions`

**Purpose:** Create a new permission.

**Permission:** `permissions.create`

**Request Body:**
```json
{
  "module": "products",
  "action": "CREATE",
  "code": "products.create",
  "description": "Create products"
}
```

---

### GET `/permissions`

**Purpose:** List permissions (optional filter by module).

**Query:** `?module=products`

---

### GET `/permissions/modules`

**Purpose:** List distinct permission modules.

**Response:** `["users", "roles", "indent", "costsheet", ...]`

---

### GET `/permissions/:id`

**Purpose:** Get permission by ID.

---

### PUT `/permissions/:id`

**Purpose:** Update permission.

---

### DELETE `/permissions/:id`

**Purpose:** Soft delete permission.

---

## 6. Business Transaction APIs (Core Workflow)

### POST `/business-transactions`

**Purpose:** Create a new Business Transaction (indent + cost sheet).

**Permission:** `indent.create`

**Request Body:**
```json
{
  "indent": {
    "productId": "uuid-or-null",
    "productName": "Shaft Assembly",
    "productCode": "PRD-SHAFT",
    "departmentId": "uuid-or-null",
    "departmentName": "Design",
    "description": "Manufacturing shaft assembly per drawing",
    "priority": "HIGH",
    "customerName": "ABC Corp",
    "layoutNumber": "L-001",
    "remarks": "Initial draft",
    "items": [
      {
        "materialName": "Steel Rod",
        "materialCode": "AGIPL-MAT-001",
        "quantity": 10,
        "unitId": "uuid",
        "shape": "ROUND",
        "dimensions": { "diameter": 50, "length": 200 },
        "remarks": "High-grade steel"
      }
    ],
    "processes": [
      {
        "processName": "Turning",
        "sequence": 1,
        "estimatedHours": 4,
        "estimatedInputQty": 10,
        "estimatedOutputQty": 10,
        "estimatedScrapQty": 0
      }
    ],
    "attachments": []
  },
  "costSheet": {
    "designCost": 500,
    "overheadCost": 200,
    "contingencyCost": 100,
    "costItems": [
      {
        "itemName": "Steel Rod 50mm",
        "category": "MATERIAL",
        "predictedRate": 150,
        "predictedQuantity": 10,
        "unitId": "uuid"
      }
    ],
    "processCosts": [
      {
        "processName": "Turning",
        "predictedCost": 400
      }
    ]
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Business Transaction created successfully",
  "data": {
    "id": "uuid",
    "indentNumber": "AGIPL-IND-2026-001",
    "costNumber": "AGIPL-CS-2026-001",
    "currentState": "DRAFT",
    "createdAt": "2026-08-24T12:00:00.000Z"
  }
}
```

**Business Rules:**
- Auto-generates `indentNumber` (AGIPL-IND-YYYY-NNN) and `costNumber` (AGIPL-CS-YYYY-NNN)
- Auto-resolves or creates Product, Department, Material records
- Material weight calculated from shape/dimensions/density
- Creates Indent + CostSheet + IndentItems + CostItems + ProcessCosts in one Prisma transaction
- Initial `WorkflowHistory` recorded
- Audit: `CREATE_DRAFT`

---

### GET `/business-transactions`

**Purpose:** List business transactions with pagination and filters.

**Permission:** `indent.view`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `state` | string | WorkflowState filter |
| `search` | string | Search by indent number, product name |
| `departmentId` | UUID | Filter by department |
| `sortBy` | string | Sort field |
| `sortOrder` | string | `asc` or `desc` |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "indentNumber": "AGIPL-IND-2026-001",
        "currentState": "STORES_PROCESSING",
        "priority": "HIGH",
        "productName": "Shaft Assembly",
        "department": { "departmentName": "Design" },
        "createdAt": "2026-08-24T12:00:00.000Z"
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

### GET `/business-transactions/:id`

**Purpose:** Get full business transaction details.

**Permission:** `indent.view`

**Response includes:** Indent, IndentItems (with materials), CostSheet, CostItems, ProcessCosts, Attachments, WorkflowHistory, allowedNextStates.

---

### PATCH `/business-transactions/:id`

**Purpose:** Update a draft business transaction.

**Permission:** `indent.edit` or `production.update`

**Business Rules:** Only allowed in states: `DRAFT`, `PRODUCTION_PROCESSING`, `ACCOUNTS_COST_VERIFICATION` (or `settings.manage` permission).

---

### POST `/business-transactions/:id/submit`

**Purpose:** Submit indent (DRAFT → DESIGN_COMPLETED).

**Permission:** `indent.submit`

**Request Body:**
```json
{
  "remarks": "Design completed, ready for stores"
}
```

**Business Rules:**
- Current state must be `DRAFT`
- User department must be DESIGN
- Optimistic locking prevents concurrent transitions
- Sends `DESIGN_COMPLETED` notification to STORES department

---

### POST `/business-transactions/:id/stores/verify`

**Purpose:** Stores stock verification (DESIGN_COMPLETED → STORES_PROCESSING).

**Permission:** `stores.issue`

**Business Rules:**
- Validates all indent items are AVAILABLE
- Updates each `IndentItem.status` to `AVAILABLE`
- Sends `STORES_PENDING` notification

---

### POST `/business-transactions/:id/stores/issue`

**Purpose:** Issue materials (STORES_PROCESSING → MATERIALS_ISSUED).

**Permission:** `stores.issue`

**Request Body:**
```json
{
  "remarks": "All materials issued",
  "issueItems": [
    {
      "indentItemId": "uuid",
      "issuedQuantity": 10
    }
  ]
}
```

**Business Rules:**
- Decrements `Material.currentStock` for each item
- Updates `IndentItem.issuedQuantity`
- **Partial issues:** If not all items fully issued, stays at `STORES_PROCESSING`
- **Full issue:** Appends `[MATERIALS_ISSUED]` remark, transitions to `MATERIALS_ISSUED`
- Stock cannot go negative — throws `BadRequestException`
- Sends `MATERIAL_ISSUED` notification (only on full issue)

---

### POST `/business-transactions/:id/stores-issue`

**Purpose:** Alias for `stores/issue` (backward compatibility).

---

### POST `/business-transactions/:id/items/:itemId/issue`

**Purpose:** Issue a single material item.

**Permission:** `stores.issue`

**Business Rules:** When last component is issued, auto-transitions to `MATERIALS_ISSUED`.

---

### POST `/business-transactions/:id/production/receive`

**Purpose:** Production receives materials (MATERIALS_ISSUED → PRODUCTION_PROCESSING).

**Permission:** `production.update`

**Business Rules:**
- Upserts `ProductionReceipt` record
- Sends `PRODUCTION_STARTED` notification

---

### POST `/business-transactions/:id/production-receive`

**Purpose:** Alias for `production/receive`.

---

### POST `/business-transactions/:id/production/start`

**Purpose:** Start production work (stays at PRODUCTION_PROCESSING).

**Permission:** `production.update`

---

### PATCH `/business-transactions/:id/production/progress`

**Purpose:** Update production progress.

**Permission:** `production.update`

**Request Body:**
```json
{
  "statusNotes": "Machining 60% complete",
  "remarks": "On schedule"
}
```

---

### POST `/business-transactions/:id/production-update`

**Purpose:** Alias for `production/progress`.

---

### POST `/business-transactions/:id/production/complete`

**Purpose:** Complete production (PRODUCTION_PROCESSING → PRODUCTION_COMPLETED).

**Permission:** `production.update`

**Business Rules:**
- Appends `[PRODUCTION_COMPLETED]` remark marker
- **Closes Loop 1** (isLoopBoundary: true)
- Sends `PRODUCTION_COMPLETED` notification to ACCOUNTS

---

### POST `/business-transactions/:id/accounts/verify`

**Purpose:** Start accounts verification (PRODUCTION_COMPLETED → ACCOUNTS_COST_VERIFICATION).

**Permission:** `accounts.verify`

**Business Rules:**
- Opens Loop 2
- Sends `ACCOUNTS_COST_VERIFICATION` notification

---

### POST `/business-transactions/:id/accounts-verify`

**Purpose:** Alias for `accounts/verify`.

---

### POST `/business-transactions/:id/accounts/actual-cost`

**Purpose:** Enter actual costs (ACCOUNTS_COST_VERIFICATION → ACTUAL_COST_UPDATED).

**Permission:** `accounts.verify`

**Request Body:**
```json
{
  "costItems": [
    {
      "costItemId": "uuid",
      "actualRate": 160,
      "actualQuantity": 10
    }
  ],
  "processCosts": [
    {
      "processCostId": "uuid",
      "actualCost": 450
    }
  ],
  "actualDesignCost": 550,
  "actualOverheadCost": 220,
  "actualContingencyCost": 80,
  "remarks": "Actual costs from vendor invoices"
}
```

**Business Rules:**
- Computes per-item variance: `varianceAmount = actual - predicted`
- Computes per-item variance percentage: `(variance / predicted) × 100`
- Computes sheet totals: `actualTotal = materialActual + processActual + designCost + overheadCost + contingencyCost`
- Computes: `varianceAmount = actualTotal - predictedTotal`
- Appends `[ACTUAL_COST_UPDATED]` remark marker
- Sends `ACTUAL_COST_UPDATED` notification

---

### POST `/business-transactions/:id/actual-costs`

**Purpose:** Alias for `accounts/actual-cost`.

---

### PATCH `/business-transactions/:id/accounts/material-cost`

**Purpose:** Update a single material's actual cost.

**Permission:** `accounts.verify`

---

### POST `/business-transactions/:id/accounts/financial-close`

**Purpose:** Financial closure (ACTUAL_COST_UPDATED → ACCOUNTS_FINANCIAL_CLOSURE).

**Permission:** `accounts.close`

**Business Rules:**
- Sets `CostSheet.status = FINALIZED`
- **Closes Loop 2** (isLoopBoundary: true)
- Sends `FINANCIAL_CLOSURE` notification

---

### POST `/business-transactions/:id/financial-closure`

**Purpose:** Alias for `accounts/financial-close`.

---

### POST `/business-transactions/:id/archive`

**Purpose:** Archive transaction (ACCOUNTS_FINANCIAL_CLOSURE → ARCHIVED).

**Permission:** `system.archive`

**Business Rules:**
- Sets `isLocked = true` (record locked against edits)
- Sends `TRANSACTION_ARCHIVED` notification

---

### POST `/business-transactions/:id/complete`

**Purpose:** Complete transaction (ARCHIVED → COMPLETED).

**Permission:** `system.complete`

**Business Rules:**
- Terminal state — no further transitions
- Sends `TRANSACTION_COMPLETED` notification

---

### Attachment APIs

#### GET `/business-transactions/attachments/search`

**Purpose:** Search attachments across transactions.

**Permission:** `indent.view` or `accounts.verify`

**Query Parameters:** `businessTransactionId`, `costSheetId`, `documentType`, `department`, `uploadedBy`, `uploadDate`, `fileName`

---

#### POST `/business-transactions/:id/attachments`

**Purpose:** Upload attachment.

**Permission:** `indent.edit` or `accounts.verify`

**Content-Type:** `multipart/form-data`

**Fields:**
- `file` — File (max 10MB, MIME signature validated)
- `remarks` — string

**Rate Limit:** 20/60s

**Business Rules:**
- Design dept can only upload in DRAFT state
- Accounts dept only in cost verification states
- File signature validation via `file-type` library

---

#### GET `/business-transactions/attachments/download/:fileName`

**Purpose:** Download attachment.

**Permission:** `indent.view` or `accounts.verify`

**Rate Limit:** 30/60s

**Business Rules:** Admin unrestricted; Managers read-only; Accounts files restricted to Accounts dept + Managers.

---

#### GET `/business-transactions/:id/attachments/summary`

**Purpose:** Get attachment statistics.

---

#### GET `/business-transactions/:id/attachments/:attachmentId/history`

**Purpose:** Get attachment audit history.

---

#### PUT `/business-transactions/:id/attachments/:attachmentId`

**Purpose:** Replace attachment.

**Rate Limit:** 20/60s

---

#### DELETE `/business-transactions/:id/attachments/:attachmentId`

**Purpose:** Delete attachment.

---

## 7. Master Data APIs

### Departments

#### GET `/departments`

**Purpose:** List departments.

**Permission:** Any of: `departments.view`, `indent.view`, `indent.create`, `inventory.view`, `production.view`, `costsheet.view`, `reports.view`, `notifications.view`

**Query Parameters:** `page`, `limit`, `search`, `sortBy`, `sortOrder`

**Note:** Without query params returns full list (for dropdowns); with params returns paginated results.

---

### Products

#### GET `/products`

**Permission:** `products.view`

#### POST `/products`

**Permission:** `products.create`

**Request Body:**
```json
{
  "productCode": "AGIPL-PRD-001",
  "productName": "Shaft Assembly",
  "description": "Main shaft for industrial pump",
  "departmentId": "uuid",
  "status": "ACTIVE"
}
```

**Business Rules:** Auto-generates `productCode` (AGIPL-PRD-NNN) if not provided or not prefixed with `AGIPL-PRD-`.

#### PUT `/products/:id`

**Permission:** `products.update`

#### DELETE `/products/:id`

**Permission:** `products.delete` or `products.update`

---

### Materials

#### GET `/materials`

**Permission:** `materials.view`

#### POST `/materials`

**Permission:** `materials.create`

**Request Body:**
```json
{
  "materialCode": "AGIPL-MAT-001",
  "materialName": "Steel Rod 50mm",
  "description": "High-grade steel rod",
  "unitId": "uuid",
  "category": "RAW_MATERIAL",
  "densityKgPerDm3": 7.85,
  "maxStock": 1000,
  "status": "ACTIVE"
}
```

**Business Rules:** Auto-generates `materialCode` (AGIPL-MAT-NNN) if not provided.

#### PUT `/materials/:id` and PATCH `/materials/:id`

**Permission:** `materials.update`

#### DELETE `/materials/:id`

**Permission:** `materials.delete`

---

### Manufacturing Processes

#### POST `/manufacturing-processes`

**Permission:** `manufacturing-processes.create`

**Request Body:**
```json
{
  "processName": "CNC Machining",
  "description": "Computer numerical control machining",
  "estimatedCycleTime": 30,
  "status": "ACTIVE"
}
```

#### GET `/manufacturing-processes`

**Permission:** `manufacturing-processes.view`

#### GET `/manufacturing-processes/:id`

**Permission:** `manufacturing-processes.view`

#### PATCH `/manufacturing-processes/:id`

**Permission:** `manufacturing-processes.update`

#### DELETE `/manufacturing-processes/:id`

**Permission:** `manufacturing-processes.delete`

#### PATCH `/manufacturing-processes/:id/restore`

**Permission:** `manufacturing-processes.restore`

---

### Units

#### POST `/units`

**Permission:** `units.create`

**Request Body:**
```json
{
  "unitName": "Kilograms",
  "unitCode": "KG",
  "description": "Weight measurement"
}
```

#### GET `/units`

**Permission:** `units.view`

#### GET `/units/:id`

**Permission:** `units.view`

#### PATCH `/units/:id`

**Permission:** `units.update`

#### DELETE `/units/:id`

**Permission:** `units.delete`

#### PATCH `/units/:id/restore`

**Permission:** `units.restore`

---

### Vendors

#### POST `/vendors`

**Permission:** `vendors.create`

**Request Body:**
```json
{
  "vendorCode": "V001",
  "vendorName": "Steel Supplies Inc.",
  "email": "contact@steel.com",
  "phone": "+1234567890",
  "address": "123 Industrial Area",
  "gstNumber": "GST1234567",
  "panNumber": "ABCDE1234F",
  "status": "ACTIVE"
}
```

#### GET `/vendors`

**Permission:** `vendors.view`

#### GET `/vendors/:id`

**Permission:** `vendors.view`

#### PATCH `/vendors/:id`

**Permission:** `vendors.update`

#### DELETE `/vendors/:id`

**Permission:** `vendors.delete`

#### PATCH `/vendors/:id/restore`

**Permission:** `vendors.restore`

---

## 8. Analytics APIs

All analytics endpoints require `analytics.view` permission and are rate-limited at 50/60s.

### GET `/analytics/kpis`

**Query Parameters:** `dateFrom`, `dateTo`, `departmentId`, `productId`, `vendorId`, `processCode`, `status`, `page`, `limit`

**Response:** Array of KPI objects with aggregated metrics.

---

### GET `/analytics/insights`

**Response:** `{ insights: IInsight[], summaryText: string, generatedAt: Date }`

---

### GET `/analytics/summary`

**Response:** Executive summary with totalTransactions, statusBreakdown, active/completed/archived/pending counts.

---

### GET `/analytics/workflow`

**Response:** Stage distribution, completion rate, average cycle days, bottleneck stage, stalled transactions.

---

### GET `/analytics/departments`

**Response:** Department workloads, highest workload department.

---

### GET `/analytics/costs`

**Query:** `from`, `to`, `page`, `limit`

**Response:** Total planned/actual cost, variance amounts, average variance percentage.

---

### GET `/analytics/products`

**Query:** `limit` (1-100)

**Response:** Product analytics, most produced, highest/lowest cost products.

---

### GET `/analytics/vendors`

**Query:** `limit` (1-100)

**Response:** Vendor analytics, highest usage, best performing vendor.

---

### GET `/analytics/dashboard-overview`

**Purpose:** Consolidated dashboard data (combines summary, workflow, departments, costs, products).

---

## 9. Communication APIs

### GET `/communication/logs`

**Permission:** `audit.view`

**Query:** `page`, `limit`, `status`

**Response:** Paginated email log entries.

---

### POST `/communication/test`

**Permission:** `settings.manage`

**Request Body:**
```json
{
  "to": "test@example.com",
  "subject": "Test Email"
}
```

**Response:** `{ success: boolean, message: string, jobId: string }`

---

### GET `/communication/health`

**Permission:** `settings.manage`

**Response:**
```json
{
  "status": "UP",
  "smtp": "ok",
  "queue": "UP",
  "timestamp": "2026-08-24T12:00:00.000Z"
}
```

---

### GET `/communication/queue`

**Permission:** `settings.manage`

**Response:**
```json
{
  "mailQueue": { "active": 2, "waiting": 5, "delayed": 0, "failed": 1 },
  "deadQueue": { "total": 3 },
  "timestamp": "2026-08-24T12:00:00.000Z"
}
```

---

### GET `/communication/metrics`

**Permission:** `settings.manage`

**Response:**
```json
{
  "throughput": {
    "totalProcessed": 150,
    "completed": 145,
    "failed": 5,
    "successRatePercentage": 96.67
  },
  "timestamp": "2026-08-24T12:00:00.000Z"
}
```

---

## 10. Notification APIs

### GET `/notifications`

**Permission:** `notifications.view`

**Query:** `page`, `limit`, `isRead` (boolean), `eventType` (string)

**Business Rules:** Results filtered by department-based RBAC:
- Admin: all notifications
- SM/GM: all event types
- Department users: only events relevant to their department

---

### GET `/notifications/unread-count`

**Permission:** `notifications.view`

**Response:** `number` — Count of unread notifications.

---

### GET `/notifications/:id`

**Permission:** `notifications.view`

**Business Rules:** RBAC-authorized access.

---

### PATCH `/notifications/:id/read`

**Permission:** `notifications.view`

**Response:** `{ success: true }`

---

### PATCH `/notifications/read-all`

**Permission:** `notifications.view`

**Response:** `{ success: true }`

---

## 11. Audit Log APIs

### GET `/audit-logs`

**Permission:** `audit.view`

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `module` | string | Filter by module (e.g., BUSINESS_TRANSACTION) |
| `action` | string | Filter by action |
| `search` | string | Search by description |
| `sortBy` | string | Sort field |
| `sortOrder` | string | `asc` or `desc` |

---

## 12. Report APIs

All report endpoints require `reports.view` permission.

### Production Reports

| Endpoint | Description |
|---|---|
| `GET /reports/production/daily` | Daily production summary |
| `GET /reports/production/daily/export` | Export as Excel/PDF |
| `GET /reports/production/process-yield` | Process yield data |
| `GET /reports/production/machine-utilization` | Machine utilization |

### Cost Reports

| Endpoint | Description |
|---|---|
| `GET /reports/cost/actual-vs-predicted` | Actual vs predicted costs |
| `GET /reports/cost/actual-vs-predicted/export` | Export as Excel/PDF |
| `GET /reports/cost/material-breakdown` | Material cost breakdown |
| `GET /reports/cost/material-breakdown/export` | Export as Excel/PDF |
| `GET /reports/cost/department-budget` | Department budget utilization |

### Master Data Reports

| Endpoint | Description |
|---|---|
| `GET /reports/master-data/vendor-performance` | Vendor performance |
| `GET /reports/master-data/vendor-performance/export` | Export as Excel/PDF |
| `GET /reports/master-data/products` | Product catalog |
| `GET /reports/master-data/products/export` | Export as Excel/PDF |

### Workflow Reports

| Endpoint | Description |
|---|---|
| `GET /reports/workflow/bottleneck` | Workflow bottleneck analysis |
| `GET /reports/workflow/bottleneck/export` | Export as Excel/PDF |

**Note:** Some export endpoints return `501 Not Implemented` (V1.0 placeholder).

---

## 13. Settings APIs

### GET `/settings`

**Purpose:** List all application settings.

**Query:** `?category=email` (optional filter)

---

### GET `/settings/:key`

**Purpose:** Get a specific setting by key.

---

### PATCH `/settings/:key`

**Permission:** `settings.manage`

**Request Body:**
```json
{
  "value": "new-value",
  "description": "Updated description",
  "category": "email"
}
```

---

## 14. Observability APIs

### GET `/observability/health/liveness`

**Authentication:** `@Public()`

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2026-08-24T12:00:00.000Z"
}
```

---

### GET `/observability/health/readiness`

**Authentication:** `@Public()`

**Response (200 when healthy):**
```json
{
  "status": "UP",
  "services": {
    "database": "UP",
    "queue": "UP"
  },
  "timestamp": "2026-08-24T12:00:00.000Z"
}
```

**Response (503 when unhealthy):**
```json
{
  "status": "DOWN",
  "services": {
    "database": "DOWN",
    "queue": "UP"
  },
  "timestamp": "2026-08-24T12:00:00.000Z"
}
```

---

### POST `/observability/frontend-errors`

**Authentication:** `@Public()`

**Request Body:**
```json
{
  "type": "ChunkLoadError",
  "message": "Failed to fetch chunk",
  "stack": "...",
  "url": "/dashboard"
}
```

**Response:** `{ success: true }`

---

### GET `/observability/metrics`

**Permission:** `settings.manage`

**Response:** Full system metrics including API, DB, Redis, Workflow, Auth, Notification, Node, and Frontend error metrics.

---

## 15. Error Response Format

All errors follow the standard envelope:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["field-level error details"],
  "timestamp": "2026-08-24T12:00:00.000Z",
  "path": "/api/resource"
}
```

### HTTP Status Codes

| Code | Meaning | When |
|---|---|---|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (creation) |
| 400 | Bad Request | Validation error, FK violation (Prisma P2003) |
| 401 | Unauthorized | Invalid/expired JWT, invalid credentials |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found (Prisma P2025) |
| 409 | Conflict | Duplicate (Prisma P2002), concurrent modification, system role deletion |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected errors |

### Prisma Error Mapping

| Prisma Code | HTTP Status | Message |
|---|---|---|
| P2002 | 409 | Unique constraint violation |
| P2025 | 404 | Record not found |
| P2003 | 400 | Foreign key constraint violation |

---

## 16. Complete Permission Codes Reference

| Module | Codes |
|---|---|
| Users | `users.create`, `users.view`, `users.update`, `users.delete` |
| Roles | `roles.create`, `roles.view`, `roles.update`, `roles.delete` |
| Permissions | `permissions.create`, `permissions.view`, `permissions.update`, `permissions.delete` |
| Indent | `indent.create`, `indent.view`, `indent.edit`, `indent.submit` |
| CostSheet | `costsheet.view` |
| Stores | `stores.issue` |
| Production | `production.update`, `production.view` |
| Accounts | `accounts.verify`, `accounts.close` |
| System | `system.archive`, `system.complete` |
| Products | `products.view`, `products.create`, `products.update`, `products.delete` |
| Materials | `materials.view`, `materials.create`, `materials.update`, `materials.delete` |
| Departments | `departments.view` |
| Analytics | `analytics.view` |
| Reports | `reports.view` |
| Notifications | `notifications.view` |
| Audit | `audit.view` |
| Settings | `settings.manage` |
| Inventory | `inventory.view` |
| Vendors | `vendors.create`, `vendors.view`, `vendors.update`, `vendors.delete`, `vendors.restore` |
| Units | `units.create`, `units.view`, `units.update`, `units.delete`, `units.restore` |
| Manufacturing Processes | `manufacturing-processes.create`, `manufacturing-processes.view`, `manufacturing-processes.update`, `manufacturing-processes.delete`, `manufacturing-processes.restore` |

---

*All API endpoints documented from actual controller implementations. Request/response examples generated from DTOs and service code.*
