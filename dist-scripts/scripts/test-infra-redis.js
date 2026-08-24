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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function testConnection() {
    console.log('Testing Infra Redis connection...');
    const host = process.env.INFRA_REDIS_HOST || process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.INFRA_REDIS_PORT || process.env.REDIS_PORT || '6379', 10);
    const password = process.env.INFRA_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined;
    const db = parseInt(process.env.INFRA_REDIS_DB || process.env.REDIS_DB || '0', 10);
    const useTls = (process.env.INFRA_REDIS_TLS || process.env.REDIS_TLS) === 'true';
    const client = new ioredis_1.default({
        host,
        port,
        password,
        db,
        tls: useTls ? {} : undefined,
        lazyConnect: true,
        connectTimeout: 5000,
        maxRetriesPerRequest: null,
    });
    client.on('error', (err) => {
        console.error('Connection failed:', err.message);
    });
    try {
        await client.connect();
        console.log('Successfully connected to Infra Redis!');
        const ping = await client.ping();
        console.log('PING response:', ping);
        console.log('Testing reconnect behavior...');
        await client.quit();
        console.log('Test completed successfully.');
    }
    catch (err) {
        console.error('Test failed:', err.message);
    }
    finally {
        client.disconnect();
    }
}
testConnection();
