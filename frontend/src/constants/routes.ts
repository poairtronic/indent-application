export const APP_ROUTES = {
  AUTH: {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
  },
  DASHBOARD: '/dashboard',
  INDENTS: {
    LIST: '/indents',
    CREATE: '/indents/create',
    DETAIL: (id: string) => `/indents/${id}`,
  },
  SETTINGS: '/settings',
  UNAUTHORIZED: '/unauthorized',
};
