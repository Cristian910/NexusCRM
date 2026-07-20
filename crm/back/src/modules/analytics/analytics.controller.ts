import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * All analytics endpoints require at least MEMBER role (the default).
 * Sensitive aggregate data (user performance) requires ADMIN+.
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/overview
   * Hero numbers for the main dashboard — aggressively cached (60 s default).
   */
  @Get('overview')
  getOverview(@CurrentUser() user: JwtPayload, @Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getOverview(user.organizationId, filters);
  }

  /**
   * GET /analytics/deals
   * Full deal funnel with per-stage breakdown and value metrics.
   */
  @Get('deals')
  getDeals(@CurrentUser() user: JwtPayload, @Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getDealsAnalytics(user.organizationId, filters);
  }

  /**
   * GET /analytics/users
   * Sales rep leaderboard — restricted to admins to avoid exposing
   * peer performance data to individual reps.
   */
  @Get('users')
  @Roles(Role.ADMIN, Role.OWNER)
  getUsers(@CurrentUser() user: JwtPayload, @Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getUsersPerformance(user.organizationId, filters);
  }

  /**
   * GET /analytics/clients
   * Client health metrics and top accounts by deal value.
   */
  @Get('clients')
  getClients(@CurrentUser() user: JwtPayload, @Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getClientsAnalytics(user.organizationId, filters);
  }

  /**
   * GET /analytics/tasks
   * Task completion and overdue metrics.
   */
  @Get('tasks')
  getTasks(@CurrentUser() user: JwtPayload, @Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getTasksAnalytics(user.organizationId, filters);
  }
}
