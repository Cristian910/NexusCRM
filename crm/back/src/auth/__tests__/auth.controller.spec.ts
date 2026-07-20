import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { Role } from '@prisma/client';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
};

const mockTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

const mockSafeUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: Role.OWNER,
  isActive: true,
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return tokens + user', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'SecurePass1!',
        firstName: 'Jane',
        lastName: 'Smith',
        organizationName: 'New Corp',
      };

      mockAuthService.register.mockResolvedValue({ user: mockSafeUser, tokens: mockTokens });

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user: mockSafeUser, tokens: mockTokens });
    });
  });

  describe('login', () => {
    it('should call authService.login and return tokens + user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'SecurePass1!',
        organizationSlug: 'test-corp',
      };

      mockAuthService.login.mockResolvedValue({ user: mockSafeUser, tokens: mockTokens });

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user: mockSafeUser, tokens: mockTokens });
    });
  });

  describe('logout', () => {
    it('should call authService.logout with the user id', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout('user-1');

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
    });
  });
});
