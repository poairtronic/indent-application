import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LegacyRouteConverter } from '@nestjs/core/router/legacy-route-converter';
import { google } from 'googleapis';
import { TemplateEngine } from './templates/template.engine';
import { CommunicationController } from './communication.controller';
import { GmailApiProvider } from './providers/gmail-api.provider';
import { mailQueueEventBus } from './queue/mail-queue.event-bus';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Deployment & Communication Production Fixes Verification', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TemplateEngine ignores empty directories lacking .hbs files and renders material_issue_overdue via fallback', () => {
    const tempEmptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-tpl-'));
    try {
      const engine = new TemplateEngine();
      // Point resolved dir to an empty dir (simulating uncopied dist/) and verify hasTemplatesOnDisk rejects it
      expect((engine as any).hasTemplatesOnDisk(tempEmptyDir)).toBe(false);

      // Force inline fallback mode and verify material_issue_overdue renders without throwing
      (engine as any).templatesDir = '';
      const html = engine.render('material_issue_overdue', {
        indentNumber: 'AGIPL-IND-2026-001',
        productName: 'Industrial Valve',
        totalRemaining: 12,
        transactionUrl: 'https://indent-application-frontend.onrender.com/indents/123',
      });
      expect(html).toContain('Material Issue Overdue');
      expect(html).toContain('AGIPL-IND-2026-001');
      expect(html).toContain('Industrial Valve');
    } finally {
      fs.rmSync(tempEmptyDir, { recursive: true, force: true });
    }
  });

  it('TemplateEngine resolves src/communication/templates with material_issue_overdue.hbs on disk', () => {
    const engine = new TemplateEngine();
    const html = engine.render('material_issue_overdue', {
      indentNumber: 'AGIPL-IND-2026-002',
      productName: 'Hydraulic Pump',
      storesProcessingStartedAt: '2026-11-24',
      overdueSince: '2026-11-26',
      outstandingMaterials: [
        { materialName: 'Steel Rod', requiredQty: 10, issuedQty: 4, remainingQty: 6 },
      ],
      totalRemaining: 6,
      transactionUrl: 'https://indent-application-frontend.onrender.com/indents/456',
    });
    expect(html).toContain('OVERDUE MATERIAL ISSUE ALERT');
    expect(html).toContain('Steel Rod');
  });

  it('CommunicationController.retryFailedEmails emits wakeup event on mailQueueEventBus', async () => {
    const mockPrisma: any = {
      emailJob: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      emailLog: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const controller = new CommunicationController(mockPrisma, {} as any, {} as any, {} as any);

    const emitSpy = jest.spyOn(mailQueueEventBus, 'emitWakeup');
    const result = await controller.retryFailedEmails();

    expect(result.success).toBe(true);
    expect(result.jobsRequeued).toBe(4);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('AppModule configures middleware with named wildcard {*path} causing zero LegacyRouteConverter warnings', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    const legacyWarnSpy = jest
      .spyOn(LegacyRouteConverter, 'printWarning')
      .mockImplementation(() => {});

    const forRoutes = jest.fn();
    const apply = jest.fn().mockReturnValue({ forRoutes });
    const appModule = new AppModule();
    appModule.configure({ apply } as any);

    expect(forRoutes).toHaveBeenCalledWith('{*path}');

    const converted = LegacyRouteConverter.tryConvert('/api/{*path}');
    expect(converted).toBe('/api/{*path}');
    expect(legacyWarnSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('NestJS ExpressAdapter app initialization with global prefix /api produces zero LegacyRouteConverter warnings', async () => {
    const legacyWarnSpy = jest.spyOn(LegacyRouteConverter, 'printWarning');
    const legacyErrorSpy = jest.spyOn(LegacyRouteConverter, 'printError');

    const mockPrisma: any = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([]),
      $executeRaw: jest.fn().mockResolvedValue(0),
      emailJob: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      applicationSetting: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    try {
      expect(legacyWarnSpy).not.toHaveBeenCalled();
      expect(legacyErrorSpy).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('GmailApiProvider forwards AbortSignal to gmail.users.messages.send and rejects pre-aborted signals', async () => {
    const prevEnv = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
      GOOGLE_GMAIL_USER: process.env.GOOGLE_GMAIL_USER,
    };
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh-token';
    process.env.GOOGLE_GMAIL_USER = 'sender@example.com';

    const sendMock = jest.fn().mockResolvedValue({ data: { id: 'gmail-msg-1' } });
    jest.spyOn(google, 'gmail').mockReturnValue({
      users: { messages: { send: sendMock } },
    } as any);

    try {
      const provider = new GmailApiProvider();
      const controller = new AbortController();

      const res = await provider.sendEmail({
        to: 'recipient@example.com',
        subject: 'AbortSignal Forward Test',
        body: 'Body text',
        signal: controller.signal,
      });

      expect(res.success).toBe(true);
      expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 'me' }), {
        signal: controller.signal,
      });

      // Verify pre-aborted signal prevents network call
      sendMock.mockClear();
      controller.abort();
      await expect(
        provider.sendEmail({
          to: 'recipient@example.com',
          subject: 'Already Aborted',
          body: 'Body text',
          signal: controller.signal,
        }),
      ).rejects.toThrow(/aborted/i);
      expect(sendMock).not.toHaveBeenCalled();
    } finally {
      Object.entries(prevEnv).forEach(([k, v]) => {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      });
    }
  });
});
