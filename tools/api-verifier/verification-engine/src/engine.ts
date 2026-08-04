import { BackendEndpoint, FrontendEndpoint, VerificationReport, ComparisonRow } from './types';

export class ApiVerificationEngine {
  
  public verify(backendData: any, frontendData: any): VerificationReport {
    const backendEndpoints: BackendEndpoint[] = backendData.controllers 
      ? Object.values(backendData.controllers).flat() as BackendEndpoint[]
      : [];
    const frontendEndpoints: FrontendEndpoint[] = (frontendData.endpoints || []).filter((endpoint: FrontendEndpoint) => {
      const url = endpoint.url || '';
      return typeof url === 'string' && url !== 'unknown' && url !== 'path' && !url.startsWith('${this.basePath}') && !url.startsWith('this.basePath');
    });
    const duplicateHooks = frontendData.qualityIssues?.duplicateHooks || [];

    const matrix: ComparisonRow[] = [];
    const p0Errors: ComparisonRow[] = [];
    const p1Errors: ComparisonRow[] = [];
    const p2Errors: ComparisonRow[] = [];
    const deadEndpoints: BackendEndpoint[] = [];
    
    let matches = 0;
    let missingApis = 0;
    let incorrectUrls = 0;
    let incorrectMethods = 0;
    let dtoMismatches = 0;

    // Normalize URLs for comparison
    const normalizeUrl = (url: string) => {
      if (!url) return '';
      return url
        .replace(/^\/?api/, '')
        .replace(/^\//, '')
        .replace(/\/:[a-zA-Z0-9_]+/g, '/{param}')
        .replace(/\/\$\{[a-zA-Z0-9_]+\}/g, '/{param}')
        .replace(/\{[a-zA-Z0-9_]+\}/g, '{param}')
        .replace(/\/\d+(?=\/|$)/g, '/{param}')
        .toLowerCase();
    };

    const frontendMatched = new Set<string>();

    for (const be of backendEndpoints) {
      const bUrl = normalizeUrl(be.fullPath);
      let matchedFe: FrontendEndpoint | undefined;
      
      for (const fe of frontendEndpoints) {
        const fUrl = normalizeUrl(fe.url);
        if (bUrl === fUrl && be.method.toUpperCase() === fe.method.toUpperCase()) {
          matchedFe = fe;
          frontendMatched.add(fUrl + fe.method);
          break;
        }
      }

      if (!matchedFe) {
        // Did we match URL but wrong method?
        const wrongMethodFe = frontendEndpoints.find(fe => normalizeUrl(fe.url) === bUrl);
        if (wrongMethodFe) {
          incorrectMethods++;
          const row: ComparisonRow = {
            module: be.module,
            backendUrl: be.fullPath,
            frontendUrl: wrongMethodFe.url,
            method: `${be.method} vs ${wrongMethodFe.method}`,
            result: 'MISMATCH',
            issues: ['P1: Wrong Method'],
            backendEndpoint: be,
            frontendEndpoint: wrongMethodFe
          };
          matrix.push(row);
          p1Errors.push(row);
          frontendMatched.add(normalizeUrl(wrongMethodFe.url) + wrongMethodFe.method);
        } else {
          missingApis++;
          deadEndpoints.push(be);
          const row: ComparisonRow = {
            module: be.module,
            backendUrl: be.fullPath,
            frontendUrl: '-',
            method: be.method,
            result: 'MISSING_FRONTEND',
            issues: ['P3: Missing Frontend Implementation'],
            backendEndpoint: be
          };
          matrix.push(row);
        }
      } else {
        // Matched successfully, check DTOs
        const issues: string[] = [];
        let isP2 = false;

        // Basic DTO name checking - often they don't match perfectly, so we just flag it
        if (be.dto && matchedFe.requestDto && be.dto !== matchedFe.requestDto && matchedFe.requestDto !== 'InlineObject') {
          issues.push(`P2: Req DTO mismatch (${be.dto} vs ${matchedFe.requestDto})`);
          isP2 = true;
          dtoMismatches++;
        }

        if (be.response && matchedFe.responseDto && be.response !== matchedFe.responseDto) {
          issues.push(`P2: Res DTO mismatch (${be.response} vs ${matchedFe.responseDto})`);
          isP2 = true;
          dtoMismatches++;
        }

        const row: ComparisonRow = {
          module: be.module,
          backendUrl: be.fullPath,
          frontendUrl: matchedFe.url,
          method: be.method,
          result: issues.length === 0 ? 'MATCH' : 'MISMATCH',
          issues,
          backendEndpoint: be,
          frontendEndpoint: matchedFe
        };

        if (issues.length === 0) {
          matches++;
        } else if (isP2) {
          p2Errors.push(row);
        }

        matrix.push(row);
      }
    }

    // Find frontend endpoints that have no backend equivalent
    for (const fe of frontendEndpoints) {
      const key = normalizeUrl(fe.url) + fe.method.toUpperCase();
      if (!frontendMatched.has(key)) {
        incorrectUrls++;
        const row: ComparisonRow = {
          module: fe.service,
          backendUrl: '-',
          frontendUrl: fe.url,
          method: fe.method,
          result: 'MISSING_BACKEND',
          issues: ['P0: Missing Backend Endpoint'],
          frontendEndpoint: fe
        };
        matrix.push(row);
        p0Errors.push(row);
      }
    }

    const totalApis = Math.max(backendEndpoints.length, frontendEndpoints.length);
    const coverage = totalApis > 0 ? ((matches / totalApis) * 100).toFixed(1) : '0.0';

    return {
      scannedAt: new Date().toISOString(),
      summary: {
        totalBackendApis: backendEndpoints.length,
        totalFrontendApis: frontendEndpoints.length,
        matches,
        missingApis,
        incorrectUrls,
        incorrectMethods,
        dtoMismatches,
        duplicateHooks: duplicateHooks.length,
        coveragePercent: coverage,
        overallResult: (p0Errors.length === 0 && p1Errors.length === 0) ? 'PASS' : 'FAIL'
      },
      matrix,
      p0Errors,
      p1Errors,
      p2Errors,
      deadEndpoints,
      duplicateEndpoints: duplicateHooks
    };
  }
}
