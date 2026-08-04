import { Command } from 'commander';
import * as path from 'path';
import { FrontendApiScanner } from './scanner';
import { generateJsonReport } from './reporters/json.reporter';
import { generateMarkdownReport } from './reporters/markdown.reporter';

const program = new Command();

program
  .name('frontend-api-scanner')
  .description('Static AST Scanner for React/Axios APIs')
  .version('1.0.0')
  .requiredOption('-p, --project <path>', 'Path to tsconfig.json of the frontend project')
  .option('-o, --output <path>', 'Output directory for reports', './reports')
  .parse(process.argv);

const options = program.opts();

async function bootstrap() {
  console.log(`[Scanner] Initializing ts-morph project with ${options.project}...`);
  
  try {
    const scanner = new FrontendApiScanner(path.resolve(process.cwd(), options.project));
    
    const results = scanner.scan();
    
    console.log(`[Scanner] Found ${results.endpoints.length} API calls and ${results.orphanHooks.length} orphan hooks.`);

    const jsonPath = path.join(process.cwd(), options.output, 'frontend-api.json');
    const mdPath = path.join(process.cwd(), options.output, 'FrontendInventory.md');

    generateJsonReport(results, jsonPath);
    generateMarkdownReport(results, mdPath);

    console.log(`[Scanner] Complete.`);
  } catch (error: any) {
    console.error(`[Scanner Error]:`, error.message);
    process.exit(1);
  }
}

bootstrap();
