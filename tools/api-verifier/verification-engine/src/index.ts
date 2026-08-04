import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { ApiVerificationEngine } from './engine';
import { generateMarkdownReports } from './reporters/markdown.reporter';
import { generateHtmlReport } from './reporters/html.reporter';
import { RuntimeRunner } from './runtime/runner';
import { generateRuntimeReports } from './reporters/runtime.reporter';

const program = new Command();

program
  .name('api-verification-engine')
  .description('Cross-references backend and frontend API JSON files to generate a compatibility matrix')
  .version('1.0.0')
  .requiredOption('-b, --backend <path>', 'Path to backend-api.json')
  .requiredOption('-f, --frontend <path>', 'Path to frontend-api.json')
  .option('-o, --output <path>', 'Output directory for reports', './reports')
  .option('-r, --runtime', 'Execute runtime verification against live backend', false)
  .parse(process.argv);

const options = program.opts();

async function bootstrap() {
  console.log(`[Engine] Starting API Verification Engine...`);
  
  try {
    const backendData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), options.backend), 'utf-8'));
    const frontendData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), options.frontend), 'utf-8'));
    
    console.log(`[Engine] Loaded backend and frontend data. Comparing...`);
    const engine = new ApiVerificationEngine();
    const report = engine.verify(backendData, frontendData);
    
    console.log(`[Engine] Verification complete. Coverage: ${report.summary.coveragePercent}%`);

    const outputDir = path.resolve(process.cwd(), options.output);
    
    // JSON
    fs.writeFileSync(path.join(outputDir, 'api-compatibility.json'), JSON.stringify(report, null, 2));
    console.log(`[JSON Reporter] Generated api-compatibility.json`);

    // Markdown
    generateMarkdownReports(report, outputDir);

    // HTML
    generateHtmlReport(report, path.join(outputDir, 'api-compatibility.html'));

    if (report.summary.overallResult === 'FAIL') {
      console.warn(`[Engine] WARNING: API Certification FAILED due to P0/P1 errors.`);
    } else {
      console.log(`[Engine] SUCCESS: API Certification PASSED.`);
    }

    if (options.runtime) {
      console.log(`\n======================================================`);
      console.log(`[Runtime] --runtime flag detected. Initiating automated runtime execution...`);
      const backendEndpoints = backendData.controllers 
        ? Object.values(backendData.controllers).flat() as any[]
        : [];
        
      const runner = new RuntimeRunner();
      const runtimeReport = await runner.executeAll(backendEndpoints);
      
      generateRuntimeReports(runtimeReport, outputDir);
      
      if (runtimeReport.totalFailed > 0) {
        console.warn(`[Runtime] WARNING: ${runtimeReport.totalFailed} endpoints failed runtime validation.`);
      } else {
        console.log(`[Runtime] SUCCESS: All endpoints passed runtime validation.`);
      }
    }

  } catch (error: any) {
    console.error(`[Engine Error]:`, error.message);
    process.exit(1);
  }
}

bootstrap();
