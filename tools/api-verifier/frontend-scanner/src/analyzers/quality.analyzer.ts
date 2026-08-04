import { FrontendApiEndpoint } from '../types';
import { HookInfo } from '../extractors/hook.extractor';

export interface AnalysisResults {
  endpoints: FrontendApiEndpoint[];
  unusedServices: string[];
  orphanHooks: HookInfo[];
  duplicateHooks: string[];
  hardcodedUrls: FrontendApiEndpoint[];
}

export function analyzeFrontendApis(services: FrontendApiEndpoint[], hooks: HookInfo[]): AnalysisResults {
  const mergedEndpoints: FrontendApiEndpoint[] = [...services];
  const unusedServices = new Set(services.map(s => s.service));
  const orphanHooks: HookInfo[] = [];
  const hookNameCount: Record<string, number> = {};
  
  for (const hook of hooks) {
    hookNameCount[hook.hookName] = (hookNameCount[hook.hookName] || 0) + 1;
    
    // Attempt to link hook to a service based on matching keywords in files or by name heuristics
    // In a real advanced static analysis, we would trace the imported functions.
    // Here we will use a basic mapping: useUsers -> UsersService
    const possibleServiceNameMatch = hook.hookName.replace(/^use/, '') + 'Service';
    let matched = false;
    
    for (const ep of mergedEndpoints) {
      if (ep.service.toLowerCase().includes(hook.hookName.replace(/^use/, '').toLowerCase()) || ep.service === possibleServiceNameMatch) {
        ep.hook = hook.hookName;
        ep.queryKey = hook.queryKey;
        ep.mutationName = hook.mutationName;
        unusedServices.delete(ep.service);
        matched = true;
      }
    }
    
    if (!matched) {
      orphanHooks.push(hook);
    }
  }

  const duplicateHooks = Object.keys(hookNameCount).filter(k => hookNameCount[k] > 1);

  const hardcodedUrls = mergedEndpoints.filter(ep => {
    // Flag if URL doesn't look like an imported constant (e.g. starts with '/' instead of API_ENDPOINTS)
    return ep.url.startsWith('/') || ep.url.startsWith('http');
  });

  return {
    endpoints: mergedEndpoints,
    unusedServices: Array.from(unusedServices),
    orphanHooks,
    duplicateHooks,
    hardcodedUrls
  };
}
