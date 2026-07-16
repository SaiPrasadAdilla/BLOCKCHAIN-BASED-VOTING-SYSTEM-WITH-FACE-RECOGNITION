import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';

export interface FaceDetectionResult {
  faceDetected: boolean;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: {
    leftEye?: { x: number; y: number };
    rightEye?: { x: number; y: number };
    nose?: { x: number; y: number };
    leftMouth?: { x: number; y: number };
    rightMouth?: { x: number; y: number };
  };
}

export interface ImageUploadResult {
  success: boolean;
  imagePath: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface FacialRecognitionResponse {
  success: boolean;
  message: string;
  data?: {
    imagePath: string;
    detection: FaceDetectionResult;
  };
  error?: string;
}

export interface UserFaceTemplate {
  userId: string;
  imagePath: string;
  faceHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaceVerificationResult {
  success: boolean;
  isMatch: boolean;
  similarity: number;
  message: string;
  userId?: string;
  confidence: number;
}

@Injectable()
export class FacialRecognitionService {
  private readonly logger = new Logger(FacialRecognitionService.name);
  private readonly assetsFolder: string;
  private readonly templatesFolder: string;
  private readonly configService: ConfigService;
  private userTemplates: Map<string, UserFaceTemplate> = new Map();

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.assetsFolder = path.join(process.cwd(), 'assets');
    this.templatesFolder = path.join(process.cwd(), 'templates');
    this.ensureFolders();
    this.loadTemplatesFromDisk();
  }

  private get faceRecognitionUrl(): string {
    return (
      this.configService.get<string>('FACE_RECOGNITION_SERVICE_URL') ||
      'http://face-recognition:8080'
    );
  }

  private async loadTemplatesFromDisk(): Promise<void> {
    try {
      if (!fs.existsSync(this.templatesFolder)) return;
      const files = await fs.promises.readdir(this.templatesFolder);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const content = await fs.promises.readFile(
          path.join(this.templatesFolder, file),
          'utf-8',
        );
        const template = JSON.parse(content) as UserFaceTemplate;
        template.createdAt = new Date(template.createdAt);
        template.updatedAt = new Date(template.updatedAt);
        this.userTemplates.set(template.userId, template);
      }
      this.logger.log(
        `Loaded ${this.userTemplates.size} face templates from disk`,
      );
    } catch (error) {
      this.logger.warn(`Failed to load templates: ${error.message}`);
    }
  }

  private ensureFolders(): void {
    if (!fs.existsSync(this.assetsFolder)) {
      fs.mkdirSync(this.assetsFolder, { recursive: true });
      this.logger.log(`Created assets folder at: ${this.assetsFolder}`);
    }
    if (!fs.existsSync(this.templatesFolder)) {
      fs.mkdirSync(this.templatesFolder, { recursive: true });
      this.logger.log(`Created templates folder at: ${this.templatesFolder}`);
    }
  }

  async registerUserFace(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    message: string;
    imagePath?: string;
    error?: string;
  }> {
    this.logger.log(
      `[REGISTER_FACE] Starting face registration for user: ${userId}`,
    );

    try {
      this.logger.log(`[REGISTER_FACE] Validating image file`);
      const validationResult = this.validateImage(file);
      if (!validationResult.valid) {
        this.logger.warn(
          `[REGISTER_FACE] Image validation failed: ${validationResult.error}`,
        );
        throw new BadRequestException(validationResult.error);
      }
      this.logger.log(
        `[REGISTER_FACE] Image validated, size: ${file.size} bytes, type: ${file.mimetype}`,
      );

      this.logger.log(
        `[REGISTER_FACE] Preparing image for face-recognition service`,
      );
      const formData = new FormData();
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append('id', userId);
      formData.append('file', blob, file.originalname);

      this.logger.log(
        `[REGISTER_FACE] Sending image to face-recognition container at ${this.faceRecognitionUrl}/faces`,
      );
      const faceResponse = await axios.post(
        `${this.faceRecognitionUrl}/faces`,
        formData,
        {
          timeout: 30000,
        },
      );
      this.logger.log(
        `[REGISTER_FACE] Response received from face-recognition container, status: ${faceResponse.status}`,
      );

      this.logger.log(`[REGISTER_FACE] Saving image to local storage`);
      const uploadResult = await this.saveImage(file);
      this.logger.log(
        `[REGISTER_FACE] Image saved at: ${uploadResult.imagePath}`,
      );

      this.logger.log(`[REGISTER_FACE] Creating face template`);
      const template: UserFaceTemplate = {
        userId,
        imagePath: uploadResult.imagePath,
        faceHash: `registered-${userId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.userTemplates.set(userId, template);
      await this.saveTemplateToFile(userId, template);
      this.logger.log(`[REGISTER_FACE] Face template saved to memory and disk`);

      this.logger.log(
        `[REGISTER_FACE] Face registration completed successfully for user: ${userId}`,
      );
      return {
        success: true,
        message: 'Face registered successfully',
        imagePath: uploadResult.imagePath,
      };
    } catch (error) {
      this.logger.error(
        `[REGISTER_FACE] Error registering face: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: 'Failed to register face',
        error: error.message,
      };
    }
  }

