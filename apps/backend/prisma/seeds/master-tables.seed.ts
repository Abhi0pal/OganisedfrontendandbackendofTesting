import { PrismaClient } from '@prisma/client';

export async function seedMasterTables(prisma: PrismaClient) {
  console.log('📌 Seeding master_tables...');

  /**
   * IMPORTANT:
   * Since your runtime reads master_tables and uses Prisma (NOT raw SQL),
   * all *_column fields must be PRISMA FIELD NAMES (camelCase),
   * not DB column names.
   */

  const masterTables = [
    // -----------------------
    // Geography
    // -----------------------
    {
      master_name: 'Country Master',
      master_code: 'COUNTRY',
      description: 'List of all countries',
      table_name: 'm_countries',
      value_column: 'id',
      label_column: 'name',
      secondary_label: 'abbreviation',
      label_template: '{name} ({abbreviation})',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/countries',
    },
    {
      master_name: 'State Master',
      master_code: 'STATE',
      description: 'List of all states',
      table_name: 'm_states',
      value_column: 'id',
      label_column: 'name',
      secondary_label: 'abbreviation',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      parent_column: 'countryId',
      api_endpoint: '/api/master/states',
    },
    {
      master_name: 'District Master',
      master_code: 'DISTRICT',
      description: 'List of all districts',
      table_name: 'm_districts',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      parent_column: 'stateId',
      api_endpoint: '/api/master/districts',
    },
    {
      master_name: 'Block Master',
      master_code: 'BLOCK',
      description: 'List of all blocks',
      table_name: 'm_blocks',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      parent_column: 'districtId',
      api_endpoint: '/api/master/blocks',
    },
    {
      master_name: 'Tehsil Master',
      master_code: 'TEHSIL',
      description: 'List of all tehsils/sub-districts',
      table_name: 'm_tehsils',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      parent_column: 'districtId',
      api_endpoint: '/api/master/tehsils',
    },
    {
      master_name: 'Village Master',
      master_code: 'VILLAGE',
      description: 'List of all villages',
      table_name: 'm_villages',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      parent_column: 'tehsilId',
      api_endpoint: '/api/master/villages',
    },

    // -----------------------
    // Department / Issuer / Docs / Forms
    // -----------------------
    {
      master_name: 'Department Master',
      master_code: 'DEPARTMENT',
      description: 'List of all departments',
      table_name: 'm_departments',
      value_column: 'id',
      label_column: 'name',
      secondary_label: 'abbreviation',
      label_template: '{name} ({abbreviation})',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/departments',
    },
    {
      master_name: 'Issuer Master',
      master_code: 'ISSUER',
      description: 'List of all document issuers',
      table_name: 'm_issuers',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isIssuerActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/issuers',
    },
    {
      master_name: 'Document Type Master',
      master_code: 'DOCUMENT_TYPE',
      description: 'List of all document types',
      table_name: 'm_documenttypes',
      value_column: 'id',
      label_column: 'name',
      secondary_label: 'abbreviation',
      is_active_column: 'isDocActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/document-types',
    },
    {
      master_name: 'Form Type Master',
      master_code: 'FORM_TYPE',
      description: 'List of all form types',
      table_name: 'm_fb_form_types',
      value_column: 'id',
      label_column: 'name',
      secondary_label: 'abbr',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/form-types',
    },

    // -----------------------
    // Masters coming from BO master_tables (and present in Prisma schema)
    // -----------------------

    // Organisation Nature
    {
      master_name: 'Organisation Nature Master',
      master_code: 'ORG_NATURE',
      description: 'Organisation Nature (General)',
      table_name: 'm_organisation_nature',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/organisation-nature',
    },
    {
      master_name: 'Organisation Nature (Education) Master',
      master_code: 'ORG_NATURE_EDU',
      description: 'Organisation Nature for Higher/Medical Education',
      table_name: 'm_organisation_nature',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'educationIsActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/organisation-nature-education',
    },

    // Current Landuse
    {
      master_name: 'Current Landuse Master',
      master_code: 'CURRENT_LANDUSE',
      description: 'Current Land Use options',
      table_name: 'm_current_landuse',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/current-landuse',
    },

    // Labour
    {
      master_name: 'Labour Factory Type Master',
      master_code: 'LABOUR_FACTORY_TYPE',
      description: 'Labour Factory Type Master',
      table_name: 'm_labour_factory_type_master',
      value_column: 'id',
      label_column: 'factoryType',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'factoryType ASC',
      api_endpoint: '/api/master/labour-factory-type',
    },
    {
      master_name: 'Labour Factory Sec85 Master',
      master_code: 'LABOUR_SEC85',
      description: 'Labour Factory Section 85 Master',
      table_name: 'm_labour_factory_sec85',
      value_column: 'id',
      label_column: 'specialProvisionName',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'specialProvisionName ASC',
      api_endpoint: '/api/master/labour-sec85',
    },

    // UJS
    {
      master_name: 'UJS Division Master',
      master_code: 'UJS_DIVISION',
      description: 'UJS Division Master',
      table_name: 'm_ujs_divisions',
      value_column: 'divisionId',
      label_column: 'officeName',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'officeName ASC',
      api_endpoint: '/api/master/ujs-divisions',
    },

    // UPCL - Supply Category
    {
      master_name: 'UPCL Supply Category Master',
      master_code: 'UPCL_SUPPLY_CATEGORY',
      description: 'UPCL Supply Categories',
      table_name: 'm_upcl_supply_categories',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      api_endpoint: '/api/master/upcl-supply-categories',
    },
    {
      master_name: 'UPCL Supply Subcategory Master',
      master_code: 'UPCL_SUPPLY_SUBCATEGORY',
      description: 'UPCL Supply Subcategories',
      table_name: 'm_upcl_supply_subcategories',
      value_column: 'id',
      label_column: 'name',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'name ASC',
      parent_column: 'supplyCategoryId',
      api_endpoint: '/api/master/upcl-supply-subcategories',
    },

    // UPCL - Voltage
    {
      master_name: 'UPCL Voltage Master',
      master_code: 'UPCL_VOLTAGE',
      description: 'UPCL Voltage Master',
      table_name: 'm_upcl_voltage',
      value_column: 'id',
      label_column: 'voltageDesc',
      secondary_label: 'voltageGroup',
      label_template: '{voltageGroup}-{voltageDesc}',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'voltageGroup ASC',
      api_endpoint: '/api/master/upcl-voltage',
    },

    // UPCL - Division/Subdivision (same table)
    {
      master_name: 'UPCL Division Master',
      master_code: 'UPCL_DIVISION',
      description: 'UPCL Division Master',
      table_name: 'm_upcl_division_subdivisions',
      value_column: 'divisionId',
      label_column: 'divisionName',
      secondary_label: 'divisionCode',
      label_template: '{divisionCode} - {divisionName}',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'divisionCode ASC',
      api_endpoint: '/api/master/upcl-divisions',
    },
    {
      master_name: 'UPCL Subdivision Master',
      master_code: 'UPCL_SUBDIVISION',
      description: 'UPCL Subdivision Master',
      table_name: 'm_upcl_division_subdivisions',
      value_column: 'subdivisionId',
      label_column: 'subdivisionName',
      secondary_label: 'subdivisionCode',
      label_template: '{subdivisionCode} - {subdivisionName}',
      is_active_column: 'isActive',
      is_active_value: 'true',
      default_order_by: 'subdivisionCode ASC',
      parent_column: 'divisionId',
      api_endpoint: '/api/master/upcl-subdivisions',
    },

    // -----------------------
    // NIC / HSN (FIXED: Prisma field names)
    // -----------------------
    {
      master_name: 'NIC Code Master',
      master_code: 'NIC_CODE',
      description: 'List of NIC codes',
      table_name: 'm_nic_code',
      value_column: 'ID',
      label_column: 'Description',
      secondary_label: 'NIC_V_Digit',
      label_template: '{NIC_V_Digit} - {Description}',
      is_active_column: 'is_active',
      is_active_value: 'Y',
      default_order_by: '"NIC_V_Digit" ASC',
      api_endpoint: '/master/nic-codes',
    },
    {
      master_name: 'HSN Code Master',
      master_code: 'HSN_CODE',
      description: 'List of HSN codes',
      table_name: 'm_hsn_code',
      value_column: 'hsn_code',
      label_column: 'comodity_name',
      secondary_label: 'hsn_code',
      label_template: '{hsn_code} - {comodity_name}',
      is_active_column: 'is_active',
      is_active_value: 'Y',
      default_order_by: 'hsn_code ASC',
      api_endpoint: '/master/hsn-codes',
    },
  ];

  // 1) Upsert all masters (parent_master_id will be set later)
  for (const master of masterTables) {
    await prisma.master_tables.upsert({
      where: { master_code: master.master_code },
      update: master,
      create: master,
    });
    console.log(`  ✓ Created/Updated ${master.master_name}`);
  }

  // 2) Setup parent-child relationships (same as your existing logic + UPCL supply)
  const relationships = [
    { child: 'STATE', parent: 'COUNTRY' },
    { child: 'DISTRICT', parent: 'STATE' },
    { child: 'BLOCK', parent: 'DISTRICT' },
    { child: 'TEHSIL', parent: 'DISTRICT' },
    { child: 'VILLAGE', parent: 'TEHSIL' },
    { child: 'UPCL_SUPPLY_SUBCATEGORY', parent: 'UPCL_SUPPLY_CATEGORY' },
    { child: 'UPCL_SUBDIVISION', parent: 'UPCL_DIVISION' },
  ];

  for (const rel of relationships) {
    const parent = await prisma.master_tables.findUnique({
      where: { master_code: rel.parent },
    });

    if (parent) {
      await prisma.master_tables.update({
        where: { master_code: rel.child },
        data: { parent_master_id: parent.id },
      });
      console.log(`  ✓ Linked ${rel.child} → ${rel.parent}`);
    }
  }

  console.log('✅ master_tables seeded successfully!');
}
