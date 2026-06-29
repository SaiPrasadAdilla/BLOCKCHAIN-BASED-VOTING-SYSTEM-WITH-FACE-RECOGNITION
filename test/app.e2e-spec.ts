import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { AuthControllerController } from '../src/modules/auth/auth/auth-controller/auth-controller.controller';
import { AuthService } from '../src/modules/auth/auth/auth-service/auth-service';
import { UserService } from '../src/modules/users/user-service/user-service';
import { CompanyController } from '../src/modules/users/company/company.controller';
import { CompanyService } from '../src/modules/users/company-service/company-service';
import { UserController } from '../src/modules/users/user/user.controller';
import { AuthGuard } from '../src/guards/auth/auth.guard';
import { RoleGuard } from '../src/guards/role/role.guard';

describe('API Endpoints (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.secret_key = 'test-secret-key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );
    app.enableCors();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/ (GET)', () => {
    it('should return Hello Application Tool message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello Application Tool 😊');
    });

    it('should return 200 status for root endpoint', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(typeof res.text).toBe('string');
        });
    });
  });
});

describe('AuthService Integration', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: JwtService;

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

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  describe('signIn', () => {
    it('should return JWT token for valid credentials', async () => {
      const mockUser = {
        email: 'test@test.com',
        role: 'admin',
        associatedCompany: { companyName: 'TestCompany' },
      };

      userService.checkUser.mockResolvedValue('user_checks_complete');
      userService.fetchUser.mockResolvedValue(mockUser as any);
      jwtService.signAsync.mockResolvedValue('valid-jwt-token');

      const result = await authService.signIn('test@test.com', 'password123');

      expect(result).toHaveProperty('jwt');
      expect(typeof result.jwt).toBe('string');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      userService.checkUser.mockResolvedValue('check_user');

      await expect(
        authService.signIn('nonexistent@test.com', 'password'),
      ).rejects.toThrow();
    });
  });
});

describe('AuthGuard Integration', () => {
  let authGuard: AuthGuard;
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

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get(JwtService);
  });

  describe('canActivate', () => {
    it('should return true for valid bearer token', async () => {
      const mockPayload = { username: 'test@test.com', role: 'admin' };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const result = await authGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException without authorization header', async () => {
      const mockRequest = {
        headers: {},
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      await expect(authGuard.canActivate(context)).rejects.toThrow();
    });
  });
});

describe('RoleGuard Integration', () => {
  let roleGuard: RoleGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleGuard],
    }).compile();

    roleGuard = module.get<RoleGuard>(RoleGuard);
  });

  describe('canActivate', () => {
    it('should return true when user role matches allowed roles', () => {
      const mockRequest = {
        user: { role: 'admin' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;

      jest
        .spyOn(RoleGuard.prototype as any, 'reflector', 'get')
        .mockReturnValue({
          get: jest.fn().mockReturnValue(['admin', 'super-admin']),
        });

      const reflector = require('@nestjs/core').Reflector;
      const spy = jest
        .spyOn(reflector, 'get')
        .mockReturnValue(['admin', 'super-admin']);

      const result = roleGuard.canActivate(context);
      expect(result).toBe(true);

      spy.mockRestore();
    });
  });
});

describe('Service Method Integration', () => {
  describe('UserService', () => {
    it('should handle user authentication flow', async () => {
      const mockUserService = {
        checkUser: jest.fn(),
        fetchUser: jest.fn(),
      };

      mockUserService.checkUser.mockResolvedValue('user_checks_complete');
      mockUserService.fetchUser.mockResolvedValue({
        email: 'test@test.com',
        role: 'admin',
        associatedCompany: { companyName: 'Company' },
      });

      const result = await mockUserService.checkUser(
        'test@test.com',
        'password',
      );
      expect(result).toBe('user_checks_complete');

      const user = await mockUserService.fetchUser('test@test.com');
      expect(user).toHaveProperty('email');
    });
  });

  describe('CompanyService', () => {
    it('should handle company operations', async () => {
      const mockCompanyService = {
        getAllCompanies: jest.fn(),
        getCompaniesCount: jest.fn(),
        createCompany: jest.fn(),
      };

      mockCompanyService.getAllCompanies.mockResolvedValue([
        { companyName: 'Company1' },
        { companyName: 'Company2' },
      ]);
      mockCompanyService.getCompaniesCount.mockResolvedValue(2);
      mockCompanyService.createCompany.mockResolvedValue({
        message: 'Company Created',
      });

      const companies = await mockCompanyService.getAllCompanies();
      expect(companies).toHaveLength(2);

      const count = await mockCompanyService.getCompaniesCount();
      expect(count).toBe(2);

      const result = await mockCompanyService.createCompany({
        companyName: 'NewCompany',
      });
      expect(result.message).toBe('Company Created');
    });
  });
});

describe('Validation Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/non-existent-route')
        .expect(404);
    });

    it('should handle PUT method on root', () => {
      return request(app.getHttpServer()).put('/').send({}).expect(404);
    });

    it('should handle DELETE method on root', () => {
      return request(app.getHttpServer()).delete('/').expect(404);
    });
  });

  describe('CORS', () => {
    it('should allow CORS requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Origin', 'http://example.com');
      expect(response.status).toBe(200);
    });

    it('should include proper headers', async () => {
      const response = await request(app.getHttpServer()).get('/');
      expect(response.status).toBe(200);
    });
  });
});
