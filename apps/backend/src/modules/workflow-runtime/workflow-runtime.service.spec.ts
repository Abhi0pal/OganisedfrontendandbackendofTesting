import { WorkflowRuntimeService } from './workflow-runtime.service';
import { PrismaService } from '../database/prisma.service';

describe('WorkflowRuntimeService.getTasks', () => {
  let service: WorkflowRuntimeService;
  let tx: any;
  let prisma: any;

  beforeEach(() => {
    tx = {
      applicationSubmission: {
        findMany: jest.fn(),
      },
      workflowInstance: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
      workflowInstance: tx.workflowInstance,
    };

    service = new WorkflowRuntimeService(prisma as PrismaService);
  });

  it('returns tasks filtered by roleId', async () => {
    tx.workflowInstance.count.mockResolvedValue(1);
    tx.workflowInstance.findMany.mockResolvedValue([
      {
        id: BigInt(1),
        applicationId: BigInt(101),
        workflowDefinitionVersion: 2,
        currentStep: 4,
        currentRoleId: 99,
        jurisdictionLevel: 'DISTRICT',
        status: 'ACTIVE',
        dueAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    tx.applicationSubmission.findMany.mockResolvedValue([
      {
        submissionId: 101,
        serviceId: '943.0',
        unitName: 'Acme Industries',
        fieldValue: {
          applicant: { fullName: 'Jane Doe' },
          company: { corp: { name: 'Acme Industries Pvt Ltd' } },
        },
      },
    ]);

    const result = await service.getTasks({ roleId: 99 });

    expect(tx.workflowInstance.count).toHaveBeenCalledWith({
      where: {
        currentRoleId: 99,
        status: 'ACTIVE',
      },
    });
    expect(tx.workflowInstance.findMany).toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      applicationId: 101,
      submissionId: 101,
      currentStep: 4,
      currentRoleId: 99,
      jurisdictionLevel: 'DISTRICT',
      status: 'ACTIVE',
      workflowDefinitionVersion: 2,
      serviceId: '943.0',
      applicantName: 'Jane Doe',
      companyName: 'Acme Industries Pvt Ltd',
    });
  });

  it('computes slaBreached correctly from dueAt', async () => {
    const now = Date.now();
    tx.workflowInstance.count.mockResolvedValue(3);
    tx.workflowInstance.findMany.mockResolvedValue([
      {
        id: BigInt(1),
        applicationId: BigInt(201),
        workflowDefinitionVersion: 1,
        currentStep: 2,
        currentRoleId: 77,
        jurisdictionLevel: 'STATE',
        status: 'ACTIVE',
        dueAt: new Date(now - 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: BigInt(2),
        applicationId: BigInt(202),
        workflowDefinitionVersion: 1,
        currentStep: 2,
        currentRoleId: 77,
        jurisdictionLevel: 'STATE',
        status: 'ACTIVE',
        dueAt: new Date(now + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: BigInt(3),
        applicationId: BigInt(203),
        workflowDefinitionVersion: 1,
        currentStep: 2,
        currentRoleId: 77,
        jurisdictionLevel: 'STATE',
        status: 'ACTIVE',
        dueAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    tx.applicationSubmission.findMany.mockResolvedValue([
      {
        submissionId: 201,
        serviceId: '100.0',
        unitName: 'Unit 201',
        fieldValue: {},
      },
      {
        submissionId: 202,
        serviceId: '100.0',
        unitName: 'Unit 202',
        fieldValue: {},
      },
      {
        submissionId: 203,
        serviceId: '100.0',
        unitName: 'Unit 203',
        fieldValue: {},
      },
    ]);

    const result = await service.getTasks({ roleId: 77, status: 'ACTIVE' });

    expect(result.items.map((item: any) => item.slaBreached)).toEqual([
      true,
      false,
      false,
    ]);
  });
});

describe('WorkflowRuntimeService.processAction - PROCESSING_FORM forward-to-many', () => {
  let service: WorkflowRuntimeService;
  let tx: any;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    tx = {
      applicationSubmission: {
        findUnique: jest.fn().mockResolvedValue({
          submissionId: 10003,
          serviceId: '100.0',
          processingLevel: 'District',
          workflowConfigVersion: 1,
          deptId: 1,
          landrigionId: 20,
          formId: 2,
          approvalId: 10,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      applicationWorkflowConfiguration: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          step: 2,
          configVersion: 1,
          status: 'PUBLISHED',
          serviceId: '100.0',
          processingLevel: 'District',
          roleId: 7,
          currentRoleId: 7,
          actionAllowedJson: ['F', 'FA', 'RBI'],
          transitionMapJson: {
            F: { next_step: 3, next_roles: [10] },
            FA: { next_step: 4, next_roles: [12] },
            RBI: { next_step: 1, next_roles: [2] },
          },
          nextAllocationRoleId: null,
          forwardRoleId: null,
          nextRoleId: 10,
          jurisdictionLevel: 'DISTRICT',
          assignmentStrategy: 'ROLE',
          formTypeId: 2,
          slaHours: 0,
        }),
        findMany: jest.fn().mockImplementation((args: any) => {
          const step = Number(args?.where?.step || 0);
          if (step === 2) {
            return Promise.resolve([
              {
                id: 1,
                step: 2,
                configVersion: 1,
                status: 'PUBLISHED',
                serviceId: '100.0',
                processingLevel: 'District',
                roleId: 7,
                currentRoleId: 7,
                actionAllowedJson: ['F', 'FA', 'RBI'],
                transitionMapJson: {
                  F: { next_step: 3, next_roles: [10] },
                  FA: { next_step: 4, next_roles: [12] },
                  RBI: { next_step: 1, next_roles: [2] },
                },
                nextAllocationRoleId: null,
                forwardRoleId: null,
                nextRoleId: 10,
                jurisdictionLevel: 'DISTRICT',
                assignmentStrategy: 'ROLE',
                formTypeId: 2,
                slaHours: 0,
              },
            ]);
          }
          if (step === 3) {
            return Promise.resolve([
              { roleId: 10, currentRoleId: 10, formTypeId: 2 },
            ]);
          }
          if (step === 4) {
            return Promise.resolve([
              { roleId: 12, currentRoleId: 12, formTypeId: 2 },
            ]);
          }
          return Promise.resolve([]);
        }),
      },
      workflowInstance: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          applicationId: BigInt(10003),
          workflowDefinitionVersion: 1,
          currentStep: 2,
          currentRoleId: 7,
          jurisdictionLevel: 'DISTRICT',
          status: 'PENDING',
          dueAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue({ id: 1 }),
      },
      department: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, uniqueTag: 'DEPT' }),
        findMany: jest.fn().mockResolvedValue([
          { id: 1, name: 'Dept 1' },
          { id: 2, name: 'Dept 2' },
        ]),
      },
      department_users: {
        findFirst: jest.fn().mockResolvedValue({ full_name: 'Actor' }),
        findMany: jest.fn().mockImplementation((args: any) => {
          if (args?.where?.dept_id === 1) {
            return Promise.resolve([
              { user_id: BigInt(3), full_name: 'User 3' },
              { user_id: BigInt(5), full_name: 'User 5' },
            ]);
          }
          if (args?.where?.dept_id === 2) {
            return Promise.resolve([
              { user_id: BigInt(8), full_name: 'User 8' },
            ]);
          }
          return Promise.resolve([]);
        }),
      },
      users: {
        findUnique: jest.fn().mockResolvedValue({
          role: { name: 'Officer' },
          department_user: { full_name: 'Actor' },
          investor_profile: null,
        }),
      },
      roles: {
        findUnique: jest.fn().mockResolvedValue({ name: 'Officer' }),
        findMany: jest.fn().mockResolvedValue([{ id: 10, name: 'Role 10' }]),
      },
      formType: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 2, name: 'Processing Form', abbr: 'PROCESSING_FORM' }),
      },
      spApplication: {
        findFirst: jest.fn().mockResolvedValue({ sno: BigInt(1) }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      forwardApplication: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
      applicationHistory: {
        create: jest.fn().mockResolvedValue({}),
      },
      workflowAudit: {
        create: jest.fn().mockResolvedValue({}),
      },
      district: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
      workflowInstance: tx.workflowInstance,
    };

    service = new WorkflowRuntimeService(prisma as PrismaService);
  });

  it('inserts two forwardApplication rows for two departments', async () => {
    await service.processAction({
      submissionId: 10003,
      serviceId: '100.0',
      action: 'FORWARD',
      comments: 'Forwarding',
      forwardedDeptIds: [1, 2],
      forwardedDistId: 20,
      blockPayload: {
        forwardDestinations: ['10-1-20', '10-2-20'],
      },
      userId: BigInt(101),
      userRoleId: 7,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(tx.forwardApplication.create).toHaveBeenCalledTimes(2);
    expect(tx.workflowInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStep: 3,
          currentRoleId: 10,
        }),
      }),
    );
  });

  it('allows FA when configured and moves to FA transition step', async () => {
    await service.processAction({
      submissionId: 10003,
      serviceId: '100.0',
      action: 'FA',
      comments: 'Forwarding to approver',
      userId: BigInt(101),
      userRoleId: 7,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(tx.workflowInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStep: 4,
        }),
      }),
    );
    expect(tx.workflowAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'FA',
        }),
      }),
    );
  });
});

