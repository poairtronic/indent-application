export interface ApiEndpoint {
  controller: string;
  module: string;
  method: string;
  path: string;
  fullPath: string;
  dto?: string;
  response?: string;
  queryDto?: string;
  paramsDto?: string;
  guards: string[];
  roles: string[];
  swagger: {
    summary?: string;
    tags: string[];
    responses: Array<{ status: number | string; description?: string; type?: string }>;
  };
  sourceFile: string;
  lineNumber: number;
}
