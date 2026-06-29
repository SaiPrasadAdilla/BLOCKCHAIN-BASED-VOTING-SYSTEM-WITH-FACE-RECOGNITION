import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockExecutionContext = (
    authHeader?: string,
  ): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true and set user on request when token is valid', async () => {
      const mockPayload = { username: 'test@test.com', role: 'admin' };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const context = createMockExecutionContext('Bearer valid-token');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: process.env.secret_key,
      });
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      const context = createMockExecutionContext('Bearer invalid-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when authorization header does not start with Bearer', async () => {
      const context = createMockExecutionContext('Basic some-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
