import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CompanyService } from './company-service';
import { company } from '../../../schemas/company.schema';

const mockCompanyModel = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  save: jest.fn(),
});

describe('CompanyService', () => {
  let service: CompanyService;
  let mockCompanyModelInstance: ReturnType<typeof mockCompanyModel>;

  beforeEach(async () => {
    mockCompanyModelInstance = mockCompanyModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getModelToken(company.name),
          useValue: mockCompanyModelInstance,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllCompanies', () => {
    it('should return all companies', async () => {
      const mockCompanies = [
        { companyName: 'Company1', createdOn: new Date() },
        { companyName: 'Company2', createdOn: new Date() },
      ];

      mockCompanyModelInstance.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCompanies),
      });

      const result = await service.getAllCompanies();
      expect(result).toEqual(mockCompanies);
      expect(mockCompanyModelInstance.find).toHaveBeenCalledWith({});
    });

    it('should return empty array when no companies exist', async () => {
      mockCompanyModelInstance.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getAllCompanies();
      expect(result).toEqual([]);
    });
  });

  describe('getCompaniesCount', () => {
    it('should return count of all companies', async () => {
      mockCompanyModelInstance.find.mockReturnValue({
        countDocuments: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(5),
        }),
      });

      const result = await service.getCompaniesCount();
      expect(result).toBe(5);
    });

    it('should return 0 when no companies exist', async () => {
      mockCompanyModelInstance.find.mockReturnValue({
        countDocuments: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(0),
        }),
      });

      const result = await service.getCompaniesCount();
      expect(result).toBe(0);
    });
  });

  describe('createCompany', () => {
    it('should create a new company successfully', async () => {
      const mockSave = jest.fn();
      const MockCompanyModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CompanyService,
          {
            provide: getModelToken(company.name),
            useValue: MockCompanyModel,
          },
        ],
      }).compile();

      const testService = module.get<CompanyService>(CompanyService);

      const companyDetails = { companyName: 'NewCompany' };
      const result = await testService.createCompany(companyDetails as any);

      expect(mockSave).toHaveBeenCalled();
      expect(result.message).toBe('Company Created');
    });

    it('should return functionNotExecutedException on error', async () => {
      const MockCompanyModel = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockImplementation(() => {
          throw new Error('Database error');
        }),
      }));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CompanyService,
          {
            provide: getModelToken(company.name),
            useValue: MockCompanyModel,
          },
        ],
      }).compile();

      const testService = module.get<CompanyService>(CompanyService);

      const companyDetails = { companyName: 'NewCompany' };
      const result = await testService.createCompany(companyDetails as any);

      expect(result.message).toContain('Error');
    });
  });
});
