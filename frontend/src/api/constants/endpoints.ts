export const API_ENDPOINTS = {
  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    SESSIONS: '/auth/sessions',
    SESSION: (id: string) => `/auth/session/${id}`,
    LOGIN_HISTORY: '/auth/login-history',
    SECURITY_STATUS: '/auth/security-status',
    UNLOCK_ACCOUNT: '/auth/unlock-account',
  },
  USERS: {
    BASE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    STATUS: (id: string) => `/users/${id}/status`,
    RESTORE: (id: string) => `/users/${id}/restore`,
  },
  ROLES: {
    BASE: '/roles',
    DETAIL: (id: string) => `/roles/${id}`,
    PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
  },
  PERMISSIONS: {
    BASE: '/permissions',
    DETAIL: (id: string) => `/permissions/${id}`,
  },
  DEPARTMENTS: {
    BASE: '/departments',
    DETAIL: (id: string) => `/departments/${id}`,
    RESTORE: (id: string) => `/departments/${id}/restore`,
  },
  BUSINESS_TRANSACTIONS: {
    BASE: '/business-transactions',
    DETAIL: (id: string) => `/business-transactions/${id}`,
    SUBMIT: (id: string) => `/business-transactions/${id}/submit`,
    STORES: {
      VERIFY: (id: string) => `/business-transactions/${id}/stores/verify`,
      ISSUE: (id: string) => `/business-transactions/${id}/stores/issue`,
    },
    PRODUCTION: {
      RECEIVE: (id: string) => `/business-transactions/${id}/production/receive`,
      START: (id: string) => `/business-transactions/${id}/production/start`,
      PROGRESS: (id: string) => `/business-transactions/${id}/production/progress`,
      COMPLETE: (id: string) => `/business-transactions/${id}/production/complete`,
    },
    DELIVERY: (id: string) => `/business-transactions/${id}/delivery`,
    ACCOUNTS: {
      VERIFY: (id: string) => `/business-transactions/${id}/accounts/verify`,
      ACTUAL_COST: (id: string) => `/business-transactions/${id}/accounts/actual-cost`,
      MATERIAL_COST: (id: string) => `/business-transactions/${id}/accounts/material-cost`,
      FINANCIAL_CLOSE: (id: string) => `/business-transactions/${id}/accounts/financial-close`,
    },
    ARCHIVE: (id: string) => `/business-transactions/${id}/archive`,
    COMPLETE: (id: string) => `/business-transactions/${id}/complete`,
    ATTACHMENTS: {
      BASE: (id: string) => `/business-transactions/${id}/attachments`,
      DETAIL: (id: string, attachmentId: string) =>
        `/business-transactions/${id}/attachments/${attachmentId}`,
      SEARCH: '/business-transactions/attachments/search',
      DOWNLOAD: (fileName: string) => `/business-transactions/attachments/download/${fileName}`,
      SUMMARY: (id: string) => `/business-transactions/${id}/attachments/summary`,
    },
  },
  PROCESSES: {
    BASE: '/manufacturing-processes',
    DETAIL: (id: string) => `/manufacturing-processes/${id}`,
    RESTORE: (id: string) => `/manufacturing-processes/${id}/restore`,
  },
  UNITS: {
    BASE: '/units',
    DETAIL: (id: string) => `/units/${id}`,
    RESTORE: (id: string) => `/units/${id}/restore`,
  },
  VENDORS: {
    BASE: '/vendors',
    DETAIL: (id: string) => `/vendors/${id}`,
    RESTORE: (id: string) => `/vendors/${id}/restore`,
  },
  PRODUCTS: {
    BASE: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    RESTORE: (id: string) => `/products/${id}/restore`,
  },
  MATERIALS: {
    BASE: '/materials',
    DETAIL: (id: string) => `/materials/${id}`,
    RESTORE: (id: string) => `/materials/${id}/restore`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    DETAIL: (id: string) => `/notifications/${id}`,
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
  ANALYTICS: {
    BASE: '/analytics',
    WORKFLOW: '/analytics/workflow',
    DEPARTMENTS: '/analytics/departments',
    COSTS: '/analytics/costs',
    PRODUCTS: '/analytics/products',
    VENDORS: '/analytics/vendors',
  },
  UPLOADS: {
    BASE: '/uploads',
    DETAIL: (id: string) => `/uploads/${id}`,
  },
} as const;

export type EndpointRegistry = typeof API_ENDPOINTS;
