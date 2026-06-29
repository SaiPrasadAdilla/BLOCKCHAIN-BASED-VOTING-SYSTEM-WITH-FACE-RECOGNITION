import { Test, TestingModule } from '@nestjs/testing';
import { AuthControllerController } from './auth-controller.controller';
import { AuthService } from '../auth-service/auth-service';
import { JwtService } from '@nestjs/jwt';

jest.mock('../auth-service/auth-service');
jest.mock('@nestjs/jwt');

describe('AuthControllerController', () => {
  let controller: AuthControllerController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      signIn: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    (JwtService as jest.Mock).mockImplementation(() => mockJwtService);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthControllerController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthControllerController>(AuthControllerController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should call authService.signIn with correct credentials', async () => {
      const loginInfo = { username: 'test@test.com', password: 'password123' };
      const expectedResult = { jwt: 'mock-jwt-token' };

      authService.signIn.mockResolvedValue(expectedResult);

      const result = await controller.signIn(loginInfo);

      expect(result).toEqual(expectedResult);
      expect(authService.signIn).toHaveBeenCalledWith(
        loginInfo.username,
        loginInfo.password,
      );
    });

    it('should return JWT token for valid credentials', async () => {
      const loginInfo = { username: 'admin@test.com', password: 'adminpass' };
      const expectedResult = { jwt: 'valid-jwt-token' };

      authService.signIn.mockResolvedValue(expectedResult);

      const result = await controller.signIn(loginInfo);

      expect(result).toEqual({ jwt: 'valid-jwt-token' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile from request', () => {
      const mockUser = {
        username: 'test@test.com',
        role: 'admin',
        associatedCompany: 'TestCompany',
      };
      const mockRequest = { user: mockUser };

      const result = controller.getProfile(mockRequest as any);

      expect(result).toEqual(mockUser);
    });
  });
});
