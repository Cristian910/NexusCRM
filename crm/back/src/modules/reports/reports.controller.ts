import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DealReportFilterDto } from './dto/report.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@Roles(Role.ADMIN, Role.OWNER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/deals
   * Structured, filterable deal report ready for export or grid display.
   * Includes per-row stageAge so teams can identify stale deals.
   */
  @Get('deals')
  getDealsReport(@CurrentUser() user: JwtPayload, @Query() filters: DealReportFilterDto) {
    return this.reportsService.getDealsReport(user.organizationId, filters);
  }
}
