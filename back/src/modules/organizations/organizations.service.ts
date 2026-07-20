import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/organization.dto';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { _count: { select: { users: true } } },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(organizationId: string, dto: UpdateOrganizationDto, requester: JwtPayload) {
    this.assertOwnerOrAdmin(requester);

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) throw new NotFoundException('Organization not found');

    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { name: dto.name },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private assertOwnerOrAdmin(user: JwtPayload): void {
    if (user.role !== Role.OWNER && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only owners and admins can modify the organization');
    }
  }
}
