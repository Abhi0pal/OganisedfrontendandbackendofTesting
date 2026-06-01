import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WorkflowBuilderConditionService {
  private readonly logger = new Logger(WorkflowBuilderConditionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConditionFields(serviceId: string, departmentId: number) {
    const formMappings = await this.prisma.formMapping.findMany({
      where: { service_id: serviceId, department_id: departmentId, is_active: 'Y' },
    });

    const builderFields = await this.prisma.formBuilderField.findMany({
      where: {
        service_id: serviceId,
        is_active: 'Y',
      },
      include: {
        formField: true,
      },
    });

    return builderFields.map((bf) => ({
      fieldKey: bf.formField.formCheckId,
      fieldLabel: bf.custom_label || bf.formField.name,
      inputType: bf.input_type,
      operators: this.getOperatorsForType(bf.input_type),
    }));
  }

  getOperatorsForType(inputType: string): string[] {
    switch (inputType) {
      case 'number':
        return ['==', '!=', '>', '<', '>=', '<='];
      case 'text':
        return ['==', '!=', 'CONTAINS', 'STARTS_WITH'];
      case 'dropdown':
      case 'radio':
        return ['==', '!=', 'IN', 'NOT_IN'];
      case 'date':
        return ['==', '!=', '>', '<', '>=', '<='];
      case 'checkbox':
        return ['==', 'IN'];
      default:
        return ['==', '!='];
    }
  }

  evaluateCondition(condition: any, applicationData: Record<string, any>): boolean {
    if (!condition) return true;

    if (condition.operator === 'AND') {
      return condition.rules.every((rule) => this.evaluateCondition(rule, applicationData));
    }
    if (condition.operator === 'OR') {
      return condition.rules.some((rule) => this.evaluateCondition(rule, applicationData));
    }

    const fieldValue = applicationData[condition.field];

    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    switch (condition.operator) {
      case '>':
        return Number(fieldValue) > Number(condition.value);
      case '<':
        return Number(fieldValue) < Number(condition.value);
      case '>=':
        return Number(fieldValue) >= Number(condition.value);
      case '<=':
        return Number(fieldValue) <= Number(condition.value);
      case '==':
        return String(fieldValue) === String(condition.value);
      case '!=':
        return String(fieldValue) !== String(condition.value);
      case 'IN':
        return condition.value.includes(fieldValue);
      case 'NOT_IN':
        return !condition.value.includes(fieldValue);
      case 'CONTAINS':
        return String(fieldValue).includes(String(condition.value));
      case 'STARTS_WITH':
        return String(fieldValue).startsWith(String(condition.value));
      default:
        return false;
    }
  }
}
