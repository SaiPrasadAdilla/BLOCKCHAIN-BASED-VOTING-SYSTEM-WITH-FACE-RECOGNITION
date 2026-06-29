import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from '../company-service/company-service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

jest.mock('../company-service/company-service');
jest.mock('@nestjs/jwt');

describe('CompanyController', () => {
  let controller: CompanyController;
  let companyService: jest.Mocked<CompanyService>;

  beforeEach(async () => {
    const mockCompanyService = {
      getAllCompanies: jest.fn(),
      getCompaniesCount: jest.fn(),
      createCompany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: Reflector,
          useValue: { get: jest.fn().mockReturnValue(['admin']) },
        },
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
    companyService = module.get(CompanyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllCompanies', () => {
    it('should return all companies', async () => {
      const mockCompanies = [
        { companyName: 'Company1', createdOn: new Date() },
        { companyName: 'Company2', createdOn: new Date() },
      ];

      companyService.getAllCompanies.mockResolvedValue(mockCompanies as any);

      const result = await controller.getAllCompanies();

      expect(result).toEqual(mockCompanies);
      expect(companyService.getAllCompanies).toHaveBeenCalled();
    });

    it('should return empty array when no companies exist', async () => {
      companyService.getAllCompanies.mockResolvedValue([] as any);

      const result = await controller.getAllCompanies();

      expect(result).toEqual([]);
    });
  });

  describe('getAllCompaniesCount', () => {
    it('should return count of all companies', async () => {
      companyService.getCompaniesCount.mockResolvedValue(5 as any);

      const result = await controller.getAllCompaniesCount();

      expect(result).toBe(5);
      expect(companyService.getCompaniesCount).toHaveBeenCalled();
    });
  });

  describe('createCompany', () => {
    it('should create a new company', async () => {
      const companyDetails = { companyName: 'NewCompany' };
      const expectedResult = { message: 'Company Created' };

      companyService.createCompany.mockResolvedValue(expectedResult as any);

      const result = await controller.createCompany(companyDetails as any);

      expect(result).toEqual(expectedResult);
      expect(companyService.createCompany).toHaveBeenCalledWith(companyDetails);
    });

    it('should handle company creation error', async () => {
      const companyDetails = { companyName: 'FailedCompany' };
      const expectedResult = { message: 'Error in creating company' };

      companyService.createCompany.mockResolvedValue(expectedResult as any);

      const result = await controller.createCompany(companyDetails as any);

      expect(result.message).toBe('Error in creating company');
    });
  });
});
