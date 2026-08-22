import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisCacheService } from '../redis-cache.service';
import { CACHE_PREFIX_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: RedisCacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const handler = context.getHandler();
    const prefix = this.reflector.get<string>(CACHE_PREFIX_METADATA, handler);
    const ttlSeconds = this.reflector.get<number>(CACHE_TTL_METADATA, handler);

    if (!prefix) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest();
    const query = req.query || {};

    // Master data (units, processes, materials, etc.) is the same for all users -
    // permissions are checked separately by the guard. Skip user-specific cache key
    // for master data to maximize cache hit rate across all users.
    const isMasterData = prefix.startsWith('master:');

    // Build deterministic query parameters key parts
    const sortedQuery = Object.keys(query)
      .sort()
      .map((key) => `${key}=${query[key]}`)
      .join('&');

    let cacheKey: string;
    if (isMasterData) {
      // Master data: same cache for all users, only vary by query params
      cacheKey = `${prefix}:${sortedQuery || 'no_query'}`;
    } else if (prefix.startsWith('user:')) {
      // User-specific data (e.g. notifications)
      const user = req.user;
      const userId = user?.id || 'anon';
      cacheKey = `${prefix}:${userId}:${sortedQuery || 'no_query'}`;
    } else {
      // Analytics/reports: include user context for role-based data
      const user = req.user;
      let userPart = 'anon';
      if (user) {
        const deptCode = user.department?.departmentCode || 'NO_DEPT';
        const deptId = user.departmentId || user.department?.id || 'NO_DEPT_ID';
        const isAdmin = user.permissions?.includes('settings.manage') ? '1' : '0';
        userPart = `dept=${deptCode}:${deptId}:admin=${isAdmin}`;
      }
      cacheKey = `${prefix}:${userPart}:${sortedQuery || 'no_query'}`;
    }

    // Try to hit the cache
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData !== null) {
      return of(cachedData);
    }

    // If cache miss, execute the route handler and cache the response
    return next.handle().pipe(
      tap(async (response) => {
        if (response !== undefined && response !== null) {
          await this.cacheService.set(cacheKey, response, ttlSeconds);
        }
      }),
    );
  }
}