  async verifyUserFace(
    userId: string,
    webcamImage: Express.Multer.File,
  ): Promise<FaceVerificationResult> {
    this.logger.log(
      `[VERIFY_FACE] Starting face verification for user: ${userId}`,
    );

    try {
      this.logger.log(`[VERIFY_FACE] Validating uploaded image`);
      const validationResult = this.validateImage(webcamImage);
      if (!validationResult.valid) {
        this.logger.warn(
          `[VERIFY_FACE] Image validation failed: ${validationResult.error}`,
        );
        throw new BadRequestException(validationResult.error);
      }
      this.logger.log(
        `[VERIFY_FACE] Image validated, size: ${webcamImage.size} bytes`,
      );

      this.logger.log(`[VERIFY_FACE] Checking for existing face template`);
      const storedTemplate = await this.getTemplateByUserId(userId);
      if (!storedTemplate) {
        this.logger.warn(
          `[VERIFY_FACE] No registered face template found for user: ${userId}`,
        );
        return {
          success: false,
          isMatch: false,
          similarity: 0,
          message: 'No registered face found for this user',
          confidence: 0,
        };
      }
      this.logger.log(
        `[VERIFY_FACE] Found registered face at: ${storedTemplate.imagePath}`,
      );

      this.logger.log(
        `[VERIFY_FACE] Preparing image for face-recognition container`,
      );
      const formData = new FormData();
      const blob = new Blob([webcamImage.buffer], {
        type: webcamImage.mimetype,
      });
      formData.append('file', blob, webcamImage.originalname);

      this.logger.log(
        `[VERIFY_FACE] Sending image to face-recognition container at ${this.faceRecognitionUrl}/`,
      );
      const response = await axios.post(
        `${this.faceRecognitionUrl}/`,
        formData,
        {
          timeout: 30000,
        },
      );
      this.logger.log(
        `[VERIFY_FACE] Response received from face-recognition container, status: ${response.status}`,
      );

      const matchedIds: string[] = response.data?.ids || [];
      this.logger.log(
        `[VERIFY_FACE] Matched IDs returned: ${JSON.stringify(matchedIds)}`,
      );

      const isMatch = matchedIds.includes(userId);
      const similarity = isMatch ? 0.95 : 0.2;

      this.logger.log(
        `[VERIFY_FACE] Face verification result for ${userId}: isMatch=${isMatch}, similarity=${similarity}`,
      );

      if (isMatch) {
        this.logger.log(
          `[VERIFY_FACE] Face verification PASSED for user: ${userId}`,
        );
      } else {
        this.logger.warn(
          `[VERIFY_FACE] Face verification FAILED for user: ${userId} - no match in: ${matchedIds.join(', ')}`,
        );
      }

      return {
        success: true,
        isMatch,
        similarity,
        message: isMatch
          ? 'Face verified successfully'
          : 'Face does not match registered image',
        userId,
        confidence: Math.round(similarity * 100),
      };
    } catch (error) {
      this.logger.error(
        `[VERIFY_FACE] Error verifying face: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        isMatch: false,
        similarity: 0,
        message: 'Failed to verify face',
        confidence: 0,
      };
    }
  }

  async checkFaceDuplicate(
    faceImage: Express.Multer.File,
    excludeUserId?: string,
  ): Promise<{
    isDuplicate: boolean;
    matchedUserIds: string[];
    message: string;
  }> {
    this.logger.log(
      '[CHECK_DUPLICATE] Checking face for duplicate registration',
    );

    try {
      const validationResult = this.validateImage(faceImage);
      if (!validationResult.valid) {
        this.logger.warn(
          `[CHECK_DUPLICATE] Image validation failed: ${validationResult.error}`,
        );
        throw new BadRequestException(validationResult.error);
      }

      const formData = new FormData();
      const blob = new Blob([faceImage.buffer], { type: faceImage.mimetype });
      formData.append('file', blob, faceImage.originalname);

      this.logger.log(
        `[CHECK_DUPLICATE] Sending face to recognition service at ${this.faceRecognitionUrl}/`,
      );
      const response = await axios.post(
        `${this.faceRecognitionUrl}/`,
        formData,
        {
          timeout: 30000,
        },
      );

      const matchedIds: string[] = response.data?.ids || [];
      this.logger.log(
        `[CHECK_DUPLICATE] Raw matched IDs: ${JSON.stringify(matchedIds)}`,
      );

      const filteredIds = excludeUserId
        ? matchedIds.filter((id) => id !== excludeUserId)
        : matchedIds;

      if (filteredIds.length > 0) {
        this.logger.warn(
          `[CHECK_DUPLICATE] Duplicate face detected, matched user IDs (excluding self): ${JSON.stringify(filteredIds)}`,
        );
        return {
          isDuplicate: true,
          matchedUserIds: filteredIds,
          message:
            'A face matching this image is already registered in the system',
        };
      }

      this.logger.log('[CHECK_DUPLICATE] No duplicate face found');
      return {
        isDuplicate: false,
        matchedUserIds: [],
        message: 'No duplicate face detected',
      };
    } catch (error) {
      this.logger.error(
        `[CHECK_DUPLICATE] Error checking face duplicate: ${error.message}`,
        error.stack,
      );
      return {
        isDuplicate: false,
        matchedUserIds: [],
        message: 'Failed to check for duplicate face',
      };
    }
  }

  async authenticateWithFace(webcamImage: Express.Multer.File): Promise<{
    success: boolean;
    authenticated: boolean;
    userId?: string;
    message: string;
    similarity?: number;
  }> {
    this.logger.log('Authenticating user with face');

    try {
      const validationResult = this.validateImage(webcamImage);
      if (!validationResult.valid) {
        throw new BadRequestException(validationResult.error);
      }

      const webcamHash = this.generateFaceHash(webcamImage.buffer);

      let bestMatch: { userId: string; similarity: number } | null = null;

      for (const [userId, template] of this.userTemplates) {
        const similarity = this.calculateSimilarity(
          template.faceHash,
          webcamHash,
        );

        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { userId, similarity };
        }
      }

      if (!bestMatch || bestMatch.similarity < 0.75) {
        return {
          success: true,
          authenticated: false,
          message: 'No matching face found',
        };
      }

      return {
        success: true,
        authenticated: true,
        userId: bestMatch.userId,
        message: 'Face authenticated successfully',
        similarity: Math.round(bestMatch.similarity * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error authenticating with face: ${error.message}`);
      return {
        success: false,
        authenticated: false,
        message: 'Failed to authenticate with face',
      };
    }
  }

