import { PrismaClient } from '@prisma/client';
import { seedRoles } from './seeds/roles.seed';
import { seedResources } from './seeds/resources.seed';
import { seedRoleResources } from './seeds/role-resources.seed';
import { seedCountries } from './seeds/country.seed';
import { seedStates } from './seeds/state.seed';
import { seedDistricts } from './seeds/district.seed';
import { seedBlocks } from './seeds/block.seed';
import { seedTehsils } from './seeds/tehsil.seed';
import { seedVillages } from './seeds/village.seed';
import { seedDepartments } from './seeds/department.seed';
import { seedIssuers } from './seeds/issuer.seed';
import { seedDocumentTypes } from './seeds/document-type.seed';
import { seedFormCategories } from './seeds/form-category.seed';
import { seedFormTypes } from './seeds/form-type.seed';
import { seedFormFields } from './seeds/form-field.seed';
import { seedFbFormMapping } from './seeds/m_fb_form_mapping.seed';
import { seedFbPageMaster } from './seeds/m_fb_page_master.seed';
import { seedFbPageCategoryMapping } from './seeds/m_fb_page_category_mapping.seed';
import { seedServicetypes } from './seeds/servicetype.seed';
import { seedServicesectors } from './seeds/servicesector.seed';
import { seedServiceincidences } from './seeds/serviceincidence.seed';
import { seedDocumentCheckpoints } from './seeds/document-checkpoint.seed';
import { seedDocumentMaster } from './seeds/document-master.seed';
import { seedUsers } from './seeds/user.seed';
import { seedLegacyDepartmentUsers } from './seeds/legacy-department-users.seed';
import { seedMasterTables } from './seeds/master-tables.seed';
import { seedMsmeYear } from './seeds/msme-year.seed';
import { seedSector } from './seeds/sectors.seed';
import { seedLandCategory } from './seeds/land-categories.seed';
import { seedSubSector } from './seeds/sub-sectors.seed';
import { seedUnitCategories } from './seeds/unit-categories.seed';
import { seedAnchorTypes } from './seeds/anchor-types.seed';
import { seedRegionCategories } from './seeds/region-categories.seed';
import { seedMappingRegionCategories } from './seeds/mapping-region-categories.seed';
import { seedBeneficiaryTypes } from './seeds/beneficiary-types.seed';
import { seedOccurrences } from './seeds/occurrences.seed';
import { seedIncentiveTypes } from './seeds/incentive-types.seed';
import { seedFinancialParameter } from './seeds/financial-parameter.seed';
import { seedUnitTypes } from './seeds/unit-types.seed';
//import { seedPolicies } from './seeds/policy.seed';
import { seedActPolicyNotifications } from './seeds/act-policy-notification.seed';
import { seedActPolicyNotificationDepartments } from './seeds/act-policy-notification-department.seed';
import { seedActPolicyNotificationAmendments } from './seeds/act-policy-notification-amendment.seed';
//import { seedFields } from './seeds/field.seed';
import { seedNicCodes } from './seeds/nic-code.seed';
import { seedHsnCodes } from './seeds/hsn-code.seed';
import { seedWorkflowConfig } from './seeds/workflow-config.seed';
import { seedWorkflowJurisdictionLevels } from './seeds/workflow-jurisdiction-level.seed';
import { seedWorkflowAssignmentStrategies } from './seeds/workflow-assignment-strategy.seed';
import { seedWorkflowActions } from './seeds/workflow-action-master.seed';
import { seedInprincipleLiveSnapshot } from './seeds/inprinciple-live-snapshot.seed';

