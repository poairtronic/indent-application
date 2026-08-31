import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { observabilityEventBus } from './observability-event-bus';
import { PrismaService } from '../prisma/prisma.service';

export interface SlowRequestInfo {
  method: string;
  url: string;
  duration: number;
  statusCode: number;
  timestamp: string;
}

export interface FailedDbQueryInfo {
  model: string;
  action: string;
  duration: number;
  error: string;
  timestamp: string;
}

export interface SlowDbQueryInfo {
  model: string;
  action: string;
  duration: number;
  timestamp: string;
}

export interface WorkflowTransitionInfo {
  fromState: string;
  toState: string;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: string;
}

export interface FrontendErrorInfo {
  type: string;
  message: string;
  stack: string;
  url: string;
  timestamp: string;
}

@Injectable()
export class ObservabilityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ObservabilityService.name);

  constructor(private readonly prismaService: PrismaService) {}

  // API Request Metrics
  private totalApiRequests = 0;
  private successApiRequests = 0;
  private errorApiRequests = 0;
  private apiStatusCodes: Record<number, number> = {};
  private apiLatencies: number[] = [];
  private slowRequests: SlowRequestInfo[] = [];

  // Database Metrics
  private totalDbQueries = 0;
  private successDbQueries = 0;
  private failedDbQueries = 0;
  private slowDbQueriesCount = 0;
  private dbLatencies: number[] = [];
  private dbFailuresHistory: FailedDbQueryInfo[] = [];
  private dbSlowQueriesHistory: SlowDbQueryInfo[] = [];
  private dbConnected = false;

  // Redis Cache Metrics
  private redisConnected = false;
  private redisCacheHits = 0;
  private redisCacheMisses = 0;
  private redisOpsTotal = 0;
  private redisOpsSuccess = 0;
  private redisOpsErrors = 0;
  private redisLatencies: number[] = [];
  private redisErrorsHistory: { error: string; timestamp: string }[] = [];

  // Workflow Stage Transitions Metrics
  private totalTransitions = 0;
  private successTransitions = 0;
  private failedTransitions = 0;
  private invalidTransitions = 0;
  private transitionLatencies: number[] = [];
  private transitionsHistory: WorkflowTransitionInfo[] = [];

  // Authentication Metrics
  private loginSuccessCount = 0;
  private loginFailureCount = 0;
  private refreshSuccessCount = 0;
  private refreshFailureCount = 0;
  private logoutCount = 0;
  private sessionRevocationCount = 0;

  // Notification Metrics
  private notificationsCreated = 0;
  private notificationsDelivered = 0;
  private notificationsFailed = 0;
  private notificationsRetried = 0;
  private notificationQueueFailures = 0;
  private unreadCountErrors = 0;

  // Frontend Errors
  private frontendErrorsHistory: FrontendErrorInfo[] = [];

  // Event handlers references
  private handlers: Record<string, (...args: any[]) => void> = {};

  onModuleInit() {
    this.registerEventListeners();
  }

  onModuleDestroy() {
    this.unregisterEventListeners();
  }

  private registerEventListeners() {
    // 1. API Requests
    this.handlers['api.request'] = (data: {
      method: string;
      url: string;
      statusCode: number;
      duration: number;
      success: boolean;
      isSlow: boolean;
    }) => {
      this.totalApiRequests++;
      if (data.success) this.successApiRequests++;
      else this.errorApiRequests++;

      this.apiStatusCodes[data.statusCode] = (this.apiStatusCodes[data.statusCode] || 0) + 1;
      this.apiLatencies.push(data.duration);
      if (this.apiLatencies.length > 1000) this.apiLatencies.shift();

      if (data.isSlow) {
        this.slowRequests.push({
          method: data.method,
          url: data.url,
          duration: data.duration,
          statusCode: data.statusCode,
          timestamp: new Date().toISOString(),
        });
        if (this.slowRequests.length > 50) this.slowRequests.shift();
      }
    };

    // 2. Database Queries
    this.handlers['db.query'] = (data: {
      model: string;
      action: string;
      duration: number;
      success: boolean;
      error?: string;
    }) => {
      this.totalDbQueries++;
      this.dbConnected = true;
      if (data.success) {
        this.successDbQueries++;
      } else {
        this.failedDbQueries++;
        this.dbFailuresHistory.push({
          model: data.model || 'N/A',
          action: data.action || 'N/A',
          duration: data.duration,
          error: data.error || 'Unknown Error',
          timestamp: new Date().toISOString(),
        });
        if (this.dbFailuresHistory.length > 50) this.dbFailuresHistory.shift();
      }

      this.dbLatencies.push(data.duration);
      if (this.dbLatencies.length > 1000) this.dbLatencies.shift();

      const env = process.env.NODE_ENV || 'development';
      const dbSlowThreshold = parseInt(
        process.env.SLOW_DB_QUERY_THRESHOLD_MS || (env === 'production' ? '50' : '200'),
        10,
      );
      if (data.duration > dbSlowThreshold) {
        this.slowDbQueriesCount++;
        this.dbSlowQueriesHistory.push({
          model: data.model || 'N/A',
          action: data.action || 'N/A',
          duration: data.duration,
          timestamp: new Date().toISOString(),
        });
        if (this.dbSlowQueriesHistory.length > 50) this.dbSlowQueriesHistory.shift();
      }
    };

    this.handlers['db.connection'] = (data: { connected: boolean }) => {
      this.dbConnected = data.connected;
    };

    // 3. Redis Cache
    this.handlers['redis.op'] = (data: {
      operation: string;
      success: boolean;
      duration: number;
      hitOrMiss?: 'hit' | 'miss';
      error?: string;
    }) => {
      this.redisOpsTotal++;
      this.redisConnected = true;
      if (data.success) {
        this.redisOpsSuccess++;
        if (data.hitOrMiss === 'hit') this.redisCacheHits++;
        else if (data.hitOrMiss === 'miss') this.redisCacheMisses++;
      } else {
        this.redisOpsErrors++;
        this.redisErrorsHistory.push({
          error: data.error || 'Cache Operation Failure',
          timestamp: new Date().toISOString(),
        });
        if (this.redisErrorsHistory.length > 50) this.redisErrorsHistory.shift();
      }

      this.redisLatencies.push(data.duration);
      if (this.redisLatencies.length > 1000) this.redisLatencies.shift();
    };

    this.handlers['redis.connection'] = (data: { connected: boolean; error?: string }) => {
      this.redisConnected = data.connected;
      if (data.error) {
        this.redisErrorsHistory.push({
          error: `Connection Error: ${data.error}`,
          timestamp: new Date().toISOString(),
        });
        if (this.redisErrorsHistory.length > 50) this.redisErrorsHistory.shift();
      }
    };

    // 4. Workflow Stage Transitions
    this.handlers['workflow.transition'] = (data: {
      fromState: string;
      toState: string;
      success: boolean;
      duration: number;
      error?: string;
    }) => {
      this.totalTransitions++;
      if (data.success) this.successTransitions++;
      else this.failedTransitions++;

      if (data.error && data.error.includes('Cannot transition')) {
        this.invalidTransitions++;
      }

      this.transitionLatencies.push(data.duration);
      if (this.transitionLatencies.length > 1000) this.transitionLatencies.shift();

      this.transitionsHistory.push({
        fromState: data.fromState,
        toState: data.toState,
        success: data.success,
        duration: data.duration,
        error: data.error,
        timestamp: new Date().toISOString(),
      });
      if (this.transitionsHistory.length > 50) this.transitionsHistory.shift();
    };

    // 5. Authentication
    this.handlers['auth.event'] = (data: {
      action: 'login' | 'refresh' | 'logout' | 'session_revocation';
      success: boolean;
      error?: string;
    }) => {
      if (data.action === 'login') {
        if (data.success) this.loginSuccessCount++;
        else this.loginFailureCount++;
      } else if (data.action === 'refresh') {
        if (data.success) this.refreshSuccessCount++;
        else this.refreshFailureCount++;
      } else if (data.action === 'logout') {
        this.logoutCount++;
      } else if (data.action === 'session_revocation') {
        this.sessionRevocationCount++;
      }
    };

    // 6. Notifications
    this.handlers['notification.event'] = (data: {
      action: 'created' | 'delivered' | 'failed' | 'retried' | 'unread_error' | 'queue_failure';
      success: boolean;
      attempt?: number;
      error?: string;
    }) => {
      if (data.action === 'created') this.notificationsCreated++;
      else if (data.action === 'delivered') this.notificationsDelivered++;
      else if (data.action === 'failed') this.notificationsFailed++;
      else if (data.action === 'retried') this.notificationsRetried++;
      else if (data.action === 'queue_failure') this.notificationQueueFailures++;
      else if (data.action === 'unread_error') this.unreadCountErrors++;
    };

    // 7. Frontend Errors
    this.handlers['frontend.error'] = (data: FrontendErrorInfo) => {
      this.frontendErrorsHistory.push({
        type: data.type,
        message: data.message,
        stack: data.stack,
        url: data.url,
        timestamp: data.timestamp || new Date().toISOString(),
      });
      if (this.frontendErrorsHistory.length > 50) this.frontendErrorsHistory.shift();
    };

    // Bind listeners
    for (const [event, handler] of Object.entries(this.handlers)) {
      observabilityEventBus.on(event, handler);
    }
  }

  private unregisterEventListeners() {
    for (const [event, handler] of Object.entries(this.handlers)) {
      observabilityEventBus.off(event, handler);
    }
  }

  // Latency percentiles helper
  private calculatePercentiles(latencies: number[]): { p95: number; p99: number } {
    if (latencies.length === 0) return { p95: 0, p99: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const p95Idx = Math.floor(sorted.length * 0.95);
    const p99Idx = Math.floor(sorted.length * 0.99);
    return {
      p95: sorted[p95Idx] ?? sorted[sorted.length - 1],
      p99: sorted[p99Idx] ?? sorted[sorted.length - 1],
    };
  }

  // Public telemetry API for frontend errors controller
  public recordFrontendError(error: FrontendErrorInfo) {
    observabilityEventBus.emit('frontend.error', error);
  }

  // Diagnostic getter for Readiness Probe
  public async getSystemStatuses(): Promise<{
    database: 'UP' | 'DOWN';
    queue: 'UP' | 'DOWN';
  }> {
    // Perform live, lightweight checks against the actual dependencies instead
    // of relying only on in-memory event flags (those flags can remain false if
    // the connection event fired before this service registered its listeners).
    let database: 'UP' | 'DOWN' = 'DOWN';
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      database = 'UP';
    } catch {
      database = 'DOWN';
    }

    let queue: 'UP' | 'DOWN' = 'DOWN';
    try {
      await this.prismaService.$queryRaw`SELECT 1 FROM "email_jobs" LIMIT 1`;
      queue = 'UP';
    } catch {
      queue = 'DOWN';
    }

    return {
      database,
      queue,
    };
  }

  // Private stats fetcher for metrics dashboard
  public getMetrics() {
    const apiPercentiles = this.calculatePercentiles(this.apiLatencies);
    const dbPercentiles = this.calculatePercentiles(this.dbLatencies);
    const redisPercentiles = this.calculatePercentiles(this.redisLatencies);
    const workflowPercentiles = this.calculatePercentiles(this.transitionLatencies);

    const apiAverage =
      this.apiLatencies.length > 0
        ? Math.round(
            this.apiLatencies.reduce((sum, val) => sum + val, 0) / this.apiLatencies.length,
          )
        : 0;

    const dbAverage =
      this.dbLatencies.length > 0
        ? Math.round(this.dbLatencies.reduce((sum, val) => sum + val, 0) / this.dbLatencies.length)
        : 0;

    const redisAverage =
      this.redisLatencies.length > 0
        ? Math.round(
            this.redisLatencies.reduce((sum, val) => sum + val, 0) / this.redisLatencies.length,
          )
        : 0;

    // Cache hit rate calculation
    const cacheOps = this.redisCacheHits + this.redisCacheMisses;
    const cacheHitRate =
      cacheOps > 0 ? parseFloat(((this.redisCacheHits / cacheOps) * 100).toFixed(2)) : 0;

    return {
      systemHealth: {
        app: 'UP',
        database: this.dbConnected ? 'UP' : 'DOWN',
        redis: this.redisConnected ? 'UP' : 'DOWN',
      },
      apiMetrics: {
        totalRequests: this.totalApiRequests,
        successRequests: this.successApiRequests,
        errorRequests: this.errorApiRequests,
        errorRate:
          this.totalApiRequests > 0
            ? parseFloat(((this.errorApiRequests / this.totalApiRequests) * 100).toFixed(2))
            : 0,
        averageLatencyMs: apiAverage,
        p95Ms: apiPercentiles.p95,
        p99Ms: apiPercentiles.p99,
        statusCodes: this.apiStatusCodes,
        slowRequestsHistory: [...this.slowRequests].reverse(),
      },
      databaseMetrics: {
        totalQueries: this.totalDbQueries,
        successQueries: this.successDbQueries,
        failedQueries: this.failedDbQueries,
        slowQueriesCount: this.slowDbQueriesCount,
        averageLatencyMs: dbAverage,
        p95Ms: dbPercentiles.p95,
        p99Ms: dbPercentiles.p99,
        failuresHistory: [...this.dbFailuresHistory].reverse(),
        slowQueriesHistory: [...this.dbSlowQueriesHistory].reverse(),
      },
      redisMetrics: {
        connected: this.redisConnected,
        cacheHits: this.redisCacheHits,
        cacheMisses: this.redisCacheMisses,
        hitRatePercentage: cacheHitRate,
        totalOps: this.redisOpsTotal,
        successOps: this.redisOpsSuccess,
        errorOps: this.redisOpsErrors,
        averageLatencyMs: redisAverage,
        p95Ms: redisPercentiles.p95,
        errorsHistory: [...this.redisErrorsHistory].reverse(),
      },
      workflowMetrics: {
        totalTransitions: this.totalTransitions,
        successTransitions: this.successTransitions,
        failedTransitions: this.failedTransitions,
        invalidTransitions: this.invalidTransitions,
        averageDurationMs: workflowPercentiles.p95, // Representing processing execution latency P95
        history: [...this.transitionsHistory].reverse(),
      },
      authMetrics: {
        loginSuccess: this.loginSuccessCount,
        loginFailure: this.loginFailureCount,
        refreshSuccess: this.refreshSuccessCount,
        refreshFailure: this.refreshFailureCount,
        logout: this.logoutCount,
        sessionRevocations: this.sessionRevocationCount,
      },
      notificationMetrics: {
        created: this.notificationsCreated,
        delivered: this.notificationsDelivered,
        failed: this.notificationsFailed,
        retried: this.notificationsRetried,
        queueFailures: this.notificationQueueFailures,
        unreadErrors: this.unreadCountErrors,
      },
      nodeMetrics: {
        uptimeSeconds: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      frontendErrors: {
        totalErrors: this.frontendErrorsHistory.length,
        history: [...this.frontendErrorsHistory].reverse(),
      },
    };
  }
}
