import { Test, TestingModule } from '@nestjs/testing';
import { ServicetypeService } from './servicetype.service';

describe('ServicetypeService', () => {
  let service: ServicetypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicetypeService],
    }).compile();

    service = module.get<ServicetypeService>(ServicetypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
