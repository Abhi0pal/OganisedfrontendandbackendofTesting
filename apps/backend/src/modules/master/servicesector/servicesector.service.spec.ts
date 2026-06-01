import { Test, TestingModule } from '@nestjs/testing';
import { ServicesectorService } from './servicesector.service';

describe('ServicesectorService', () => {
  let service: ServicesectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesectorService],
    }).compile();

    service = module.get<ServicesectorService>(ServicesectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
