import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WorkflowFieldsService {
  private readonly logger = new Logger(WorkflowFieldsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all master fields from the FormField table.
   */
  async getMasterFields() {
    return this.prisma.formField.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        formCheckId: true,
        categoryId: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Add a master field to a specific formTypeId for a service.
   * This creates/finds the mapping in m_fb_form_builder_fields.
   */
  async addFieldToStep(params: { 
    serviceId: string; 
    formTypeId: number; 
    fieldId: number; 
    workflowStepId: number; 
    categoryId?: number 
  }) {
    const { serviceId, formTypeId, fieldId, workflowStepId, categoryId } = params;

    // Check if mapping already exists
    const existing = await this.prisma.formBuilderField.findFirst({
      where: {
        service_id: serviceId,
        form_id: formTypeId,
        form_field_id: fieldId,
      },
    });

    if (existing) {
      return existing;
    }

    // Determine category: use provided or find a default "Department Action" one
    let targetCategoryId = categoryId;
    if (!targetCategoryId) {
      const deptCategory = await this.prisma.formCategory.findFirst({
        where: { categoryName: { contains: 'Department Action' } },
      });
      targetCategoryId = deptCategory?.id || 1; // Fallback to category 1 if not found
    }

    // 1. Get Department ID from Workflow Step
    const step = await this.prisma.workflowProcess.findUnique({
      where: { id: workflowStepId },
      include: { workflowDef: { select: { departmentId: true } } },
    });

    const deptId = step?.workflowDef?.departmentId || 1;

    // 2. Validate service exists
    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId },
      select: { id: true, service_id: true, department_id: true },
    });

    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    // 2.1 Ensure Form Mapping exists
    let formMapping = await this.prisma.formMapping.findFirst({
      where: { service_id: serviceId, form_type_id: formTypeId, department_id: deptId },
    });

    if (!formMapping) {
      try {
        formMapping = await this.prisma.formMapping.create({
          data: {
            service_id: serviceId,
            form_type_id: formTypeId,
            department_id: deptId,
            form_name: `Form for ${serviceId}`,
            form_code: `FORM_${serviceId}_${formTypeId}`,
            is_active: 'Y',
          },
        });
      } catch (error: any) {
        if (error.code === 'P2003') {
          throw new Error(`FK constraint failed for service_id: ${serviceId}. Service may not exist or department may be invalid.`);
        }
        throw error;
      }
    }

    // 3. Ensure a Page exists for this form (Default to Page 1)
    let page = await this.prisma.formPageMaster.findFirst({
      where: { service_id: serviceId, form_id: formTypeId, is_active: 'Y' },
    });

    if (!page) {
      page = await this.prisma.formPageMaster.create({
        data: {
          service_id: serviceId,
          form_id: formTypeId,
          page_name: 'Page 1',
          preference: 1,
          is_active: 'Y',
        },
      });
    }

    // 2. Ensure Category Mapping exists for this page and category
    const mapping = await this.prisma.formPageCategoryMapping.findFirst({
      where: { page_id: page.id, category_id: targetCategoryId, is_active: 'Y' },
    });

    if (!mapping) {
      await this.prisma.formPageCategoryMapping.create({
        data: {
          page_id: page.id,
          category_id: targetCategoryId,
          preference: 1,
          is_active: 'Y',
        },
      });
    }

    // 3. Get current max preference to append at the end
    const lastField = await this.prisma.formBuilderField.findFirst({
      where: { service_id: serviceId, form_id: formTypeId },
      orderBy: { preference: 'desc' },
      select: { preference: true },
    });
    const nextPreference = (lastField?.preference || 0) + 1;

    // 4. Create the mapping
    return this.prisma.formBuilderField.create({
      data: {
        service_id: serviceId,
        form_id: formTypeId,
        form_field_id: fieldId,
        category_id: targetCategoryId,
        page_id: page.id,
        preference: nextPreference,
        input_type: 'text',
        is_active: 'Y',
      },
    });
  }

  /**
   * Remove a field mapping.
   */
  async removeField(id: number) {
    // Using deleteMany to avoid P2025 error if record is already gone
    return this.prisma.formBuilderField.deleteMany({
      where: { id },
    });
  }
}
