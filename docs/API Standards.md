# API Standards

## 1. Request/Response Conventions
- All REST request/response bodies must use JSON payload format.
- Resource endpoints follow the plural noun guideline:
  - `POST /api/indents` - Create
  - `GET /api/indents` - List
  - `GET /api/indents/:id` - Read
  - `PATCH /api/indents/:id` - Update status or attributes

## 2. Response Structure
Successful responses should return the data resource wrapper directly or in a structured payload:
```json
{
  "success": true,
  "data": { ... }
}
```

Error responses should follow a standard exception format containing error codes and messages:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## 3. Authentication & Authorization
- Secure endpoints require Bearer JWT authorizations:
  - `Authorization: Bearer <token>`
- Enforce role-based checks inside NestJS route guards.
