"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeRunner = void 0;
const axios_1 = __importDefault(require("axios"));
const auth_helper_1 = require("./auth.helper");
const payload_generator_1 = require("./payload.generator");
class RuntimeRunner {
    authHelper;
    payloadGenerator;
    baseUrl;
    constructor(baseUrl = 'http://localhost:3001/api') {
        this.baseUrl = baseUrl;
        this.authHelper = new auth_helper_1.AuthHelper(this.baseUrl);
        this.payloadGenerator = new payload_generator_1.PayloadGenerator();
    }
    async executeAll(endpoints) {
        const results = [];
        const jwt = await this.authHelper.getValidToken();
        console.log(`[Runtime] Starting execution against ${this.baseUrl} with ${endpoints.length} endpoints...`);
        for (const ep of endpoints) {
            const result = await this.executeSingle(ep, jwt);
            results.push(result);
        }
        const passed = results.filter(r => r.passed).length;
        return {
            executedAt: new Date().toISOString(),
            totalExecuted: endpoints.length,
            totalPassed: passed,
            totalFailed: endpoints.length - passed,
            results
        };
    }
    async executeSingle(ep, jwt) {
        const url = this.baseUrl + this.payloadGenerator.generateUrl(ep.fullPath);
        const method = ep.method.toLowerCase();
        const data = ['post', 'put', 'patch'].includes(method) ? this.payloadGenerator.generateMockBody(ep.dto) : undefined;
        let statusWithoutAuth = 'ERROR';
        let statusWithAuth = 'ERROR';
        let passed = true;
        let errorCategory;
        let errorDetails = '';
        let responseSchema;
        const isProtected = ep.guards.length > 0;
        // Test 1: Without Auth (if protected, should 401)
        if (isProtected) {
            try {
                const res = await (0, axios_1.default)({ method, url, data, timeout: 5000 });
                statusWithoutAuth = res.status;
            }
            catch (err) {
                statusWithoutAuth = err.response?.status || 'ERROR';
            }
            if (statusWithoutAuth !== 401 && statusWithoutAuth !== 403) {
                passed = false;
                errorCategory = 'CRITICAL';
                errorDetails += `Expected 401/403 without Auth, got ${statusWithoutAuth}. `;
            }
        }
        // Test 2: With Auth
        try {
            const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
            const res = await (0, axios_1.default)({ method, url, data, headers, timeout: 5000 });
            statusWithAuth = res.status;
            responseSchema = typeof res.data === 'object' ? Object.keys(res.data) : typeof res.data;
        }
        catch (err) {
            statusWithAuth = err.response?.status || 'ERROR';
            responseSchema = err.response?.data;
        }
        // Validate Status with Auth
        // 200, 201, 204 are success
        // 400 Bad Request, 404 Not Found, 422 Unprocessable Entity are EXPECTED because we are faking data/UUIDs
        // 500 Internal Server Error is ALWAYS a CRITICAL FAILURE
        const acceptableStatuses = [200, 201, 204, 400, 403, 404, 409, 422];
        if (statusWithAuth === 500) {
            passed = false;
            errorCategory = 'CRITICAL';
            errorDetails += `Server threw 500 Internal Server Error. `;
        }
        else if (statusWithAuth === 'ERROR') {
            passed = false;
            errorCategory = 'CRITICAL';
            errorDetails += `Network Error or Timeout. `;
        }
        else if (!acceptableStatuses.includes(statusWithAuth)) {
            passed = false;
            errorCategory = 'WARNING';
            errorDetails += `Unexpected status code: ${statusWithAuth}. `;
        }
        return {
            endpoint: ep.fullPath,
            method: ep.method,
            statusWithoutAuth,
            statusWithAuth,
            responseSchema,
            passed,
            errorCategory,
            errorDetails: errorDetails.trim() || undefined
        };
    }
}
exports.RuntimeRunner = RuntimeRunner;
