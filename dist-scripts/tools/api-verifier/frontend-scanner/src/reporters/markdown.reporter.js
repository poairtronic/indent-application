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
exports.generateMarkdownReport = generateMarkdownReport;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateMarkdownReport(results, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    let md = `# Frontend API Inventory\n\n`;
    md += `> Generated on ${new Date().toISOString()}\n\n`;
    md += `## Summary\n`;
    md += `- **Total API Calls**: ${results.endpoints.length}\n`;
    md += `- **Duplicate Hooks**: ${results.duplicateHooks.length}\n`;
    md += `- **Unused Services**: ${results.unusedServices.length}\n`;
    md += `- **Orphan Hooks**: ${results.orphanHooks.length}\n`;
    md += `- **Hardcoded URLs**: ${results.hardcodedUrls.length}\n\n`;
    md += `## API Endpoints\n\n`;
    md += `| Service | Hook | Method | URL | Req DTO | Res DTO | Query Key |\n`;
    md += `|---------|------|--------|-----|---------|---------|-----------|\n`;
    for (const ep of results.endpoints) {
        const serviceStr = `\`${ep.service}\``;
        const hookStr = ep.hook ? `\`${ep.hook}\`` : '-';
        const methodStr = `\`${ep.method}\``;
        const urlStr = `\`${ep.url}\``;
        const reqDtoStr = ep.requestDto ? `\`${ep.requestDto}\`` : '-';
        const resDtoStr = ep.responseDto ? `\`${ep.responseDto}\`` : '-';
        const queryKeyStr = ep.queryKey ? `\`[${ep.queryKey.join(', ')}]\`` : '-';
        md += `| ${serviceStr} | ${hookStr} | ${methodStr} | ${urlStr} | ${reqDtoStr} | ${resDtoStr} | ${queryKeyStr} |\n`;
    }
    if (results.hardcodedUrls.length > 0) {
        md += `\n## ⚠️ Hardcoded URLs (Action Required)\n`;
        for (const ep of results.hardcodedUrls) {
            md += `- ${ep.service}: \`${ep.url}\`\n`;
        }
    }
    if (results.unusedServices.length > 0) {
        md += `\n## ⚠️ Unused Services\n`;
        for (const svc of results.unusedServices) {
            md += `- \`${svc}\`\n`;
        }
    }
    fs.writeFileSync(outputPath, md, 'utf-8');
    console.log(`[Markdown Reporter] Generated Markdown report at ${outputPath}`);
}
