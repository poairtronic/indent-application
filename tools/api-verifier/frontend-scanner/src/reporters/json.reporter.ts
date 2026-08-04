import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResults } from '../analyzers/quality.analyzer';

export function generateJsonReport(results: AnalysisResults, outputPath: string): void {
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
