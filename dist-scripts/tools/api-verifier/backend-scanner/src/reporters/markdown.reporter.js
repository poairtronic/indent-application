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
function generateMarkdownReport(endpoints, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    let md = `# Backend API Inventory\n\n`;
    md += `> Generated on ${new Date().toISOString()}\n\n`;
    md += `Total Endpoints: **${endpoints.length}**\n\n`;
    md += `| Module | Controller | Method | Path | DTO | Response | Guards | Roles |\n`;
    md += `|--------|------------|--------|------|-----|----------|--------|-------|\n`;
    for (const ep of endpoints) {
        const methodStr = `\`${ep.method}\``;
        const pathStr = `\`${ep.fullPath}\``;
        const dtoStr = ep.dto ? `\`${ep.dto}\`` : (ep.queryDto ? `\`${ep.queryDto}\` (Q)` : '-');
        const respStr = ep.response ? `\`${ep.response}\`` : '-';
        const guardsStr = ep.guards.length > 0 ? ep.guards.join(', ') : '-';
        const rolesStr = ep.roles.length > 0 ? ep.roles.join(', ') : '-';
        md += `| ${ep.module} | ${ep.controller} | ${methodStr} | ${pathStr} | ${dtoStr} | ${respStr} | ${guardsStr} | ${rolesStr} |\n`;
    }
    fs.writeFileSync(outputPath, md, 'utf-8');
    console.log(`[Markdown Reporter] Generated Markdown report at ${outputPath}`);
}
