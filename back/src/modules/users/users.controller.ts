import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, ChangePasswordDto, InviteUserDto, UpdateUserRoleDto } from './dto/user.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // List all users in the organization
  @Get()
  @Roles(Role.ADMIN, Role.OWNER)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(user.organizationId);
  }

  // Get own profile
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(user.sub, user.organizationId);
  }

  // Update own profile
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(user.sub, user.organizationId, dto);
  }

  // Change own password
  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.sub, user.organizationId, dto);
  }

  // Invite a new user to the organization
  @Post('invite')
  @Roles(Role.ADMIN, Role.OWNER)
  @HttpCode(HttpStatus.CREATED)
  invite(@CurrentUser() user: JwtPayload, @Body() dto: InviteUserDto) {
    return this.usersService.invite(user.organizationId, dto, user);
  }

  // Get any user by id (admin+)
  @Get(':id')
  @Roles(Role.ADMIN, Role.OWNER)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(id, user.organizationId);
  }

  // Change role of a user
  @Patch(':id/role')
  @Roles(Role.ADMIN, Role.OWNER)
  @HttpCode(HttpStatus.OK)
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.updateRole(id, user.organizationId, dto, user);
  }

  // Deactivate a user
  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.deactivate(id, user.organizationId, user);
  }
}
