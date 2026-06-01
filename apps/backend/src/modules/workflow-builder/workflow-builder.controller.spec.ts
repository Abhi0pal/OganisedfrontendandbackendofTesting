import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowBuilderController } from './workflow-builder.controller';

describe('WorkflowBuilderController', () => {
  let controller: WorkflowBuilderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowBuilderController],
    }).compile();

    controller = module.get<WorkflowBuilderController>(WorkflowBuilderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
