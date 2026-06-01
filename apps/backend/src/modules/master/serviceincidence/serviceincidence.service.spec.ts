import { Test, TestingModule } from '@nestjs/testing';
import { ServiceincidenceService } from './serviceincidence.service';

describe('ServiceincidenceService', () => {
  let service: ServiceincidenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceincidenceService],
    }).compile();

    service = module.get<ServiceincidenceService>(ServiceincidenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
