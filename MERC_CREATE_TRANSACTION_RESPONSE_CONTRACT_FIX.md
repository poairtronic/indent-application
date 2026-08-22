# MERC Create Transaction Response Contract Fix

## Backend Actual Response
`POST /business-transactions`
```json
{
  "id": "uuid-...",
  "success": true
}
```

## Frontend Expected Response
The frontend globally abstracted API client (`BaseService`) expects endpoints to return a standard envelope format wrapped in `{ data: T, success: boolean, ... }`. It uses the `unwrap` utility which indiscriminately returns `response.data`.
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "uuid-...",
    "success": true
  }
}
```

## Actual Mismatch
The NestJS backend's global `TransformInterceptor` explicitly checks `if (data && 'success' in data)` and passes the object unaltered if true, bypassing the standard envelope creation.
Therefore, the `createTransaction` controller which returns `{ id: ..., success: true }` circumvents the standard envelope.
The frontend `unwrap` function unconditionally tries to return `response.data` which evaluates to `undefined` because there is no `data` field in the response.

## Correct Response Access Path
Instead of modifying the backend or creating endpoint-specific hacks in the frontend hooks, the fix normalizes the API client contract at the lowest level (`frontend/src/api/utils/response.ts` -> `unwrap`):
```typescript
export function unwrap<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}
```
This safely accommodates both endpoints that use the standard envelope (containing `data`) and endpoints that bypass it (returning fields directly).
Additionally, `IndentFormPage.tsx` was updated to explicitly validate that an ID is present in the unwrapped response before attempting to navigate.
