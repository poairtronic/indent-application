import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Request } from 'express';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    const where: { isDeleted: boolean; category?: string } = { isDeleted: false };
    if (category) {
      where.category = category;
    }
    return this.prisma.applicationSetting.findMany({
      where,
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string) {
    const setting = await this.prisma.applicationSetting.findFirst({
      where: { key, isDeleted: false },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    return setting;
  }

  async update(key: string, dto: UpdateSettingDto, req: Request) {
    let setting = await this.prisma.applicationSetting.findFirst({
      where: { key, isDeleted: false },
    });

    const user = req.user as any;
    const userId = user?.id;

    if (!setting) {
      // Create if it doesn't exist (helpful for new settings not seeded)
      setting = await this.prisma.applicationSetting.create({
        data: {
          key,
          value: dto.value,
          category: dto.category || 'General',
          description: dto.description || '',
          createdBy: userId,
        },
      });

      if (userId) {
        await this.prisma.auditLog.create({
          data: {
            performedBy: userId,
            action: 'CREATE',
            module: 'ApplicationSetting',
            recordId: setting.id,
            newValue: setting as any,
          },
        });
      }
      return setting;
    }

    const updatedSetting = await this.prisma.applicationSetting.update({
      where: { id: setting.id },
      data: {
        value: dto.value,
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        updatedBy: userId,
      },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          performedBy: userId,
          action: 'UPDATE',
          module: 'ApplicationSetting',
          recordId: setting.id,
          oldValue: setting as any,
          newValue: updatedSetting as any,
        },
      });
    }

    return updatedSetting;
  }
}
