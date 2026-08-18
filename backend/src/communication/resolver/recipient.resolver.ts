import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvalidRecipientException } from '../exceptions/communication.exceptions';

export interface IResolverQuery {
  userId?: string | string[];
  departmentCode?: string;
  roleName?: string | string[];
  indentId?: string;
  workflowStateTarget?: string;
}

@Injectable()
export class RecipientResolver {
  private readonly logger = new Logger(RecipientResolver.name);

  constructor(private readonly prisma: PrismaService) {}

  public async resolve(query: IResolverQuery): Promise<string[]> {
    this.logger.log(`Resolving recipients for query: ${JSON.stringify(query)}`);
    const emails: string[] = [];

    // 1. Single or Multiple User IDs
    if (query.userId) {
      const userIds = Array.isArray(query.userId) ? query.userId : [query.userId];
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          isDeleted: false,
          status: 'ACTIVE',
        },
        select: { email: true },
      });
      users.forEach((u) => emails.push(u.email));
    }

    // 2. Department Code (e.g. "DESIGN", "STORES", "ACCOUNTS")
    if (query.departmentCode) {
      const codes = [
        query.departmentCode,
        query.departmentCode === 'DESIGN' ? 'DSGN' : '',
        query.departmentCode === 'STORES' ? 'STOR' : '',
        query.departmentCode === 'PRODUCTION' ? 'PROD' : '',
        query.departmentCode === 'ACCOUNTS' ? 'ACCT' : '',
        query.departmentCode === 'DSGN' ? 'DESIGN' : '',
        query.departmentCode === 'STOR' ? 'STORES' : '',
        query.departmentCode === 'PROD' ? 'PRODUCTION' : '',
        query.departmentCode === 'ACCT' ? 'ACCOUNTS' : '',
      ].filter(Boolean);

      const users = await this.prisma.user.findMany({
        where: {
          department: { departmentCode: { in: codes }, isDeleted: false },
          isDeleted: false,
          status: 'ACTIVE',
        },
        select: { email: true },
      });
      users.forEach((u) => emails.push(u.email));
    }

    // 3. Role Name (e.g. "Senior Manager", "General Manager")
    if (query.roleName) {
      const roleNames = Array.isArray(query.roleName) ? query.roleName : [query.roleName];
      const users = await this.prisma.user.findMany({
        where: {
          role: { roleName: { in: roleNames }, isDeleted: false },
          isDeleted: false,
          status: 'ACTIVE',
        },
        select: { email: true },
      });
      users.forEach((u) => emails.push(u.email));
    }

    // 4. Indent ID: Get Creator, and if cost sheet exists, also Cost Sheet Preparer
    if (query.indentId) {
      const indent = await this.prisma.indent.findUnique({
        where: { id: query.indentId },
        include: {
          creator: { select: { email: true } },
          costSheet: {
            include: {
              preparer: { select: { email: true } },
            },
          },
        },
      });

      if (indent) {
        if (indent.creator) emails.push(indent.creator.email);
        if (indent.costSheet?.preparer) emails.push(indent.costSheet.preparer.email);
      }
    }

    // De-duplicate emails
    const uniqueEmails = Array.from(new Set(emails.map((e) => e.trim().toLowerCase())));
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate email shapes
    for (const email of uniqueEmails) {
      if (!emailRegex.test(email)) {
        throw new InvalidRecipientException(email, 'Failed regex format validation.');
      }
    }

    this.logger.log(`Resolved unique email recipients count: ${uniqueEmails.length}`);
    return uniqueEmails;
  }
}
