import { Controller, Get, Module, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  // Deliberately dependency-free — no Prisma/Redis calls. Render (and most
  // PaaS) poll this to decide whether the container is alive; if it depended
  // on the database, a slow DB would take the whole service down with it.
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
