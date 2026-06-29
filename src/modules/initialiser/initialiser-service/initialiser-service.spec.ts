import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InitialiserService } from './initialiser-service';
import { User } from '../../../schemas/user.schema';
import { company } from '../../../schemas/company.schema';

jest.mock('bcrypt');

const createMockUserModel = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  save: jest.fn(),
});

const createMockCompanyModel = () => {
  const mockSave = jest.fn();
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: mockSave,
    create: jest.fn(),
  };
};

describe('InitialiserService', () => {
  let service: InitialiserService;
  let mockUserModel: ReturnType<typeof createMockUserModel>;
  let mockCompanyModel: ReturnType<typeof createMockCompanyModel>;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.admin_username = 'admin@test.com';
    process.env.admin_password = 'adminpass';
    process.env.salt_rounds = '10';

    mockUserModel = createMockUserModel();
    mockCompanyModel = createMockCompanyModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitialiserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(company.name),
          useValue: mockCompanyModel,
        },
      ],
    }).compile();

    service = module.get<InitialiserService>(InitialiserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
