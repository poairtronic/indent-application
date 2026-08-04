export interface BackendEndpoint {
  module: string;
  controller: string;
  method: string;
  path: string;
  fullPath: string;
  dto?: string;
  queryDto?: string;
  response?: string;
  guards: string[];
  roles: string[];
  permissions: string[];
  swagger: any;
}

export interface FrontendEndpoint {
  service: string;
  hook: string;
  method: string;
  url: string;
  queryKey?: string[];
  requestDto?: string;
  responseDto?: string;
  mutationName?: string;
  authRequired?: boolean;
  sourceFile: string;
  lineNumber: number;
}

export type MatchResult = 'MATCH' | 'MISMATCH' | 'MISSING_FRONTEND' | 'MISSING_BACKEND';

export interface ComparisonRow {
  module: string;
  backendUrl: string;
  frontendUrl: string;
  method: string;
  result: MatchResult;
  issues: string[];
  backendEndpoint?: BackendEndpoint;
  frontendEndpoint?: FrontendEndpoint;
}

export interface VerificationReport {
  scannedAt: string;
  summary: {
    totalBackendApis: number;
    totalFrontendApis: number;
    matches: number;
    missingApis: number;
    incorrectUrls: number;
    incorrectMethods: number;
    dtoMismatches: number;
    duplicateHooks: number;
    coveragePercent: string;
    overallResult: 'PASS' | 'FAIL';
  };
  matrix: ComparisonRow[];
  p0Errors: ComparisonRow[];
  p1Errors: ComparisonRow[];
  p2Errors: ComparisonRow[];
  deadEndpoints: BackendEndpoint[];
  duplicateEndpoints: string[];
}

export interface RuntimeExecutionResult {
  endpoint: string;
  method: string;
  statusWithoutAuth: number | 'ERROR';
  statusWithAuth: number | 'ERROR';
  responseSchema?: any;
  passed: boolean;
  errorCategory?: 'CRITICAL' | 'WARNING' | 'INFO';
  errorDetails?: string;
}

export interface RuntimeReport {
  executedAt: string;
  totalExecuted: number;
  totalPassed: number;
  totalFailed: number;
  results: RuntimeExecutionResult[];
}

export interface SwaggerEndpoint {
  path: string;
  method: string;
  summary?: string;
  operationId?: string;
  tags?: string[];
  parameters: any[];
  requestBodySchema?: string;
  responseSchemas: Record<string, string>;
  isProtected: boolean;
}

export interface SwaggerReportRow {
  swaggerEndpoint?: SwaggerEndpoint;
  backendEndpoint?: BackendEndpoint;
  frontendEndpoint?: FrontendEndpoint;
  result: 'MATCH' | 'MISSING_IN_BACKEND' | 'MISSING_IN_SWAGGER' | 'MISSING_IN_FRONTEND' | 'MISMATCH';
  issues: string[];
}

export interface SwaggerReport {
  generatedAt: string;
  summary: {
    totalSwagger: number;
    totalBackend: number;
    totalFrontend: number;
    missingInSwagger: number;
    missingInBackend: number;
    missingInFrontend: number;
    mismatches: number;
  };
  matrix: SwaggerReportRow[];
}

