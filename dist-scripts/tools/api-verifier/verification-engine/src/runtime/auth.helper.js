"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHelper = void 0;
const axios_1 = __importDefault(require("axios"));
class AuthHelper {
    baseUrl;
    token = null;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async getValidToken() {
        if (this.token)
            return this.token;
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/auth/login`, {
                username: 'admin',
                password: 'password'
            });
            this.token = response.data.token || response.data.accessToken || null;
            return this.token;
        }
        catch (e) {
            console.warn(`[Runtime] Failed to auto-authenticate. Using mock JWT if needed.`);
            // Mock standard JWT format just in case auth/login fails
            return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.mocksignature';
        }
    }
}
exports.AuthHelper = AuthHelper;
