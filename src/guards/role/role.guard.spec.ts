import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RoleGuard>(RoleGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockExecutionContext = (userRole?: string): ExecutionContext => {
    const mockRequest = {
      user: userRole ? { role: userRole } : undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true when user role is in allowed roles', () => {
      reflector.get.mockReturnValue(['admin', 'super-admin', 'owner']);

      const context = createMockExecutionContext('admin') as any;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith('roles', context.getHandler());
    });

    it('should return false when user role is not in allowed roles', () => {
      reflector.get.mockReturnValue(['admin', 'super-admin']);

      const context = createMockExecutionContext('user') as any;

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when no roles are defined', () => {
      reflector.get.mockReturnValue(undefined);

      const context = createMockExecutionContext('admin') as any;

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return true when user has super-admin role', () => {
      reflector.get.mockReturnValue(['super-admin', 'admin']);

      const context = createMockExecutionContext('super-admin') as any;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
