import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationService } from '../communication.service';
import { NodemailerProvider } from '../providers/nodemailer.provider';
import { TemplateEngine } from '../templates/template.engine';
import { RecipientResolver } from '../resolver/recipient.resolver';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationEventBus, CommunicationEventType } from '../events/communication-event.bus';
import { NotificationDispatcher } from '../dispatcher/notification.dispatcher';
import {
  TemplateNotFoundException,
  InvalidRecipientException,
} from '../exceptions/communication.exceptions';

// ─────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  indent: {
    findUnique: jest.fn(),
  },
  emailLog: {
    create: jest.fn(),
  },
};

const mockNodemailerProvider = {
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
};

describe('Enterprise Communication Module', () => {
  let service: CommunicationService;
  let engine: TemplateEngine;
  let resolver: RecipientResolver;
  let bus: CommunicationEventBus;
  let dispatcher: NotificationDispatcher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        TemplateEngine,
        RecipientResolver,
        CommunicationEventBus,
        NotificationDispatcher,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NodemailerProvider, useValue: mockNodemailerProvider },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
    engine = module.get<TemplateEngine>(TemplateEngine);
    resolver = module.get<RecipientResolver>(RecipientResolver);
    bus = module.get<CommunicationEventBus>(CommunicationEventBus);
    dispatcher = module.get<NotificationDispatcher>(NotificationDispatcher);

    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // 1. Template Engine Tests
  // ─────────────────────────────────────────────

  describe('TemplateEngine', () => {
    it('should successfully compile welcome template with inline context data', () => {
      const html = engine.render('welcome', { name: 'Sanjay Kumar', employeeCode: 'EMP-909' });
      expect(html).toContain('Sanjay Kumar');
      expect(html).toContain('EMP-909');
    });

    it('should throw TemplateNotFoundException for non-existent templates', () => {
      expect(() => engine.render('non_existent_template')).toThrow(TemplateNotFoundException);
    });

    it('should include the brand name header partial in the layout output', () => {
      const html = engine.render('welcome', { name: 'Sanjay' });
      expect(html).toContain('IMCMS ERP'); // from header partial file
    });
  });

  // ─────────────────────────────────────────────
  // 2. Recipient Resolver Tests
  // ─────────────────────────────────────────────

  describe('RecipientResolver', () => {
    it('should resolve multiple user IDs to email list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'user1@imcms.com' },
        { email: 'user2@imcms.com' },
      ]);

      const result = await resolver.resolve({ userId: ['uuid-1', 'uuid-2'] });
      expect(result).toHaveLength(2);
      expect(result).toContain('user1@imcms.com');
      expect(result).toContain('user2@imcms.com');
    });

    it('should resolve department code designers successfully', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ email: 'designer@imcms.com' }]);

      const result = await resolver.resolve({ departmentCode: 'DESIGN' });
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('designer@imcms.com');
    });

    it('should resolve role names to email list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ email: 'manager@imcms.com' }]);

      const result = await resolver.resolve({ roleName: 'Senior Manager' });
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('manager@imcms.com');
    });

    it('should throw InvalidRecipientException if resolver resolves invalid emails', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ email: 'invalid-email-format' }]);
      await expect(resolver.resolve({ roleName: 'Senior Manager' })).rejects.toThrow(
        InvalidRecipientException,
      );
    });
  });

  // ─────────────────────────────────────────────
  // 3. Communication Service Tests
  // ─────────────────────────────────────────────

  describe('CommunicationService', () => {
    it('should resolve, render, send, and log email transactions successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-uuid' });
      mockPrisma.emailLog.create.mockResolvedValue({ id: 'log-uuid' });

      const result = await service.sendEmail({
        to: 'recipient@imcms.com',
        subject: 'Welcome to ERP',
        templateName: 'welcome',
        templateContext: { name: 'Recipient' },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockNodemailerProvider.sendEmail).toHaveBeenCalled();
      expect(mockPrisma.emailLog.create).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // 4. Event Bus and Dispatcher Tests
  // ─────────────────────────────────────────────

  describe('CommunicationEventBus & Dispatcher', () => {
    it('should trigger email send when an event is emitted on the event bus', async () => {
      dispatcher.onModuleInit();
      const sendSpy = jest
        .spyOn(service, 'sendEmail')
        .mockResolvedValue({ success: true, messageId: '1' });

      bus.emit(CommunicationEventType.USER_REGISTERED, {
        email: 'test@imcms.com',
        firstName: 'Test',
        lastName: 'User',
        employeeCode: 'EMP-111',
        departmentName: 'Design',
        roleName: 'Engineer',
        loginUrl: 'http://login',
      });

      // Allow microtask queue to run event subscription handlers
      await new Promise(process.nextTick);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@imcms.com',
          templateName: 'welcome',
        }),
      );

      dispatcher.onModuleDestroy();
    });
  });
});
