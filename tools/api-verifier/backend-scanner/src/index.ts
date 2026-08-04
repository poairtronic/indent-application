import { Command } from 'commander';
import * as path from 'path';
import { ApiScanner } from './scanner';
import { generateJsonReport } from './reporters/json.reporter';
import { generateMarkdownReport } from './reporters/markdown.reporter';

const program = new Command();

program
  .name('backend-api-scanner')
  .description('Static AST Scanner for NestJS APIs')
  .version('1.0.0')
  .requiredOption('-p, --project <path>', 'Path to tsconfig.json of the backend project')
  .option('-o, --output <path>', 'Output directory for reports', './reports')
  .parse(process.argv);

const options = program.opts();

async function bootstrap() {
  console.log(`[Scanner] Initializing ts-morph project with ${options.project}...`);
  
  try {
    const scanner = new ApiScanner(path.resolve(process.cwd(), options.project));
    
    console.log(`[Scanner] Scanning AST for controllers...`);
    const endpoints = scanner.scan();
    
    console.log(`[Scanner] Found ${endpoints.length} endpoints.`);

    const jsonPath = path.join(process.cwd(), options.output, 'backend-api.json');
    const mdPath = path.join(process.cwd(), options.output, 'BackendInventory.md');

    generateJsonReport(endpoints, jsonPath);
    generateMarkdownReport(endpoints, mdPath);

    console.log(`[Scanner] Complete.`);
  } catch (error: any) {
    console.error(`[Scanner Error]:`, error.message);
    process.exit(1);
  }
}

bootstrap();
