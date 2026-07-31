export const PROCESS_MESSAGES = {
  CREATED_SUCCESS: 'Manufacturing process created successfully.',
  UPDATED_SUCCESS: 'Manufacturing process updated successfully.',
  DELETED_SUCCESS: 'Manufacturing process deleted successfully.',
  FETCHED_SUCCESS: 'Manufacturing process retrieved successfully.',
  LIST_FETCHED_SUCCESS: 'Manufacturing processes list retrieved successfully.',
  NOT_FOUND: 'Manufacturing process not found.',
  DUPLICATE_CODE: 'A manufacturing process with this code already exists for the product.',
  INVALID_PRODUCT: 'Invalid or inactive product specified.',
  SEQUENCE_CONFLICT:
    'The provided process sequence conflicts with an existing process for the product.',
  IN_USE_DELETE:
    'Manufacturing process cannot be deleted because it is referenced by indents or cost sheets.',
};
