# IMCMS Enterprise API Verification Tool

A comprehensive 5-step pipeline that verifies API contract consistency across **Swagger/OpenAPI**, **NestJS backend controllers**, and **React frontend services/hooks**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    API Verification Pipeline                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 1          Step 2          Step 3          Step 4    Step 5   │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐ ┌──────┐ │
│  │ Backend  │   │ Frontend │   │   Cross- │   │ Swagger│ │ Live │ │
│  │ Scanner  │──▶│ Scanner  │──▶│ Reference│──▶│  Tri-  │ │ Test │ │
│  │ (AST)    │   │ (AST)    │   │  Engine  │   │  Way   │ │      │ │
│  └──────────┘   └──────────┘   └──────────┘   └────────┘ └──────┘ │
│       │              │              │              │           │     │
│       ▼              ▼              ▼              ▼           ▼     │
│  backend-api   frontend-api  api-compat    swagger-contract  runtime│
│    .json          .json       .json         .json           results │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- Backend server running at `http://localhost:3001` (for Swagger + runtime steps)
- PostgreSQL (for runtime verification)

### Install

```bash
# From project root
npm install

# Install sub-project dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Run

```bash
# Full pipeline (contract verification only — no live server needed)
npm run verify-api

# Full pipeline with live endpoint testing
npm run verify-api -- --runtime

# CI mode (strict exit codes, machine-readable output)
npm run verify-api -- --ci

# Strict mode (zero P0 and P1 tolerance)
npm run verify-api -- --strict
```

## CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--ci` | `false` | CI mode: exits with code 1 on failure, produces JSON output |
| `--runtime` | `false` | Include live endpoint testing against running backend |
| `--strict` | `false` | Zero tolerance for P0 and P1 issues |
| `--p0-threshold` | `0` | Max allowed P0 errors (missing backend endpoints) |
| `--p1-threshold` | `10` | Max allowed P1 errors (method/URL mismatches) |
| `--p2-threshold` | `50` | Max allowed P2 errors (DTO mismatches) |
| `--p3-threshold` | `100` | Max allowed P3 issues (dead endpoints) |
| `--swagger-url` | `http://localhost:3001/api-json` | OpenAPI spec URL |
| `--backend-url` | `http://localhost:3001/api` | Backend base URL for runtime |
| `--output` | `tools/api-verifier/reports` | Output directory |
| `--no-archive` | `false` | Skip archiving reports |

## Pipeline Steps

### Step 1: Backend Scanner

Scans NestJS controllers using TypeScript AST (ts-morph) to extract:
- All REST endpoints (method + path)
- DTO references (request/response bodies)
- Guards, roles, and permission decorators
- Module groupings

**Output:** `tools/api-verifier/reports/backend-api.json`

### Step 2: Frontend Scanner

Scans React service classes and hooks using TypeScript AST to extract:
- All API calls (method + URL)
- Request/response type references
- Hook-to-service connections
- Duplicate hooks, orphan hooks, hardcoded URLs

**Output:** `tools/api-verifier/reports/frontend-api.json`

### Step 3: Verification Engine

Cross-references backend and frontend contracts to detect:
- **P0:** Frontend calls endpoint that backend doesn't have
- **P1:** HTTP method mismatch (GET vs POST)
- **P2:** DTO/schema name mismatches
- **P3:** Backend endpoints never called by frontend (dead code)

**Output:** `tools/api-verifier/reports/api-compatibility.json`

### Step 4: Swagger Verification

Fetches the live OpenAPI spec and performs a tri-way comparison:
- Swagger ↔ Backend AST
- Swagger ↔ Frontend hooks
- Detects missing endpoints in any direction
- Validates request/response schemas against code

**Output:**
- `tools/api-verifier/reports/swagger-contract.json`
- `tools/api-verifier/reports/SwaggerComparison.md`
- `tools/api-verifier/reports/OpenApiMismatch.md`

### Step 5: Runtime Verification (Optional)

Hits live backend endpoints to verify:
- Authentication enforcement (401/403 without token)
- Response status codes (no 500 errors)
- Response schema structure

**Output:**
- `tools/api-verifier/reports/runtime-results.json`
- `tools/api-verifier/reports/RuntimeVerification.md`

## Generated Reports

| File | Format | Description |
|------|--------|-------------|
| `api-verification.json` | JSON | Machine-readable CI output |
| `api-compatibility.json` | JSON | Full verification matrix |
| `swagger-contract.json` | JSON | Swagger tri-way comparison |
| `runtime-results.json` | JSON | Runtime test results |
| `SwaggerComparison.md` | Markdown | Swagger tri-way matrix |
| `OpenApiMismatch.md` | Markdown | Swagger discrepancies |
| `ApiContract.md` | Markdown | Backend vs Frontend matrix |
| `ApiMismatch.md` | Markdown | P0/P1/P2 mismatches |
| `DeadEndpoints.md` | Markdown | Unused backend endpoints |
| `FinalCertification.md` | Markdown | Overall PASS/FAIL status |
| `RuntimeVerification.md` | Markdown | Live test results |
| `api-compatibility.html` | HTML | Visual report |

