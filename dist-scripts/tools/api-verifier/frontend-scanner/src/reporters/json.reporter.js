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
exports.generateJsonReport = generateJsonReport;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateJsonReport(results, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const finalOutput = {
        scannedAt: new Date().toISOString(),
        summary: {
            totalEndpoints: results.endpoints.length,
            duplicateHooksCount: results.duplicateHooks.length,
            unusedServicesCount: results.unusedServices.length,
            orphanHooksCount: results.orphanHooks.length,
            hardcodedUrlsCount: results.hardcodedUrls.length
        },
        endpoints: results.endpoints,
        qualityIssues: {
            duplicateHooks: results.duplicateHooks,
            unusedServices: results.unusedServices,
            orphanHooks: results.orphanHooks,
            hardcodedUrls: results.hardcodedUrls
        }
    };
    fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf-8');
    console.log(`[JSON Reporter] Generated JSON report at ${outputPath}`);
}
