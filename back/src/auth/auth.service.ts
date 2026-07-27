import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { Prisma, Role } from '@prisma/client';
import { SafeUser, toSafeUser } from '@/common/types/shared.types';
import { QueueProducerService } from '@/queues/queue-producer.service';

const RESET_TOKEN_TTL_MINUTES = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly queueProducer: QueueProducerService,
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    // Always return the same generic message whether or not the account exists —
    // this endpoint must never leak which emails/organizations are registered.
    const genericResponse = {
      message: 'If an account exists for that email, a reset link has been sent.',
    };

    const organization = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug },
    });
    if (!organization || organization.status !== 'ACTIVE') {
      return genericResponse;
    }

    const user = await this.prisma.user.findUnique({
      where: { email_organizationId: { email: dto.email, organizationId: organization.id } },
    });
    if (!user || !user.isActive) {
      return genericResponse;
    }

    // The raw token goes in the email link; only its SHA-256 digest is persisted.
    // Unlike passwords, this token is already 256 bits of random entropy, so a
    // fast, lookup-friendly hash is appropriate here (bcrypt would only slow down
    // the one legitimate lookup, not a brute-force attempt, which is infeasible
    // against this much entropy either way).
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: hashedToken, resetPasswordExpiresAt: expiresAt },
    });

    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.queueProducer.enqueueEmail({
      to: user.email,
      toName: `${user.firstName} ${user.lastName}`,
      subject: 'Reset your password',
      template: 'password-reset',
      context: {
        recipientName: user.firstName,
        resetUrl,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      },
    });

    this.logger.log(`Password reset requested for userId=${user.id}`);

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('This reset link is invalid or has expired');
    }

    const hashedPassword = await this.hashValue(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
        // Force re-login on every device as a safety measure after a reset.
        refreshToken: null,
      },
    });

    this.logger.log(`Password reset completed for userId=${user.id}`);

    return { message: 'Your password has been reset. You can now sign in.' };
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
