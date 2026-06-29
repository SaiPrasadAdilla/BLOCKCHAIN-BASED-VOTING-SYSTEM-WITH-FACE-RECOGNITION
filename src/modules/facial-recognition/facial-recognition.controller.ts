import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { multerOptions } from '../../config/multer.config';
import {
  FacialRecognitionService,
  FacialRecognitionResponse,
  FaceVerificationResult,
} from './facial-recognition.service';
import { AuthGuard } from '../../guards/auth/auth.guard';
import { RoleGuard } from '../../guards/role/role.guard';
import { Role } from '../../decorators/role/role.decorator';

@ApiTags('Facial Recognition')
@Controller('facial-recognition')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth()
export class FacialRecognitionController {
  private readonly logger = new Logger(FacialRecognitionController.name);

  constructor(
    private readonly facialRecognitionService: FacialRecognitionService,
  ) {}

  @Post('register/:userId')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Role('super-admin', 'admin', 'owner', 'write')
  @ApiOperation({
    summary: 'Register user face',
    description: 'Register a face image for a user',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Face registered successfully' })
  async registerUserFace(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    message: string;
    imagePath?: string;
    error?: string;
  }> {
    this.logger.log(
      `[CONTROLLER] Received face registration request for user: ${userId}`,
    );

    if (!file) {
      this.logger.warn(
        `[CONTROLLER] No image file provided for user: ${userId}`,
      );
      throw new BadRequestException('No image file provided');
    }
    this.logger.log(
      `[CONTROLLER] Image file received: ${file.originalname}, size: ${file.size} bytes, type: ${file.mimetype}`,
    );

    this.logger.log(
      `[CONTROLLER] Calling facialRecognitionService.registerUserFace`,
    );
    const result = await this.facialRecognitionService.registerUserFace(
      userId,
      file,
    );

    this.logger.log(
      `[CONTROLLER] Face registration completed: success=${result.success}, message: ${result.message}`,
    );
    return result;
  }

  @Post('verify/:userId')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Role('super-admin', 'admin', 'owner', 'write')
  async verifyUserFace(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FaceVerificationResult> {
    this.logger.log(
      `[CONTROLLER] Received face verification request for user: ${userId}`,
    );

    if (!file) {
      this.logger.warn(
        `[CONTROLLER] No image file provided for user: ${userId}`,
      );
      throw new BadRequestException('No image file provided');
    }
    this.logger.log(
      `[CONTROLLER] Image file received: ${file.originalname}, size: ${file.size} bytes`,
    );

    this.logger.log(
      `[CONTROLLER] Calling facialRecognitionService.verifyUserFace`,
    );
    const result = await this.facialRecognitionService.verifyUserFace(
      userId,
      file,
    );

    this.logger.log(
      `[CONTROLLER] Face verification completed: success=${result.success}, isMatch=${result.isMatch}, similarity=${result.similarity}`,
    );
    return result;
  }

  @Post('authenticate')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Role('super-admin', 'admin', 'owner', 'write', 'read')
  async authenticateWithFace(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    authenticated: boolean;
    userId?: string;
    message: string;
    similarity?: number;
  }> {
    this.logger.log('[CONTROLLER] Received face authentication request');

    if (!file) {
      this.logger.warn(
        '[CONTROLLER] No image file provided for authentication',
      );
      throw new BadRequestException('No image file provided');
    }
    this.logger.log(
      `[CONTROLLER] Image file received: ${file.originalname}, size: ${file.size} bytes`,
    );

    const result =
      await this.facialRecognitionService.authenticateWithFace(file);
    this.logger.log(
      `[CONTROLLER] Authentication completed: authenticated=${result.authenticated}, userId=${result.userId}`,
    );
    return result;
  }

  @Put('update/:userId')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Role('super-admin', 'admin', 'owner', 'write')
  async updateUserFace(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    success: boolean;
    message: string;
    imagePath?: string;
    error?: string;
  }> {
    this.logger.log(
      `[CONTROLLER] Received face update request for user: ${userId}`,
    );

    if (!file) {
      this.logger.warn(
        `[CONTROLLER] No image file provided for user: ${userId}`,
      );
      throw new BadRequestException('No image file provided');
    }
    this.logger.log(
      `[CONTROLLER] Image file received: ${file.originalname}, size: ${file.size} bytes`,
    );

    const result = await this.facialRecognitionService.updateUserFace(
      userId,
      file,
    );
    this.logger.log(
      `[CONTROLLER] Face update completed: success=${result.success}`,
    );
    return result;
  }

  @Delete('user/:userId')
  async deleteUserFace(
    @Param('userId') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `[CONTROLLER] Received delete face template request for user: ${userId}`,
    );
    const result = await this.facialRecognitionService.deleteUserFace(userId);
    this.logger.log(
      `[CONTROLLER] Face delete completed: success=${result.success}`,
    );
    return result;
  }

  @Get('user/:userId')
  async getUserFaceInfo(@Param('userId') userId: string): Promise<{
    exists: boolean;
    userId?: string;
    imagePath?: string;
    registeredAt?: Date;
    lastUpdated?: Date;
  }> {
    this.logger.log(
      `[CONTROLLER] Received get face info request for user: ${userId}`,
    );
    const result = await this.facialRecognitionService.getUserFaceInfo(userId);
    this.logger.log(
      `[CONTROLLER] Face info retrieved: exists=${result.exists}`,
    );
    return result;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Role('super-admin', 'admin', 'owner', 'write')
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FacialRecognitionResponse> {
    this.logger.log(`Received image upload request: ${file?.originalname}`);

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.facialRecognitionService.processImage(file);
  }

  @Post('verify')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Role('super-admin', 'admin', 'owner', 'write')
  async verifyFace(
    @UploadedFile() file: Express.Multer.File,
    @Body('referenceImagePath') referenceImagePath?: string,
  ): Promise<{
    match: boolean;
    similarity: number;
    message: string;
  }> {
    this.logger.log('Received face verification request');

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.facialRecognitionService.verifyFace(file, referenceImagePath);
  }

  @Get('images')
  @Role('super-admin', 'admin')
  async listImages(): Promise<{
    images: Array<{
      filename: string;
      path: string;
      size: number;
      uploadedAt: Date;
    }>;
  }> {
    this.logger.log('Received list images request');
    return this.facialRecognitionService.listImages();
  }

  @Get('image/*')
  @Role('super-admin', 'admin')
  async getImageInfo(@Param('path') path: string): Promise<{
    exists: boolean;
    path: string;
    size?: number;
    lastModified?: Date;
  }> {
    this.logger.log(`Received get image info request for: ${path}`);
    return this.facialRecognitionService.getImageInfo(`/assets/${path}`);
  }

  @Delete('image/*')
  @Role('super-admin', 'admin')
  async deleteImage(
    @Param('path') path: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Received delete image request for: ${path}`);
    return this.facialRecognitionService.deleteImage(`/assets/${path}`);
  }

  @Post('detect')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Role('super-admin', 'admin', 'owner', 'write')
  async detectFace(@UploadedFile() file: Express.Multer.File): Promise<{
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
  }> {
    this.logger.log('Received face detection request');

    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.facialRecognitionService.detectFace(file);
  }
}