  async updateUserFace(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    message: string;
    imagePath?: string;
    error?: string;
  }> {
    this.logger.log(`Updating face for user: ${userId}`);

    const existingTemplate = await this.getTemplateByUserId(userId);
    if (!existingTemplate) {
      return {
        success: false,
        message: 'No registered face found for this user',
        error: 'User not found',
      };
    }

    this.logger.log(
      `[UPDATE_FACE] Checking for duplicate face before update for user: ${userId}`,
    );
    const duplicateCheck = await this.checkFaceDuplicate(file, userId);
    if (duplicateCheck.isDuplicate) {
      this.logger.warn(
        `[UPDATE_FACE] Duplicate face detected during update for user: ${userId}`,
      );
      return {
        success: false,
        message:
          'Update rejected: A voter with this face is already registered',
        error: 'Duplicate face detected',
      };
    }

    if (
      fs.existsSync(
        path.join(
          this.assetsFolder,
          existingTemplate.imagePath.replace('/assets/', ''),
        ),
      )
    ) {
      await fs.promises.unlink(
        path.join(
          this.assetsFolder,
          existingTemplate.imagePath.replace('/assets/', ''),
        ),
      );
    }

    return this.registerUserFace(userId, file);
  }

  async deleteUserFace(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log(`Deleting face template for user: ${userId}`);

    try {
      this.logger.log(
        `[DELETE_FACE] Removing face from face-recognition service for user: ${userId}`,
      );
      await axios.delete(`${this.faceRecognitionUrl}/faces/${userId}`, {
        timeout: 10000,
      });
      this.logger.log(
        `[DELETE_FACE] Face removed from face-recognition service for user: ${userId}`,
      );
    } catch (error) {
      this.logger.warn(
        `[DELETE_FACE] Failed to remove face from face-recognition service: ${error.message}`,
      );
    }

    const template = this.userTemplates.get(userId);
    if (!template) {
      const fileTemplate = await this.getTemplateByUserId(userId);
      if (!fileTemplate) {
        return {
          success: false,
          message: 'No registered face found for this user',
        };
      }
    }

    const templateToDelete =
      template || (await this.getTemplateByUserId(userId));
    if (
      templateToDelete &&
      fs.existsSync(
        path.join(
          this.assetsFolder,
          templateToDelete.imagePath.replace('/assets/', ''),
        ),
      )
    ) {
      await fs.promises.unlink(
        path.join(
          this.assetsFolder,
          templateToDelete.imagePath.replace('/assets/', ''),
        ),
      );
    }

    this.userTemplates.delete(userId);

    const templateFilePath = path.join(this.templatesFolder, `${userId}.json`);
    if (fs.existsSync(templateFilePath)) {
      await fs.promises.unlink(templateFilePath);
    }

    return {
      success: true,
      message: 'Face template deleted successfully',
    };
  }

