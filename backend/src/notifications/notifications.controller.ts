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
  async list(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('isRead') isRead?: string,
  ) {
    const userId = (req as any).user?.id;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, department: true },
    });
    if (!user) {
      return { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
    }

    const roleName = user.role?.roleName;
    const deptCode = user.department?.departmentCode;
    const isAdmin = roleName?.toUpperCase() === 'ADMIN' || roleName === 'System Administrator';

    const where: any = {
      isDeleted: false,
    };

    if (!isAdmin) {
      // Must be a recipient
      where.recipients = {
        some: {
          userId,
          isDeleted: false,
        },
      };

      // Filter based on department visibility rules
      const titleConditions: any[] = [];
      if (deptCode === 'DESIGN' || deptCode === 'DSGN') {
        titleConditions.push(
          { title: { contains: 'Draft Returned', mode: 'insensitive' } },
          { title: { contains: 'Cost Sheet Updated', mode: 'insensitive' } },
          { title: { contains: 'Actual Cost', mode: 'insensitive' } },
          { title: { contains: 'Design Drawing', mode: 'insensitive' } },
          { title: { contains: 'Document Deleted', mode: 'insensitive' } },
          { title: { contains: 'Document Replaced', mode: 'insensitive' } },
        );
      } else if (deptCode === 'STORES' || deptCode === 'STOR') {
        titleConditions.push(
          { title: { contains: 'New Manufacturing Indent', mode: 'insensitive' } },
          { title: { contains: 'Stores Stock Verification', mode: 'insensitive' } },
        );
      } else if (deptCode === 'PRODUCTION' || deptCode === 'PROD') {
        titleConditions.push(
          { title: { contains: 'Material Issued', mode: 'insensitive' } },
          { title: { contains: 'Production Manufacturing Started', mode: 'insensitive' } },
          { title: { contains: 'Production Manufacturing Completed', mode: 'insensitive' } },
        );
      } else if (deptCode === 'ACCOUNTS' || deptCode === 'ACCT') {
        titleConditions.push(
          { title: { contains: 'Production Manufacturing Completed', mode: 'insensitive' } },
          { title: { contains: 'Product Delivered', mode: 'insensitive' } },
          { title: { contains: 'Accounts Cost Verification', mode: 'insensitive' } },
          { title: { contains: 'Actual Cost', mode: 'insensitive' } },
          { title: { contains: 'Financial Closure', mode: 'insensitive' } },
          { title: { contains: 'Vendor Bill', mode: 'insensitive' } },
        );
      } else if (roleName === 'Senior Manager' || roleName === 'General Manager') {
        titleConditions.push(
          { title: { contains: 'Actual Cost', mode: 'insensitive' } },
          { title: { contains: 'Financial Closure', mode: 'insensitive' } },
          { title: { contains: 'Archived', mode: 'insensitive' } },
          { title: { contains: 'Completed', mode: 'insensitive' } },
          { title: { contains: 'Design Drawing', mode: 'insensitive' } },
          { title: { contains: 'Vendor Bill', mode: 'insensitive' } },
          { title: { contains: 'Document Deleted', mode: 'insensitive' } },
          { title: { contains: 'Document Replaced', mode: 'insensitive' } },
        );
      }

      if (titleConditions.length > 0) {
        where.OR = titleConditions;
      } else {
        // No matching department — return zero results safely
        where.id = '00000000-0000-0000-0000-000000000000';
      }
    }

    if (isRead !== undefined && isRead !== '') {
      if (where.recipients) {
        where.recipients.some.isRead = isRead === 'true';
      } else {
        where.recipients = {
          some: {
            isRead: isRead === 'true',
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

    // Return cached count if available (20-second TTL reduces DB load from polling)
    const cached = await this.cacheService.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, department: true },
    });
    if (!user) {
      return 0;
    }

    const roleName = user.role?.roleName;
    const deptCode = user.department?.departmentCode;
    const isAdmin = roleName?.toUpperCase() === 'ADMIN' || roleName === 'System Administrator';

    const where: any = {
      userId,
      isRead: false,
      isDeleted: false,
      notification: {
        isDeleted: false,
      },
    };

    if (!isAdmin) {
      const titleConditions: any[] = [];
      if (deptCode === 'DESIGN' || deptCode === 'DSGN') {
        titleConditions.push(
          { title: { contains: 'Draft Returned', mode: 'insensitive' } },
          { title: { contains: 'Cost Sheet Updated', mode: 'insensitive' } },
          { title: { contains: 'Actual Cost', mode: 'insensitive' } },
          { title: { contains: 'Design Drawing', mode: 'insensitive' } },
          { title: { contains: 'Document Deleted', mode: 'insensitive' } },
          { title: { contains: 'Document Replaced', mode: 'insensitive' } },
        );
      } else if (deptCode === 'STORES' || deptCode === 'STOR') {
        titleConditions.push(
          { title: { contains: 'New Manufacturing Indent', mode: 'insensitive' } },
          { title: { contains: 'Stores Stock Verification', mode: 'insensitive' } },
        );
      } else if (deptCode === 'PRODUCTION' || deptCode === 'PROD') {
        titleConditions.push(
          { title: { contains: 'Material Issued', mode: 'insensitive' } },
          { title: { contains: 'Production Manufacturing Started', mode: 'insensitive' } },
          { title: { contains: 'Production Manufacturing Completed', mode: 'insensitive' } },
        );
      } else if (deptCode === 'ACCOUNTS' || deptCode === 'ACCT') {
        titleConditions.push(
          { title: { contains: 'Production Manufacturing Completed', mode: 'insensitive' } },
          { title: { contains: 'Product Delivered', mode: 'insensitive' } },
          { title: { contains: 'Accounts Cost Verification', mode: 'insensitive' } },
          { title: { contains: 'Actual Cost', mode: 'insensitive' } },
          { title: { contains: 'Financial Closure', mode: 'insensitive' } },
          { title: { contains: 'Vendor Bill', mode: 'insensitive' } },
        );
      } else if (roleName === 'Senior Manager' || roleName === 'General Manager') {
        titleConditions.push(
          { title: { contains: 'Actual Cost', mode: 'insensitive' } },
          { title: { contains: 'Financial Closure', mode: 'insensitive' } },
          { title: { contains: 'Archived', mode: 'insensitive' } },
          { title: { contains: 'Completed', mode: 'insensitive' } },
          { title: { contains: 'Design Drawing', mode: 'insensitive' } },
          { title: { contains: 'Vendor Bill', mode: 'insensitive' } },
          { title: { contains: 'Document Deleted', mode: 'insensitive' } },
          { title: { contains: 'Document Replaced', mode: 'insensitive' } },
        );
      }

      if (titleConditions.length > 0) {
        // Combine with existing notification.isDeleted filter using AND
        where.notification.AND = [{ isDeleted: false }, { OR: titleConditions }];
        delete where.notification.isDeleted;
      } else {
        // No matching department — return zero results
        where.notification.id = '00000000-0000-0000-0000-000000000000';
      }
    }

    const count = await this.prisma.notificationRecipient.count({ where });
    await this.cacheService.set(cacheKey, count, 20);
    return count;
  }

  @Get(':id')
  @Permissions('notifications.view')
  @ApiOperation({ summary: 'Get notification details by ID' })
  async getDetails(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, department: true },
    });
    if (!user) {
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

    const roleName = user.role?.roleName;
    const deptCode = user.department?.departmentCode;
    const isAdmin = roleName?.toUpperCase() === 'ADMIN' || roleName === 'System Administrator';

    let isAuthorized = isAdmin;

    if (!isAuthorized) {
      const isRecipient = notification.recipients.some((r) => r.userId === userId);
      if (isRecipient) {
        const title = notification.title.toLowerCase();
        if (deptCode === 'DESIGN' || deptCode === 'DSGN') {
          isAuthorized =
            title.includes('draft returned') ||
            title.includes('cost sheet updated') ||
            title.includes('actual cost') ||
            title.includes('design drawing') ||
            title.includes('document deleted') ||
            title.includes('document replaced');
        } else if (deptCode === 'STORES' || deptCode === 'STOR') {
          isAuthorized =
            title.includes('new manufacturing indent') ||
            title.includes('stores stock verification');
        } else if (deptCode === 'PRODUCTION' || deptCode === 'PROD') {
          isAuthorized =
            title.includes('material issued') ||
            title.includes('production manufacturing started') ||
            title.includes('production manufacturing completed');
        } else if (deptCode === 'ACCOUNTS' || deptCode === 'ACCT') {
          isAuthorized =
            title.includes('production manufacturing completed') ||
            title.includes('product delivered') ||
            title.includes('accounts cost verification') ||
            title.includes('actual cost') ||
            title.includes('financial closure') ||
            title.includes('vendor bill');
        } else if (roleName === 'Senior Manager' || roleName === 'General Manager') {
          isAuthorized =
            title.includes('actual cost') ||
            title.includes('financial closure') ||
            title.includes('archived') ||
            title.includes('completed') ||
            title.includes('design drawing') ||
            title.includes('vendor bill') ||
            title.includes('document deleted') ||
            title.includes('document replaced');
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