describe('WorkflowRuntimeService.getActivityDetail - action access gating', () => {
  let service: WorkflowRuntimeService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      applicationSubmission: {
        findUnique: jest.fn().mockResolvedValue({
          submissionId: 10003,
          serviceId: '100.0',
          formId: 2,
          applicationStatus: 'P',
          unitName: 'Unit A',
          processingLevel: 'District',
          deptId: 1,
          landrigionId: 20,
          workflowConfigVersion: 1,
        }),
      },
      workflowInstance: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          applicationId: BigInt(10003),
          workflowDefinitionVersion: 1,
          currentStep: 3,
          currentRoleId: 3,
          jurisdictionLevel: 'DISTRICT',
          status: 'PENDING',
          dueAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      applicationWorkflowConfiguration: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            {
              id: 10,
              step: 3,
              configVersion: 1,
              status: 'PUBLISHED',
              roleId: 3,
              currentRoleId: 3,
              formTypeId: 2,
              formType: { abbr: 'PROCESSING_FORM', name: 'Processing Form' },
              jurisdictionLevelMaster: null,
              assignmentStrategyMaster: null,
              actionAllowedJson: ['F'],
              transitionMapJson: { F: { next_step: 2, next_roles: [7] } },
              processingLevel: 'District',
              assignmentRuleJson: {},
              jurisdictionLevel: 'DISTRICT',
              assignmentStrategy: 'ROLE',
              slaHours: 0,
              slaBreachRequiresReason: false,
              subformActionName: null,
              actionMasterIdsJson: [],
            },
          ]),
      },
      forwardApplication: {
        findFirst: jest.fn().mockResolvedValue({
          nextRoleId: 3,
          forwardedDeptId: 1,
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            apprLvlId: 1,
            appSubId: 10003,
            nextRoleId: 3,
            nextUserId: 303,
            forwardedDeptId: 1,
            forwardedDistId: 20,
            actionStatus: 'F',
            actionTaken: 'FORWARD',
            approvStatus: 'P',
            createdOn: new Date(),
          },
        ]),
      },
      department_users: {
        findFirst: jest.fn().mockResolvedValue({
          dept_id: 1,
          district_id: 20,
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      roles: {
        findUnique: jest.fn().mockResolvedValue({ name: 'Department User' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      department: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Dept 1' }),
      },
    };

    service = new WorkflowRuntimeService(prisma as PrismaService);
  });

  it('returns empty actions for role 7 when current role is 3', async () => {
    const result = await service.getActivityDetail({
      userId: BigInt(700),
      userRoleId: 7,
      submissionId: 10003,
    });

    expect(result.actionAccess).toMatchObject({
      allowed: false,
      message: expect.stringContaining('Application is currently pending with'),
    });
    expect(result.currentStepConfig?.actionAllowedJson || []).toEqual([]);
  });

  it('returns step actions for assigned role 3 user', async () => {
    const result = await service.getActivityDetail({
      userId: BigInt(303),
      userRoleId: 3,
      submissionId: 10003,
    });

    expect(result.actionAccess).toMatchObject({
      allowed: true,
    });
    expect(result.currentStepConfig?.actionAllowedJson || []).toEqual(['F']);
  });
});

