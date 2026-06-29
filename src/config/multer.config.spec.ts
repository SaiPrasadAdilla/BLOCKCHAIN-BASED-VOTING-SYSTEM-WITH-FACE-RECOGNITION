import { Test, TestingModule } from '@nestjs/testing';
import { MulterConfig, multerOptions } from './multer.config';

describe('MulterConfig', () => {
  let multerConfig: MulterConfig;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MulterConfig],
    }).compile();

    multerConfig = module.get<MulterConfig>(MulterConfig);
  });

  describe('options', () => {
    it('should return multer options object', () => {
      const options = multerConfig.options;

      expect(options).toBeDefined();
      expect(options.storage).toBeDefined();
      expect(options.limits).toBeDefined();
      expect(options.fileFilter).toBeDefined();
    });

    it('should have memory storage configured', () => {
      const options = multerConfig.options;

      expect(options.storage).toBeDefined();
    });

    it('should have file size limit of 10MB', () => {
      const options = multerConfig.options;

      expect(options.limits?.fileSize).toBe(10 * 1024 * 1024);
    });

    it('should filter valid image types', () => {
      const options = multerConfig.options;

      const mockFile = {
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      let accepted = false;
      options.fileFilter!({} as Express.Request, mockFile, (error, accept) => {
        if (!error) accepted = accept;
      });

      expect(accepted).toBe(true);
    });

    it('should reject invalid file types', () => {
      const options = multerConfig.options;

      const mockFile = {
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      let accepted = false;
      options.fileFilter!({} as Express.Request, mockFile, (error, accept) => {
        if (!error) accepted = accept;
      });

      expect(accepted).toBe(false);
    });

    it('should accept PNG images', () => {
      const options = multerConfig.options;

      const mockFile = {
        mimetype: 'image/png',
      } as Express.Multer.File;

      let accepted = false;
      options.fileFilter!({} as Express.Request, mockFile, (error, accept) => {
        if (!error) accepted = accept;
      });

      expect(accepted).toBe(true);
    });

    it('should accept GIF images', () => {
      const options = multerConfig.options;

      const mockFile = {
        mimetype: 'image/gif',
      } as Express.Multer.File;

      let accepted = false;
      options.fileFilter!({} as Express.Request, mockFile, (error, accept) => {
        if (!error) accepted = accept;
      });

      expect(accepted).toBe(true);
    });

    it('should accept WebP images', () => {
      const options = multerConfig.options;

      const mockFile = {
        mimetype: 'image/webp',
      } as Express.Multer.File;

      let accepted = false;
      options.fileFilter!({} as Express.Request, mockFile, (error, accept) => {
        if (!error) accepted = accept;
      });

      expect(accepted).toBe(true);
    });
  });

  describe('multerOptions export', () => {
    it('should have valid storage', () => {
      expect(multerOptions.storage).toBeDefined();
    });

    it('should have valid limits', () => {
      expect(multerOptions.limits?.fileSize).toBe(10 * 1024 * 1024);
    });

    it('should have valid fileFilter', () => {
      expect(multerOptions.fileFilter).toBeDefined();
    });
  });
});
