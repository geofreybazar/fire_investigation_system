import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class AuditRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findPaginated(
    where: Prisma.AuditLogWhereInput,
    skip: number,
    take: number,
  ) {
    const [auditLogs, total] = await Promise.all([
      this.prismaService.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              account_number: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prismaService.auditLog.count({ where }),
    ]);

    return { auditLogs, total };
  }
}
