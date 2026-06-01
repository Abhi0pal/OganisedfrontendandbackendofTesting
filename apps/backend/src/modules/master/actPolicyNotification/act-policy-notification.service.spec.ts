import { Test, TestingModule } from '@nestjs/testing';
import { ActPolicyNotificationService } from './act-policy-notification.service';

describe('ActPolicyNotificationService', () => {
  let service: ActPolicyNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActPolicyNotificationService],
    }).compile();

    service = module.get<ActPolicyNotificationService>(ActPolicyNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