describe('WorkflowRuntimeService.processAction - step transition persistence', () => {
  let service: WorkflowRuntimeService;
  let tx: any;
  let prisma: any;

  beforeEach(() => {
    tx = {
      applicationSubmission: {
        findUnique: jest.fn().mockResolvedValue({
          submissionId: 10000,
          serviceId: '943.0',
          processingLevel: 'District',
          workflowConfigVersion: 1,
          deptId: 1,
          landrigionId: 20,
          formId: 2,
          approvalId: 2,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      applicationWorkflowConfiguration: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockImplementation((args: any) => {
          const step = Number(args?.where?.step || 0);
          if (step === 1) {
            return Promise.resolve([
              {
                id: 11,
                step: 1,
                configVersion: 1,
                status: 'PUBLISHED',
                serviceId: '943.0',
                roleId: 2,
                currentRoleId: 2,
                actionAllowedJson: ['P'],
                transitionMapJson: { P: { next_step: 2, next_roles: [7] } },
                nextRoleId: 7,
                jurisdictionLevel: 'DISTRICT',
                assignmentStrategy: 'ROLE',
                formTypeId: 2,
                slaHours: 0,
              },
            ]);
          }
          if (step === 2) {
            return Promise.resolve([
              {
                roleId: 7,
                currentRoleId: 7,
                formTypeId: 2,
              },
            ]);
          }
          return Promise.resolve([]);
        }),
      },
      workflowInstance: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          applicationId: BigInt(10000),
          workflowDefinitionVersion: 1,
          currentStep: 1,
          currentRoleId: 2,
          jurisdictionLevel: 'DISTRICT',
          status: 'PENDING',
          dueAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      forwardApplication: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
      department_users: {
        findFirst: jest.fn().mockResolvedValue({ full_name: 'Investor User' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      department: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, uniqueTag: 'DEPT' }),
      },
      users: {
        findUnique: jest.fn().mockResolvedValue({
          role: { name: 'Investor' },
          department_user: null,
          investor_profile: { first_name: 'Inv', last_name: 'User' },
        }),
      },
      roles: {
        findUnique: jest.fn().mockResolvedValue({ name: 'Investor' }),
      },
      formType: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 2, name: 'Applicant Form', abbr: 'AF' }),
      },
      spApplication: {
        findFirst: jest.fn().mockResolvedValue({ sno: BigInt(1) }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      applicationHistory: {
        create: jest.fn().mockResolvedValue({}),
      },
      workflowAudit: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
      workflowInstance: tx.workflowInstance,
    };

    service = new WorkflowRuntimeService(prisma as PrismaService);
  });

  it('moves step 1 P to step 2 role 7', async () => {
    await service.processAction({
      submissionId: 10000,
      serviceId: '943.0',
      action: 'P',
      comments: 'Submitted',
      userId: BigInt(200),
      userRoleId: 2,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(tx.workflowInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStep: 2,
          currentRoleId: 7,
        }),
      }),
    );
  });
});

