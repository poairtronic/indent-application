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
const commander_1 = require("commander");
const path = __importStar(require("path"));
const scanner_1 = require("./scanner");
const json_reporter_1 = require("./reporters/json.reporter");
const markdown_reporter_1 = require("./reporters/markdown.reporter");
const program = new commander_1.Command();
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
        const scanner = new scanner_1.ApiScanner(path.resolve(process.cwd(), options.project));
        console.log(`[Scanner] Scanning AST for controllers...`);
        const endpoints = scanner.scan();
        console.log(`[Scanner] Found ${endpoints.length} endpoints.`);
        const jsonPath = path.join(process.cwd(), options.output, 'backend-api.json');
        const mdPath = path.join(process.cwd(), options.output, 'BackendInventory.md');
        (0, json_reporter_1.generateJsonReport)(endpoints, jsonPath);
        (0, markdown_reporter_1.generateMarkdownReport)(endpoints, mdPath);
        console.log(`[Scanner] Complete.`);
    }
    catch (error) {
        console.error(`[Scanner Error]:`, error.message);
        process.exit(1);
    }
}
bootstrap();