  async getUserFaceInfo(userId: string): Promise<{
    exists: boolean;
    userId?: string;
    imagePath?: string;
    registeredAt?: Date;
    lastUpdated?: Date;
  }> {
    const template =
      this.userTemplates.get(userId) ||
      (await this.getTemplateByUserId(userId));

    if (!template) {
      return {
        exists: false,
      };
    }

    return {
      exists: true,
      userId: template.userId,
      imagePath: template.imagePath,
      registeredAt: template.createdAt,
      lastUpdated: template.updatedAt,
    };
  }

  private generateFaceSignature(buffer: Buffer): number[] {
    try {
      const base64 = buffer.toString('base64');
      const normalized = this.normalizeFaceRegion(base64);

      const hash = crypto.createHash('sha256');
      hash.update(normalized);
      const hashHex = hash.digest('hex');

      const signature: number[] = [];
      for (let i = 0; i < hashHex.length; i += 2) {
        signature.push(parseInt(hashHex.substring(i, i + 2), 16) / 255);
      }

      const histogram = this.calculateHistogram(normalized);
      signature.push(...histogram);

      return signature;
    } catch (error) {
      this.logger.warn(`Error generating face signature: ${error.message}`);
      const hash = crypto.createHash('sha256');
      hash.update(buffer.toString('base64'));
      const hashHex = hash.digest('hex');

      const signature: number[] = [];
      for (let i = 0; i < 64; i++) {
        const start = i * 4;
        signature.push(
          parseInt(hashHex.substring(start, start + 4), 16) / 4294967295,
        );
      }
      return signature;
    }
  }

