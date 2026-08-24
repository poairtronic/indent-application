"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const ts_morph_1 = require("ts-morph");
const service_extractor_1 = require("./service.extractor");
(0, node_test_1.default)('extractServices captures object-based services that call apiClient', () => {
    const project = new ts_morph_1.Project({
        useInMemoryCompilerHost: true,
        compilerOptions: {
            target: ts_morph_1.ScriptTarget.ES2020,
        },
    });
    const sourceFile = project.createSourceFile('analytics.service.ts', `
      export const analyticsService = {
        getSummary: async () => {
          const response = await apiClient.get('/analytics/summary');
          return response.data;
        },
      };
    `);
    const endpoints = (0, service_extractor_1.extractServices)([sourceFile]);
    strict_1.default.ok(endpoints.some((endpoint) => endpoint.service === 'analyticsService' && endpoint.url === '/analytics/summary'));
});
