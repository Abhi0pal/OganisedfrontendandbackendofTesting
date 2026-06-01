import { PrismaClient } from '@prisma/client';

export async function seedMasterDepartmentStructure(prisma: PrismaClient) {
  try {
    console.log('Seeding Master Department Structure...');

    // Get or create a system user (assuming user with id 1 exists or use admin user)
    const systemUser = await prisma.users.findFirst({
      where: { user_type: 'DEPARTMENT' },
    });

    if (!systemUser) {
      console.log('No system user found. Please create a user first.');
      return;
    }

    const createdBy = systemUser.id;

    // ============================================
    // 1. CREATE DEPARTMENT MASTER DEFINITION
    // ============================================
    const departmentMaster = await prisma.masterDefinition.create({
      data: {
        name: 'Department',
        code: 'DEPARTMENT',
        description: 'Government Department Master Data',
        icon: 'pi pi-fw pi-building',
        is_active: true,
        is_system: true,
        allow_import: true,
        display_order: 1,
        created_by: createdBy,
      },
    });

    // Update if already exists
    try {
      await prisma.masterDefinition.create({
        data: {
          name: 'Department',
          code: 'DEPARTMENT',
          description: 'Government Department Master Data',
          icon: 'pi pi-fw pi-building',
          is_active: true,
          is_system: true,
          allow_import: true,
          display_order: 1,
          created_by: createdBy,
        },
      });
    } catch (e) {
      // Already exists, skip
    }

    console.log('✓ Department Master Definition created:', departmentMaster.id);

    // ============================================
    // 2. CREATE DEPARTMENT COLUMN DEFINITIONS
    // ============================================
    const departmentColumns = [
      {
        column_key: 'name',
        column_label: 'Department Name',
        data_type: 'TEXT',
        is_required: true,
        is_unique: false,
        is_searchable: true,
        is_listable: true,
        is_filterable: true,
        display_order: 1,
        placeholder: 'e.g., Agriculture Department',
      },
      {
        column_key: 'unique_tag',
        column_label: 'Unique Tag',
        data_type: 'TEXT',
        is_required: true,
        is_unique: true,
        is_searchable: true,
        is_listable: true,
        is_filterable: false,
        display_order: 2,
        placeholder: 'e.g., AGR-DEPT',
      },
      {
        column_key: 'abbreviation',
        column_label: 'Abbreviation',
        data_type: 'TEXT',
        is_required: true,
        is_unique: false,
        is_searchable: false,
        is_listable: true,
        is_filterable: false,
        display_order: 3,
        placeholder: 'e.g., AGR',
      },
      {
        column_key: 'dept_type',
        column_label: 'Department Type',
        data_type: 'SELECT',
        is_required: true,
        is_unique: false,
        is_searchable: false,
        is_listable: true,
        is_filterable: true,
        display_order: 4,
        options: JSON.stringify([
          { label: 'Central', value: '1' },
          { label: 'State', value: '2' },
        ]),
      },
      {
        column_key: 'icon',
        column_label: 'Icon',
        data_type: 'TEXT',
        is_required: false,
        is_unique: false,
        is_searchable: false,
        is_listable: false,
        is_filterable: false,
        display_order: 5,
        placeholder: 'e.g., pi pi-fw pi-leaf',
      },
      {
        column_key: 'is_active',
        column_label: 'Active',
        data_type: 'BOOLEAN',
        is_required: false,
        is_unique: false,
        is_searchable: false,
        is_listable: true,
        is_filterable: true,
        display_order: 6,
      },
    ];

    for (const col of departmentColumns) {
      await prisma.masterColumnDefinition.upsert({
        where: {
          master_id_column_key: {
            master_id: departmentMaster.id,
            column_key: col.column_key,
          },
        },
        update: {},
        create: {
          master_id: departmentMaster.id,
          column_key: col.column_key,
          column_label: col.column_label,
          data_type: col.data_type as any,
          is_required: col.is_required,
          is_unique: col.is_unique,
          is_searchable: col.is_searchable,
          is_listable: col.is_listable,
          is_filterable: col.is_filterable,
          display_order: col.display_order,
          options: col.options || undefined,
          placeholder: col.placeholder,
        },
      });
    }

    console.log('✓ Department Column Definitions created');

    // ============================================
    // 3. CREATE DEPARTMENT MASTER DATA
    // ============================================
    const departments = [
      {
        name: 'Agriculture Department',
        unique_tag: 'AGR-DEPT',
        abbreviation: 'AGR',
        dept_type: '2',
        icon: 'pi pi-fw pi-leaf',
        is_active: true,
      },
      {
        name: 'Health Department',
        unique_tag: 'HEALTH-DEPT',
        abbreviation: 'HLTH',
        dept_type: '2',
        icon: 'pi pi-fw pi-heart',
        is_active: true,
      },
      {
        name: 'Education Department',
        unique_tag: 'EDU-DEPT',
        abbreviation: 'EDU',
        dept_type: '2',
        icon: 'pi pi-fw pi-book',
        is_active: true,
      },
      {
        name: 'Public Works Department',
        unique_tag: 'PWD-DEPT',
        abbreviation: 'PWD',
        dept_type: '2',
        icon: 'pi pi-fw pi-building',
        is_active: true,
      },
      {
        name: 'Labor Department',
        unique_tag: 'LABOR-DEPT',
        abbreviation: 'LBR',
        dept_type: '2',
        icon: 'pi pi-fw pi-briefcase',
        is_active: true,
      },
    ];

    const departmentDataIds: Array<{
      masterId: number;
      dataId: bigint;
      name: string;
    }> = [];

    for (const dept of departments) {
      const masterData = await prisma.masterData.create({
        data: {
          master_id: departmentMaster.id,
          code: departmentMaster.code,
          data: dept,
          is_active: true,
          created_by: createdBy,
        },
      });

      departmentDataIds.push({
        masterId: departmentMaster.id,
        dataId: masterData.id,
        name: dept.name,
      });
    }

    console.log('✓ Department Master Data created:', departmentDataIds.length);

    // ============================================
    // 4. CREATE SUB-DEPARTMENT MASTER DEFINITION
    // ============================================
    let subDepartmentMaster;
    try {
      subDepartmentMaster = await prisma.masterDefinition.create({
        data: {
          name: 'Sub Department',
          code: 'SUB_DEPARTMENT',
          description: 'Sub Department / Division Master Data',
          icon: 'pi pi-fw pi-sitemap',
          is_active: true,
          is_system: true,
          allow_import: true,
          display_order: 2,
          created_by: createdBy,
        },
      });
    } catch (e) {
      // Already exists, fetch it
      subDepartmentMaster = await prisma.masterDefinition.findFirstOrThrow({
        where: { code: 'SUB_DEPARTMENT' },
      });
    }

    console.log(
      '✓ Sub Department Master Definition created:',
      subDepartmentMaster.id,
    );

    // ============================================
    // 5. CREATE SUB-DEPARTMENT COLUMN DEFINITIONS
    // ============================================
    const subDepartmentColumns = [
      {
        column_key: 'department_id',
        column_label: 'Department',
        data_type: 'SELECT',
        is_required: true,
        is_unique: false,
        is_searchable: false,
        is_listable: true,
        is_filterable: true,
        display_order: 1,
      },
      {
        column_key: 'name',
        column_label: 'Sub Department Name',
        data_type: 'TEXT',
        is_required: true,
        is_unique: false,
        is_searchable: true,
        is_listable: true,
        is_filterable: true,
        display_order: 2,
        placeholder: 'e.g., Agricultural Extension',
      },
      {
        column_key: 'unique_tag',
        column_label: 'Unique Tag',
        data_type: 'TEXT',
        is_required: true,
        is_unique: true,
        is_searchable: true,
        is_listable: true,
        is_filterable: false,
        display_order: 3,
        placeholder: 'e.g., AGR-EXT',
      },
      {
        column_key: 'abbreviation',
        column_label: 'Abbreviation',
        data_type: 'TEXT',
        is_required: true,
        is_unique: false,
        is_searchable: false,
        is_listable: true,
        is_filterable: false,
        display_order: 4,
        placeholder: 'e.g., AGEXT',
      },
      {
        column_key: 'description',
        column_label: 'Description',
        data_type: 'TEXT',
        is_required: false,
        is_unique: false,
        is_searchable: true,
        is_listable: false,
        is_filterable: false,
        display_order: 5,
        placeholder: 'Brief description of the sub-department',
      },
      {
        column_key: 'is_active',
        column_label: 'Active',
        data_type: 'BOOLEAN',
        is_required: false,
        is_unique: false,
        is_searchable: false,
        is_listable: true,
        is_filterable: true,
        display_order: 6,
      },
    ];

    for (const col of subDepartmentColumns) {
      await prisma.masterColumnDefinition.upsert({
        where: {
          master_id_column_key: {
            master_id: subDepartmentMaster.id,
            column_key: col.column_key,
          },
        },
        update: {},
        create: {
          master_id: subDepartmentMaster.id,
          column_key: col.column_key,
          column_label: col.column_label,
          data_type: col.data_type as any,
          is_required: col.is_required,
          is_unique: col.is_unique,
          is_searchable: col.is_searchable,
          is_listable: col.is_listable,
          is_filterable: col.is_filterable,
          display_order: col.display_order,
          placeholder: col.placeholder,
        },
      });
    }

    console.log('✓ Sub Department Column Definitions created');

    // ============================================
    // 6. CREATE SUB-DEPARTMENT MASTER DATA
    // ============================================
    const subDepartments = [
      // Agriculture Department (ID 0)
      {
        department_id: 0,
        name: 'Agricultural Extension',
        unique_tag: 'AGR-EXT',
        abbreviation: 'AGEXT',
        description: 'Field-level extension services',
        is_active: true,
      },
      {
        department_id: 0,
        name: 'Soil & Water Conservation',
        unique_tag: 'AGR-SWC',
        abbreviation: 'SWC',
        description: 'Conservation of soil and water resources',
        is_active: true,
      },
      // Health Department (ID 1)
      {
        department_id: 1,
        name: 'Public Health Division',
        unique_tag: 'HLTH-PHD',
        abbreviation: 'PHD',
        description: 'Public health programs and initiatives',
        is_active: true,
      },
      {
        department_id: 1,
        name: 'Disease Surveillance',
        unique_tag: 'HLTH-DS',
        abbreviation: 'DSURVL',
        description: 'Disease surveillance and control',
        is_active: true,
      },
      // Education Department (ID 2)
      {
        department_id: 2,
        name: 'Primary Education',
        unique_tag: 'EDU-PRIM',
        abbreviation: 'EDUPRIM',
        description: 'Primary school administration and planning',
        is_active: true,
      },
      {
        department_id: 2,
        name: 'Secondary Education',
        unique_tag: 'EDU-SEC',
        abbreviation: 'EDUSEC',
        description: 'Secondary school administration',
        is_active: true,
      },
      // Public Works Department (ID 3)
      {
        department_id: 3,
        name: 'Road Construction',
        unique_tag: 'PWD-ROAD',
        abbreviation: 'ROAD',
        description: 'Road construction and maintenance',
        is_active: true,
      },
      {
        department_id: 3,
        name: 'Water Supply Division',
        unique_tag: 'PWD-WATER',
        abbreviation: 'WATER',
        description: 'Water supply infrastructure',
        is_active: true,
      },
      // Labor Department (ID 4)
      {
        department_id: 4,
        name: 'Labor Standards',
        unique_tag: 'LBR-STD',
        abbreviation: 'LBRSTD',
        description: 'Labor standards and regulations',
        is_active: true,
      },
      {
        department_id: 4,
        name: 'Mine Safety & Health',
        unique_tag: 'LBR-MINE',
        abbreviation: 'MINE',
        description: 'Mine safety and worker health',
        is_active: true,
      },
    ];

    for (let i = 0; i < subDepartments.length; i++) {
      const subDept = subDepartments[i];
      const parentDepartmentData = departmentDataIds[subDept.department_id];

      const masterData = await prisma.masterData.create({
        data: {
          master_id: subDepartmentMaster.id,
          code: subDepartmentMaster.code,
          tenant_id: null,
          data: {
            department_id: parentDepartmentData.dataId.toString(),
            department_name: parentDepartmentData.name,
            name: subDept.name,
            unique_tag: subDept.unique_tag,
            abbreviation: subDept.abbreviation,
            description: subDept.description,
            is_active: subDept.is_active,
          },
          is_active: true,
          created_by: createdBy,
        },
      });

      // ============================================
      // 7. CREATE MASTER DATA REFERENCES
      // ============================================
      // Link SubDepartment to Department via MasterDataReference
      await prisma.masterDataReference.create({
        data: {
          from_data_id: masterData.id,
          to_data_id: parentDepartmentData.dataId,
          column_key: 'department_id',
        },
      });
    }

    console.log('✓ Sub Department Master Data created: 10');
    console.log('✓ Master Data References created: 10');

    console.log(
      '\n✅ Master Department Structure seeding completed successfully!',
    );
  } catch (error) {
    console.error('❌ Error seeding master department structure:', error);
    throw error;
  }
}
