import { Test, TestingModule } from '@nestjs/testing';
import { ServicetypeController } from './servicetype.controller';

describe('ServicetypeController', () => {
  let controller: ServicetypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicetypeController],
    }).compile();

    controller = module.get<ServicetypeController>(ServicetypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
