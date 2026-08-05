import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
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
  ],
  controllers: [],
  providers: [
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
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
