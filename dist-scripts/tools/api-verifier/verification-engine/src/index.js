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
const fs = __importStar(require("fs"));
const engine_1 = require("./engine");
const markdown_reporter_1 = require("./reporters/markdown.reporter");
const html_reporter_1 = require("./reporters/html.reporter");
const runner_1 = require("./runtime/runner");
const runtime_reporter_1 = require("./reporters/runtime.reporter");
const program = new commander_1.Command();
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
        const engine = new engine_1.ApiVerificationEngine();
        const report = engine.verify(backendData, frontendData);
        console.log(`[Engine] Verification complete. Coverage: ${report.summary.coveragePercent}%`);
        const outputDir = path.resolve(process.cwd(), options.output);
        // JSON
        fs.writeFileSync(path.join(outputDir, 'api-compatibility.json'), JSON.stringify(report, null, 2));
        console.log(`[JSON Reporter] Generated api-compatibility.json`);
        // Markdown
        (0, markdown_reporter_1.generateMarkdownReports)(report, outputDir);
        // HTML
        (0, html_reporter_1.generateHtmlReport)(report, path.join(outputDir, 'api-compatibility.html'));
        if (report.summary.overallResult === 'FAIL') {
            console.warn(`[Engine] WARNING: API Certification FAILED due to P0/P1 errors.`);
        }
        else {
            console.log(`[Engine] SUCCESS: API Certification PASSED.`);
        }
        if (options.runtime) {
            console.log(`\n======================================================`);
            console.log(`[Runtime] --runtime flag detected. Initiating automated runtime execution...`);
            const backendEndpoints = backendData.controllers
                ? Object.values(backendData.controllers).flat()
                : [];
            const runner = new runner_1.RuntimeRunner();
            const runtimeReport = await runner.executeAll(backendEndpoints);
            (0, runtime_reporter_1.generateRuntimeReports)(runtimeReport, outputDir);
            if (runtimeReport.totalFailed > 0) {
                console.warn(`[Runtime] WARNING: ${runtimeReport.totalFailed} endpoints failed runtime validation.`);
            }
            else {
                console.log(`[Runtime] SUCCESS: All endpoints passed runtime validation.`);
            }
        }
    }
    catch (error) {
        console.error(`[Engine Error]:`, error.message);
        process.exit(1);
    }
}
bootstrap();
