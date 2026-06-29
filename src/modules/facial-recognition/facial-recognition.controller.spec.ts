import { Test, TestingModule } from '@nestjs/testing';
import { FacialRecognitionController } from './facial-recognition.controller';
import { FacialRecognitionService } from './facial-recognition.service';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { multerOptions } from '../../config/multer.config';

describe('FacialRecognitionController', () => {
  let controller: FacialRecognitionController;
  let service: FacialRecognitionService;

  const mockFacialRecognitionService = {
    processImage: jest.fn(),
    verifyFace: jest.fn(),
    listImages: jest.fn(),
    getImageInfo: jest.fn(),
    deleteImage: jest.fn(),
    detectFace: jest.fn(),
    registerUserFace: jest.fn(),
    verifyUserFace: jest.fn(),
    authenticateWithFace: jest.fn(),
    updateUserFace: jest.fn(),
    deleteUserFace: jest.fn(),
    getUserFaceInfo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacialRecognitionController],
      providers: [
        {
          provide: FacialRecognitionService,
          useValue: mockFacialRecognitionService,
        },
      ],
    }).compile();

    controller = module.get<FacialRecognitionController>(
      FacialRecognitionController,
    );
    service = module.get<FacialRecognitionService>(FacialRecognitionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should successfully upload and process an image', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test-face.jpg',
        filename: '1234567890-test-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        success: true,
        message: 'Face detected successfully',
        data: {
          imagePath: '/assets/1234567890-test-face.jpg',
          detection: {
            faceDetected: true,
            confidence: 0.95,
            boundingBox: { x: 100, y: 50, width: 100, height: 120 },
          },
        },
      };

      mockFacialRecognitionService.processImage.mockResolvedValue(mockResponse);

      const result = await controller.uploadImage(mockFile);

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.processImage).toHaveBeenCalledWith(
        mockFile,
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.uploadImage(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle images without face detected', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'no-face.jpg',
        filename: '1234567890-no-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        success: true,
        message: 'No face detected in the image',
        data: {
          imagePath: '/assets/1234567890-no-face.jpg',
          detection: {
            faceDetected: false,
            confidence: 0,
          },
        },
      };

      mockFacialRecognitionService.processImage.mockResolvedValue(mockResponse);

      const result = await controller.uploadImage(mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No face detected in the image');
      expect(result.data?.detection.faceDetected).toBe(false);
    });
  });

  describe('verifyFace', () => {
    it('should successfully verify a face', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'verify.jpg',
        filename: '1234567890-verify.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        match: true,
        similarity: 0.85,
        message: 'Face verified successfully',
      };

      mockFacialRecognitionService.verifyFace.mockResolvedValue(mockResponse);

      const result = await controller.verifyFace(
        mockFile,
        '/assets/reference.jpg',
      );

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.verifyFace).toHaveBeenCalledWith(
        mockFile,
        '/assets/reference.jpg',
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        controller.verifyFace(undefined as any, '/assets/reference.jpg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle non-matching face verification', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'different.jpg',
        filename: '1234567890-different.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        match: false,
        similarity: 0.45,
        message: 'Face does not match reference image',
      };

      mockFacialRecognitionService.verifyFace.mockResolvedValue(mockResponse);

      const result = await controller.verifyFace(
        mockFile,
        '/assets/reference.jpg',
      );

      expect(result.match).toBe(false);
      expect(result.message).toBe('Face does not match reference image');
    });
  });

  describe('listImages', () => {
    it('should return list of images', async () => {
      const mockResponse = {
        images: [
          {
            filename: 'test1.jpg',
            path: '/assets/test1.jpg',
            size: 10240,
            uploadedAt: new Date(),
          },
          {
            filename: 'test2.png',
            path: '/assets/test2.png',
            size: 20480,
            uploadedAt: new Date(),
          },
        ],
      };

      mockFacialRecognitionService.listImages.mockResolvedValue(mockResponse);

      const result = await controller.listImages();

      expect(result).toEqual(mockResponse);
      expect(result.images.length).toBe(2);
      expect(mockFacialRecognitionService.listImages).toHaveBeenCalled();
    });

    it('should return empty list when no images exist', async () => {
      const mockResponse = { images: [] };

      mockFacialRecognitionService.listImages.mockResolvedValue(mockResponse);

      const result = await controller.listImages();

      expect(result.images).toEqual([]);
      expect(result.images.length).toBe(0);
    });
  });

  describe('getImageInfo', () => {
    it('should return image info for existing image', async () => {
      const mockResponse = {
        exists: true,
        path: '/assets/test.jpg',
        size: 10240,
        lastModified: new Date(),
      };

      mockFacialRecognitionService.getImageInfo.mockResolvedValue(mockResponse);

      const result = await controller.getImageInfo('test.jpg');

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.getImageInfo).toHaveBeenCalledWith(
        '/assets/test.jpg',
      );
    });

    it('should return exists false for non-existent image', async () => {
      const mockResponse = {
        exists: false,
        path: '/assets/nonexistent.jpg',
      };

      mockFacialRecognitionService.getImageInfo.mockResolvedValue(mockResponse);

      const result = await controller.getImageInfo('nonexistent.jpg');

      expect(result.exists).toBe(false);
    });
  });

  describe('deleteImage', () => {
    it('should successfully delete an image', async () => {
      const mockResponse = {
        success: true,
        message: 'Image deleted successfully',
      };

      mockFacialRecognitionService.deleteImage.mockResolvedValue(mockResponse);

      const result = await controller.deleteImage('test.jpg');

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.deleteImage).toHaveBeenCalledWith(
        '/assets/test.jpg',
      );
    });

    it('should return failure message for non-existent image', async () => {
      const mockResponse = {
        success: false,
        message: 'Image not found',
      };

      mockFacialRecognitionService.deleteImage.mockResolvedValue(mockResponse);

      const result = await controller.deleteImage('nonexistent.jpg');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Image not found');
    });
  });

  describe('detectFace', () => {
    it('should successfully detect face in image', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'detect.jpg',
        filename: '1234567890-detect.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        faceDetected: true,
        confidence: 0.95,
        boundingBox: { x: 100, y: 50, width: 100, height: 120 },
        landmarks: {
          leftEye: { x: 120, y: 80 },
          rightEye: { x: 180, y: 80 },
          nose: { x: 150, y: 110 },
          leftMouth: { x: 130, y: 140 },
          rightMouth: { x: 170, y: 140 },
        },
      };

      mockFacialRecognitionService.detectFace.mockResolvedValue(mockResponse);

      const result = await controller.detectFace(mockFile);

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.detectFace).toHaveBeenCalledWith(
        mockFile,
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.detectFace(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle images with no face detected', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'no-face.jpg',
        filename: '1234567890-no-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        faceDetected: false,
        confidence: 0,
      };

      mockFacialRecognitionService.detectFace.mockResolvedValue(mockResponse);

      const result = await controller.detectFace(mockFile);

      expect(result.faceDetected).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'error.jpg',
        filename: '1234567890-error.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-image-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const errorResponse = {
        success: false,
        message: 'Failed to process image',
        error: 'Some internal error',
      };

      mockFacialRecognitionService.processImage.mockResolvedValue(
        errorResponse,
      );

      const result = await controller.uploadImage(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
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
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        success: true,
        message: 'Face registered successfully',
        imagePath: '/assets/1234567890-user-face.jpg',
      };

      mockFacialRecognitionService.registerUserFace.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.registerUserFace('user123', mockFile);

      expect(result).toEqual(mockResponse);
      expect(
        mockFacialRecognitionService.registerUserFace,
      ).toHaveBeenCalledWith('user123', mockFile);
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        controller.registerUserFace('user123', undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyUserFace', () => {
    it('should verify user face successfully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'verify-face.jpg',
        filename: 'verify-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-face-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        success: true,
        isMatch: true,
        similarity: 0.95,
        message: 'Face verified successfully',
        userId: 'user123',
        confidence: 95,
      };

      mockFacialRecognitionService.verifyUserFace.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.verifyUserFace('user123', mockFile);

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.verifyUserFace).toHaveBeenCalledWith(
        'user123',
        mockFile,
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        controller.verifyUserFace('user123', undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('authenticateWithFace', () => {
    it('should authenticate user successfully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'auth-face.jpg',
        filename: 'auth-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('mock-face-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        success: true,
        authenticated: true,
        userId: 'user123',
        message: 'Face authenticated successfully',
        similarity: 0.95,
      };

      mockFacialRecognitionService.authenticateWithFace.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.authenticateWithFace(mockFile);

      expect(result).toEqual(mockResponse);
      expect(
        mockFacialRecognitionService.authenticateWithFace,
      ).toHaveBeenCalledWith(mockFile);
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.authenticateWithFace(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateUserFace', () => {
    it('should update user face successfully', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'new-face.jpg',
        filename: 'new-face.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        buffer: Buffer.from('new-face-data'),
        fieldname: 'image',
        path: '',
        destination: '',
        encoding: '',
      } as Express.Multer.File;

      const mockResponse = {
        success: true,
        message: 'Face registered successfully',
        imagePath: '/assets/new-face.jpg',
      };

      mockFacialRecognitionService.updateUserFace.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.updateUserFace('user123', mockFile);

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.updateUserFace).toHaveBeenCalledWith(
        'user123',
        mockFile,
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        controller.updateUserFace('user123', undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUserFace', () => {
    it('should delete user face successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Face template deleted successfully',
      };

      mockFacialRecognitionService.deleteUserFace.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.deleteUserFace('user123');

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.deleteUserFace).toHaveBeenCalledWith(
        'user123',
      );
    });
  });

  describe('getUserFaceInfo', () => {
    it('should return user face info', async () => {
      const mockResponse = {
        exists: true,
        userId: 'user123',
        imagePath: '/assets/user-face.jpg',
        registeredAt: new Date(),
        lastUpdated: new Date(),
      };

      mockFacialRecognitionService.getUserFaceInfo.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getUserFaceInfo('user123');

      expect(result).toEqual(mockResponse);
      expect(mockFacialRecognitionService.getUserFaceInfo).toHaveBeenCalledWith(
        'user123',
      );
    });
  });
});