## CI Output Format

The `api-verification.json` file provides machine-readable output for CI pipelines:

```json
{
  "timestamp": "2026-08-04T12:00:00.000Z",
  "overallResult": "PASS",
  "steps": {
    "backendScanner": true,
    "frontendScanner": true,
    "verificationEngine": true,
    "swaggerVerification": true,
    "runtimeVerification": true
  },
  "summary": {
    "p0Errors": 0,
    "p1Errors": 2,
    "p2Errors": 5,
    "p3DeadEndpoints": 12,
    "coverage": "85.3",
    "swaggerAvailable": true,
    "swaggerMismatches": 1,
    "runtimeFailed": 0
  },
  "thresholds": {
    "p0": 0,
    "p1": 10,
    "p2": 50,
    "p3": 100
  }
}
```

## Severity Levels

| Level | Name | Description | Default Threshold |
|-------|------|-------------|-------------------|
| **P0** | Critical | Frontend calls endpoint backend doesn't have | 0 (fail on any) |
| **P1** | High | HTTP method mismatch between frontend and backend | 10 |
| **P2** | Medium | DTO/schema name mismatches | 50 |
| **P3** | Low | Dead backend endpoints (no frontend caller) | 100 |

P0 and P1 issues cause the pipeline to **FAIL**. P2 and P3 are warnings by default.

## GitHub Actions Integration

The included `.github/workflows/api-verification.yml` runs on:
- Every push to main/master/dev
- Every pull request
- Manual dispatch (with optional runtime testing)

It will:
1. Start PostgreSQL and Redis services
2. Install all dependencies
3. Run database migrations
4. Start the backend server
5. Execute the full verification pipeline
6. Upload reports as artifacts
7. Comment PR results on pull requests

## Azure DevOps Integration

The included `azure-pipelines.yml` provides:
- **Stage 1:** Static contract verification (every PR/push)
- **Stage 2:** Runtime verification (main branch only, with real database)

Reports are published as build artifacts.

## Project Structure

```
tools/api-verifier/
├── backend-scanner/           # NestJS AST scanner
│   ├── src/
│   │   ├── index.ts           # CLI entry point
│   │   ├── scanner.ts         # AST scanner class
│   │   ├── extractors/        # Controller/method extractors
│   │   ├── reporters/         # JSON + Markdown output
│   │   └── types.ts
│   └── package.json
├── frontend-scanner/          # React/Axios AST scanner
│   ├── src/
│   │   ├── index.ts           # CLI entry point
│   │   ├── scanner.ts         # AST scanner class
│   │   ├── extractors/        # Service/hook extractors
│   │   ├── analyzers/         # Quality analysis
│   │   ├── reporters/         # JSON + Markdown output
│   │   └── types.ts
│   └── package.json
├── verification-engine/       # Cross-reference + Swagger + Runtime
│   ├── src/
│   │   ├── index.ts           # CLI entry point
│   │   ├── engine.ts          # Contract cross-reference engine
│   │   ├── types.ts           # Type definitions
│   │   ├── swagger/
│   │   │   ├── swagger.parser.ts      # OpenAPI fetch + parse
│   │   │   └── swagger.comparator.ts  # Tri-way comparison
│   │   ├── reporters/
│   │   │   ├── markdown.reporter.ts
│   │   │   ├── html.reporter.ts
│   │   │   ├── swagger.reporter.ts
│   │   │   └── runtime.reporter.ts
│   │   └── runtime/
│   │       ├── runner.ts       # Live endpoint executor
│   │       ├── auth.helper.ts  # Auto-authentication
│   │       └── payload.generator.ts  # Mock payload generation
│   ├── reports/                # Generated reports
│   └── package.json
└── README.md                   # This file

scripts/
└── verify-api.ts               # Pipeline orchestrator
```

## Troubleshooting

### "Could not fetch valid OpenAPI spec"

The backend server is not running. Start it:
```bash
cd backend
npm run start:dev
```

Then re-run: `npm run verify-api`

### "Backend scanner found 0 endpoints"

Ensure the backend tsconfig.json path is correct:
```bash
npm run verify-api -- --backend-tsconfig backend/tsconfig.json
```

### "Frontend scanner found 0 endpoints"

Ensure the frontend tsconfig.app.json path is correct. The scanner needs:
- `frontend/tsconfig.app.json` (or `frontend/tsconfig.json`)

### High P0 count (false positives)

The frontend scanner may not resolve template literal URLs. Check:
- `tools/api-verifier/reports/frontend-api.json` for raw `${...}` URLs
- These are typically BaseService methods that resolve at runtime

### Runtime verification all ERROR

Backend server is not running or not reachable. Ensure:
1. Backend is started: `cd backend && npm run start:dev`
2. Port matches: default is 3001
3. Database is running and migrations are applied

### "ts-node: command not found"

Install ts-node globally or use npx:
```bash
npm install -g ts-node
# or
npx ts-node scripts/verify-api.ts
```

## License

Internal — IMCMS Enterprise