import { seedServiceDetails } from './seeds/service-details.seed';
import { seedKyaData } from './seeds/kya-data.seed';
//import { seedInspections } from './seeds/inspections.seed';
//import { seedCISInspections } from './seeds/cis-inspections.seed';
import { seedUpclSupplyCategories } from './seeds/upcl-supply-categories.seed';
import { seedUpclSupplySubcategories } from './seeds/upcl-supply-subcategories.seed';
import { seedUpclDivisionSubdivisions } from './seeds/upcl-division-subdivisions.seed';
import { seedUpclVoltage } from './seeds/upcl-voltage.seed';
import { seedUjsDivision } from './seeds/ujs-division.seed';
import { seedLabourFactoryTypeMaster } from './seeds/labour-factory-type-master.seed';
import { seedLabourFactorySec85 } from './seeds/labour-factory-sec85.seed';
import { seedPollutionControlEquipments } from './seeds/pollution-control-equipments.seed';
import { seedCurrentLanduse } from './seeds/current-landuse.seed';
import { seedProjectStatus } from './seeds/project-status.seed';
import { seedLandAllotmentStage } from './seeds/land-allotment-stage.seed';
import { seedServices } from './seeds/service.seed';
import { seedOrganisationNature } from './seeds/organization-nature.seed';
import { seedPollutionCategories } from './seeds/pollution-categories.seed';
//import { seedSchemeDefinitions } from './seeds/scheme-definitions.seed';
//import { seedKycIcCalculator } from './seeds/kyi-ic-calculator.seed';

import { seedServiceBackfill } from './seeds/service-backfill.seed';

// NEW: demo sso seed
import { seedDemoSso } from './seeds/demo-sso.seed';

// Workflow V2 Builder seed
import { seedWorkflowV2 } from './seeds/workflow-v2.seed';

// KYA (Know Your Approval) seed
import { seedKya } from './seeds/kya.seed';

import { seedUttarakhandInspectors } from './seeds/uttarakhand-inspectors.seed';

// Multi-tenancy and RBAC seeds
import { seedTenant } from './seeds/tenant.seed';
import { seedTenantProject } from './seeds/tenant-project.seed';
import { seedModule } from './seeds/module.seed';
import { seedPermission } from './seeds/permission.seed';
import { seedRolePermission } from './seeds/role-permission.seed';
import { seedUserRoleAssignment } from './seeds/user-role-assignment.seed';
import { seedUserAssignmentScope } from './seeds/user-assignment-scope.seed';
import { seedUserAssignmentPermissionOverride } from './seeds/user-assignment-permission-override.seed';
import { seedMasterDepartmentStructure } from './seeds/master-department-structure.seed';

const prisma = new PrismaClient();

// --- Truncate all tables in the correct order to avoid FK conflicts ---
async function truncateAllTables(prisma: PrismaClient) {
  console.log('\n🗑️  Truncating all tables...');

  const tablesToTruncate = [
    // Workflow V2 tables (must come before tenants, departments, roles)
    'wf_audit',
    'wf_instances',
    'wf_fork_join_branches',
    'wf_fork_joins',
    'wf_transitions',
    'wf_process_actions',
    'wf_processes',
    'wf_definitions',
    // Multi-tenancy and RBAC (must come before users and roles)
    'user_assignment_permission_overrides',
    'user_assignment_scopes',
    'user_role_assignments',
    'role_permissions',
    'permissions',
    'modules',
    'tenant_projects',
    'tenants',
    // Inspection module (has FK to services)
    'inspection_observation_responses',
    'inspection_observations',
    'inspection_transactions',
    'inspection_checklist_items',
    'inspection_checklists',
    'third_party_inspectors',
    // RBAC
    'role_resources',
    'user_logs',
    'user_tokens',
    'department_users',
    'investor_profiles',
    'users',
    'm_villages',
    'm_tehsils',
    'm_blocks',
    'm_districts',
    'm_states',
    'm_countries',
    'm_document_checkpoints',
    'm_documenttypes',
    'm_issuers',
    'm_departments',
    'm_document_master',
    'm_fb_form_types',
    'm_fb_form_categories',
    'm_fb_form_field',
    'm_fb_form_mapping',
    'm_fb_page_master',
    'm_fb_page_category_mapping',
    'm_nic_code',
    'm_hsn_code',
    'master_tables',
    'master_data_reference',
    'master_column_definition',
    'master_data',
    'master_definition',
    'm_servicetype',
    'm_servicesector',
    'm_serviceincidence', // ← ensure this matches actual table
    'kya_service_mappings',
    'kya_options',
    'kya_questions',
    'm_kya_categories',
    'm_service_details',
    'm_service',
    'm_workflow_action_master',
    'm_workflow_assignment_strategy',
    'm_workflow_jurisdiction_level',
    'm_pollution_categories',
    'm_project_status',
    'm_land_allotment_stage',
    'm_information_wizard',
    'm_policy',
    'resources',
    'roles',
    'm_act_policy_notification',
    'm_act_policy_notification_departments',
    'm_act_policy_notification_amendments',
    'c_application_workflow_configuration',
    // NOTE: Skip all t_* transactional tables
  ];

  for (const tableName of tablesToTruncate) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      console.log(`  ✓ Truncated ${tableName}`);
    } catch (error) {
      console.warn(
        `  ⚠️  Could not truncate ${tableName}: ${(error as Error).message}`,
      );
    }
  }

  console.log('✅ All tables truncated successfully.');
}

