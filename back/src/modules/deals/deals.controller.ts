import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto, ChangeDealStageDto, QueryDealDto } from './dto/deal.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDealDto, @CurrentUser() user: JwtPayload) {
    return this.dealsService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: QueryDealDto) {
    return this.dealsService.findAll(user.organizationId, query);
  }

  @Get('pipeline')
  getPipelineSummary(@CurrentUser() user: JwtPayload) {
    return this.dealsService.getPipelineSummary(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.dealsService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() dto: UpdateDealDto, @CurrentUser() user: JwtPayload) {
    return this.dealsService.update(id, dto, user);
  }

  @Patch(':id/stage')
  @HttpCode(HttpStatus.OK)
  changeStage(
    @Param('id') id: string,
    @Body() dto: ChangeDealStageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dealsService.changeStage(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.dealsService.remove(id, user);
  }
}
