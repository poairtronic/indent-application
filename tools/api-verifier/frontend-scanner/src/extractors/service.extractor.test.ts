import test from 'node:test';
import assert from 'node:assert/strict';
import { Project, ScriptTarget } from 'ts-morph';
import { extractServices } from './service.extractor';

test('extractServices captures object-based services that call apiClient', () => {
  const project = new Project({
    useInMemoryCompilerHost: true,
    compilerOptions: {
      target: ScriptTarget.ES2020,
    },
  });

  const sourceFile = project.createSourceFile(
    'analytics.service.ts',
    `
      export const analyticsService = {
        getSummary: async () => {
          const response = await apiClient.get('/analytics/summary');
          return response.data;
        },
      };
    `,
  );

  const endpoints = extractServices([sourceFile]);

  assert.ok(endpoints.some((endpoint) => endpoint.service === 'analyticsService' && endpoint.url === '/analytics/summary'));
});