describe('WorkflowRuntimeService.processAction - department parallel completion', () => {
  let service: WorkflowRuntimeService;
  let tx: any;
  let prisma: any;

  const baseSubmission = {
    submissionId: 10000,
    serviceId: '943.0',
    processingLevel: 'District',
    workflowConfigVersion: 1,
    deptId: 1,
    landrigionId: 20,
    formId: 2,
    approvalId: 3,
  };

  const step3Config = {
    id: 31,
    step: 3,
    configVersion: 1,
    status: 'PUBLISHED',
    serviceId: '943.0',
    roleId: 3,
    currentRoleId: 3,
    actionAllowedJson: ['F'],
    transitionMapJson: {
      F: { next_step: 2, next_roles: [7] },
    },
    nextRoleId: 7,
    jurisdictionLevel: 'DISTRICT',
    assignmentStrategy: 'ROLE',
    formTypeId: 2,
    slaHours: 0,
  };

  beforeEach(() => {
    tx = {
      applicationSubmission: {
        findUnique: jest.fn().mockResolvedValue(baseSubmission),
        update: jest.fn().mockResolvedValue({}),
      },
      applicationWorkflowConfiguration: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockImplementation((args: any) => {
          const step = Number(args?.where?.step || 0);
          if (step === 3) return Promise.resolve([step3Config]);
          if (step === 2) {
            return Promise.resolve([{ roleId: 7, currentRoleId: 7, formTypeId: 2 }]);
          }
          return Promise.resolve([]);
        }),
      },
      workflowInstance: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          applicationId: BigInt(10000),
          workflowDefinitionVersion: 1,
          currentStep: 3,
          currentRoleId: 3,
          jurisdictionLevel: 'DISTRICT',
          status: 'PENDING',
          dueAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      department: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, uniqueTag: 'DEPT' }),
      },
      department_users: {
        findFirst: jest.fn().mockResolvedValue({ dept_id: 1, district_id: 20 }),
        findMany: jest.fn().mockResolvedValue([{ user_id: BigInt(700) }]),
      },
      users: {
        findUnique: jest.fn().mockResolvedValue({
          role: { name: 'Department User' },
          department_user: { full_name: 'Dept Officer' },
          investor_profile: null,
        }),
      },
      roles: {
        findUnique: jest.fn().mockResolvedValue({ name: 'Department User' }),
      },
      formType: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 2, name: 'Comment Level', abbr: 'PROCESSING_FORM' }),
      },
      spApplication: {
        findFirst: jest.fn().mockResolvedValue({ sno: BigInt(1) }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      forwardApplication: {
        findFirst: jest.fn().mockResolvedValue({
          nextRoleId: 3,
          forwardedDeptId: 1,
        }),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
      applicationHistory: {
        create: jest.fn().mockResolvedValue({}),
      },
      workflowAudit: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
      workflowInstance: tx.workflowInstance,
    };

    service = new WorkflowRuntimeService(prisma as PrismaService);
  });

  it('keeps workflow at step 3 while other departments are still pending', async () => {
    tx.forwardApplication.findMany.mockResolvedValue([
      { apprLvlId: 11, nextUserId: 301, forwardedDeptId: 1, forwardedDistId: 20 },
      { apprLvlId: 12, nextUserId: 302, forwardedDeptId: 2, forwardedDistId: 20 },
    ]);
    tx.forwardApplication.count.mockResolvedValue(1);

    await service.processAction({
      submissionId: 10000,
      serviceId: '943.0',
      action: 'F',
      comments: 'Dept 1 comment',
      userId: BigInt(301),
      userRoleId: 3,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(tx.forwardApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { apprLvlId: 11 } }),
    );
    expect(tx.workflowInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStep: 3,
          currentRoleId: 3,
        }),
      }),
    );
  });

  it('moves workflow to step 2 role 7 when last department task completes', async () => {
    tx.forwardApplication.findMany.mockResolvedValue([
      { apprLvlId: 11, nextUserId: 301, forwardedDeptId: 1, forwardedDistId: 20 },
    ]);
    tx.forwardApplication.count.mockResolvedValue(0);

    await service.processAction({
      submissionId: 10000,
      serviceId: '943.0',
      action: 'F',
      comments: 'Last department completed',
      userId: BigInt(301),
      userRoleId: 3,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(tx.workflowInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStep: 2,
          currentRoleId: 7,
        }),
      }),
    );
  });
});

