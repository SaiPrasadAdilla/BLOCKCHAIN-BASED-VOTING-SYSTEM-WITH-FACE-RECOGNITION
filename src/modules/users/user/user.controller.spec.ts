import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../user-service/user-service';
import { AuthGuard } from '../../../guards/auth/auth.guard';
import { RoleGuard } from '../../../guards/role/role.guard';
import { JwtService } from '@nestjs/jwt';

jest.mock('../user-service/user-service');
jest.mock('@nestjs/jwt');

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockUserService = {
      createUser: jest.fn(),
      checkUser: jest.fn(),
      fetchUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: AuthGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: RoleGuard,
          useValue: { canActivate: () => true },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should call userService.createUser with user details', async () => {
      const userDetails = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        role: 'admin',
        associatedCompany: { companyName: 'TestCompany' } as any,
      };

      const expectedResult = { message: 'User Created !!!!' };
      userService.createUser.mockResolvedValue(expectedResult as any);

      const result = await controller.createUser(userDetails);

      expect(result).toEqual(expectedResult);
      expect(userService.createUser).toHaveBeenCalledWith(userDetails);
    });

    it('should handle duplicate user creation', async () => {
      const userDetails = {
        name: 'Existing User',
        email: 'existing@test.com',
        password: 'password123',
        role: 'admin',
        associatedCompany: {} as any,
      };

      const expectedResult = { message: 'user already present' };
      userService.createUser.mockResolvedValue(expectedResult as any);

      const result = await controller.createUser(userDetails);

      expect(result.message).toBe('user already present');
    });
  });
});
