import { Test, TestingModule } from '@nestjs/testing';
import { ServiceincidenceController } from './serviceincidence.controller';

describe('ServiceincidenceController', () => {
  let controller: ServiceincidenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceincidenceController],
    }).compile();

    controller = module.get<ServiceincidenceController>(ServiceincidenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