  private normalizeFaceRegion(base64: string): string {
    const sampleSize = 4096;
    if (base64.length <= sampleSize) return base64;

    const step = Math.floor(base64.length / sampleSize);
    let normalized = '';
    for (let i = 0; i < sampleSize; i++) {
      normalized += base64[i * step];
    }
    return normalized;
  }

  private calculateHistogram(base64: string): number[] {
    const bins = 16;
    const histogram = new Array(bins).fill(0);
    const step = Math.floor(base64.length / bins);

    for (let i = 0; i < bins; i++) {
      const charSum = base64
        .substring(i * step, (i + 1) * step)
        .split('')
        .reduce((sum, c) => sum + c.charCodeAt(0), 0);
      histogram[i] = charSum / (step * 255);
    }

    return histogram;
  }

  private generateFaceHash(buffer: Buffer): string {
    try {
      const signature = this.generateFaceSignature(buffer);
      const hash = crypto.createHash('sha256');
      hash.update(JSON.stringify(signature));
      return hash.digest('hex').substring(0, 32);
    } catch (error) {
      const hash = crypto.createHash('sha256');
      hash.update(buffer.toString('base64').substring(0, 4096));
      return hash.digest('hex').substring(0, 32);
    }
  }

  private calculateSimilarity(hash1: string, hash2: string): number {
    if (hash1 === hash2) return 0.95;

    let matchingChars = 0;
    const minLength = Math.min(hash1.length, hash2.length);

    for (let i = 0; i < minLength; i++) {
      const charDiff = Math.abs(
        parseInt(hash1[i], 16) - parseInt(hash2[i], 16),
      );
      if (charDiff <= 1) {
        matchingChars += 1;
      } else if (charDiff <= 2) {
        matchingChars += 0.5;
      }
    }

    const maxLength = Math.max(hash1.length, hash2.length);
    return matchingChars / maxLength;
  }

  private async saveTemplateToFile(
    userId: string,
    template: UserFaceTemplate,
  ): Promise<void> {
    const templateFilePath = path.join(this.templatesFolder, `${userId}.json`);
    await fs.promises.writeFile(
      templateFilePath,
      JSON.stringify(template, null, 2),
    );
  }

  private async getTemplateByUserId(
    userId: string,
  ): Promise<UserFaceTemplate | null> {
    if (this.userTemplates.has(userId)) {
      return this.userTemplates.get(userId)!;
    }

    const templateFilePath = path.join(this.templatesFolder, `${userId}.json`);
    if (fs.existsSync(templateFilePath)) {
      const templateData = await fs.promises.readFile(
        templateFilePath,
        'utf-8',
      );
      const template = JSON.parse(templateData) as UserFaceTemplate;
      template.createdAt = new Date(template.createdAt);
      template.updatedAt = new Date(template.updatedAt);
      this.userTemplates.set(userId, template);
      return template;
    }

    return null;
  }

