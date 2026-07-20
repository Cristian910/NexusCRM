import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  DealReportFilterDto,
  DealReport,
  DealReportRow,
  ReportSortField,
  SortOrder,
} from './dto/report.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDealsReport(organizationId: string, filters: DealReportFilterDto): Promise<DealReport> {
    const {
      dateFrom,
      dateTo,
      stage,
      assignedToId,
      clientId,
      search,
      sortBy = ReportSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 50,
    } = filters;

    const safeLimit = Math.min(limit, 500);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.DealWhereInput = {
      organizationId,
      ...(stage && { stage }),
      ...(assignedToId && { assignedToId }),
      ...(clientId && { clientId }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const orderBy: Prisma.DealOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Single transaction: data + count + aggregate in parallel
    const [deals, total, aggregate] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy,
        select: {
          id: true,
          title: true,
          value: true,
          stage: true,
          expectedCloseDate: true,
          createdAt: true,
          updatedAt: true,
          client: { select: { id: true, name: true, company: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          // Fetch latest stage history entry to compute stageAge
          stageHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      this.prisma.deal.count({ where }),
      this.prisma.deal.aggregate({
        where,
        _sum: { value: true },
        _avg: { value: true },
      }),
    ]);

    const now = new Date();

    const data: DealReportRow[] = deals.map((deal) => {
      const lastStageChange = deal.stageHistory[0]?.createdAt ?? deal.createdAt;
      const stageAgeDays = Math.floor(
        (now.getTime() - lastStageChange.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        id: deal.id,
        title: deal.title,
        value: Number(deal.value),
        stage: deal.stage,
        expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
        createdAt: deal.createdAt.toISOString(),
        client: {
          id: deal.client.id,
          name: deal.client.name,
          company: deal.client.company,
        },
        assignedTo: deal.assignedTo
          ? {
              id: deal.assignedTo.id,
              name: `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`,
            }
          : null,
        stageAge: stageAgeDays,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      filters: {
        dateFrom,
        dateTo,
        stage,
        assignedToId,
        clientId,
        search,
        sortBy,
        sortOrder,
      },
      summary: {
        totalRows: total,
        totalPages: Math.ceil(total / safeLimit),
        page,
        totalValue: Number(aggregate._sum.value ?? 0),
        averageValue: Number(aggregate._avg.value ?? 0),
      },
      data,
    };
  }
}
