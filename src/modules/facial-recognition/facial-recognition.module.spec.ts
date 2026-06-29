import { Test, TestingModule } from '@nestjs/testing';
import { FacialRecognitionModule } from './facial-recognition.module';
import { FacialRecognitionService } from './facial-recognition.service';

describe('FacialRecognitionModule', () => {
  let service: FacialRecognitionService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [FacialRecognitionModule],
    }).compile();

    service = testingModule.get<FacialRecognitionService>(
      FacialRecognitionService,
    );
  });

  it('should have FacialRecognitionService as a provider', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(FacialRecognitionService);
  });

  it('should export FacialRecognitionService', () => {
    expect(service).toBeDefined();
  });
});
