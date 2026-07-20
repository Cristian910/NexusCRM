import { Controller, Get, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/organization.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  findMyOrganization(@CurrentUser() user: JwtPayload) {
    return this.organizationsService.findOne(user.organizationId);
  }

  @Patch('me')
  @Roles(Role.OWNER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  update(@Body() dto: UpdateOrganizationDto, @CurrentUser() user: JwtPayload) {
    return this.organizationsService.update(user.organizationId, dto, user);
  }
}
