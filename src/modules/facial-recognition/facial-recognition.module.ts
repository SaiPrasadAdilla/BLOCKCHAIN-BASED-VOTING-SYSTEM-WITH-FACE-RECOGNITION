import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FacialRecognitionController } from './facial-recognition.controller';
import { FacialRecognitionService } from './facial-recognition.service';
import { multerOptions } from '../../config/multer.config';

@Module({
  imports: [MulterModule.register(multerOptions)],
  controllers: [FacialRecognitionController],
  providers: [FacialRecognitionService],
  exports: [FacialRecognitionService],
})
export class FacialRecognitionModule {}
