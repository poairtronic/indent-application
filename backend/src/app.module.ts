import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { UsersModule } from './users/users.module';
import { ProcessesModule } from './processes/processes.module';
import { UnitsModule } from './units/units.module';
import { VendorsModule } from './vendors/vendors.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

import { BusinessTransactionModule } from './business-transaction/business-transaction.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CommunicationModule } from './communication/communication.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { MasterDataModule } from './master-data/master-data.module';
import { ReportsModule } from './reports/reports.module';
import { RedisCacheModule } from './redis-cache/redis-cache.module';
import { HttpCacheInterceptor } from './redis-cache/interceptors/http-cache.interceptor';
import { StorageModule } from './storage/storage.module';

import { ObservabilityModule } from './observability/observability.module';
import { CorrelationIdMiddleware } from './observability/correlation-id.middleware';
import { ApiMonitoringMiddleware } from './observability/api-monitoring.middleware';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    UsersModule,
    ProcessesModule,
    UnitsModule,
    VendorsModule,
    BusinessTransactionModule,
    AnalyticsModule,
    CommunicationModule,
    NotificationsModule,
    AuditModule,
    MasterDataModule,
    ReportsModule,
    RedisCacheModule,
    StorageModule,
    ObservabilityModule,
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000,
            limit: 300,
          },
        ],
        storage: process.env.NODE_ENV === 'production'
          ? new ThrottlerStorageRedisService(
              new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
                db: parseInt(process.env.REDIS_DB || '0', 10),
                tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
                keyPrefix: 'throttler:',
              }),
            )
          : undefined,
        getTracker: (req: Record<string, any>) => {
          return req.user?.id || req.ip;
        },
      }),
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware, ApiMonitoringMiddleware).forRoutes('*');
  }
}
