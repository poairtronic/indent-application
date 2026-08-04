import * as fs from 'fs';
import * as path from 'path';
import { ApiEndpoint } from '../types';

export function generateJsonReport(endpoints: ApiEndpoint[], outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Group by controller
  const grouped = endpoints.reduce((acc, ep) => {
    if (!acc[ep.controller]) acc[ep.controller] = [];
    acc[ep.controller].push(ep);
    return acc;
  }, {} as Record<string, ApiEndpoint[]>);

  const finalOutput = {
    totalEndpoints: endpoints.length,
    scannedAt: new Date().toISOString(),
    controllers: grouped
  };

  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf-8');
  console.log(`[JSON Reporter] Generated JSON report at ${outputPath}`);
}
