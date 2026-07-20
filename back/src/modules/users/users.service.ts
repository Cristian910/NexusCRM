import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { UpdateUserDto, ChangePasswordDto, InviteUserDto, UpdateUserRoleDto } from './dto/user.dto';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { SafeUser, toSafeUser, generateSecurePassword } from '@/common/types/shared.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(organizationId: string): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      select: this.safeSelect(),
      orderBy: { createdAt: 'asc' },
    });

    // Select already excludes sensitive fields; cast is safe
    return users as unknown as SafeUser[];
  }

  async findOne(id: string, organizationId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: this.safeSelect(),
    });

    if (!user) throw new NotFoundException('User not found');
    return user as unknown as SafeUser;
  }

  async updateMe(id: string, organizationId: string, dto: UpdateUserDto): Promise<SafeUser> {
    // Scope update to org — prevents cross-tenant writes
    const updated = await this.prisma.user.updateMany({
      where: { id, organizationId },
      data: dto,
    });

    if (updated.count === 0) throw new NotFoundException('User not found');

    return this.findOne(id, organizationId);
  }

  async changePassword(id: string, organizationId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const rounds = this.configService.get<number>('app.bcryptRounds') ?? 12;
    const hashed = await bcrypt.hash(dto.newPassword, rounds);

    // Invalidate all existing sessions by clearing refresh token
    await this.prisma.user.updateMany({
      where: { id, organizationId },
      data: { password: hashed, refreshToken: null },
    });
  }

  async invite(
    organizationId: string,
    dto: InviteUserDto,
    requester: JwtPayload,
  ): Promise<SafeUser> {
    this.assertCanManageUsers(requester);

    if (dto.role === Role.OWNER && requester.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can invite other owners');
    }

    const exists = await this.prisma.user.findUnique({
      where: { email_organizationId: { email: dto.email, organizationId } },
    });

    if (exists) {
      throw new ConflictException('User with this email already exists in the organization');
    }

    const tempPassword = generateSecurePassword();
    const rounds = this.configService.get<number>('app.bcryptRounds') ?? 12;
    const hashed = await bcrypt.hash(tempPassword, rounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hashed,
        role: dto.role,
        organizationId,
      },
    });

    this.logger.log(`User invited: ${dto.email} to org ${organizationId} with role ${dto.role}`);
    return toSafeUser(user);
  }

  async updateRole(
    targetUserId: string,
    organizationId: string,
    dto: UpdateUserRoleDto,
    requester: JwtPayload,
  ): Promise<SafeUser> {
    this.assertCanManageUsers(requester);

    if (targetUserId === requester.sub) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId },
    });

    if (!target) throw new NotFoundException('User not found');

    if (target.role === Role.OWNER && requester.role !== Role.OWNER) {
      throw new ForbiddenException("Only an owner can change another owner's role");
    }

    if (dto.role === Role.OWNER && requester.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can promote users to owner');
    }

    // Scoped updateMany — only updates within the organization
    await this.prisma.user.updateMany({
      where: { id: targetUserId, organizationId },
      data: { role: dto.role },
    });

    return this.findOne(targetUserId, organizationId);
  }

  async deactivate(
    targetUserId: string,
    organizationId: string,
    requester: JwtPayload,
  ): Promise<void> {
    this.assertCanManageUsers(requester);

    if (targetUserId === requester.sub) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId },
    });

    if (!target) throw new NotFoundException('User not found');

    if (target.role === Role.OWNER && requester.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can deactivate other owners');
    }

    await this.prisma.user.updateMany({
      where: { id: targetUserId, organizationId },
      data: { isActive: false, refreshToken: null },
    });

    this.logger.log(`User ${targetUserId} deactivated by ${requester.sub}`);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Prisma select that excludes password and refreshToken at the DB level.
   * Preferred over post-fetch stripping — never loads sensitive data into memory.
   */
  private safeSelect() {
    return {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private assertCanManageUsers(user: JwtPayload): void {
    if (user.role !== Role.OWNER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Insufficient permissions to manage users');
    }
  }
}
