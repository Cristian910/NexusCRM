import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role, OrganizationStatus } from '@prisma/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  organization: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, unknown> = {
      'jwt.accessSecret': 'access-secret',
      'jwt.accessExpiresIn': '15m',
      'jwt.refreshSecret': 'refresh-secret',
      'jwt.refreshExpiresIn': '7d',
      'app.bcryptRounds': 10,
    };
    return config[key];
  }),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockOrg = {
  id: 'org-1',
  name: 'Test Corp',
  slug: 'test-corp',
  status: OrganizationStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: '',
  firstName: 'John',
  lastName: 'Doe',
  role: Role.OWNER,
  isActive: true,
  refreshToken: null,
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'SecurePass1!',
      firstName: 'Jane',
      lastName: 'Smith',
      organizationName: 'New Corp',
    };

    it('should register a new user and organization successfully', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma),
      );
      mockPrisma.organization.create.mockResolvedValue(mockOrg);
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, email: registerDto.email });
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'hashed' });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'new-corp' },
      });
    });

    it('should throw ConflictException if organization slug already exists', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'SecurePass1!',
      organizationSlug: 'test-corp',
    };

    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithHash = { ...mockUser, password: hashedPassword };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.user.findUnique.mockResolvedValue(userWithHash);
      mockPrisma.user.update.mockResolvedValue({ ...userWithHash, refreshToken: 'hashed' });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if organization does not exist (prevents org enumeration)', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if organization is suspended', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        ...mockOrg,
        status: OrganizationStatus.SUSPENDED,
      });

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const userWithHash = { ...mockUser, password: await bcrypt.hash('other-password', 10) };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.user.findUnique.mockResolvedValue(userWithHash);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user is inactive', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear the refresh token on logout', async () => {
      mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('user-1');

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
    });
  });

  // ─── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('should throw UnauthorizedException if user has no stored refresh token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, refreshToken: null });

      await expect(service.refresh('user-1', 'org-1', 'some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token does not match', async () => {
      const hashed = await bcrypt.hash('correct-token', 10);
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, refreshToken: hashed });

      await expect(service.refresh('user-1', 'org-1', 'wrong-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens when refresh token is valid', async () => {
      const rawToken = 'valid-refresh-token';
      const hashed = await bcrypt.hash(rawToken, 10);
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, refreshToken: hashed });
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'new-hashed' });

      const result = await service.refresh('user-1', 'org-1', rawToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
