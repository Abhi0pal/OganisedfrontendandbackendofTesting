
import { PrismaClient } from '@prisma/client';
import { workflow_config_data } from './data/workflow-config.data';

// Helper to map string to enum or null
function mapEnum<T extends string>(value: any, allowed: T[], fallback: T): T {
  const v = String(value || '').toUpperCase();
  return (allowed as string[]).includes(v) ? (v as T) : fallback;
}

const JURISDICTION_LEVELS = ['STATE', 'DISTRICT', 'BLOCK', 'TEHSIL', 'GRAM_PANCHAYAT', 'VILLAGE'] as const;
const ASSIGNMENT_STRATEGIES = ['ROLE', 'USER', 'OFFICE', 'RULE'] as const;
const PROCESSING_LEVELS = ['State', 'District'] as const;

export async function seedWorkflowConfig(prisma: PrismaClient) {
  try {
    for (const row of workflow_config_data as Array<Record<string, any>>) {
      const jurisdictionLevel = mapEnum(row.processing_level, [...JURISDICTION_LEVELS], 'DISTRICT');
      const assignmentStrategy = mapEnum(row.assignment_strategy, [...ASSIGNMENT_STRATEGIES], 'ROLE');
      const processingLevel = mapEnum(row.processing_level, [...PROCESSING_LEVELS], 'District');
      const nullIfEmpty = (v: any) => v === undefined || v === null || String(v).toUpperCase() === 'NULL' || String(v).trim() === '' ? null : v;

      await prisma.applicationWorkflowConfiguration.upsert({
        where: { id: Number(row.id) },
        update: {
          step: Number(row.step),
          departmentId: Number(row.department_id),
          serviceId: String(row.service_id),
          configVersion: 1,
          status: 'PUBLISHED',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          roleId: Number(row.current_role_id),
          jurisdictionLevelId: nullIfEmpty(row.jurisdiction_level_id),
          assignmentStrategyId: nullIfEmpty(row.assignment_strategy_id),
          actionMasterIdsJson: row.action_master_ids_json ? (typeof row.action_master_ids_json === 'string' ? JSON.parse(row.action_master_ids_json) : row.action_master_ids_json) : [],
          jurisdictionLevel,
          assignmentStrategy,
          assignmentRuleJson: row.assignment_rule_json ? (typeof row.assignment_rule_json === 'string' ? JSON.parse(row.assignment_rule_json) : row.assignment_rule_json) : {},
          actionAllowedJson: row.action_allowed_json ? (typeof row.action_allowed_json === 'string' ? JSON.parse(row.action_allowed_json) : row.action_allowed_json) : [],
          transitionMapJson: row.transition_map_json ? (typeof row.transition_map_json === 'string' ? JSON.parse(row.transition_map_json) : row.transition_map_json) : {},
          slaHours: Number(row.time_in_hours) || 0,
          slaBreachRequiresReason: String(row.is_delay_reason_required || '').toUpperCase() === 'Y',
          nextAllocationRoleId: nullIfEmpty(row.next_role_id),
          createdBy: 'data-seed',
          updatedBy: 'data-seed',
          processingLevel,
          currentRoleId: Number(row.current_role_id),
          formTypeId: Number(row.form_type_id),
          nextRoleId: Number(row.next_role_id),
          approverId: Number(row.approver_id),
          forwardRoleId: Number(row.forward_role_id),
          revertRoleId: Number(row.revert_role_id),
          isDelayReasonRequired: row.is_delay_reason_required,
          timeInHours: String(row.time_in_hours),
          canRevertToInvestor: row.can_revert_to_investor,
          canVerifyDocument: row.can_verify_document,
          canForwardToMultipleRoleId: nullIfEmpty(row.can_forward_to_multiple_role_id),
          canForwardToMultipleUserId: nullIfEmpty(row.can_forward_to_multiple_user_id),
          isOwnDepartment: row.is_own_department,
          permissableTabFormId: String(row.permissable_tab_form_id || ''),
          documentShowLast: row.document_show_last,
          processAnytime: row.process_anytime,
          showLiceneceList: String(row.show_licenece_list || '0'),
          showFieldEditableOrNot: String(row.show_field_editable_or_not || '0'),
          formServiceJs: String(row.form_service_js || ''),
          formActionController: String(row.form_action_controller || ''),
          subformActionName: String(row.subform_action_name || ''),
          licenceNumberFormat: nullIfEmpty(row.licence_number_format),
        },
        create: {
          id: Number(row.id),
          step: Number(row.step),
          departmentId: Number(row.department_id),
          serviceId: String(row.service_id),
          configVersion: 1,
          status: 'PUBLISHED',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          roleId: Number(row.current_role_id),
          jurisdictionLevelId: nullIfEmpty(row.jurisdiction_level_id),
          assignmentStrategyId: nullIfEmpty(row.assignment_strategy_id),
          actionMasterIdsJson: row.action_master_ids_json ? (typeof row.action_master_ids_json === 'string' ? JSON.parse(row.action_master_ids_json) : row.action_master_ids_json) : [],
          jurisdictionLevel,
          assignmentStrategy,
          assignmentRuleJson: row.assignment_rule_json ? (typeof row.assignment_rule_json === 'string' ? JSON.parse(row.assignment_rule_json) : row.assignment_rule_json) : {},
          actionAllowedJson: row.action_allowed_json ? (typeof row.action_allowed_json === 'string' ? JSON.parse(row.action_allowed_json) : row.action_allowed_json) : [],
          transitionMapJson: row.transition_map_json ? (typeof row.transition_map_json === 'string' ? JSON.parse(row.transition_map_json) : row.transition_map_json) : {},
          slaHours: Number(row.time_in_hours) || 0,
          slaBreachRequiresReason: String(row.is_delay_reason_required || '').toUpperCase() === 'Y',
          nextAllocationRoleId: nullIfEmpty(row.next_role_id),
          createdBy: 'data-seed',
          updatedBy: 'data-seed',
          processingLevel,
          currentRoleId: Number(row.current_role_id),
          formTypeId: Number(row.form_type_id),
          nextRoleId: Number(row.next_role_id),
          approverId: Number(row.approver_id),
          forwardRoleId: Number(row.forward_role_id),
          revertRoleId: Number(row.revert_role_id),
          isDelayReasonRequired: row.is_delay_reason_required,
          timeInHours: String(row.time_in_hours),
          canRevertToInvestor: row.can_revert_to_investor,
          canVerifyDocument: row.can_verify_document,
          canForwardToMultipleRoleId: nullIfEmpty(row.can_forward_to_multiple_role_id),
          canForwardToMultipleUserId: nullIfEmpty(row.can_forward_to_multiple_user_id),
          isOwnDepartment: row.is_own_department,
          permissableTabFormId: String(row.permissable_tab_form_id || ''),
          documentShowLast: row.document_show_last,
          processAnytime: row.process_anytime,
          showLiceneceList: String(row.show_licenece_list || '0'),
          showFieldEditableOrNot: String(row.show_field_editable_or_not || '0'),
          formServiceJs: String(row.form_service_js || ''),
          formActionController: String(row.form_action_controller || ''),
          subformActionName: String(row.subform_action_name || ''),
          licenceNumberFormat: nullIfEmpty(row.licence_number_format),
        },
      });
    }
    console.log('Seeded workflow config from data file.');
  } catch (error) {
    console.error('  workflow config seeding failed:', error);
    throw error;
  }
}
