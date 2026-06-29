import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user-service';
import { User } from '../../../schemas/user.schema';

jest.mock('bcrypt');

const createMockUserModel = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  save: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let mockUserModel: ReturnType<typeof createMockUserModel>;

  beforeEach(async () => {
    mockUserModel = createMockUserModel();
    jest.clearAllMocks();
    process.env.salt_rounds = '10';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkUser', () => {
    it('should return "user_checks_complete" when user exists and password matches', async () => {
      const bcrypt = require('bcrypt');
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      mockUserModel.find.mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(1),
      });
      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.checkUser('test@example.com', 'password123');
      expect(result).toBe('user_checks_complete');
    });

    it('should return "check_password" when user exists but password does not match', async () => {
      const bcrypt = require('bcrypt');
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      mockUserModel.find.mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(1),
      });
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.checkUser(
        'test@example.com',
        'wrongpassword',
      );
      expect(result).toBe('check_password');
    });

    it('should return "check_user" when user does not exist', async () => {
      mockUserModel.find.mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0),
      });

      const result = await service.checkUser(
        'nonexistent@example.com',
        'password123',
      );
      expect(result).toBe('check_user');
    });
  });

  describe('fetchUser', () => {
    it('should fetch user by email with populated company', async () => {
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.fetchUser('test@example.com');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('createUser', () => {
    it('should return InvalidArgumentException when user already exists', async () => {
      mockUserModel.find.mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(1),
      });

      const userDetails = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'admin',
        associatedCompany: {} as any,
      };

      const result = await service.createUser(userDetails);
      expect(result.message).toBe('user already present');
    });

    it('should create a new user successfully', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const MockUserModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));
      (MockUserModel as any).find = jest.fn().mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0),
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserService,
          {
            provide: getModelToken(User.name),
            useValue: MockUserModel,
          },
        ],
      }).compile();

      const testService = module.get<UserService>(UserService);

      const userDetails = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'admin',
        associatedCompany: { _id: 'company-id' } as any,
      };

      const result = await testService.createUser(userDetails);
      expect(result.message).toBe('User Created !!!!');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return functionNotExecutedException on database error', async () => {
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const MockUserModel = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        }),
      }));
      (MockUserModel as any).find = jest.fn().mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0),
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserService,
          {
            provide: getModelToken(User.name),
            useValue: MockUserModel,
          },
        ],
      }).compile();

      const testService = module.get<UserService>(UserService);

      const userDetails = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'admin',
        associatedCompany: { _id: 'company-id' } as any,
      };

      const result = await testService.createUser(userDetails);
      expect(result.message).toContain('Error');
    });
  });
});
