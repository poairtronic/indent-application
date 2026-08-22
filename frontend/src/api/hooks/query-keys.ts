type QueryKeyFactory = {
  all: readonly ['api', string];
  lists: () => readonly ['api', 'list', string];
  list: (module: string) => readonly ['api', 'list', string];
  details: () => readonly ['api', 'detail', string];
  detail: (module: string, id: string) => readonly ['api', 'detail', string, string];
  searches: () => readonly ['api', 'search', string];
  search: (module: string, query: string) => readonly ['api', 'search', string, string];
  infinite: (module: string) => readonly ['api', 'infinite', string];
  infiniteWithParams: (
    module: string,
    params: string,
  ) => readonly ['api', 'infinite', string, string];
};

function createKeyFactory(_moduleName: string): QueryKeyFactory {
  return {
    all: ['api', _moduleName] as const,
    lists: () => ['api', 'list', _moduleName] as const,
    list: (module: string) => ['api', 'list', module] as const,
    details: () => ['api', 'detail', _moduleName] as const,
    detail: (module: string, id: string) => ['api', 'detail', module, id] as const,
    searches: () => ['api', 'search', _moduleName] as const,
    search: (module: string, query: string) => ['api', 'search', module, query] as const,
    infinite: (module: string) => ['api', 'infinite', module] as const,
    infiniteWithParams: (module: string, params: string) =>
      ['api', 'infinite', module, params] as const,
  };
}

export const queryKeys = {
  auth: createKeyFactory('auth'),
  users: createKeyFactory('users'),
  roles: createKeyFactory('roles'),
  permissions: createKeyFactory('permissions'),
  departments: createKeyFactory('departments'),
  processes: createKeyFactory('processes'),
  units: createKeyFactory('units'),
  vendors: createKeyFactory('vendors'),
  products: createKeyFactory('products'),
  materials: createKeyFactory('materials'),
  indents: createKeyFactory('indents'),
  costSheets: createKeyFactory('cost-sheets'),
  notifications: createKeyFactory('notifications'),
  audit: createKeyFactory('audit'),
  communication: createKeyFactory('communication'),
  analytics: createKeyFactory('analytics'),
  reports: createKeyFactory('reports'),
  uploads: createKeyFactory('uploads'),
  settings: createKeyFactory('settings'),
} as const;

export function invalidateModule(
  queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>,
  module: string,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ['api', 'list', module],
  });
}

export function invalidateDetail(
  queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>,
  module: string,
  id: string,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ['api', 'detail', module, id],
  });
}

export function invalidateAll(
  queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>,
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: ['api'],
  });
}
