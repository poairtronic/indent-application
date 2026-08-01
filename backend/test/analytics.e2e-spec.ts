import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AnalyticsModule } from '../src/analytics/analytics.module';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { ExecutionContext } from '@nestjs/common';

describe('AnalyticsController (Integration/e2e)', () => {
  let app: INestApplication<App>;
  const mockAnalyticsService = {
    getExecutiveSummary: jest.fn().mockResolvedValue({ totalTransactions: 10 }),
    getWorkflowAnalytics: jest.fn().mockResolvedValue({ completionRate: 75.5 }),
    getDepartmentAnalytics: jest.fn().mockResolvedValue({ departments: [] }),
    getCostAnalytics: jest.fn().mockResolvedValue({ totalPlannedCost: 5000 }),
    getProductAnalytics: jest.fn().mockResolvedValue({ products: [] }),
    getVendorAnalytics: jest.fn().mockResolvedValue({ vendors: [] }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AnalyticsModule],
    })
      .overrideProvider(AnalyticsService)
      .useValue(mockAnalyticsService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user-uuid-1234', role: 'Senior Manager' };
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({
        canActivate: () => true, // bypass permission checks for routing integration tests
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/analytics/summary (GET) should return executive summary', () => {
    return request(app.getHttpServer())
      .get('/analytics/summary')
      .expect(200)
      .expect({ totalTransactions: 10 });
  });

  it('/analytics/workflow (GET) should return workflow analytics', () => {
    return request(app.getHttpServer())
      .get('/analytics/workflow')
      .expect(200)
      .expect({ completionRate: 75.5 });
  });

  it('/analytics/departments (GET) should return department workload metrics', () => {
    return request(app.getHttpServer())
      .get('/analytics/departments')
      .expect(200)
      .expect({ departments: [] });
  });

  it('/analytics/costs (GET) should accept valid query params and return cost metrics', () => {
    return request(app.getHttpServer())
      .get('/analytics/costs?from=2025-01-01T00:00:00.000Z&to=2025-12-31T23:59:59.000Z')
      .expect(200)
      .expect({ totalPlannedCost: 5000 });
  });

  it('/analytics/costs (GET) should reject invalid date query params', () => {
    return request(app.getHttpServer()).get('/analytics/costs?from=invalid-date').expect(400);
  });

  it('/analytics/products (GET) should return product intelligence', () => {
    return request(app.getHttpServer())
      .get('/analytics/products?limit=10')
      .expect(200)
      .expect({ products: [] });
  });

  it('/analytics/products (GET) should reject out of range limit parameter', () => {
    return request(app.getHttpServer()).get('/analytics/products?limit=999').expect(400);
  });

  it('/analytics/vendors (GET) should return vendor analysis summary', () => {
    return request(app.getHttpServer())
      .get('/analytics/vendors')
      .expect(200)
      .expect({ vendors: [] });
  });
});
