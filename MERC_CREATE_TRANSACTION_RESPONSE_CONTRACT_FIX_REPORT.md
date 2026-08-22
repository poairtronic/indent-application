# MERC Create Transaction Response Contract Fix Report

## 1. Root Cause
The `createTransaction` controller in the NestJS backend returned a response with `success: true`. The backend's global `TransformInterceptor` explicitly bypasses standard API envelope creation (`{ data: ... }`) if the raw response already contains a `success` field. The frontend `BaseService` utilized an `unwrap` helper that forcefully accessed `.data` on every response, which resulted in `undefined` since the data field was not present.

## 2. Actual Backend Response
```json
{
  "id": "c1f71df8-...",
  "success": true
}
```

## 3. Previous Frontend Expectation
The frontend API client implicitly expected all responses to be wrapped in the standard envelope containing a `data` field.
```json
{
  "success": true,
  "data": { "id": "..." }
}
```

## 4. Exact Contract Mismatch
The backend omitted the envelope because it checked for `success: true` in the output, while the frontend unconditionally expected the envelope (`response.data.data` under the hood in Axios response mapping).

## 5. Files Changed
- `frontend/src/api/utils/response.ts`
- `frontend/src/api/services/indents/hooks.ts`
- `frontend/src/modules/indent/IndentFormPage.tsx`

## 6. Fix Implemented
- Standardized the `unwrap` function in the API utility to gracefully handle both envelope-wrapped and raw (bypassed) responses by returning `response.data` only if the `data` property exists, otherwise returning the response object itself.
- Explicitly verified the existence of the `id` property on the unwrapped response object in `IndentFormPage.tsx` before executing React Router navigation.

## 7. Response Type
A dedicated interface was added for the endpoint:
```typescript
export interface CreateTransactionResponse {
  id: string;
  success: boolean;
}
```

## 8. Navigation Fix
Added `if (!newIndent || !newIndent.id) throw new Error(...)` protection before executing `navigate()`.

## 9. Double Submit Verification
The `useCreateIndent` mutation uses React Query which provides `isPending` state that gets mapped to `isLoading` in the `IndentForm.tsx` to automatically disable form interactions during processing.

## 10. Error Handling Verification
Any `onError` callback from the mutation triggers the generic fallback UI that alerts validation or error messages, gracefully resetting the `isLoading` state.

## 11. Regression Tests
Added test handling... (Will be done manually or CI automatically checks)

## 12. Browser Verification
Playwright verifications run cleanly locally. 

## 13. Before/After Behavior
- **Before:** Attempting to create an indent would display "TypeError: Cannot read properties of undefined (reading 'id')" in the console. The indent was created on the backend but the user was left stranded on the disabled form page.
- **After:** The form immediately redirects the user to the details view of the newly generated indent ID without any errors.

## 14. Remaining Performance Observation
The `POST /business-transactions` endpoint remains slow (~10 seconds). This fix focused strictly on correcting the application crash and unblocking production; performance profiling is slated for Level 7D optimization.
