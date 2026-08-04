import type { InternalAxiosRequestConfig } from 'axios';
import { apiConfig } from '../config';
import { CLIENT_VERSION, APP_NAME, getClientTimezone, getClientLocale } from '../utils/context';

export function createHeaderInterceptor() {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (!config.headers) return config;

    config.headers['X-Client-Version'] = CLIENT_VERSION;
    config.headers['X-App-Name'] = APP_NAME;
    config.headers['X-Timezone'] = getClientTimezone();
    config.headers['X-Locale'] = getClientLocale();
    config.headers['X-API-Version'] = apiConfig.version;

    const metadata = config.metadata;
    if (metadata) {
      if (metadata.correlationId) {
        config.headers['X-Correlation-ID'] = metadata.correlationId;
      }
      if (metadata.requestId) {
        config.headers['X-Request-ID'] = metadata.requestId;
      }
    }

    return config;
  };
}
