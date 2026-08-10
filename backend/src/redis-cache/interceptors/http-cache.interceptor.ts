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
    const user = req.user;
    const query = req.query || {};

    // 1. Build deterministic user context key parts
    let userPart = 'anon';
    if (user) {
      const deptCode = user.department?.departmentCode || 'NO_DEPT';
      const deptId = user.departmentId || user.department?.id || 'NO_DEPT_ID';
      const isAdmin = user.permissions?.includes('settings.manage') ? '1' : '0';
      const isManager = deptCode === 'SMGR' || deptCode === 'GMGR' ? '1' : '0';
      const hasFinancialAccess =
        isAdmin === '1' || isManager === '1' || deptCode === 'ACCT' ? '1' : '0';
      const hasWorkflowAccess =
        isAdmin === '1' || isManager === '1' || deptCode === 'DSGN' || deptCode === 'STOR'
          ? '1'
          : '0';

      userPart = `deptCode=${deptCode}:deptId=${deptId}:isAdmin=${isAdmin}:isManager=${isManager}:hasFin=${hasFinancialAccess}:hasWork=${hasWorkflowAccess}`;
    }

    // 2. Build deterministic query parameters key parts
    const sortedQuery = Object.keys(query)
      .sort()
      .map((key) => `${key}=${query[key]}`)
      .join('&');

    const cacheKey = `${prefix}:${userPart}:${sortedQuery || 'no_query'}`;

    // 3. Try to hit the cache
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData !== null) {
      this.logger.log(`Cache HIT on key: ${cacheKey}`);
      return of(cachedData);
    }

    this.logger.log(`Cache MISS on key: ${cacheKey}. Fetching from database.`);

    // 4. If cache miss, execute the route handler and cache the response
    return next.handle().pipe(
      tap(async (response) => {
        if (response !== undefined && response !== null) {
          await this.cacheService.set(cacheKey, response, ttlSeconds);
        }
      }),
    );
  }
}
