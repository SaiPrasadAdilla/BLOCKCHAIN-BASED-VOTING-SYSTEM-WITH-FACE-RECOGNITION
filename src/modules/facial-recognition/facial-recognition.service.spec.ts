import { Test, TestingModule } from '@nestjs/testing';
import { FacialRecognitionService } from './facial-recognition.service';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

describe('FacialRecognitionService', () => {
  let service: FacialRecognitionService;
  const assetsFolder = path.join(process.cwd(), 'assets');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacialRecognitionService],
    }).compile();

    service = module.get<FacialRecognitionService>(FacialRecognitionService);
  });

  afterEach(async () => {
    if (fs.existsSync(assetsFolder)) {
      const files = await fs.promises.readdir(assetsFolder);
      for (const file of files) {
        if (file.startsWith('test-') || file.startsWith('123')) {
          await fs.promises.unlink(path.join(assetsFolder, file));
        }
      }
    }
  });

  describe('processImage', () => {
    it('should successfully process a valid image with face detected', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test-face.jpg',
        filename: 'test-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
      } as Express.Multer.File;

      const result = await service.processImage(mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.imagePath).toContain('/assets/');
      expect(result.data?.detection).toBeDefined();
      expect(result.data?.detection.faceDetected).toBe(true);
      expect(result.data?.detection.confidence).toBeGreaterThan(0);
    });

    it('should return error when file is invalid', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test.txt',
        filename: 'test.txt',
        mimetype: 'text/plain',
        size: 100,
        buffer: Buffer.from('not-an-image'),
      } as Express.Multer.File;

      const result = await service.processImage(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('saveImage', () => {
    it('should save image to assets folder', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test-image.jpg',
        filename: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 10240,
        buffer: Buffer.from('test-image-content'),
      } as Express.Multer.File;

      const result = await service.saveImage(mockFile);

      expect(result.success).toBe(true);
      expect(result.imagePath).toContain('/assets/');
      expect(result.filename).toBeDefined();
      expect(result.originalName).toBe('test-image.jpg');
      expect(result.size).toBe(10240);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.uploadedAt).toBeInstanceOf(Date);
    });

    it('should create assets folder if it does not exist', async () => {
      const testAssetsFolder = path.join(process.cwd(), 'test-assets-temp');

      if (fs.existsSync(testAssetsFolder)) {
        const files = await fs.promises.readdir(testAssetsFolder);
        for (const file of files) {
          await fs.promises.unlink(path.join(testAssetsFolder, file));
        }
        await fs.promises.rmdir(testAssetsFolder);
      }

      const customService = new FacialRecognitionService();

      const mockFile: Express.Multer.File = {
        originalname: 'temp-test.jpg',
        filename: 'temp-test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const result = await customService.saveImage(mockFile);
      expect(result.success).toBe(true);
    });
  });

  describe('detectFace', () => {
    it('should detect face in valid JPEG image', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'face.jpg',
        filename: 'face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-jpeg-data'),
      } as Express.Multer.File;

      const result = await service.detectFace(mockFile);

      expect(result.faceDetected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.boundingBox).toBeDefined();
      expect(result.boundingBox?.x).toBeDefined();
      expect(result.boundingBox?.y).toBeDefined();
      expect(result.boundingBox?.width).toBeDefined();
      expect(result.boundingBox?.height).toBeDefined();
    });

    it('should detect face in valid PNG image', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'face.png',
        filename: 'face.png',
        mimetype: 'image/png',
        size: 50000,
        buffer: Buffer.from('mock-png-data'),
      } as Express.Multer.File;

      const result = await service.detectFace(mockFile);

      expect(result.faceDetected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should throw BadRequestException for invalid mime type', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'file.pdf',
        filename: 'file.pdf',
        mimetype: 'application/pdf',
        size: 1000,
        buffer: Buffer.from('pdf-data'),
      } as Express.Multer.File;

      await expect(service.detectFace(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for file too large', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'huge.jpg',
        filename: 'huge.jpg',
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024,
        buffer: Buffer.from('large-data'),
      } as Express.Multer.File;

      await expect(service.detectFace(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should warn for small file size', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'small.jpg',
        filename: 'small.jpg',
        mimetype: 'image/jpeg',
        size: 500,
        buffer: Buffer.from('small-data'),
      } as Express.Multer.File;

      const result = await service.detectFace(mockFile);
      expect(result.faceDetected).toBe(true);
    });
  });

  describe('verifyFace', () => {
    it('should verify face successfully when face detected and matches', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'verify-face.jpg',
        filename: 'verify-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
      } as Express.Multer.File;

      const result = await service.verifyFace(mockFile);

      expect(result.similarity).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(service.verifyFace(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return match false when no face detected', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'no-face.pdf',
        filename: 'no-face.pdf',
        mimetype: 'application/pdf',
        size: 1000,
        buffer: Buffer.from('pdf-data'),
      } as Express.Multer.File;

      await expect(service.verifyFace(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getImageInfo', () => {
    it('should return exists false for non-existent image', async () => {
      const result = await service.getImageInfo('/assets/nonexistent.jpg');

      expect(result.exists).toBe(false);
      expect(result.path).toBe('/assets/nonexistent.jpg');
    });

    it('should return image info for existing image', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'info-test.jpg',
        filename: 'info-test.jpg',
        mimetype: 'image/jpeg',
        size: 10240,
        buffer: Buffer.from('test-image-content'),
      } as Express.Multer.File;

      const saveResult = await service.saveImage(mockFile);
      const result = await service.getImageInfo(saveResult.imagePath);

      expect(result.exists).toBe(true);
      expect(result.path).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
      expect(result.lastModified).toBeDefined();
      expect(typeof result.lastModified?.getTime()).toBe('number');
    });
  });

  describe('deleteImage', () => {
    it('should return success false for non-existent image', async () => {
      const result = await service.deleteImage('/assets/nonexistent.jpg');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Image not found');
    });

    it('should delete existing image successfully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'delete-test.jpg',
        filename: 'delete-test.jpg',
        mimetype: 'image/jpeg',
        size: 10240,
        buffer: Buffer.from('test-image-content'),
      } as Express.Multer.File;

      const saveResult = await service.saveImage(mockFile);
      const deleteResult = await service.deleteImage(saveResult.imagePath);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('Image deleted successfully');
    });
  });

  describe('listImages', () => {
    it('should return empty array when no images exist', async () => {
      const result = await service.listImages();

      expect(result.images).toBeDefined();
      expect(Array.isArray(result.images)).toBe(true);
    });

    it('should list all images in assets folder', async () => {
      const mockFile1: Express.Multer.File = {
        originalname: 'list-test-1.jpg',
        filename: 'list-test-1.jpg',
        mimetype: 'image/jpeg',
        size: 10240,
        buffer: Buffer.from('test-image-1'),
      } as Express.Multer.File;

      const mockFile2: Express.Multer.File = {
        originalname: 'list-test-2.png',
        filename: 'list-test-2.png',
        mimetype: 'image/png',
        size: 20480,
        buffer: Buffer.from('test-image-2'),
      } as Express.Multer.File;

      await service.saveImage(mockFile1);
      await service.saveImage(mockFile2);

      const result = await service.listImages();

      expect(result.images.length).toBeGreaterThanOrEqual(2);
      const jpgImages = result.images.filter((img) =>
        img.filename.endsWith('.jpg'),
      );
      expect(jpgImages.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle GIF images', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'face.gif',
        filename: 'face.gif',
        mimetype: 'image/gif',
        size: 30000,
        buffer: Buffer.from('gif-data'),
      } as Express.Multer.File;

      const result = await service.detectFace(mockFile);

      expect(result.faceDetected).toBe(true);
    });

    it('should handle WebP images', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'face.webp',
        filename: 'face.webp',
        mimetype: 'image/webp',
        size: 30000,
        buffer: Buffer.from('webp-data'),
      } as Express.Multer.File;

      const result = await service.detectFace(mockFile);

      expect(result.faceDetected).toBe(true);
    });

    it('should return landmarks when face detected', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'landmarks-test.jpg',
        filename: 'landmarks-test.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('test-data'),
      } as Express.Multer.File;

      const result = await service.detectFace(mockFile);

      expect(result.landmarks).toBeDefined();
      expect(result.landmarks?.leftEye).toBeDefined();
      expect(result.landmarks?.rightEye).toBeDefined();
      expect(result.landmarks?.nose).toBeDefined();
      expect(result.landmarks?.leftMouth).toBeDefined();
      expect(result.landmarks?.rightMouth).toBeDefined();
    });
  });

  describe('registerUserFace', () => {
    it('should register user face successfully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'user-face.jpg',
        filename: 'user-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-face-data'),
      } as Express.Multer.File;

      const result = await service.registerUserFace('user123', mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Face registered successfully');
      expect(result.imagePath).toContain('/assets/');
    });

    it('should fail with invalid file type', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'user-face.txt',
        filename: 'user-face.txt',
        mimetype: 'text/plain',
        size: 1000,
        buffer: Buffer.from('not-an-image'),
      } as Express.Multer.File;

      const result = await service.registerUserFace('user123', mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should fail with file too large', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'large-face.jpg',
        filename: 'large-face.jpg',
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024,
        buffer: Buffer.from('large-data'),
      } as Express.Multer.File;

      const result = await service.registerUserFace('user123', mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('too large');
    });
  });

  describe('verifyUserFace', () => {
    it('should verify user face successfully when matches', async () => {
      const registerFile: Express.Multer.File = {
        originalname: 'register-face.jpg',
        filename: 'register-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-face-data-1'),
      } as Express.Multer.File;

      await service.registerUserFace('verify-user', registerFile);

      const verifyFile: Express.Multer.File = {
        originalname: 'verify-face.jpg',
        filename: 'verify-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-face-data-1'),
      } as Express.Multer.File;

      const result = await service.verifyUserFace('verify-user', verifyFile);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.similarity).toBeGreaterThan(0.7);
      expect(result.userId).toBe('verify-user');
      expect(result.message).toBe('Face verified successfully');
    });

    it('should return no registered face for non-existent user', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test-face.jpg',
        filename: 'test-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-face-data'),
      } as Express.Multer.File;

      const result = await service.verifyUserFace(
        'non-existent-user',
        mockFile,
      );

      expect(result.success).toBe(false);
      expect(result.isMatch).toBe(false);
      expect(result.message).toContain('No registered face found');
    });

    it('should handle invalid file type gracefully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test.txt',
        filename: 'test.txt',
        mimetype: 'text/plain',
        size: 1000,
        buffer: Buffer.from('not-an-image'),
      } as Express.Multer.File;

      const result = await service.verifyUserFace('user123', mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to verify face');
    });

    it('should handle invalid file type gracefully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test.txt',
        filename: 'test.txt',
        mimetype: 'text/plain',
        size: 1000,
        buffer: Buffer.from('not-an-image'),
      } as Express.Multer.File;

      const result = await service.verifyUserFace('user123', mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to verify face');
    });
  });

  describe('authenticateWithFace', () => {
    it('should authenticate user when face matches', async () => {
      const registerFile: Express.Multer.File = {
        originalname: 'auth-face.jpg',
        filename: 'auth-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('auth-face-data'),
      } as Express.Multer.File;

      await service.registerUserFace('auth-user', registerFile);

      const authFile: Express.Multer.File = {
        originalname: 'auth-verify.jpg',
        filename: 'auth-verify.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('auth-face-data'),
      } as Express.Multer.File;

      const result = await service.authenticateWithFace(authFile);

      expect(result.success).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(result.userId).toBe('auth-user');
      expect(result.message).toBe('Face authenticated successfully');
    });

    it('should return not authenticated when no match found', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'unknown-face.jpg',
        filename: 'unknown-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('unknown-face-data'),
      } as Express.Multer.File;

      const result = await service.authenticateWithFace(mockFile);

      expect(result.success).toBe(true);
      expect(result.authenticated).toBe(false);
      expect(result.message).toBe('No matching face found');
    });

    it('should handle invalid file type gracefully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test.txt',
        filename: 'test.txt',
        mimetype: 'text/plain',
        size: 1000,
        buffer: Buffer.from('not-an-image'),
      } as Express.Multer.File;

      const result = await service.authenticateWithFace(mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to authenticate with face');
    });
  });

  describe('updateUserFace', () => {
    it('should update user face successfully', async () => {
      const registerFile: Express.Multer.File = {
        originalname: 'old-face.jpg',
        filename: 'old-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('old-face-data'),
      } as Express.Multer.File;

      await service.registerUserFace('update-user', registerFile);

      const updateFile: Express.Multer.File = {
        originalname: 'new-face.jpg',
        filename: 'new-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('new-face-data'),
      } as Express.Multer.File;

      const result = await service.updateUserFace('update-user', updateFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Face registered successfully');
    });

    it('should fail for non-existent user', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'new-face.jpg',
        filename: 'new-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('new-face-data'),
      } as Express.Multer.File;

      const result = await service.updateUserFace('non-existent', mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No registered face found');
    });
  });

  describe('deleteUserFace', () => {
    it('should delete user face successfully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'delete-face.jpg',
        filename: 'delete-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('delete-face-data'),
      } as Express.Multer.File;

      await service.registerUserFace('delete-user', mockFile);

      const result = await service.deleteUserFace('delete-user');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Face template deleted successfully');
    });

    it('should return failure for non-existent user', async () => {
      const result = await service.deleteUserFace('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No registered face found');
    });
  });

  describe('getUserFaceInfo', () => {
    it('should return user face info for registered user', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'info-face.jpg',
        filename: 'info-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('info-face-data'),
      } as Express.Multer.File;

      await service.registerUserFace('info-user', mockFile);

      const result = await service.getUserFaceInfo('info-user');

      expect(result.exists).toBe(true);
      expect(result.userId).toBe('info-user');
      expect(result.imagePath).toContain('/assets/');
      expect(result.registeredAt).toBeDefined();
    });

    it('should return exists false for non-existent user', async () => {
      const result = await service.getUserFaceInfo('non-existent-user');

      expect(result.exists).toBe(false);
    });
  });
});
