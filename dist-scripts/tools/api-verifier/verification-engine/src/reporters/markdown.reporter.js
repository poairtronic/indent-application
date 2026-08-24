"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarkdownReports = generateMarkdownReports;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateMarkdownReports(report, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // 1. ApiContract.md
    let contractMd = `# API Verification Matrix\n\n`;
    contractMd += `| Module | Backend URL | Frontend URL | Method | Result | Issues |\n`;
    contractMd += `|--------|-------------|--------------|--------|--------|--------|\n`;
    for (const row of report.matrix) {
        contractMd += `| ${row.module} | \`${row.backendUrl}\` | \`${row.frontendUrl}\` | \`${row.method}\` | **${row.result}** | ${row.issues.join('<br>')} |\n`;
    }
    fs.writeFileSync(path.join(outputDir, 'ApiContract.md'), contractMd);
    // 2. ApiMismatch.md (P0, P1, P2)
    let mismatchMd = `# API Mismatches (P0, P1, P2)\n\n`;
    mismatchMd += `## P0 Errors (Missing Endpoints)\n`;
    for (const err of report.p0Errors)
        mismatchMd += `- **${err.method}** \`${err.frontendUrl}\` (Requested by ${err.module})\n`;
    mismatchMd += `\n## P1 Errors (Method/URL Mismatch)\n`;
    for (const err of report.p1Errors)
        mismatchMd += `- \`${err.backendUrl}\` -> \`${err.frontendUrl}\` (${err.issues.join(', ')})\n`;
    mismatchMd += `\n## P2 Errors (DTO/Auth Mismatch)\n`;
    for (const err of report.p2Errors)
        mismatchMd += `- \`${err.backendUrl}\`: ${err.issues.join(', ')}\n`;
    fs.writeFileSync(path.join(outputDir, 'ApiMismatch.md'), mismatchMd);
    // 3. DeadEndpoints.md
    let deadMd = `# Dead Backend Endpoints (P3)\n\n`;
    deadMd += `These endpoints exist in the backend but are never called by the frontend.\n\n`;
    for (const ep of report.deadEndpoints) {
        deadMd += `- **${ep.method}** \`${ep.fullPath}\` (${ep.module})\n`;
    }
    fs.writeFileSync(path.join(outputDir, 'DeadEndpoints.md'), deadMd);
    // 4. DuplicateEndpoints.md
    let dupMd = `# Duplicate Frontend Hooks (P3)\n\n`;
    for (const hook of report.duplicateEndpoints) {
        dupMd += `- \`${hook}\`\n`;
    }
    fs.writeFileSync(path.join(outputDir, 'DuplicateEndpoints.md'), dupMd);
    // 5. FinalCertification.md
    let certMd = `# Final API Certification\n\n`;
    certMd += `> Generated on ${report.scannedAt}\n\n`;
    certMd += `## Result: ${report.summary.overallResult === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;
    certMd += `| Metric | Count |\n`;
    certMd += `|--------|-------|\n`;
    certMd += `| Total Backend APIs | ${report.summary.totalBackendApis} |\n`;
    certMd += `| Total Frontend APIs | ${report.summary.totalFrontendApis} |\n`;
    certMd += `| Matched APIs | ${report.summary.matches} |\n`;
    certMd += `| Coverage | ${report.summary.coveragePercent}% |\n`;
    certMd += `| P0 Missing Backend | ${report.summary.incorrectUrls} |\n`;
    certMd += `| P1 Method/URL Mismatch | ${report.summary.incorrectMethods} |\n`;
    certMd += `| P2 DTO Mismatch | ${report.summary.dtoMismatches} |\n`;
    certMd += `| P3 Dead Backend Endpoints | ${report.deadEndpoints.length} |\n`;
    fs.writeFileSync(path.join(outputDir, 'FinalCertification.md'), certMd);
    console.log(`[Markdown Reporter] Generated Markdown reports in ${outputDir}`);
}
