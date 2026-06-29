import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth-service';
import { UserService } from '../../../users/user-service/user-service';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUserService = {
      checkUser: jest.fn(),
      fetchUser: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    const mockUser = {
      email: 'admin@example.com',
      role: 'super-admin',
      name: 'Admin User',
      associatedCompany: { companyName: 'TestCompany' },
    };

    it('should return JWT token when credentials are valid', async () => {
      userService.checkUser.mockResolvedValue('user_checks_complete');
      userService.fetchUser.mockResolvedValue(mockUser as any);
      jwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.signIn('admin@example.com', 'password123');

      expect(result).toEqual({ jwt: 'mock-jwt-token' });
      expect(userService.checkUser).toHaveBeenCalledWith(
        'admin@example.com',
        'password123',
      );
      expect(userService.fetchUser).toHaveBeenCalledWith('admin@example.com');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          username: 'admin@example.com',
          role: 'super-admin',
          associatedCompany: 'TestCompany',
        },
        { secret: process.env.secret_key },
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      userService.checkUser.mockResolvedValue('check_password');

      await expect(
        service.signIn('admin@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userService.checkUser.mockResolvedValue('check_user');

      await expect(
        service.signIn('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unknown check result', async () => {
      userService.checkUser.mockResolvedValue('unknown_result' as any);

      await expect(
        service.signIn('admin@example.com', 'password123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should include company name in JWT payload', async () => {
      const userWithCompany = {
        ...mockUser,
        associatedCompany: { companyName: 'MyCompany' },
      };
      userService.checkUser.mockResolvedValue('user_checks_complete');
      userService.fetchUser.mockResolvedValue(userWithCompany as any);
      jwtService.signAsync.mockResolvedValue('mock-jwt-token');

      await service.signIn('admin@example.com', 'password123');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          associatedCompany: 'MyCompany',
        }),
        expect.any(Object),
      );
    });
  });
});
