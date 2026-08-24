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
exports.generateRuntimeReports = generateRuntimeReports;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateRuntimeReports(report, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // 1. JSON
    fs.writeFileSync(path.join(outputDir, 'runtime-results.json'), JSON.stringify(report, null, 2));
    // 2. Markdown
    let md = `# Runtime Verification Report\n\n`;
    md += `> Executed at ${report.executedAt}\n\n`;
    md += `## Summary\n`;
    md += `- **Total Endpoints Executed**: ${report.totalExecuted}\n`;
    md += `- **Passed Validation**: ${report.totalPassed}\n`;
    md += `- **Failed Validation**: ${report.totalFailed}\n\n`;
    const critical = report.results.filter(r => r.errorCategory === 'CRITICAL');
    const warnings = report.results.filter(r => r.errorCategory === 'WARNING');
    if (critical.length > 0) {
        md += `## 🚨 Critical Failures\n\n`;
        md += `These endpoints failed severe expectations (e.g. returned 500 Internal Server Error, or failed to enforce 401 Unauthorized).\n\n`;
        md += `| Method | Endpoint | Auth | No Auth | Details |\n`;
        md += `|--------|----------|------|---------|---------|\n`;
        for (const r of critical) {
            md += `| **${r.method}** | \`${r.endpoint}\` | ${r.statusWithAuth} | ${r.statusWithoutAuth} | ${r.errorDetails} |\n`;
        }
    }
    if (warnings.length > 0) {
        md += `\n## ⚠️ Warnings\n\n`;
        md += `| Method | Endpoint | Auth | No Auth | Details |\n`;
        md += `|--------|----------|------|---------|---------|\n`;
        for (const r of warnings) {
            md += `| **${r.method}** | \`${r.endpoint}\` | ${r.statusWithAuth} | ${r.statusWithoutAuth} | ${r.errorDetails} |\n`;
        }
    }
    md += `\n## All Executed Endpoints\n\n`;
    md += `| Method | Endpoint | Auth | No Auth | Status |\n`;
    md += `|--------|----------|------|---------|--------|\n`;
    for (const r of report.results) {
        const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
        md += `| **${r.method}** | \`${r.endpoint}\` | ${r.statusWithAuth} | ${r.statusWithoutAuth} | ${statusIcon} |\n`;
    }
    fs.writeFileSync(path.join(outputDir, 'RuntimeVerification.md'), md);
    console.log(`[Runtime Reporter] Generated runtime reports in ${outputDir}`);
}
