import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { Prisma, Role } from '@prisma/client';
import { SafeUser, toSafeUser } from '@/common/types/shared.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const slug = this.generateSlug(dto.organizationName);

    const existingOrg = await this.prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      throw new ConflictException('An organization with this name already exists');
    }

    const hashedPassword = await this.hashValue(dto.password);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName, slug },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: Role.OWNER,
          organizationId: organization.id,
        },
      });

      return { organization, user };
    });

    const tokens = await this.generateTokens(
      result.user.id,
      result.user.email,
      result.organization.id,
      result.user.role,
    );
    await this.storeRefreshToken(result.user.id, tokens.refreshToken);

    this.logger.log(`New organization registered: ${slug} | userId=${result.user.id}`);

    return { user: toSafeUser(result.user), tokens };
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug },
    });

    if (!organization) {
      // Return same error as wrong password to prevent org enumeration
      throw new UnauthorizedException('Invalid credentials');
    }

    if (organization.status !== 'ACTIVE') {
      throw new ForbiddenException('Organization is suspended');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email_organizationId: {
          email: dto.email,
          organizationId: organization.id,
        },
      },
    });

    // Constant-time response to prevent timing attacks / user enumeration
    if (!user) {
      await bcrypt.compare(dto.password, '$2b$12$placeholder.hash.to.prevent.timing.attacks');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, organization.id, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user: toSafeUser(user), tokens };
  }

  async refresh(
    userId: string,
    organizationId: string,
    rawRefreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, isActive: true },
    });

    // Always run bcrypt to prevent timing attacks even when token is null
    const storedHash = user?.refreshToken ?? '$2b$12$placeholder.hash.to.prevent.timing.attacks';
    const tokenMatches = await bcrypt.compare(rawRefreshToken, storedHash);

    if (!user || !user.refreshToken || !tokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user.id, user.email, organizationId, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    // updateMany scoped — no-op if userId doesn't match any record
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    organizationId: string,
    role: Role,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, organizationId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const hashed = await this.hashValue(rawToken);
    // updateMany — always scoped to the specific user ID
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  private async hashValue(value: string): Promise<string> {
    const rounds = this.configService.get<number>('app.bcryptRounds') ?? 12;
    return bcrypt.hash(value, rounds);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