// --- Reset sequences for all tables ---
async function resetAllSequences(prisma: PrismaClient) {
  console.log('\n🔄 Resetting all auto-increment sequences...');

  const tables = [
    { tableName: 'users', seqName: 'users_id_seq' },
    { tableName: 'tenants', seqName: 'tenants_id_seq' },
    { tableName: 'tenant_projects', seqName: 'tenant_projects_id_seq' },
    { tableName: 'modules', seqName: 'modules_id_seq' },
    { tableName: 'permissions', seqName: 'permissions_id_seq' },
    { tableName: 'role_permissions', seqName: 'role_permissions_id_seq' },
    {
      tableName: 'user_role_assignments',
      seqName: 'user_role_assignments_id_seq',
    },
    {
      tableName: 'user_assignment_permission_overrides',
      seqName: 'user_assignment_permission_overrides_id_seq',
    },
    { tableName: 'roles', seqName: 'roles_id_seq' },
    { tableName: 'resources', seqName: 'resources_id_seq' },
    { tableName: 'role_resources', seqName: 'role_resources_id_seq' },
    { tableName: 'user_logs', seqName: 'user_logs_id_seq' },
    { tableName: 'user_tokens', seqName: 'user_tokens_id_seq' },
    { tableName: 'investor_profiles', seqName: 'investor_profiles_id_seq' },
    { tableName: 'department_users', seqName: 'department_users_id_seq' },
    { tableName: 'm_countries', seqName: 'm_countries_id_seq' },
    { tableName: 'm_states', seqName: 'm_states_id_seq' },
    { tableName: 'm_districts', seqName: 'm_districts_id_seq' },
    { tableName: 'm_blocks', seqName: 'm_blocks_id_seq' },
    { tableName: 'm_tehsils', seqName: 'm_tehsils_id_seq' },
    { tableName: 'm_villages', seqName: 'm_villages_id_seq' },
    { tableName: 'm_departments', seqName: 'm_departments_id_seq' },
    { tableName: 'm_issuers', seqName: 'm_issuers_id_seq' },
    { tableName: 'm_documenttypes', seqName: 'm_documenttypes_id_seq' },
    { tableName: 'm_document_checkpoints', seqName: 'm_document_checkpoints_id_seq' },
    { tableName: 'm_document_master', seqName: 'm_document_master_id_seq' },
    { tableName: 'm_fb_form_types', seqName: 'm_fb_form_types_id_seq' },
    { tableName: 'm_fb_form_categories', seqName: 'm_fb_form_categories_id_seq' },
    { tableName: 'm_fb_form_field', seqName: 'm_fb_form_field_id_seq' },
    { tableName: 'm_fb_form_mapping', seqName: 'm_fb_form_mapping_id_seq' },
    { tableName: 'm_fb_page_master', seqName: 'm_fb_page_master_id_seq' },
    { tableName: 'm_fb_page_category_mapping', seqName: 'm_fb_page_category_mapping_id_seq' },
    { tableName: 'm_servicetype', seqName: 'm_servicetype_id_seq' },
    { tableName: 'm_servicesector', seqName: 'm_servicesector_id_seq' },
    { tableName: 'm_serviceincidence', seqName: 'm_serviceincidence_id_seq' }, // ← fixed
    { tableName: 'm_service', seqName: 'm_service_id_seq' },
    { tableName: 'm_kya_categories', seqName: 'm_kya_categories_id_seq' },
    { tableName: 'kya_questions', seqName: 'kya_questions_id_seq' },
    { tableName: 'kya_options', seqName: 'kya_options_id_seq' },
    { tableName: 'kya_service_mappings', seqName: 'kya_service_mappings_id_seq' },
    { tableName: 'm_service_details', seqName: 'm_service_details_id_seq' },
    { tableName: 'm_workflow_action_master', seqName: 'm_workflow_action_master_id_seq' },
    { tableName: 'm_workflow_assignment_strategy', seqName: 'm_workflow_assignment_strategy_id_seq' },
    { tableName: 'm_workflow_jurisdiction_level', seqName: 'm_workflow_jurisdiction_level_id_seq' },
    { tableName: 'm_pollution_categories', seqName: 'm_pollution_categories_id_seq' },
    { tableName: 'm_project_status', seqName: 'm_project_status_id_seq' },
    { tableName: 'm_land_allotment_stage', seqName: 'm_land_allotment_stage_id_seq' },
    { tableName: 'm_policy', seqName: 'm_policy_id_seq' },
    { tableName: 'm_information_wizard', seqName: 'm_information_wizard_id_seq' },
    { tableName: 'm_act_policy_notification', seqName: 'm_act_policy_notification_id_seq' },
    { tableName: 'm_act_policy_notification_departments', seqName: 'm_act_policy_notification_departments_id_seq' },
    { tableName: 'm_act_policy_notification_amendments', seqName: 'm_act_policy_notification_amendments_id_seq' },
    { tableName: 'c_application_workflow_configuration', seqName: 'c_application_workflow_configuration_id_seq' },
    // NOTE: Skip all t_* transactional tables
  ];

  for (const { tableName, seqName } of tables) {
    try {
      const query = `SELECT setval('${seqName}', COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1, false);`;
      await prisma.$executeRawUnsafe(query);
      console.log(`  ✓ Sequence for ${tableName} reset.`);
    } catch (error) {
      console.warn(`  ⚠️  Could not reset sequence for ${tableName}: ${(error as Error).message}`);
    }
  }

  // Ensure CAF/submission IDs start after 10000
  try {
    await prisma.$executeRawUnsafe(`SELECT setval('t_application_submission_submission_id_seq', 10000, false);`);
    console.log('  ✓ Set t_application_submission sequence to start at 10000');
  } catch (error) {
    console.warn(`  ⚠️  Could not set submission sequence to 10000: ${(error as Error).message}`);
  }

  console.log('✅ All sequences have been reset correctly.');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    console.log('🌱 Starting database seeding...\n');

    // --- Step 1: Truncate all tables ---
    await truncateAllTables(prisma);

    // --- Step 2: Reset sequences to 1 before seeding ---
    console.log('\n🔄 Resetting sequences to prepare for fresh seeding...');
    const resetTables = [
      { tableName: 'tenants', seqName: 'tenants_id_seq' },
      { tableName: 'tenant_projects', seqName: 'tenant_projects_id_seq' },
      { tableName: 'modules', seqName: 'modules_id_seq' },
      { tableName: 'permissions', seqName: 'permissions_id_seq' },
      { tableName: 'role_permissions', seqName: 'role_permissions_id_seq' },
      {
        tableName: 'user_role_assignments',
        seqName: 'user_role_assignments_id_seq',
      },
      {
        tableName: 'user_assignment_permission_overrides',
        seqName: 'user_assignment_permission_overrides_id_seq',
      },
      { tableName: 'roles', seqName: 'roles_id_seq' },
      { tableName: 'resources', seqName: 'resources_id_seq' },
      { tableName: 'role_resources', seqName: 'role_resources_id_seq' },
      { tableName: 'm_countries', seqName: 'm_countries_id_seq' },
      { tableName: 'm_states', seqName: 'm_states_id_seq' },
      { tableName: 'm_districts', seqName: 'm_districts_id_seq' },
      { tableName: 'm_blocks', seqName: 'm_blocks_id_seq' },
      { tableName: 'm_tehsils', seqName: 'm_tehsils_id_seq' },
      { tableName: 'm_villages', seqName: 'm_villages_id_seq' },
      { tableName: 'm_issuers', seqName: 'm_issuers_id_seq' },
      { tableName: 'm_departments', seqName: 'm_departments_id_seq' },
      { tableName: 'm_documenttypes', seqName: 'm_documenttypes_id_seq' },
      { tableName: 'm_document_checkpoints', seqName: 'm_document_checkpoints_id_seq' },
      { tableName: 'm_document_master', seqName: 'm_document_master_id_seq' },
      { tableName: 'm_fb_form_types', seqName: 'm_fb_form_types_id_seq' },
      { tableName: 'm_fb_form_categories', seqName: 'm_fb_form_categories_id_seq' },
      { tableName: 'm_fb_form_field', seqName: 'm_fb_form_field_id_seq' },
      { tableName: 'm_fb_form_mapping', seqName: 'm_fb_form_mapping_id_seq' },
      { tableName: 'm_fb_page_master', seqName: 'm_fb_page_master_id_seq' },
      { tableName: 'm_fb_page_category_mapping', seqName: 'm_fb_page_category_mapping_id_seq' },
      { tableName: 'm_servicetype', seqName: 'm_servicetype_id_seq' },
      { tableName: 'm_servicesector', seqName: 'm_servicesector_id_seq' },
      { tableName: 'm_serviceincidence', seqName: 'm_serviceincidence_id_seq' }, // ← fixed
      { tableName: 'm_service', seqName: 'm_service_id_seq' },
      { tableName: 'm_workflow_action_master', seqName: 'm_workflow_action_master_id_seq' },
      { tableName: 'm_workflow_assignment_strategy', seqName: 'm_workflow_assignment_strategy_id_seq' },
      { tableName: 'm_workflow_jurisdiction_level', seqName: 'm_workflow_jurisdiction_level_id_seq' },
      { tableName: 'm_pollution_categories', seqName: 'm_pollution_categories_id_seq' },
      { tableName: 'm_project_status', seqName: 'm_project_status_id_seq' },
      { tableName: 'm_land_allotment_stage', seqName: 'm_land_allotment_stage_id_seq' },
      { tableName: 'm_policy', seqName: 'm_policy_id_seq' },
      { tableName: 'm_information_wizard', seqName: 'm_information_wizard_id_seq' },
      { tableName: 'users', seqName: 'users_id_seq' },
      { tableName: 'm_act_policy_notification', seqName: 'm_act_policy_notification_id_seq' },
      { tableName: 'm_act_policy_notification_departments', seqName: 'm_act_policy_notification_departments_id_seq' },
      { tableName: 'm_act_policy_notification_amendments', seqName: 'm_act_policy_notification_amendments_id_seq' },
      { tableName: 'c_application_workflow_configuration', seqName: 'c_application_workflow_configuration_id_seq' },
      // NOTE: Skip all t_* transactional tables
    ];

    for (const { tableName, seqName } of resetTables) {
      try {
        await prisma.$executeRawUnsafe(`SELECT setval('${seqName}', 1, false);`);
        console.log(`  ✓ Reset ${tableName} sequence to 1`);
      } catch (error) {
        console.warn(`  ⚠️  Could not reset ${tableName} sequence: ${(error as Error).message}`);
      }
    }

    // --- Step 3: Seed data in proper order ---
    console.log('\n📌 Starting fresh seeding process...\n');

    // RBAC
    await seedRoles(prisma);
    await seedResources(prisma);
    await seedRoleResources(prisma);

    // Geographic masters
    await seedCountries(prisma);
    await seedStates(prisma);
    await seedDistricts(prisma);
    await seedBlocks(prisma);
    await seedTehsils(prisma);
    await seedVillages(prisma);

    // Other masters (dependencies first!)
    await seedIssuers(prisma);
    await seedDocumentTypes(prisma);
    await seedDocumentCheckpoints(prisma);
    await seedDepartments(prisma);
    await seedLegacyDepartmentUsers(prisma);
    // Users must be seeded BEFORE UserRoleAssignment
    await seedUsers(prisma);

    // Multi-tenancy and Permissions (depends on roles, users being seeded)
    await seedTenant(prisma);
    await seedTenantProject(prisma);
    await seedModule(prisma);
    await seedPermission(prisma);
    await seedRolePermission(prisma);
    await seedUserRoleAssignment(prisma);
    await seedUserAssignmentScope(prisma);
    await seedUserAssignmentPermissionOverride(prisma);

    // Document master depends on departments & document types
    await seedDocumentMaster(prisma);

    // NIC / HSN master data
    await seedNicCodes(prisma);
    await seedHsnCodes(prisma);
    await seedMasterTables(prisma);

    // Master Department Structure (Uses Master tables)
    await seedMasterDepartmentStructure(prisma);

    // Form/services
    await seedFormTypes(prisma);
    await seedFormCategories(prisma);
    await seedFormFields(prisma);
    await seedServicetypes(prisma);
    await seedServicesectors(prisma);
    await seedServiceincidences(prisma);
    await seedServices(prisma);
    await seedWorkflowJurisdictionLevels(prisma);
    await seedWorkflowAssignmentStrategies(prisma);
    await seedWorkflowActions(prisma);
    await seedServiceBackfill(prisma);
    await seedFbFormMapping(prisma);
    await seedFbPageMaster(prisma);
    await seedFbPageCategoryMapping(prisma);
    await seedWorkflowConfig(prisma);
    //await seedInprincipleLiveSnapshot(prisma);
    await seedActPolicyNotifications(prisma);
    await seedActPolicyNotificationDepartments(prisma);
    await seedActPolicyNotificationAmendments(prisma);

    // KYI and IC masters
    await seedMsmeYear(prisma);
    await seedSector(prisma);
    await seedLandCategory(prisma);
    await seedSubSector(prisma);
    await seedUnitCategories(prisma);
    await seedAnchorTypes(prisma);
    await seedRegionCategories(prisma);
    await seedMappingRegionCategories(prisma);
    await seedBeneficiaryTypes(prisma);
    await seedOccurrences(prisma);
    await seedIncentiveTypes(prisma);
    await seedFinancialParameter(prisma);
    await seedUnitTypes(prisma);
    await seedServiceDetails(prisma);

    // Policies depend on departments
    //await seedPolicies(prisma);
    //await seedFields(prisma);
    //await seedSchemeDefinitions(prisma);
    //await seedKycIcCalculator(prisma);

    // KYA module
    //await seedKya(prisma);

    // Inspections module
    //await seedInspections(prisma);
    //await seedCISInspections(prisma); // CIS: Application Submissions + Inspectors + Inspection Transactions
    
    // Seed Uttarakhand Inspectors
    await seedUttarakhandInspectors(prisma);

    // --- Step 4: Ensure demo SSO rows exist (safe upserts) ---
    await seedDemoSso(prisma);

    // --- Step 5: Final sequence reset ---
    // Sequences must be reset before Workflow V2 seed because it relies on autoincrement for roles & users
    await resetAllSequences(prisma);

    // --- Step 6: Seed Workflow V2 Builder data ---
    await seedWorkflowV2(prisma);

    console.log('\n✅ Database seeding Phase 1 completed successfully.');

    console.log('\n📋 Test Credentials:');
    console.log('  Admin: admin@example.com / admin@123');
    console.log('  Department: user@example.com / user@123');
    console.log('  Investor: investor@example.com / investor@123');
    console.log('  Joint Director: jd@example.com / user@123');
    console.log('  Inspector: inspector@example.com / user@123');
    await seedUpclSupplyCategories(prisma);
    await seedUpclSupplySubcategories(prisma);
    await seedUpclDivisionSubdivisions(prisma);
    await seedUpclVoltage(prisma);
    await seedUjsDivision(prisma);
    await seedLabourFactoryTypeMaster(prisma);
    await seedLabourFactorySec85(prisma);
    await seedPollutionControlEquipments(prisma);
    await seedPollutionCategories(prisma);
    await seedCurrentLanduse(prisma);
    await seedProjectStatus(prisma);
    await seedLandAllotmentStage(prisma);
    await seedOrganisationNature(prisma);
    await seedServices(prisma);
    // KYA seed (must run after services so service IDs exist)
   // await seedKya(prisma);
    // NOTE: Skip all t_* transactional seed data

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
