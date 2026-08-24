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
exports.generateHtmlReport = generateHtmlReport;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateHtmlReport(report, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const resultColor = report.summary.overallResult === 'PASS' ? '#2ecc71' : '#e74c3c';
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Compatibility Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #2c3e50; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
    .status { padding: 10px 20px; border-radius: 4px; font-weight: bold; color: white; background-color: ${resultColor}; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center; }
    .card .value { font-size: 24px; font-weight: bold; color: #007bff; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
    th { background-color: #f8f9fa; }
    tr.mismatch { background-color: #fff3cd; }
    tr.missing { background-color: #f8d7da; }
    .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-match { background: #d4edda; color: #155724; }
    .badge-mismatch { background: #fff3cd; color: #856404; }
    .badge-missing { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Enterprise API Compatibility Matrix</h1>
    <div class="status">${report.summary.overallResult}</div>
  </div>
  
  <div class="grid">
    <div class="card">
      <div>Coverage</div>
      <div class="value">${report.summary.coveragePercent}%</div>
    </div>
    <div class="card">
      <div>Backend APIs</div>
      <div class="value">${report.summary.totalBackendApis}</div>
    </div>
    <div class="card">
      <div>Frontend APIs</div>
      <div class="value">${report.summary.totalFrontendApis}</div>
    </div>
    <div class="card">
      <div>Dead Endpoints</div>
      <div class="value" style="color: #6c757d;">${report.deadEndpoints.length}</div>
    </div>
  </div>

  <h2>Comparison Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Module</th>
        <th>Backend Endpoint</th>
        <th>Frontend Endpoint</th>
        <th>Status</th>
        <th>Issues</th>
      </tr>
    </thead>
    <tbody>
`;
    for (const row of report.matrix) {
        let trClass = '';
        let badgeClass = 'badge-match';
        if (row.result === 'MISMATCH') {
            trClass = 'mismatch';
            badgeClass = 'badge-mismatch';
        }
        else if (row.result !== 'MATCH') {
            trClass = 'missing';
            badgeClass = 'badge-missing';
        }
        html += `
      <tr class="${trClass}">
        <td>${row.module}</td>
        <td><code>${row.method} ${row.backendUrl}</code></td>
        <td><code>${row.frontendUrl}</code></td>
        <td><span class="badge ${badgeClass}">${row.result}</span></td>
        <td>${row.issues.join('<br>')}</td>
      </tr>
    `;
    }
    html += `
    </tbody>
  </table>
</body>
</html>
`;
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`[HTML Reporter] Generated HTML report at ${outputPath}`);
}
