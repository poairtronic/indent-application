import * as fs from 'fs';
import * as path from 'path';
import { ApiEndpoint } from '../types';

export function generateMarkdownReport(endpoints: ApiEndpoint[], outputPath: string): void {
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
