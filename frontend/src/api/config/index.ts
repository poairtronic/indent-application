import type { ClientConfig } from '../types/client';

export type Environment = 'development' | 'testing' | 'production';

interface EnvironmentConfig {
  api: ClientConfig;
  features: {
    enableRequestLogging: boolean;
    enableResponseLogging: boolean;
    enableErrorReporting: boolean;
  };
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_VERSION = 'v1';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

function getSocketUrl(): string {
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
}

function getEnvironment(): Environment {
  const mode = import.meta.env.MODE;
  if (mode === 'production') return 'production';
  if (mode === 'test') return 'testing';
  return 'development';
}

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    api: {
      baseURL: getApiBaseUrl(),
      timeout: DEFAULT_TIMEOUT,
      version: DEFAULT_VERSION,
      environment: 'development',
    },
    features: {
      enableRequestLogging: true,
      enableResponseLogging: true,
      enableErrorReporting: false,
    },
  },
  testing: {
    api: {
      baseURL: getApiBaseUrl(),
      timeout: DEFAULT_TIMEOUT,
      version: DEFAULT_VERSION,
      environment: 'testing',
    },
    features: {
      enableRequestLogging: false,
      enableResponseLogging: false,
      enableErrorReporting: true,
    },
  },
  production: {
    api: {
      baseURL: getApiBaseUrl(),
      timeout: DEFAULT_TIMEOUT,
      version: DEFAULT_VERSION,
      environment: 'production',
    },
    features: {
      enableRequestLogging: false,
      enableResponseLogging: false,
      enableErrorReporting: true,
    },
  },
};

export const config = configs[getEnvironment()];

export const apiConfig = config.api;

export const featureFlags = config.features;

export const socketUrl = getSocketUrl();

export const environment = getEnvironment();
