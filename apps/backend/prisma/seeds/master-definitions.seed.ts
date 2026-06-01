import { PrismaClient } from '@prisma/client';

export async function seedMasterDefinitions(prisma: PrismaClient) {
  try {
    console.log('🚀 Seeding Master Definitions...');

    // ======================================
    // 1. CREATE COUNTRY MASTER DEFINITION
    // ======================================
    const countryMaster = await prisma.masterDefinition.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        tenant_id: 1,
        name: 'Country',
        code: 'COUNTRY',
        description: 'List of countries',
        icon: 'globe',
        is_active: true,
        is_system: false,
        allow_import: true,
        display_order: 1,
        created_by: BigInt(1),
      },
    });
    console.log('✅ Country Master Definition created');

    // Create Country columns
    const countryColumns = [
      {
        master_id: countryMaster.id,
        column_key: 'name',
        column_label: 'Country Name',
        data_type: 'TEXT',
        is_required: true,
        is_unique: true,
        is_searchable: true,
        is_listable: true,
        is_filterable: false,
        display_order: 1,
      },
      {
        master_id: countryMaster.id,
        column_key: 'code',
        column_label: 'Country Code',
        data_type: 'TEXT',
        is_required: true,
        is_unique: true,
        is_searchable: true,
        is_listable: true,
        is_filterable: false,
        display_order: 2,
      },
      {
        master_id: countryMaster.id,
        column_key: 'description',
        column_label: 'Description',
        data_type: 'TEXT',
        is_required: false,
        is_unique: false,
        is_searchable: false,
        is_listable: true,
        is_filterable: false,
        display_order: 3,
      },
    ];

    for (const col of countryColumns) {
      await prisma.masterColumnDefinition.upsert({
        where: {
          master_id_column_key: {
            master_id: col.master_id,
            column_key: col.column_key,
          },
        },
        update: {},
        create: col as any,
      });
    }
    console.log('✅ Country columns created');

    // ======================================
    // 2. CREATE STATE MASTER DEFINITION
    // ======================================
    const stateMaster = await prisma.masterDefinition.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        tenant_id: 1,
        name: 'State',
        code: 'STATE',
        description: 'List of states/provinces',
        icon: 'map',
        is_active: true,
        is_system: false,
        allow_import: true,
        display_order: 2,
        created_by: BigInt(1),
      },
    });
    console.log('✅ State Master Definition created');

    // Create State columns
    const stateColumns = [
      {
        master_id: stateMaster.id,
        column_key: 'name',
        column_label: 'State Name',
        data_type: 'TEXT',
        is_required: true,
        is_unique: false,
        is_searchable: true,
        is_listable: true,
        is_filterable: false,
        display_order: 1,
      },
      {
        master_id: stateMaster.id,
        column_key: 'code',
        column_label: 'State Code',
        data_type: 'TEXT',
        is_required: false,
        is_unique: false,
        is_searchable: true,
        is_listable: true,
        is_filterable: false,
        display_order: 2,
      },
      {
        master_id: stateMaster.id,
        column_key: 'country_id',
        column_label: 'Country ID',
        data_type: 'NUMBER',
        is_required: false,
        is_unique: false,
        is_searchable: false,
        is_listable: false,
        is_filterable: true,
        display_order: 3,
      },
    ];

    for (const col of stateColumns) {
      await prisma.masterColumnDefinition.upsert({
        where: {
          master_id_column_key: {
            master_id: col.master_id,
            column_key: col.column_key,
          },
        },
        update: {},
        create: col as any,
      });
    }
    console.log('✅ State columns created');

    // ======================================
    // 3. CREATE DISTRICT MASTER DEFINITION
    // ======================================
    const districtMaster = await prisma.masterDefinition.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        tenant_id: 1,
        name: 'District',
        code: 'DISTRICT',
        description: 'List of districts',
        icon: 'building-2',
        is_active: true,
        is_system: false,
        allow_import: true,
        display_order: 3,
        created_by: BigInt(1),
      },
    });
    console.log('✅ District Master Definition created');

    // Create District columns
    const districtColumns = [
      {
        master_id: districtMaster.id,
        column_key: 'name',
        column_label: 'District Name',
        data_type: 'TEXT',
        is_required: true,
        is_unique: false,
        is_searchable: true,
        is_listable: true,
        is_filterable: false,
        display_order: 1,
      },
      {
        master_id: districtMaster.id,
        column_key: 'code',
        column_label: 'District Code',
        data_type: 'TEXT',
        is_required: false,
        is_unique: false,
        is_searchable: true,
        is_listable: true,
        is_filterable: false,
        display_order: 2,
      },
      {
        master_id: districtMaster.id,
        column_key: 'state_id',
        column_label: 'State ID',
        data_type: 'NUMBER',
        is_required: false,
        is_unique: false,
        is_searchable: false,
        is_listable: false,
        is_filterable: true,
        display_order: 3,
      },
    ];

    for (const col of districtColumns) {
      await prisma.masterColumnDefinition.upsert({
        where: {
          master_id_column_key: {
            master_id: col.master_id,
            column_key: col.column_key,
          },
        },
        update: {},
        create: col as any,
      });
    }
    console.log('✅ District columns created');

    // ======================================
    // 4. SEED DUMMY DATA FOR COUNTRIES
    // ======================================
    const countryData = [
      { name: 'India', code: 'IN', description: 'Republic of India' },
      { name: 'United States', code: 'US', description: 'United States of America' },
      { name: 'United Kingdom', code: 'UK', description: 'United Kingdom' },
    ];

    for (const country of countryData) {
      await prisma.masterData.upsert({
        where: {
          id: BigInt(0),
        },
        update: {},
        create: {
          master_id: countryMaster.id,
          tenant_id: 1,
          data: country,
          is_active: true,
          created_by: BigInt(1),
        },
      });
    }
    console.log(`✅ Seeded ${countryData.length} countries`);

    // ======================================
    // 5. SEED DUMMY DATA FOR STATES
    // ======================================
    const stateData = [
      { name: 'Uttarakhand', code: 'UT', country_id: 1 },
      { name: 'Uttar Pradesh', code: 'UP', country_id: 1 },
      { name: 'Bihar', code: 'BR', country_id: 1 },
      { name: 'California', code: 'CA', country_id: 2 },
      { name: 'Texas', code: 'TX', country_id: 2 },
      { name: 'England', code: 'EN', country_id: 3 },
    ];

    for (const state of stateData) {
      await prisma.masterData.create({
        data: {
          master_id: stateMaster.id,
          code: stateMaster.code,
          tenant_id: 1,
          data: state,
          is_active: true,
          created_by: BigInt(1),
        },
      });
    }
    console.log(`✅ Seeded ${stateData.length} states`);

    // ======================================
    // 6. SEED DUMMY DATA FOR DISTRICTS
    // ======================================
    const districtData = [
      { name: 'Dehradun', code: 'DHA', state_id: 1 },
      { name: 'Uttarkashi', code: 'UTTA', state_id: 1 },
      { name: 'Almora', code: 'ALM', state_id: 1 },
      { name: 'Lucknow', code: 'LCK', state_id: 2 },
      { name: 'Kanpur', code: 'KRP', state_id: 2 },
      { name: 'Patna', code: 'PTN', state_id: 3 },
      { name: 'Gaya', code: 'GYA', state_id: 3 },
      { name: 'Los Angeles', code: 'LA', state_id: 4 },
      { name: 'San Francisco', code: 'SF', state_id: 4 },
      { name: 'Dallas', code: 'DTL', state_id: 5 },
      { name: 'London', code: 'LON', state_id: 6 },
    ];

    for (const district of districtData) {
      await prisma.masterData.create({
        data: {
          master_id: districtMaster.id,
          code: districtMaster.code,
          tenant_id: 1,
          data: district,
          is_active: true,
          created_by: BigInt(1),
        },
      });
    }
    console.log(`✅ Seeded ${districtData.length} districts`);

    console.log('\n✅ Master Definitions seeded successfully!\n');
  } catch (error) {
    console.error('❌ Master Definitions seeding failed:', error);
    throw error;
  }
}