describe('WorkflowRuntimeService.listInbox', () => {
  let service: WorkflowRuntimeService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      department_users: {
        findFirst: jest.fn().mockResolvedValue({
          dept_id: 1,
          district_id: 20,
        }),
      },
      workflowInstance: {
        findMany: jest.fn(),
      },
      forwardApplication: {
        findMany: jest.fn(),
      },
      applicationSubmission: {
        findMany: jest.fn(),
      },
      service: {
        findMany: jest.fn().mockResolvedValue([
          { service_id: '943.0', service_name: 'In Principle Approval' },
        ]),
      },
      department: {
        findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Dept 1' }]),
      },
    };
    service = new WorkflowRuntimeService(prisma as PrismaService);
  });

  it('returns only pending dept tasks for role 3 user assignment', async () => {
    prisma.workflowInstance.findMany.mockResolvedValue([
      {
        applicationId: BigInt(1001),
        currentStep: 3,
        currentRoleId: 3,
        dueAt: null,
        updatedAt: new Date('2026-02-18T10:00:00Z'),
      },
      {
        applicationId: BigInt(1002),
        currentStep: 3,
        currentRoleId: 3,
        dueAt: null,
        updatedAt: new Date('2026-02-18T09:00:00Z'),
      },
    ]);
    prisma.forwardApplication.findMany.mockResolvedValue([
      {
        appSubId: 1001,
        nextUserId: BigInt(3001),
        forwardedDeptId: 1,
        forwardedDistId: 20,
        createdOn: new Date('2026-02-18T10:00:00Z'),
      },
      {
        appSubId: 1002,
        nextUserId: BigInt(9999),
        forwardedDeptId: 2,
        forwardedDistId: 20,
        createdOn: new Date('2026-02-18T09:00:00Z'),
      },
    ]);
    prisma.applicationSubmission.findMany.mockResolvedValue([
      {
        submissionId: 1001,
        serviceId: '943.0',
        unitName: 'Unit A',
        fieldValue: { applicant: { fullName: 'Applicant A' } },
        applicationStatus: 'P',
        applicationUpdatedDateTime: new Date('2026-02-18T10:00:00Z'),
        deptId: 1,
      },
      {
        submissionId: 1002,
        serviceId: '943.0',
        unitName: 'Unit B',
        fieldValue: { applicant: { fullName: 'Applicant B' } },
        applicationStatus: 'P',
        applicationUpdatedDateTime: new Date('2026-02-18T09:00:00Z'),
        deptId: 1,
      },
    ]);

    const result = await service.listInbox({
      userId: BigInt(3001),
      userRoleId: 3,
      page: 1,
      limit: 20,
    });

    expect(prisma.workflowInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ currentRoleId: 3, currentStep: 3 }),
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].submissionId).toBe(1001);
  });

  it('returns only step 2 role 7 items pending with role 7', async () => {
    prisma.workflowInstance.findMany.mockResolvedValue([
      {
        applicationId: BigInt(2001),
        currentStep: 2,
        currentRoleId: 7,
        dueAt: null,
        updatedAt: new Date('2026-02-18T08:00:00Z'),
      },
      {
        applicationId: BigInt(2002),
        currentStep: 2,
        currentRoleId: 7,
        dueAt: null,
        updatedAt: new Date('2026-02-18T07:00:00Z'),
      },
    ]);
    prisma.forwardApplication.findMany.mockResolvedValue([
      {
        appSubId: 2001,
        nextUserId: BigInt(9999),
        forwardedDeptId: 99,
        forwardedDistId: 20,
        createdOn: new Date('2026-02-18T08:00:00Z'),
      },
    ]);
    prisma.applicationSubmission.findMany.mockResolvedValue([
      {
        submissionId: 2001,
        serviceId: '943.0',
        unitName: 'Unit N1',
        fieldValue: { applicant: { fullName: 'Nodal A' } },
        applicationStatus: 'P',
        applicationUpdatedDateTime: new Date('2026-02-18T08:00:00Z'),
        deptId: 1,
      },
      {
        submissionId: 2002,
        serviceId: '943.0',
        unitName: 'Unit N2',
        fieldValue: { applicant: { fullName: 'Nodal B' } },
        applicationStatus: 'P',
        applicationUpdatedDateTime: new Date('2026-02-18T07:00:00Z'),
        deptId: 1,
      },
    ]);

    const result = await service.listInbox({
      userId: BigInt(7001),
      userRoleId: 7,
      page: 1,
      limit: 20,
    });

    expect(prisma.workflowInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ currentRoleId: 7, currentStep: 2 }),
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].submissionId).toBe(2002);
  });

  it('returns only step 4 role 33 items pending with role 33', async () => {
    prisma.workflowInstance.findMany.mockResolvedValue([
      {
        applicationId: BigInt(3001),
        currentStep: 4,
        currentRoleId: 33,
        dueAt: null,
        updatedAt: new Date('2026-02-18T06:00:00Z'),
      },
    ]);
    prisma.forwardApplication.findMany.mockResolvedValue([
      {
        appSubId: 3001,
        nextUserId: BigInt(3301),
        forwardedDeptId: 1,
        forwardedDistId: 20,
        createdOn: new Date('2026-02-18T06:00:00Z'),
      },
    ]);
    prisma.applicationSubmission.findMany.mockResolvedValue([
      {
        submissionId: 3001,
        serviceId: '943.0',
        unitName: 'Unit Approver',
        fieldValue: { applicant: { fullName: 'Approver A' } },
        applicationStatus: 'FA',
        applicationUpdatedDateTime: new Date('2026-02-18T06:00:00Z'),
        deptId: 1,
      },
    ]);

    const result = await service.listInbox({
      userId: BigInt(3301),
      userRoleId: 33,
      page: 1,
      limit: 20,
    });

    expect(prisma.workflowInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ currentRoleId: 33, currentStep: 4 }),
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      submissionId: 3001,
      currentStep: 4,
      currentRoleId: 33,
    });
  });
});
