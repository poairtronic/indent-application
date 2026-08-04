export interface FrontendApiEndpoint {
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
