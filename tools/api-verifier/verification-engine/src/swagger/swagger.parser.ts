import axios from 'axios';
import { SwaggerEndpoint } from '../types';

export class SwaggerParser {
  private swaggerUrl: string;

  constructor(swaggerUrl: string = 'http://localhost:3001/api-json') {
    this.swaggerUrl = swaggerUrl;
  }

  public async fetchAndParse(): Promise<SwaggerEndpoint[]> {
    let spec: any;
    
    // Try the default URL, fallback to common ones
    const urlsToTry = [
      this.swaggerUrl,
      this.swaggerUrl.replace('/api-json', '/swagger-json'),
      this.swaggerUrl.replace('/api-json', '/openapi.json'),
      this.swaggerUrl.replace('/api-json', '/api/docs-json')
    ];

    for (const url of urlsToTry) {
      try {
        console.log(`[Swagger] Attempting to fetch OpenAPI spec from ${url}...`);
        const res = await axios.get(url, { timeout: 3000 });
        spec = res.data;
        break;
      } catch (e) {
        // Continue trying
      }
    }

    if (!spec || !spec.paths) {
      throw new Error(`[Swagger] Could not fetch valid OpenAPI spec from any known endpoints.`);
    }

    console.log(`[Swagger] Successfully fetched OpenAPI spec. Parsing endpoints...`);
    const endpoints: SwaggerEndpoint[] = [];

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods as any)) {
        
        // Extract DTO ref from Request Body
        let requestBodySchema: string | undefined;
        if (operation.requestBody?.content?.['application/json']?.schema?.$ref) {
          const ref = operation.requestBody.content['application/json'].schema.$ref;
          requestBodySchema = ref.split('/').pop();
        }

        // Extract DTO refs from Responses
        const responseSchemas: Record<string, string> = {};
        if (operation.responses) {
          for (const [statusCode, resBody] of Object.entries(operation.responses as any)) {
            if (resBody.content?.['application/json']?.schema?.$ref) {
              const ref = resBody.content['application/json'].schema.$ref;
              responseSchemas[statusCode] = ref.split('/').pop();
            }
          }
        }

        // Check for security
        const isProtected = Array.isArray(operation.security) && operation.security.length > 0;

        endpoints.push({
          path,
          method: method.toUpperCase(),
          summary: operation.summary,
          operationId: operation.operationId,
          tags: operation.tags,
          parameters: operation.parameters || [],
          requestBodySchema,
          responseSchemas,
          isProtected
        });
      }
    }

    return endpoints;
  }
}
