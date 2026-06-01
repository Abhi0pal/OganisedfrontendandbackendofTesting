import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowBuilderService } from './workflow-builder.service';

describe('WorkflowBuilderService', () => {
  let service: WorkflowBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowBuilderService],
    }).compile();

    service = module.get<WorkflowBuilderService>(WorkflowBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
