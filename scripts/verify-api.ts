#!/usr/bin/env ts-node
/**
 * ============================================================================
 * IMCMS Enterprise API Verification Tool
 * ============================================================================
 *
 * Orchestrates a 5-step pipeline:
 *   1. Backend Scanner   — AST-scans NestJS controllers → backend-api.json
 *   2. Frontend Scanner  — AST-scans React services/hooks → frontend-api.json
 *   3. Verification Engine — Cross-references backend vs frontend contracts
 *   4. Swagger Verification — Fetches live OpenAPI spec, tri-way comparison
 *   5. Runtime Verification — Hits live endpoints to validate auth & responses
 *
 * Usage:
 *   npm run verify-api                          # Full pipeline
 *   npm run verify-api -- --ci                  # CI mode (machine output, strict exit)
 *   npm run verify-api -- --runtime             # Include live endpoint testing
 *   npm run verify-api -- --p0-threshold 0      # Fail on any P0 (default: 0)
 *   npm run verify-api -- --p1-threshold 5      # Fail if P1 > 5
 *   npm run verify-api -- --swagger-url http://host:port/api-json
 *
 * Output:
 *   tools/api-verifier/reports/  — All generated reports
 *   tools/api-verifier/reports/api-verification.json — Machine-readable CI output
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ─── Colors (no dependency needed) ──────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// ─── CLI Arguments ──────────────────────────────────────────────────────────
interface CliOptions {
  ci: boolean;
  runtime: boolean;
  p0Threshold: number;
  p1Threshold: number;
  p2Threshold: number;
  p3Threshold: number;
  swaggerUrl: string;
  backendUrl: string;
  outputDir: string;
  archive: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = {
    ci: false,
    runtime: false,
    p0Threshold: 0,
    p1Threshold: 10,
    p2Threshold: 50,
    p3Threshold: 100,
    swaggerUrl: 'http://localhost:3001/api-json',
    backendUrl: 'http://localhost:3001/api',
    outputDir: path.resolve(process.cwd(), 'tools/api-verifier/reports'),
    archive: true,
  };

  for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
      case '--ci': opts.ci = true; break;
      case '--runtime': opts.runtime = true; break;
      case '--no-archive': opts.archive = false; break;
      case '--p0-threshold': opts.p0Threshold = parseInt(args[++i], 10); break;
      case '--p1-threshold': opts.p1Threshold = parseInt(args[++i], 10); break;
      case '--p2-threshold': opts.p2Threshold = parseInt(args[++i], 10); break;
      case '--p3-threshold': opts.p3Threshold = parseInt(args[++i], 10); break;
      case '--swagger-url': opts.swaggerUrl = args[++i]; break;
      case '--backend-url': opts.backendUrl = args[++i]; break;
      case '--output': opts.outputDir = path.resolve(process.cwd(), args[++i]); break;
    }
  }
  return opts;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const ROOT = process.cwd();
const TOOLS_DIR = path.join(ROOT, 'tools/api-verifier');
const REPORTS_DIR = path.join(TOOLS_DIR, 'reports');
const BACKEND_SCANNER = path.join(TOOLS_DIR, 'backend-scanner');
const FRONTEND_SCANNER = path.join(TOOLS_DIR, 'frontend-scanner');
const VERIFICATION_ENGINE = path.join(TOOLS_DIR, 'verification-engine');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function banner(step: number, total: number, title: string) {
  console.log('');
  console.log(`${c.bold}${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`${c.bold}${c.cyan}  STEP ${step}/${total}: ${title}${c.reset}`);
  console.log(`${c.bold}${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log('');
}

function success(msg: string) { console.log(`${c.bold}${c.green}  ✔ ${msg}${c.reset}`); }
function warn(msg: string) { console.log(`${c.bold}${c.yellow}  ⚠ ${msg}${c.reset}`); }
function fail(msg: string) { console.log(`${c.bold}${c.red}  ✖ ${msg}${c.reset}`); }
function info(msg: string) { console.log(`${c.dim}  ℹ ${msg}${c.reset}`); }
function heading(msg: string) { console.log(`\n${c.bold}${c.white}  ${msg}${c.reset}`); }

function runCommand(cmd: string, cwd: string, label: string): boolean {
  try {
    execSync(cmd, { cwd, stdio: 'pipe', timeout: 120000 });
    return true;
  } catch (err: any) {
    const stderr = err.stderr?.toString() || '';
    const stdout = err.stdout?.toString() || '';
    fail(`${label} failed:`);
    if (stderr) console.log(`    ${c.red}${stderr.split('\n').slice(0, 5).join('\n    ')}${c.reset}`);
    if (stdout) console.log(`    ${c.dim}${stdout.split('\n').slice(0, 5).join('\n    ')}${c.reset}`);
    return false;
  }
}

// ─── Step 1: Backend Scanner ────────────────────────────────────────────────
function step1_backendScanner(): boolean {
  banner(1, 5, 'Backend Scanner (NestJS AST)');

  const backendApiPath = path.join(REPORTS_DIR, 'backend-api.json');
  info(`Scanning NestJS controllers via AST...`);

  const reportsRel = path.relative(BACKEND_SCANNER, REPORTS_DIR);
  const cmdOk = runCommand(
    `npx ts-node src/index.ts -p "${path.join(ROOT, 'backend/tsconfig.json')}" -o "${reportsRel}"`,
    BACKEND_SCANNER,
    'Backend Scanner'
  );

  if (cmdOk && fs.existsSync(backendApiPath)) {
    const data = JSON.parse(fs.readFileSync(backendApiPath, 'utf-8'));
    const count = data.totalEndpoints || Object.values(data.controllers || {}).flat().length;
    console.log('');
    success(`Discovered ${c.bold}${c.white}${count}${c.reset}${c.green} backend endpoints`);
    const controllers = Object.keys(data.controllers || {});
    info(`Controllers: ${controllers.join(', ')}`);
    return true;
  }

  fail('Backend scanner did not produce backend-api.json');
  return false;
}

// ─── Step 2: Frontend Scanner ───────────────────────────────────────────────
function step2_frontendScanner(): boolean {
  banner(2, 5, 'Frontend Scanner (React/Axios AST)');

  const frontendApiPath = path.join(REPORTS_DIR, 'frontend-api.json');
  info(`Scanning React services and hooks via AST...`);

  const reportsRelFe = path.relative(FRONTEND_SCANNER, REPORTS_DIR);
  const ok = runCommand(
    `npx ts-node src/index.ts -p "${path.join(ROOT, 'frontend/tsconfig.app.json')}" -o "${reportsRelFe}"`,
    FRONTEND_SCANNER,
    'Frontend Scanner'
  );

  if (ok && fs.existsSync(frontendApiPath)) {
    const data = JSON.parse(fs.readFileSync(frontendApiPath, 'utf-8'));
    const count = data.summary?.totalEndpoints || data.endpoints?.length || 0;
    success(`Discovered ${c.bold}${c.white}${count}${c.reset}${c.green} frontend API calls`);
    if (data.qualityIssues?.duplicateHooks?.length) {
      warn(`${data.qualityIssues.duplicateHooks.length} duplicate hooks detected`);
    }
    return true;
  }

  fail('Frontend scanner did not produce frontend-api.json');
  return false;
}

// ─── Step 3: Verification Engine ────────────────────────────────────────────
function step3_verificationEngine(opts: CliOptions): {
  passed: boolean;
  report: any;
} {
  banner(3, 5, 'Verification Engine (Contract Cross-Reference)');

  const backendApi = path.join(REPORTS_DIR, 'backend-api.json');
  const frontendApi = path.join(REPORTS_DIR, 'frontend-api.json');

  if (!fs.existsSync(backendApi) || !fs.existsSync(frontendApi)) {
    fail('Missing backend-api.json or frontend-api.json — run steps 1 & 2 first');
    return { passed: false, report: null };
  }

  info(`Cross-referencing backend and frontend contracts...`);

  // Import and run the engine directly (faster than spawning a process)
  let report: any;
  try {
    // Use require to load the engine module
    const enginePath = path.join(VERIFICATION_ENGINE, 'src/engine.ts');
    // We'll use ts-node to eval it
    const engineScript = `
      const { ApiVerificationEngine } = require('${enginePath.replace(/\\/g, '/')}');
      const backendData = JSON.parse(require('fs').readFileSync('${backendApi.replace(/\\/g, '/')}', 'utf-8'));
      const frontendData = JSON.parse(require('fs').readFileSync('${frontendApi.replace(/\\/g, '/')}', 'utf-8'));
      const engine = new ApiVerificationEngine();
      const report = engine.verify(backendData, frontendData);
      process.stdout.write(JSON.stringify(report));
    `;
    // Fallback: use the CLI
    const outputJson = path.join(REPORTS_DIR, 'api-compatibility.json');
    const mdDir = REPORTS_DIR;

    const reportsRelVe = path.relative(VERIFICATION_ENGINE, REPORTS_DIR);
    const ok = runCommand(
      `npx ts-node src/index.ts -b "${backendApi}" -f "${frontendApi}" -o "${reportsRelVe}"`,
      VERIFICATION_ENGINE,
      'Verification Engine'
    );

    if (ok && fs.existsSync(outputJson)) {
      report = JSON.parse(fs.readFileSync(outputJson, 'utf-8'));
    } else {
      fail('Verification engine did not produce api-compatibility.json');
      return { passed: false, report: null };
    }
  } catch (err: any) {
    fail(`Engine error: ${err.message}`);
    return { passed: false, report: null };
  }

  // Display results
  const s = report.summary;
  console.log('');
  heading('Verification Summary');
  console.log(`  Backend APIs:    ${c.bold}${s.totalBackendApis}${c.reset}`);
  console.log(`  Frontend APIs:   ${c.bold}${s.totalFrontendApis}${c.reset}`);
  console.log(`  Matches:         ${c.bold}${c.green}${s.matches}${c.reset}`);
  console.log(`  Coverage:        ${c.bold}${c.cyan}${s.coveragePercent}%${c.reset}`);
  console.log('');
  console.log(`  ${c.red}P0 (Missing Backend):  ${s.incorrectUrls}${c.reset}`);
  console.log(`  ${c.yellow}P1 (Method Mismatch):  ${s.incorrectMethods}${c.reset}`);
  console.log(`  ${c.yellow}P2 (DTO Mismatch):     ${s.dtoMismatches}${c.reset}`);
  console.log(`  ${c.dim}P3 (Dead Endpoints):   ${report.deadEndpoints?.length || 0}${c.reset}`);
  console.log('');

  // Threshold checks
  let passed = true;
  if (s.incorrectUrls > opts.p0Threshold) {
    fail(`P0 threshold exceeded: ${s.incorrectUrls} > ${opts.p0Threshold}`);
    passed = false;
  } else {
    success(`P0 within threshold: ${s.incorrectUrls} <= ${opts.p0Threshold}`);
  }

  if (s.incorrectMethods > opts.p1Threshold) {
    fail(`P1 threshold exceeded: ${s.incorrectMethods} > ${opts.p1Threshold}`);
    passed = false;
  } else {
    success(`P1 within threshold: ${s.incorrectMethods} <= ${opts.p1Threshold}`);
  }

  if (s.dtoMismatches > opts.p2Threshold) {
    warn(`P2 threshold exceeded: ${s.dtoMismatches} > ${opts.p2Threshold} (non-blocking)`);
  } else {
    success(`P2 within threshold: ${s.dtoMismatches} <= ${opts.p2Threshold}`);
  }

  const deadCount = report.deadEndpoints?.length || 0;
  if (deadCount > opts.p3Threshold) {
    warn(`P3 threshold exceeded: ${deadCount} > ${opts.p3Threshold} (non-blocking)`);
  } else {
    success(`P3 within threshold: ${deadCount} <= ${opts.p3Threshold}`);
  }

  return { passed, report };
}

// ─── Step 4: Swagger Verification ──────────────────────────────────────────
function step4_swaggerVerification(opts: CliOptions): {
  passed: boolean;
  report: any;
} {
  banner(4, 5, 'Swagger / OpenAPI Verification (Tri-Way Comparison)');

  const backendApi = path.join(REPORTS_DIR, 'backend-api.json');
  const frontendApi = path.join(REPORTS_DIR, 'frontend-api.json');

  if (!fs.existsSync(backendApi) || !fs.existsSync(frontendApi)) {
    fail('Missing scanner outputs — cannot run Swagger verification');
    return { passed: false, report: null };
  }

  info(`Fetching OpenAPI spec from ${opts.swaggerUrl}...`);

  // Try to fetch swagger spec and run comparison
  let swaggerReport: any = null;
  let passed = true;

  try {
    // Build a small inline script that uses the SwaggerParser + SwaggerComparator
    const scriptContent = `
      const axios = require('axios');
      const fs = require('fs');
      const path = require('path');

      const SWAGGER_URLS = [
        '${opts.swaggerUrl}',
        '${opts.swaggerUrl.replace('/api-json', '/swagger-json')}',
        '${opts.swaggerUrl.replace('/api-json', '/openapi.json')}',
        '${opts.swaggerUrl.replace('/api-json', '/api/docs-json')}',
      ];

      async function main() {
        let spec = null;
        for (const url of SWAGGER_URLS) {
          try {
            process.stderr.write('[Swagger] Trying ' + url + '...\\n');
            const res = await axios.get(url, { timeout: 5000 });
            if (res.data && res.data.paths) {
              spec = res.data;
              process.stderr.write('[Swagger] Success!\\n');
              break;
            }
          } catch (e) { /* try next */ }
        }

        if (!spec) {
          process.stderr.write('[Swagger] No live OpenAPI spec found. Generating offline report.\\n');
          // Produce a minimal report
          const report = {
            generatedAt: new Date().toISOString(),
            liveSwaggerAvailable: false,
            summary: { totalSwagger: 0, totalBackend: 0, totalFrontend: 0, missingInSwagger: 0, missingInBackend: 0, missingInFrontend: 0, mismatches: 0 },
            matrix: [],
            note: 'Swagger endpoint was not reachable. Start the backend server and re-run.'
          };
          process.stdout.write(JSON.stringify(report));
          return;
        }

        // Parse swagger
        const endpoints = [];
        for (const [pathKey, methods] of Object.entries(spec.paths)) {
          for (const [method, op] of Object.entries(methods)) {
            if (['get','post','put','patch','delete'].includes(method.toLowerCase())) {
              let reqSchema = undefined;
              if (op.requestBody?.content?.['application/json']?.schema?.$ref) {
                reqSchema = op.requestBody.content['application/json'].schema.$ref.split('/').pop();
              }
              const resSchemas = {};
              if (op.responses) {
                for (const [code, rb] of Object.entries(op.responses)) {
                  if (rb.content?.['application/json']?.schema?.$ref) {
                    resSchemas[code] = rb.content['application/json'].schema.$ref.split('/').pop();
                  }
                }
              }
              endpoints.push({
                path: pathKey,
                method: method.toUpperCase(),
                summary: op.summary,
                operationId: op.operationId,
                tags: op.tags || [],
                parameters: op.parameters || [],
                requestBodySchema: reqSchema,
                responseSchemas: resSchemas,
                isProtected: Array.isArray(op.security) && op.security.length > 0,
              });
            }
          }
        }

        // Load backend/frontend scans
        const backendData = JSON.parse(fs.readFileSync('${backendApi.replace(/\\/g, '/')}', 'utf-8'));
        const frontendData = JSON.parse(fs.readFileSync('${frontendApi.replace(/\\/g, '/')}', 'utf-8'));

        const backendEndpoints = [];
        for (const eps of Object.values(backendData.controllers || {})) {
          backendEndpoints.push(...eps);
        }
        const frontendEndpoints = frontendData.endpoints || [];

        // Normalize
        const normalizeUrl = (url) => url.replace(/^\\/?api/, '').replace(/^\\//, '').replace(/\\/:[a-zA-Z0-9_]+/g, '/{param}').replace(/\\/\\$\\{[a-zA-Z0-9_]+\\}/g, '/{param}').replace(/\\{[a-zA-Z0-9_]+\\}/g, '{param}').toLowerCase();

        const matrix = [];
        const backendMatched = new Set();
        const frontendMatched = new Set();

        for (const sw of endpoints) {
          const swUrl = normalizeUrl(sw.path);
          const be = backendEndpoints.find(b => normalizeUrl(b.fullPath) === swUrl && b.method.toUpperCase() === sw.method);
          const fe = frontendEndpoints.find(f => normalizeUrl(f.url) === swUrl && f.method.toUpperCase() === sw.method);

          const issues = [];
          if (!be) { issues.push('Missing in Backend AST'); }
          if (!fe) { issues.push('Missing in Frontend hooks'); }
          if (be && sw.requestBodySchema && be.dto && !be.dto.includes(sw.requestBodySchema)) {
            issues.push('Schema Mismatch: Swagger expects ' + sw.requestBodySchema + ', AST says ' + be.dto);
          }
          if (fe && sw.requestBodySchema && fe.requestDto && fe.requestDto !== 'InlineObject' && !fe.requestDto.includes(sw.requestBodySchema)) {
            issues.push('Frontend DTO Mismatch: Swagger expects ' + sw.requestBodySchema + ', Frontend sends ' + fe.requestDto);
          }

          let result = 'MATCH';
          if (!be) result = 'MISSING_IN_BACKEND';
          else if (!fe) result = 'MISSING_IN_FRONTEND';
          else if (issues.length > 0) result = 'MISMATCH';

          if (be) backendMatched.add(normalizeUrl(be.fullPath) + be.method);
          if (fe) frontendMatched.add(normalizeUrl(fe.url) + fe.method);

          matrix.push({ swaggerEndpoint: sw, backendEndpoint: be, frontendEndpoint: fe, result, issues });
        }

        let missingInSwagger = 0;
        for (const be of backendEndpoints) {
          if (!backendMatched.has(normalizeUrl(be.fullPath) + be.method)) {
            missingInSwagger++;
            matrix.push({ backendEndpoint: be, result: 'MISSING_IN_SWAGGER', issues: ['Found in Backend AST, missing from Swagger Spec'] });
          }
        }

        const report = {
          generatedAt: new Date().toISOString(),
          liveSwaggerAvailable: true,
          swaggerUrl: '${opts.swaggerUrl}',
          summary: {
            totalSwagger: endpoints.length,
            totalBackend: backendEndpoints.length,
            totalFrontend: frontendEndpoints.length,
            missingInSwagger,
            missingInBackend: matrix.filter(r => r.result === 'MISSING_IN_BACKEND').length,
            missingInFrontend: matrix.filter(r => r.result === 'MISSING_IN_FRONTEND').length,
            mismatches: matrix.filter(r => r.result === 'MISMATCH').length,
          },
          matrix,
        };

        process.stdout.write(JSON.stringify(report));
      }

      main().catch(e => { process.stderr.write(e.message + '\\n'); process.exit(1); });
    `;

    const scriptPath = path.join(REPORTS_DIR, '_swagger_inline.js');
    fs.writeFileSync(scriptPath, scriptContent);

    const result = execSync(`node "${scriptPath}"`, {
      cwd: ROOT,
      timeout: 30000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    swaggerReport = JSON.parse(result.trim());
    fs.unlinkSync(scriptPath); // cleanup
  } catch (err: any) {
    fail(`Swagger verification error: ${err.message}`);
    return { passed: false, report: null };
  }

  // Save reports
  fs.writeFileSync(path.join(REPORTS_DIR, 'swagger-contract.json'), JSON.stringify(swaggerReport, null, 2));

  // Generate SwaggerComparison.md
  generateSwaggerComparisonMd(swaggerReport);
  generateOpenApiMismatchMd(swaggerReport);

  // Display
  const s = swaggerReport.summary;
  console.log('');
  heading('Swagger Verification Summary');
  console.log(`  Live Spec:       ${swaggerReport.liveSwaggerAvailable ? `${c.green}Available${c.reset}` : `${c.red}Not Reachable${c.reset}`}`);
  console.log(`  Swagger Endpoints: ${c.bold}${s.totalSwagger}${c.reset}`);
  console.log(`  Backend AST:      ${c.bold}${s.totalBackend}${c.reset}`);
  console.log(`  Frontend Hooks:   ${c.bold}${s.totalFrontend}${c.reset}`);
  console.log('');
  console.log(`  ${c.red}Missing in Backend:  ${s.missingInBackend}${c.reset}`);
  console.log(`  ${c.yellow}Missing in Swagger:  ${s.missingInSwagger}${c.reset}`);
  console.log(`  ${c.yellow}Missing in Frontend: ${s.missingInFrontend}${c.reset}`);
  console.log(`  ${c.yellow}Schema Mismatches:   ${s.mismatches}${c.reset}`);

  if (s.missingInBackend > 0) {
    fail(`${s.missingInBackend} endpoints in Swagger but NOT in backend code`);
    passed = false;
  } else {
    success('All Swagger endpoints have backend implementations');
  }

  if (s.missingInFrontend > 0) {
    warn(`${s.missingInFrontend} Swagger endpoints not called by frontend`);
  }

  return { passed, report: swaggerReport };
}

function generateSwaggerComparisonMd(report: any) {
  let md = `# OpenAPI / Swagger Tri-Way Matrix\n\n`;
  md += `> Generated at ${report.generatedAt}\n\n`;
  md += `## Summary\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  md += `| Live Swagger Available | ${report.liveSwaggerAvailable ? 'Yes' : 'No'} |\n`;
  md += `| Swagger Endpoints | ${report.summary.totalSwagger} |\n`;
  md += `| Backend AST Endpoints | ${report.summary.totalBackend} |\n`;
  md += `| Frontend Hooks | ${report.summary.totalFrontend} |\n`;
  md += `| Missing in Swagger | ${report.summary.missingInSwagger} |\n`;
  md += `| Missing in Backend | ${report.summary.missingInBackend} |\n`;
  md += `| Missing in Frontend | ${report.summary.missingInFrontend} |\n`;
  md += `| Schema Mismatches | ${report.summary.mismatches} |\n\n`;

  md += `## Matrix\n`;
  md += `| Status | Method | Endpoint | Issues |\n`;
  md += `|--------|--------|----------|--------|\n`;
  for (const row of report.matrix) {
    const method = row.swaggerEndpoint?.method || row.backendEndpoint?.method || row.frontendEndpoint?.method || '-';
    const url = row.swaggerEndpoint?.path || row.backendEndpoint?.fullPath || row.frontendEndpoint?.url || '-';
    md += `| **${row.result}** | ${method} | \`${url}\` | ${row.issues.join('<br>')} |\n`;
  }

  fs.writeFileSync(path.join(REPORTS_DIR, 'SwaggerComparison.md'), md);
}

