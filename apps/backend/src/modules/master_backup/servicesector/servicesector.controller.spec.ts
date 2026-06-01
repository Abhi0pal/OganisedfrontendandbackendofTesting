import { Test, TestingModule } from '@nestjs/testing';
import { ServicesectorController } from './servicesector.controller';

describe('ServicesectorController', () => {
  let controller: ServicesectorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesectorController],
    }).compile();

    controller = module.get<ServicesectorController>(ServicesectorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