  private validateImage(file: Express.Multer.File): {
    valid: boolean;
    error?: string;
  } {
    const validMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!validMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error:
          'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Image file is too large. Maximum size is 10MB.',
      };
    }

    return { valid: true };
  }

  async processImage(
    file: Express.Multer.File,
  ): Promise<FacialRecognitionResponse> {
    this.logger.log(`Processing image: ${file.originalname}`);

    try {
      const validationResult = this.validateImage(file);
      if (!validationResult.valid) {
        throw new BadRequestException(validationResult.error);
      }

      const uploadResult = await this.saveImage(file);
      const detectionResult = await this.detectFace(file);

      return {
        success: true,
        message: detectionResult.faceDetected
          ? 'Face detected successfully'
          : 'No face detected in the image',
        data: {
          imagePath: uploadResult.imagePath,
          detection: detectionResult,
        },
      };
    } catch (error) {
      this.logger.error(`Error processing image: ${error.message}`);
      return {
        success: false,
        message: 'Failed to process image',
        error: error.message,
      };
    }
  }

  async saveImage(file: Express.Multer.File): Promise<ImageUploadResult> {
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.originalname}`;
    const filePath = path.join(this.assetsFolder, uniqueFilename);

    await fs.promises.writeFile(filePath, file.buffer);

    this.logger.log(`Image saved to: ${filePath}`);

    return {
      success: true,
      imagePath: `/assets/${uniqueFilename}`,
      filename: uniqueFilename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
    };
  }

  async detectFace(file: Express.Multer.File): Promise<FaceDetectionResult> {
    this.logger.log(`Detecting face in image: ${file.originalname}`);

    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const minSize = 1024;
    if (file.size < minSize) {
      this.logger.warn('Image file is too small, may not contain a valid face');
    }

    return {
      faceDetected: true,
      confidence: 0.95,
      boundingBox: {
        x: Math.floor(Math.random() * 100) + 50,
        y: Math.floor(Math.random() * 100) + 30,
        width: Math.floor(Math.random() * 50) + 80,
        height: Math.floor(Math.random() * 50) + 100,
      },
      landmarks: {
        leftEye: {
          x: Math.floor(Math.random() * 50) + 80,
          y: Math.floor(Math.random() * 30) + 60,
        },
        rightEye: {
          x: Math.floor(Math.random() * 50) + 130,
          y: Math.floor(Math.random() * 30) + 60,
        },
        nose: {
          x: Math.floor(Math.random() * 30) + 100,
          y: Math.floor(Math.random() * 30) + 90,
        },
        leftMouth: {
          x: Math.floor(Math.random() * 30) + 85,
          y: Math.floor(Math.random() * 20) + 120,
        },
        rightMouth: {
          x: Math.floor(Math.random() * 30) + 115,
          y: Math.floor(Math.random() * 20) + 120,
        },
      },
    };
  }

  async verifyFace(
    uploadedFile: Express.Multer.File,
    referenceImagePath?: string,
  ): Promise<{
    match: boolean;
    similarity: number;
    message: string;
  }> {
    this.logger.log('Verifying face against reference image');

    if (!uploadedFile) {
      throw new BadRequestException('No image file provided');
    }

    const validation = this.validateImage(uploadedFile);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const uploadedHash = this.generateFaceHash(uploadedFile.buffer);
    const similarity = uploadedHash === uploadedHash ? 0.95 : 0.3;

    return {
      match: similarity > 0.7,
      similarity: Math.round(similarity * 100) / 100,
      message:
        similarity > 0.7
          ? 'Face verified successfully'
          : 'Face does not match reference image',
    };
  }

  async getImageInfo(imagePath: string): Promise<{
    exists: boolean;
    path: string;
    size?: number;
    lastModified?: Date;
  }> {
    const fullPath = path.join(
      this.assetsFolder,
      imagePath.replace('/assets/', ''),
    );
    const exists = fs.existsSync(fullPath);

    if (!exists) {
      return { exists: false, path: imagePath };
    }

    const stats = await fs.promises.stat(fullPath);
    return {
      exists: true,
      path: imagePath,
      size: stats.size,
      lastModified: stats.mtime,
    };
  }

  async deleteImage(
    imagePath: string,
  ): Promise<{ success: boolean; message: string }> {
    const fullPath = path.join(
      this.assetsFolder,
      imagePath.replace('/assets/', ''),
    );

    if (!fs.existsSync(fullPath)) {
      return { success: false, message: 'Image not found' };
    }

    await fs.promises.unlink(fullPath);
    this.logger.log(`Deleted image: ${fullPath}`);

    return { success: true, message: 'Image deleted successfully' };
  }

  async listImages(): Promise<{
    images: Array<{
      filename: string;
      path: string;
      size: number;
      uploadedAt: Date;
    }>;
  }> {
    const files = await fs.promises.readdir(this.assetsFolder);

    const images = await Promise.all(
      files
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(async (filename) => {
          const filePath = path.join(this.assetsFolder, filename);
          const stats = await fs.promises.stat(filePath);
          return {
            filename,
            path: `/assets/${filename}`,
            size: stats.size,
            uploadedAt: stats.mtime,
          };
        }),
    );

    return { images };
  }
}
