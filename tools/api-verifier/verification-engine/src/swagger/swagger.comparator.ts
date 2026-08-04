import { BackendEndpoint, FrontendEndpoint, SwaggerEndpoint, SwaggerReport, SwaggerReportRow } from '../types';

export class SwaggerComparator {
  
  public compare(
    swaggerEndpoints: SwaggerEndpoint[], 
    backendEndpoints: BackendEndpoint[], 
    frontendEndpoints: FrontendEndpoint[]
  ): SwaggerReport {
    
    const matrix: SwaggerReportRow[] = [];
    let missingInBackend = 0;
    let missingInSwagger = 0;
    let missingInFrontend = 0;
    let mismatches = 0;

    const normalizeUrl = (url: string) => {
      return url
        .replace(/^\/?api/, '')
        .replace(/^\//, '')
        .replace(/\/:[a-zA-Z0-9_]+/g, '/{param}')
        .replace(/\/\$\{[a-zA-Z0-9_]+\}/g, '/{param}')
        .replace(/\{[a-zA-Z0-9_]+\}/g, '{param}')
        .toLowerCase();
    };

    const backendMatched = new Set<string>();
    const frontendMatched = new Set<string>();

    // 1. Iterate over Swagger (The Source of Truth)
    for (const sw of swaggerEndpoints) {
      const swUrl = normalizeUrl(sw.path);
      const method = sw.method;
      
      const be = backendEndpoints.find(b => normalizeUrl(b.fullPath) === swUrl && b.method.toUpperCase() === method);
      const fe = frontendEndpoints.find(f => normalizeUrl(f.url) === swUrl && f.method.toUpperCase() === method);

      const issues: string[] = [];

      if (!be) {
        issues.push(`Missing in Backend code (AST)`);
        missingInBackend++;
      } else {
        backendMatched.add(normalizeUrl(be.fullPath) + be.method);
      }

      if (!fe) {
        issues.push(`Missing in Frontend hooks`);
        missingInFrontend++;
      } else {
        frontendMatched.add(normalizeUrl(fe.url) + fe.method);
      }

      // Check schemas if matched
      if (be && sw.requestBodySchema && be.dto && !be.dto.includes(sw.requestBodySchema)) {
         // This is a rough check, DTO names can be nested
         issues.push(`Schema Mismatch: Swagger expects ${sw.requestBodySchema}, AST says ${be.dto}`);
      }
      
      if (fe && sw.requestBodySchema && fe.requestDto && fe.requestDto !== 'InlineObject' && !fe.requestDto.includes(sw.requestBodySchema)) {
         issues.push(`Frontend DTO Mismatch: Swagger expects ${sw.requestBodySchema}, Frontend sends ${fe.requestDto}`);
      }

      if (be && sw.isProtected && be.guards.length === 0) {
        issues.push(`Auth Mismatch: Swagger marks protected, AST found no guards.`);
      }

      let result: any = 'MATCH';
      if (!be) result = 'MISSING_IN_BACKEND';
      else if (!fe) result = 'MISSING_IN_FRONTEND';
      else if (issues.length > 0) result = 'MISMATCH';

      if (result === 'MISMATCH') mismatches++;

      matrix.push({
        swaggerEndpoint: sw,
        backendEndpoint: be,
        frontendEndpoint: fe,
        result,
        issues
      });
    }

    // 2. Find Backend endpoints missing in Swagger
    for (const be of backendEndpoints) {
      const key = normalizeUrl(be.fullPath) + be.method;
      if (!backendMatched.has(key)) {
        missingInSwagger++;
        matrix.push({
          backendEndpoint: be,
          result: 'MISSING_IN_SWAGGER',
          issues: ['Found in Backend AST, but missing from live Swagger Spec']
        });
      }
    }

    // 3. Find Frontend endpoints missing in Swagger
    for (const fe of frontendEndpoints) {
      const key = normalizeUrl(fe.url) + fe.method;
      if (!frontendMatched.has(key)) {
        // Did it match a backend one but just miss swagger?
        if (!matrix.find(m => m.frontendEndpoint === fe)) {
          missingInSwagger++;
          matrix.push({
            frontendEndpoint: fe,
            result: 'MISSING_IN_SWAGGER',
            issues: ['Frontend is calling this, but it is not in the live Swagger Spec']
          });
        }
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalSwagger: swaggerEndpoints.length,
        totalBackend: backendEndpoints.length,
        totalFrontend: frontendEndpoints.length,
        missingInSwagger,
        missingInBackend,
        missingInFrontend,
        mismatches
      },
      matrix
    };
  }
}
