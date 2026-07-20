import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { QueryActivityDto } from './dto/activity.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';

/**
 * Read-only controller.
 * Activity records are NEVER written through HTTP — only via domain events.
 */
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: QueryActivityDto) {
    return this.activityService.findAll(user.organizationId, query);
  }

  /**
   * Lightweight polling endpoint — used by the frontend's realtime
   * activity channel (every 30s) to detect new activity without
   * fetching the full feed.
   */
  @Get('recent-count')
  async recentCount(@CurrentUser() user: JwtPayload): Promise<{ count: number }> {
    const count = await this.activityService.recentCount(user.organizationId);
    return { count };
  }

  @Get('entity/:entityId')
  findByEntity(
    @Param('entityId') entityId: string,
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.activityService.findByEntity(entityId, user.organizationId, +page, +limit);
  }
}
