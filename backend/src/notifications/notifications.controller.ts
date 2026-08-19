import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis-cache/redis-cache.service';
import { Request } from 'express';
import { NotificationQueryDto } from '../common/dto/pagination-query.dto';

// ──────────────────────────────────────────────────────────────
// DEPARTMENT / ROLE → ALLOWED EVENT TYPES (eventType-based)
// ──────────────────────────────────────────────────────────────
const DEPT_EVENT_MAP: Record<string, string[]> = {
  DESIGN: ['ACTUAL_COST_UPDATED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'DOCUMENT_REPLACED'],
  DSGN: ['ACTUAL_COST_UPDATED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'DOCUMENT_REPLACED'],
  STORES: ['DESIGN_COMPLETED', 'STORES_PENDING'],
  STOR: ['DESIGN_COMPLETED', 'STORES_PENDING'],
  PRODUCTION: ['MATERIAL_ISSUED', 'PRODUCTION_STARTED', 'PRODUCTION_COMPLETED'],
  PROD: ['MATERIAL_ISSUED', 'PRODUCTION_STARTED', 'PRODUCTION_COMPLETED'],
  ACCOUNTS: [
    'PRODUCTION_COMPLETED',
    'ACCOUNTS_COST_VERIFICATION',
    'ACTUAL_COST_UPDATED',
    'FINANCIAL_CLOSURE',
    'DOCUMENT_UPLOADED',
  ],
  ACCT: [
    'PRODUCTION_COMPLETED',
    'ACCOUNTS_COST_VERIFICATION',
    'ACTUAL_COST_UPDATED',
    'FINANCIAL_CLOSURE',
    'DOCUMENT_UPLOADED',
  ],
};

const MANAGER_EVENT_TYPES = [
  'INDENT_SUBMITTED',
  'DESIGN_COMPLETED',
  'STORES_PENDING',
  'MATERIAL_ISSUED',
  'PRODUCTION_STARTED',
  'PRODUCTION_COMPLETED',
  'ACCOUNTS_COST_VERIFICATION',
  'ACTUAL_COST_UPDATED',
  'FINANCIAL_CLOSURE',
  'TRANSACTION_ARCHIVED',
  'TRANSACTION_COMPLETED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_DELETED',
  'DOCUMENT_REPLACED',
];

/**
 * Resolves allowed eventTypes for a user based on department code and role.
 * Returns null for admin (no restriction needed).
 */
function resolveAllowedEventTypes(
  roleName: string | undefined,
  deptCode: string | undefined,
): string[] | null {
  const isAdmin = roleName?.toUpperCase() === 'ADMIN' || roleName === 'System Administrator';
  if (isAdmin) return null; // Admin: unrestricted

  if (roleName === 'Senior Manager' || roleName === 'General Manager') {
    return MANAGER_EVENT_TYPES;
  }

  const upperDept = deptCode?.toUpperCase() ?? '';
  return DEPT_EVENT_MAP[upperDept] || [];
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
  ) {}

  @Get()
  @Permissions('notifications.view')
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  async list(@Req() req: Request, @Query() query: NotificationQueryDto) {
    const userId = (req as any).user?.id;
    const pageNum = query.page || 1;
    const limitNum = query.limit || 20;
    const isRead = query.isRead;
    const eventTypeFilter = query.eventType;
    const offset = (pageNum - 1) * limitNum;

    // Use user info from JWT (already validated and cached) instead of re-querying DB
    const jwtUser = (req as any).user;
    if (!jwtUser) {
      return { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
    }

    const roleName = jwtUser.role?.roleName;
    const deptCode = jwtUser.department?.departmentCode;
    const allowedEventTypes = resolveAllowedEventTypes(roleName, deptCode);

    const where: any = {
      isDeleted: false,
    };

    if (allowedEventTypes !== null) {
      // Non-admin: must be a recipient
      where.recipients = {
        some: {
          userId,
          isDeleted: false,
        },
      };

      // Filter by eventType-based department visibility
      if (allowedEventTypes.length > 0) {
        where.eventType = { in: allowedEventTypes };
      } else {
        // No matching department — return zero results safely
        where.id = '00000000-0000-0000-0000-000000000000';
      }
    }

    // Optional client-requested eventType filter (must intersect with allowed types)
    if (eventTypeFilter) {
      if (allowedEventTypes !== null && !allowedEventTypes.includes(eventTypeFilter)) {
        // User is requesting an event type they are not authorized to see
        return { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
      }
      where.eventType = eventTypeFilter;
    }

    if (isRead !== undefined) {
      if (where.recipients) {
        where.recipients.some.isRead = isRead;
      } else {
        where.recipients = {
          some: {
            userId,
            isRead: isRead,
            isDeleted: false,
          },
        };
      }
    }

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum,
        include: {
          recipients: {
            where: { userId, isDeleted: false },
            select: { isRead: true, readAt: true },
          },
          creator: {
            select: { firstName: true, lastName: true, employeeCode: true },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const items = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      eventType: n.eventType,
      type: n.type,
      isRead: n.recipients[0]?.isRead ?? false,
      readAt: n.recipients[0]?.readAt ?? null,
      entityType: n.referenceModule,
      entityId: n.referenceId,
      referenceModule: n.referenceModule,
      createdBy: n.createdBy,
      creator: n.creator,
      createdAt: n.createdAt,
    }));

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get('unread-count')
  @Permissions('notifications.view')
  @ApiOperation({ summary: 'Get unread notification count for the current user' })
  async getUnreadCount(@Req() req: Request) {
    const userId = (req as any).user?.id;
    const cacheKey = `notifications:unread-count:${userId}`;

    // Return cached count if available (60-second TTL reduces DB load from polling)
    const cached = await this.cacheService.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Use user info already validated and cached by JWT strategy
    // instead of re-querying the database on every call
    const jwtUser = (req as any).user;
    if (!jwtUser) {
      return 0;
    }

    const roleName = jwtUser.role?.roleName;
    const deptCode = jwtUser.department?.departmentCode;
    const allowedEventTypes = resolveAllowedEventTypes(roleName, deptCode);

    const where: any = {
      userId,
      isRead: false,
      isDeleted: false,
      notification: {
        isDeleted: false,
      },
    };

    if (allowedEventTypes !== null) {
      where.notification.eventType = { in: allowedEventTypes };
    }

    const count = await this.prisma.notificationRecipient.count({ where });
    await this.cacheService.set(cacheKey, count, 60);
    return count;
  }

  @Get(':id')
  @Permissions('notifications.view')
  @ApiOperation({ summary: 'Get notification details by ID' })
  async getDetails(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id;

    // Use user info from JWT (already validated and cached) instead of re-querying DB
    const jwtUser = (req as any).user;
    if (!jwtUser) {
      throw new ForbiddenException('User not found.');
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        recipients: {
          where: { isDeleted: false },
        },
      },
    });

    if (!notification || notification.isDeleted) {
      throw new NotFoundException('Notification not found.');
    }

    const roleName = jwtUser.role?.roleName;
    const deptCode = jwtUser.department?.departmentCode;
    const allowedEventTypes = resolveAllowedEventTypes(roleName, deptCode);

    let isAuthorized = allowedEventTypes === null; // Admin is always authorized

    if (!isAuthorized) {
      const isRecipient = notification.recipients.some((r) => r.userId === userId);
      if (isRecipient) {
        // Authorize based on eventType
        const notifEventType = notification.eventType;
        if (notifEventType && allowedEventTypes!.includes(notifEventType)) {
          isAuthorized = true;
        } else if (!notifEventType) {
          // Legacy notifications without eventType — allow if user is recipient
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      await this.prisma.auditLog.create({
        data: {
          module: 'NOTIFICATIONS',
          recordId: id,
          action: 'ACCESS_DENIED',
          performedBy: userId,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
      throw new ForbiddenException('You are not authorized to view this notification.');
    }

    await this.prisma.auditLog.create({
      data: {
        module: 'NOTIFICATIONS',
        recordId: id,
        action: 'VIEW',
        performedBy: userId,
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      eventType: notification.eventType,
      type: notification.type,
      referenceModule: notification.referenceModule,
      referenceId: notification.referenceId,
      createdBy: notification.createdBy,
      createdAt: notification.createdAt,
    };
  }

  @Patch(':id/read')
  @Permissions('notifications.view')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id;

    const result = await this.prisma.notificationRecipient.updateMany({
      where: {
        notificationId: id,
        userId,
        isDeleted: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (result.count > 0) {
      await this.prisma.auditLog.create({
        data: {
          module: 'NOTIFICATIONS',
          recordId: id,
          action: 'MARK_READ',
          performedBy: userId,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    }

    return { success: true };
  }

  @Patch('read-all')
  @Permissions('notifications.view')
  @ApiOperation({ summary: 'Mark all notifications as read for the current user' })
  async markAllAsRead(@Req() req: Request) {
    const userId = (req as any).user?.id;

    await this.prisma.notificationRecipient.updateMany({
      where: {
        userId,
        isRead: false,
        isDeleted: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        module: 'NOTIFICATIONS',
        recordId: 'all',
        action: 'MARK_READ_ALL',
        performedBy: userId,
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    return { success: true };
  }
}