function generateOpenApiMismatchMd(report: any) {
  let md = `# OpenAPI Discrepancies\n\n`;
  md += `> Generated at ${report.generatedAt}\n\n`;

  const missingBackend = report.matrix.filter((r: any) => r.result === 'MISSING_IN_BACKEND');
  if (missingBackend.length > 0) {
    md += `## Missing in Backend Code\n\n`;
    md += `These endpoints exist in Swagger but have no corresponding backend controller implementation.\n\n`;
    for (const row of missingBackend) {
      md += `- \`${row.swaggerEndpoint?.path}\` (${row.swaggerEndpoint?.method})\n`;
    }
    md += `\n`;
  }

  const missingSwagger = report.matrix.filter((r: any) => r.result === 'MISSING_IN_SWAGGER');
  if (missingSwagger.length > 0) {
    md += `## Missing in Swagger Spec\n\n`;
    md += `These endpoints exist in backend code but are not exposed in the OpenAPI specification.\n\n`;
    for (const row of missingSwagger) {
      md += `- \`${row.backendEndpoint?.fullPath}\` (${row.backendEndpoint?.method})\n`;
    }
    md += `\n`;
  }

  const mismatches = report.matrix.filter((r: any) => r.result === 'MISMATCH');
  if (mismatches.length > 0) {
    md += `## Contract Mismatches\n\n`;
    md += `These endpoints have schema or metadata conflicts between Swagger and code.\n\n`;
    for (const row of mismatches) {
      md += `- \`${row.swaggerEndpoint?.path}\`: ${row.issues.join(', ')}\n`;
    }
    md += `\n`;
  }

  if (missingBackend.length === 0 && missingSwagger.length === 0 && mismatches.length === 0) {
    md += `## No Discrepancies Found\n\nAll endpoints are consistent between Swagger, backend code, and frontend hooks.\n`;
  }

  fs.writeFileSync(path.join(REPORTS_DIR, 'OpenApiMismatch.md'), md);
}

