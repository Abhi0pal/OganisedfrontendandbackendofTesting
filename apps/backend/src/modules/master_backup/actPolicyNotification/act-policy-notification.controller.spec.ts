import { Test, TestingModule } from '@nestjs/testing';
import { ActPolicyNotificationController } from './act-policy-notification.controller';

describe('ActPolicyNotificationController', () => {
  let controller: ActPolicyNotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActPolicyNotificationController],
    }).compile();

    controller = module.get<ActPolicyNotificationController>(ActPolicyNotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
