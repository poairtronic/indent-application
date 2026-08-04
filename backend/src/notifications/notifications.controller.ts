import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

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

    const where: any = {
      recipients: {
        some: {
          userId,
          isDeleted: false,
        },
      },
      isDeleted: false,
    };

    if (isRead !== undefined && isRead !== '') {
      where.recipients.some.isRead = isRead === 'true';
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
      entityType: n.entityType,
      entityId: n.entityId,
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

    const count = await this.prisma.notificationRecipient.count({
      where: {
        userId,
        isRead: false,
        isDeleted: false,
        notification: {
          isDeleted: false,
        },
      },
    });

    return count;
  }

  @Patch(':id/read')
  @Permissions('notifications.view')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.id;

    await this.prisma.notificationRecipient.updateMany({
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

    return { success: true };
  }
}