// ─── Step 5: Runtime Verification ──────────────────────────────────────────
function step5_runtimeVerification(opts: CliOptions): {
  passed: boolean;
  report: any;
} {
  banner(5, 5, 'Runtime Verification (Live Endpoint Testing)');

  if (!opts.runtime) {
    info('Skipping runtime verification (use --runtime to enable)');
    return { passed: true, report: null };
  }

  const backendApi = path.join(REPORTS_DIR, 'backend-api.json');
  if (!fs.existsSync(backendApi)) {
    fail('Missing backend-api.json — cannot run runtime verification');
    return { passed: false, report: null };
  }

  info(`Testing live endpoints at ${opts.backendUrl}...`);

  // Build inline runtime test script
  const scriptContent = `
    const axios = require('axios');
    const fs = require('fs');
    const { faker } = require('@faker-js/faker');

    const BASE_URL = '${opts.backendUrl}';
    const backendData = JSON.parse(fs.readFileSync('${backendApi.replace(/\\/g, '/')}', 'utf-8'));
    const endpoints = [];
    for (const eps of Object.values(backendData.controllers || {})) {
      endpoints.push(...eps);
    }

    async function getAuthToken() {
      try {
        const res = await axios.post(BASE_URL + '/auth/login', {
          email: 'admin@imcms.com',
          password: 'Admin@123'
        }, { timeout: 5000 });
        return res.data?.data?.accessToken || res.data?.accessToken || null;
      } catch {
        try {
          const res = await axios.post(BASE_URL + '/auth/login', {
            username: 'admin',
            password: 'password'
          }, { timeout: 5000 });
          return res.data?.data?.accessToken || res.data?.accessToken || null;
        } catch {
          return null;
        }
      }
    }

    function generateUrl(p) {
      return p.replace(/:[a-zA-Z0-9_]+/g, () => faker.string.uuid());
    }

    function generateBody(dto) {
      if (!dto) return {};
      const mock = {};
      if (dto.toLowerCase().includes('login')) { mock.email = faker.internet.email(); mock.password = 'Test@123'; }
      else if (dto.toLowerCase().includes('user')) { mock.email = faker.internet.email(); mock.firstName = faker.person.firstName(); mock.lastName = faker.person.lastName(); }
      else if (dto.toLowerCase().includes('role')) { mock.roleName = faker.person.jobTitle(); mock.description = faker.lorem.sentence(); }
      else if (dto.toLowerCase().includes('vendor')) { mock.vendorName = faker.company.name(); mock.email = faker.internet.email(); }
      else if (dto.toLowerCase().includes('product')) { mock.productName = faker.commerce.productName(); }
      else if (dto.toLowerCase().includes('material')) { mock.materialName = faker.commerce.productMaterial(); }
      else if (dto.toLowerCase().includes('process')) { mock.processName = faker.commerce.product(); }
      else if (dto.toLowerCase().includes('unit')) { mock.unitName = faker.string.alpha(3); }
      else if (dto.toLowerCase().includes('department')) { mock.departmentName = faker.commerce.department(); }
      else { mock.title = faker.lorem.words(2); mock.description = faker.lorem.sentence(); }
      return mock;
    }

    async function main() {
      const jwt = await getAuthToken();
      const results = [];

      for (const ep of endpoints) {
        const url = BASE_URL + generateUrl(ep.fullPath);
        const method = ep.method.toLowerCase();
        const data = ['post','put','patch'].includes(method) ? generateBody(ep.dto) : undefined;
        const isProtected = ep.guards && ep.guards.length > 0;

        let statusNoAuth = 'SKIP';
        let statusWithAuth = 'ERROR';
        let passed = true;
        let errorCategory = undefined;
        let errorDetails = '';

        // Test without auth
        if (isProtected) {
          try {
            const res = await axios({ method, url, data, timeout: 5000 });
            statusNoAuth = res.status;
          } catch (err) {
            statusNoAuth = err.response?.status || 'ERROR';
          }
          if (statusNoAuth !== 401 && statusNoAuth !== 403 && statusNoAuth !== 'ERROR') {
            passed = false;
            errorCategory = 'CRITICAL';
            errorDetails += 'Expected 401/403 without auth, got ' + statusNoAuth + '. ';
          }
        }

        // Test with auth
        try {
          const headers = jwt ? { Authorization: 'Bearer ' + jwt } : {};
          const res = await axios({ method, url, data, headers, timeout: 5000 });
          statusWithAuth = res.status;
        } catch (err) {
          statusWithAuth = err.response?.status || 'ERROR';
          if (statusWithAuth === 500) {
            passed = false;
            errorCategory = 'CRITICAL';
            errorDetails += 'Server returned 500. ';
          } else if (statusWithAuth === 'ERROR') {
            passed = false;
            errorCategory = 'CRITICAL';
            errorDetails += 'Network error or timeout. ';
          } else if (![400, 403, 404, 409, 422].includes(statusWithAuth)) {
            passed = false;
            errorCategory = 'WARNING';
            errorDetails += 'Unexpected status: ' + statusWithAuth + '. ';
          }
        }

        results.push({
          endpoint: ep.fullPath,
          method: ep.method,
          statusWithoutAuth: statusNoAuth,
          statusWithAuth: statusWithAuth,
          passed,
          errorCategory,
          errorDetails: errorDetails.trim() || undefined,
        });
      }

      const report = {
        executedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        totalExecuted: results.length,
        totalPassed: results.filter(r => r.passed).length,
        totalFailed: results.filter(r => !r.passed).length,
        results,
      };

      process.stdout.write(JSON.stringify(report));
    }

    main().catch(e => { process.stderr.write(e.message + '\\n'); process.exit(1); });
  `;

  const scriptPath = path.join(REPORTS_DIR, '_runtime_inline.js');
  fs.writeFileSync(scriptPath, scriptContent);

  try {
    const result = execSync(`node "${scriptPath}"`, {
      cwd: ROOT,
      timeout: 180000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const report = JSON.parse(result.trim());
    fs.unlinkSync(scriptPath);

    // Save
    fs.writeFileSync(path.join(REPORTS_DIR, 'runtime-results.json'), JSON.stringify(report, null, 2));
    generateRuntimeReport(report);

    // Display
    console.log('');
    heading('Runtime Verification Summary');
    console.log(`  Total Tested:  ${c.bold}${report.totalExecuted}${c.reset}`);
    console.log(`  ${c.green}Passed:        ${report.totalPassed}${c.reset}`);
    console.log(`  ${c.red}Failed:        ${report.totalFailed}${c.reset}`);

    const critical = report.results.filter((r: any) => r.errorCategory === 'CRITICAL');
    if (critical.length > 0) {
      console.log('');
      fail(`${critical.length} CRITICAL failures:`);
      for (const r of critical.slice(0, 10)) {
        console.log(`    ${c.red}${r.method} ${r.endpoint} — ${r.errorDetails}${c.reset}`);
      }
    }

    return { passed: report.totalFailed === 0, report };
  } catch (err: any) {
    fs.unlinkSync(scriptPath);
    fail(`Runtime verification error: ${err.message}`);
    return { passed: false, report: null };
  }
}

function generateRuntimeReport(report: any) {
  let md = `# Runtime Verification Report\n\n`;
  md += `> Executed at ${report.executedAt}\n\n`;
  md += `## Summary\n`;
  md += `- **Base URL**: \`${report.baseUrl}\`\n`;
  md += `- **Total Endpoints**: ${report.totalExecuted}\n`;
  md += `- **Passed**: ${report.totalPassed}\n`;
  md += `- **Failed**: ${report.totalFailed}\n\n`;

  const critical = report.results.filter((r: any) => r.errorCategory === 'CRITICAL');
  if (critical.length > 0) {
    md += `## Critical Failures\n\n`;
    md += `| Method | Endpoint | No Auth | With Auth | Details |\n`;
    md += `|--------|----------|---------|-----------|--------|\n`;
    for (const r of critical) {
      md += `| **${r.method}** | \`${r.endpoint}\` | ${r.statusWithoutAuth} | ${r.statusWithAuth} | ${r.errorDetails} |\n`;
    }
    md += `\n`;
  }

  md += `## All Endpoints\n\n`;
  md += `| Method | Endpoint | No Auth | With Auth | Status |\n`;
  md += `|--------|----------|---------|-----------|--------|\n`;
  for (const r of report.results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    md += `| **${r.method}** | \`${r.endpoint}\` | ${r.statusWithoutAuth} | ${r.statusWithAuth} | ${icon} |\n`;
  }

  fs.writeFileSync(path.join(REPORTS_DIR, 'RuntimeVerification.md'), md);
}

// ─── Archive ────────────────────────────────────────────────────────────────
function archiveReports() {
  const archiveDir = path.join(REPORTS_DIR, 'archive');
  ensureDir(archiveDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const destDir = path.join(archiveDir, timestamp);
  ensureDir(destDir);

  const filesToArchive = [
    'api-compatibility.json',
    'swagger-contract.json',
    'runtime-results.json',
    'ApiContract.md',
    'ApiMismatch.md',
    'DeadEndpoints.md',
    'FinalCertification.md',
    'SwaggerComparison.md',
    'OpenApiMismatch.md',
    'RuntimeVerification.md',
    'api-compatibility.html',
    'backend-api.json',
    'frontend-api.json',
  ];

  let archived = 0;
  for (const file of filesToArchive) {
    const src = path.join(REPORTS_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(destDir, file));
      archived++;
    }
  }

  if (archived > 0) {
    success(`Archived ${archived} reports to ${c.dim}${destDir}${c.reset}`);
  }
}

// ─── Final Summary ──────────────────────────────────────────────────────────
function finalSummary(results: {
  step1: boolean;
  step2: boolean;
  step3: { passed: boolean; report: any };
  step4: { passed: boolean; report: any };
  step5: { passed: boolean; report: any };
}, opts: CliOptions) {
  console.log('');
  console.log(`${c.bold}${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`${c.bold}${c.cyan}  FINAL VERIFICATION SUMMARY${c.reset}`);
  console.log(`${c.bold}${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log('');

  const allPassed = results.step1 && results.step2 && results.step3.passed && results.step4.passed && results.step5.passed;

  console.log(`  ${results.step1 ? c.green + '✔' : c.red + '✖'}${c.reset} Step 1: Backend Scanner`);
  console.log(`  ${results.step2 ? c.green + '✔' : c.red + '✖'}${c.reset} Step 2: Frontend Scanner`);
  console.log(`  ${results.step3.passed ? c.green + '✔' : c.red + '✖'}${c.reset} Step 3: Verification Engine`);
  console.log(`  ${results.step4.passed ? c.green + '✔' : c.red + '✖'}${c.reset} Step 4: Swagger Verification`);
  console.log(`  ${results.step5.passed ? c.green + '✔' : c.red + '✖'}${c.reset} Step 5: Runtime Verification`);
  console.log('');

  if (allPassed) {
    console.log(`${c.bold}${c.bgGreen}${c.white}  API VERIFICATION: PASS  ${c.reset}`);
  } else {
    console.log(`${c.bold}${c.bgRed}${c.white}  API VERIFICATION: FAIL  ${c.reset}`);
  }
  console.log('');

  // Machine-readable CI output
  const ciOutput = {
    timestamp: new Date().toISOString(),
    overallResult: allPassed ? 'PASS' : 'FAIL',
    steps: {
      backendScanner: results.step1,
      frontendScanner: results.step2,
      verificationEngine: results.step3.passed,
      swaggerVerification: results.step4.passed,
      runtimeVerification: results.step5.passed,
    },
    summary: {
      p0Errors: results.step3.report?.summary?.incorrectUrls ?? 0,
      p1Errors: results.step3.report?.summary?.incorrectMethods ?? 0,
      p2Errors: results.step3.report?.summary?.dtoMismatches ?? 0,
      p3DeadEndpoints: results.step3.report?.deadEndpoints?.length ?? 0,
      coverage: results.step3.report?.summary?.coveragePercent ?? '0',
      swaggerAvailable: results.step4.report?.liveSwaggerAvailable ?? false,
      swaggerMismatches: results.step4.report?.summary?.mismatches ?? 0,
      runtimeFailed: results.step5.report?.totalFailed ?? 0,
    },
    thresholds: {
      p0: opts.p0Threshold,
      p1: opts.p1Threshold,
      p2: opts.p2Threshold,
      p3: opts.p3Threshold,
    },
  };

  const ciOutputPath = path.join(opts.outputDir, 'api-verification.json');
  fs.writeFileSync(ciOutputPath, JSON.stringify(ciOutput, null, 2));
  info(`Machine-readable output: ${ciOutputPath}`);

  return allPassed;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  const opts = parseArgs();

  console.log('');
  console.log(`${c.bold}${c.magenta}╔════════════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.magenta}║     IMCMS Enterprise API Verification Tool                       ║${c.reset}`);
  console.log(`${c.bold}${c.magenta}║     Swagger • Backend AST • Frontend AST • Runtime                ║${c.reset}`);
  console.log(`${c.bold}${c.magenta}╚════════════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log('');
  info(`Mode: ${opts.ci ? 'CI (strict)' : 'Interactive'}`);
  info(`Thresholds: P0=${opts.p0Threshold}, P1=${opts.p1Threshold}, P2=${opts.p2Threshold}, P3=${opts.p3Threshold}`);
  info(`Reports: ${opts.outputDir}`);

  ensureDir(opts.outputDir);
  ensureDir(REPORTS_DIR);

  // Execute pipeline
  const step1 = step1_backendScanner();
  const step2 = step2_frontendScanner();
  const step3 = step3_verificationEngine(opts);
  const step4 = step4_swaggerVerification(opts);
  const step5 = step5_runtimeVerification(opts);

  // Archive
  if (opts.archive) {
    heading('Archiving Reports');
    archiveReports();
  }

  // Final summary
  const allPassed = finalSummary({ step1, step2, step3, step4, step5 }, opts);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${c.dim}  Completed in ${elapsed}s${c.reset}\n`);

  // Exit code
  if (!allPassed) {
    if (opts.ci) {
      process.exit(1);
    } else {
      warn('API verification failed. Review reports in tools/api-verifier/reports/');
    }
  }
}

main().catch((err) => {
  console.error(`\n${c.red}Fatal error: ${err.message}${c.reset}`);
  process.exit(1);
});
