import { ModuleExportConfig } from './export-utils';

/**
 * Export configuration for Country module
 */
export const countryExportConfig: ModuleExportConfig = {
  moduleName: 'countries',
  title: 'Countries',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Country Name', field: 'name', width: 25 },
    { header: 'Abbreviation', field: 'abbreviation', width: 15 },
    { header: 'BO Country ID', field: 'boCountryId', width: 15 },
    { header: 'LR ID', field: 'lrId', width: 15 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for State module
 */
export const stateExportConfig: ModuleExportConfig = {
  moduleName: 'states',
  title: 'States',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'State Name', field: 'name', width: 25 },
    { header: 'Abbreviation', field: 'abbreviation', width: 15 },
    { header: 'Country ID', field: 'countryId', width: 12 },
    { header: 'BO State ID', field: 'boStateId', width: 15 },
    { header: 'BO LGD ID', field: 'boLgdId', width: 15 },
    { header: 'State Code', field: 'stateCode', width: 12 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for District module
 */
export const districtExportConfig: ModuleExportConfig = {
  moduleName: 'districts',
  title: 'Districts',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'District Name', field: 'name', width: 25 },
    { header: 'Abbreviation', field: 'abbreviation', width: 15 },
    { header: 'State ID', field: 'stateId', width: 12 },
    { header: 'District Code', field: 'districtCode', width: 15 },
    { header: 'Lat/Long', field: 'latlong', width: 20 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for Block module
 */
export const blockExportConfig: ModuleExportConfig = {
  moduleName: 'blocks',
  title: 'Blocks',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Block Name', field: 'name', width: 25 },
    { header: 'District ID', field: 'districtId', width: 12 },
    { header: 'State ID', field: 'stateId', width: 12 },
    { header: 'Unit Category', field: 'unitCategory', width: 15 },
    { header: 'District Code', field: 'districtCode', width: 15 },
    { header: 'LG Code District ID', field: 'lgCodeDistrictId', width: 18 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for Tehsil module
 */
export const tehsilExportConfig: ModuleExportConfig = {
  moduleName: 'tehsils',
  title: 'Tehsils',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Tehsil Name', field: 'name', width: 25 },
    { header: 'District ID', field: 'districtId', width: 12 },
    { header: 'State ID', field: 'stateId', width: 12 },
    { header: 'Sub-District Code', field: 'subDistrictCode', width: 18 },
    { header: 'Dept Division ID', field: 'deptDivisionId', width: 15 },
    { header: 'LG District ID', field: 'lgDistrictId', width: 15 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for Village module
 */
export const villageExportConfig: ModuleExportConfig = {
  moduleName: 'villages',
  title: 'Villages',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Village Name', field: 'name', width: 25 },
    { header: 'Tehsil ID', field: 'tehsilId', width: 12 },
    { header: 'Village Code', field: 'villageCode', width: 18 },
    { header: 'Sub-District Code', field: 'subDistrictCode', width: 18 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for Department module
 */
export const departmentExportConfig: ModuleExportConfig = {
  moduleName: 'departments',
  title: 'Departments',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Department Name', field: 'name', width: 25 },
    { header: 'Unique Tag', field: 'uniqueTag', width: 15 },
    { header: 'Abbreviation', field: 'abbreviation', width: 12 },
    { header: 'IP Address', field: 'ip', width: 15 },
    { header: 'Base URL', field: 'baseUrl', width: 25 },
    {
      header: 'Department Type',
      field: 'deptType',
      width: 12,
      formatter: (value) => (value === 1 ? 'Central' : 'State'),
    },
    { header: 'Order', field: 'order', width: 10 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for Issuer module
 */
export const issuerExportConfig: ModuleExportConfig = {
  moduleName: 'issuers',
  title: 'Issuers',
  columns: [
    { header: 'ID', field: 'id', width: 10 },
    { header: 'Issuer Name', field: 'name', width: 40 },
    {
      header: 'Status',
      field: 'isIssuerActive',
      width: 15,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 20,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for DocumentType module
 */
export const documentTypeExportConfig: ModuleExportConfig = {
  moduleName: 'documentTypes',
  title: 'Document Types',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Document Type Name', field: 'name', width: 30 },
    { header: 'Abbreviation', field: 'abbreviation', width: 15 },
    {
      header: 'Format Required',
      field: 'isFormatRequired',
      width: 15,
      formatter: (value) => (value === true ? 'Yes' : value === false ? 'No' : 'N/A'),
    },
    {
      header: 'Status',
      field: 'isDocActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => new Date(value).toLocaleDateString(),
    },
  ],
};

/**
 * Export configuration for DocumentCheckpoint module
 */
export const documentCheckpointExportConfig: ModuleExportConfig = {
  moduleName: 'documentCheckpoints',
  title: 'Document Checkpoints',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Checkpoint Name', field: 'name', width: 40 },
    { header: 'Code', field: 'code', width: 15 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'created',
      width: 18,
      formatter: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
    {
      header: 'Modified Date',
      field: 'modified',
      width: 18,
      formatter: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
  ],
};


/**
 * Export configuration for Service Type module
 */
export const servicetypeExportConfig: ModuleExportConfig = {
  moduleName: 'servicetype',
  title: 'Service Type',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Service Type Name', field: 'name', width: 40 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
    {
      header: 'Modified Date',
      field: 'updatedAt',
      width: 18,
      formatter: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
  ],
};

/**
 * Export configuration for Service Sector module
 */
export const servicesectorExportConfig: ModuleExportConfig = {
  moduleName: 'servicesector',
  title: 'Service Sector',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Service Sector Name', field: 'name', width: 40 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
    {
      header: 'Modified Date',
      field: 'updatedAt',
      width: 18,
      formatter: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
  ],
};


/**
 * Export configuration for Service Sector module
 */
export const serviceincidenceExportConfig: ModuleExportConfig = {
  moduleName: 'serviceincidence',
  title: 'Service Incidence',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Service Incidence Name', field: 'name', width: 40 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
    {
      header: 'Modified Date',
      field: 'updatedAt',
      width: 18,
      formatter: (value) => (value ? new Date(value).toLocaleDateString() : 'N/A'),
    },
  ],
};


/**
 * Export configuration for Service module
 */
export const serviceExportConfig: ModuleExportConfig = {
  moduleName: 'service',
  title: 'Service Master',
  columns: [
    { header: 'ID', field: 'id', width: 6 },

    { header: 'Service ID', field: 'service_id', width: 16 },

    { header: 'Service Name', field: 'service_name', width: 40 },

    { header: 'Department', field: 'department_name', width: 30 },

    {
      header: 'Issuer Type',
      field: 'issuer_name',
      width: 18,
    },

    {
      header: 'Service Level',
      field: 'service_level',
      width: 18,
    },

    {
      header: 'Service Status',
      field: 'service_status',
      width: 22,
      formatter: (value) =>
        value
          ? value.replace(/_/g, ' ').toUpperCase()
          : 'N/A',
    },

    {
      header: 'Active Status',
      field: 'isActive',
      width: 14,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },

    {
      header: 'Go-Live Date',
      field: 'service_go_live_date',
      width: 18,
      formatter: (value) =>
        value ? new Date(value).toLocaleDateString('en-IN') : 'N/A',
    },

    {
      header: 'End Date',
      field: 'service_end_date',
      width: 18,
      formatter: (value) =>
        value ? new Date(value).toLocaleDateString('en-IN') : 'N/A',
    },

    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) =>
        value ? new Date(value).toLocaleDateString('en-IN') : 'N/A',
    },

    {
      header: 'Last Updated',
      field: 'updatedAt',
      width: 18,
      formatter: (value) =>
        value ? new Date(value).toLocaleDateString('en-IN') : 'N/A',
    },
  ],
};


export const documentMasterExportConfig = {
  columns: [
    { key: 'checklistId', label: 'Checklist ID' },
    { key: 'state.name', label: 'State' },
    { key: 'issuer.name', label: 'Issuer' },
    { key: 'department.name', label: 'Department' },
    { key: 'checklistDocumentName', label: 'Document Name' },
    { key: 'checklistDocumentExtension', label: 'File Extension' },
    { key: 'checklistDocumentMaxSize', label: 'Max Size (bytes)' },
    { key: 'prescribedDocumentFormat', label: 'Prescribed Format' },
    {
      key: 'isDocActive',
      label: 'Status',
      formatter: (value: boolean) => (value ? 'Active' : 'Inactive'),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      formatter: (value: string) => new Date(value).toLocaleDateString(),
    },
  ],
};


export const investorDocumentExportConfig = {
  moduleName: 'investorDocuments',
  title: 'Investor Documents',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Reference No.', field: 'documentReferenceNumber', width: 28 },
    { header: 'Name', field: 'documentName', width: 24 },
    { header: 'Version', field: 'documentVersion', width: 12 },
    {
      header: 'Status',
      field: 'documentStatus',
      width: 12,
      formatter: (v: string) =>
        v === 'U' ? 'Unverified' : v === 'V' ? 'Verified' : v === 'R' ? 'Rejected' : v === 'M' ? 'Mismatched' : v,
    },
    { header: 'Type', field: 'documentType.name', width: 20 },
    { header: 'Issuer', field: 'issuer.name', width: 20 },
    { header: 'Department', field: 'department.name', width: 20 },
    { header: 'Valid From', field: 'validFrom', width: 16, formatter: (v: string) => (v ? new Date(v).toLocaleDateString() : '—') },
    { header: 'Valid To', field: 'validTo', width: 16, formatter: (v: string) => (v ? new Date(v).toLocaleDateString() : '—') },
    {
      header: 'Issued On',
      field: 'documentDateOfIssuance',
      width: 16,
      formatter: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    { header: 'Active', field: 'isDocumentActive', width: 12, formatter: (v: string) => (v === 'Y' ? 'Yes' : 'No') },
    { header: 'Created', field: 'createdAt', width: 18, formatter: (v: string) => new Date(v).toLocaleDateString() },
  ],
};

export const actPolicyNotificationExportConfig: ModuleExportConfig = {
  moduleName: 'actPolicyNotifications',
  title: 'Act Policy Notification Master',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Type', field: 'type', width: 12 },
    { header: 'Level', field: 'level', width: 12 },
    { header: 'Name', field: 'name', width: 24 },
    { header: 'Brief', field: 'brief', width: 24 },
    { header: 'English File Path', field: 'englishfilePath', width: 24 },
    { header: 'Hindi File Path', field: 'hindifilePath', width: 24 },
    {
      header: 'Start Date',
      field: 'start_date',
      width: 16,
      formatter: (v) => (v ? new Date(v).toLocaleDateString() : ''),
    },
    {
      header: 'End Date',
      field: 'end_date',
      width: 16,
      formatter: (v) => (v ? new Date(v).toLocaleDateString() : ''),
    },
    {
      header: 'Active Status',
      field: 'isActive',
      width: 16,
      formatter:
        (value) => (value ? "Active" : "Inactive"),
    },
    {
      header:'Created Date',
      field:'createdAt',
      width: 18,
      formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
    }
  ],
};

export const informationWizardExportConfig: ModuleExportConfig = {
  moduleName: 'informationWizard',
  title: 'Information Wizard',
  columns: [
    { header: 'ID', field: 'id', width: 6 },
    { header: 'Service ID', field: 'serviceId', width: 12 },
    {
      header: 'Department',
      field: 'department',
      width: 24,
      formatter: (_value, row) =>
        row?.service?.department?.name || 'N/A',
    },
    {
      header: 'Service',
      field: 'service',
      width: 30,
      formatter: (_value, row) =>
        row?.service?.service_name || 'N/A',
    },
    {
      header: 'Statuary Form Path',
      field: 'statuaryFormPath',
      width: 28,
    },
    {
      header: 'Fee Structure Path',
      field: 'feeStructurePath',
      width: 28,
    },
    {
      header: 'SOP Document Path',
      field: 'sopDocumentPath',
      width: 28,
    },
    {
      header: 'Stage Wise Timeline Path',
      field: 'stageWiseTimelinePath',
      width: 28,
    },
    {
      header: 'Statuary Timeline Path',
      field: 'statuaryTimelinePath',
      width: 28,
    },
    {
      header: 'Statuary Timeline Text',
      field: 'statuaryTimelineText',
      width: 24,
    },
    {
      header: 'Inspection Checklist Path',
      field: 'inspectionChecklistPath',
      width: 28,
    },
    { header: 'Risk Category', field: 'riskCategory', width: 20 },
    { header: 'Size of Firm', field: 'sizeOfFirm', width: 20 },
    { header: 'Business Location', field: 'businessLocation', width: 20 },
    { header: 'Investor Type', field: 'investorType', width: 18 },
    {
      header: 'Active Status',
      field: 'isActive',
      width: 14,
      formatter: (value) => (value ? 'Active' : 'Inactive'),
    },
    {
      header: 'Updated Date',
      field: 'updatedAt',
      width: 18,
      formatter: (value) =>
        value ? new Date(value).toLocaleDateString('en-IN') : 'N/A',
    },
    {
      header: 'Created Date',
      field: 'createdAt',
      width: 18,
      formatter: (value) =>
        value ? new Date(value).toLocaleDateString('en-IN') : 'N/A',
    }
  ],
};


export const formFieldExportConfig: ModuleExportConfig = {
  moduleName: 'form-fields',
  title: 'Form Fields',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Code', field: 'formCheckId', width: 18 },
    { header: 'Field Label', field: 'name', width: 30 },
    { header: 'Parent ID', field: 'parentId', width: 10 },
    { header: 'Category ID', field: 'categoryId', width: 12 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (v) => (v ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created',
      field: 'createdAt',
      width: 18,
      formatter: (v) => (v ? new Date(v).toLocaleDateString() : 'N/A'),
    },
  ],
};


export const formCategoryExportConfig: ModuleExportConfig = {
  moduleName: 'form-categories',
  title: 'Form Categories',
  columns: [
    { header: 'ID', field: 'id', width: 8 },
    { header: 'Code', field: 'categoryCode', width: 18 },
    { header: 'Category Name', field: 'categoryName', width: 30 },
    { header: 'Name (Hindi)', field: 'nameInHindi', width: 24 },
    { header: 'Parent ID', field: 'parentId', width: 10 },
    {
      header: 'Status',
      field: 'isActive',
      width: 12,
      formatter: (v) => (v ? 'Active' : 'Inactive'),
    },
    {
      header: 'Created',
      field: 'createdAt',
      width: 18,
      formatter: (v) => (v ? new Date(v).toLocaleDateString() : 'N/A'),
    },
  ],
};
 export const organisationNatureExportConfig: ModuleExportConfig = {
    moduleName: 'organisationNature',
    title: 'Organisation Master',
    columns: [
      { header: 'ID', field: 'id', width: 8 },
      { header: 'Name', field: 'name', width: 24 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter:
          (value) => (value ? "Active" : "Inactive"),
      },
      {
        header: 'Is Education Active Status',
        field: 'educationIsActive',
        width: 16,
        formatter:
          (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'created',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const upclSupplyCategoriesExportConfig: ModuleExportConfig = {
    moduleName: 'upclSupplyCategory',
    title: 'UPCL Supply Category Master',
    columns: [
      { header: 'ID', field: 'id', width: 8 },
      { header: 'Name', field: 'name', width: 8 },
      { header: 'Type', field: 'type', width: 8 },
      { header: 'Parent', field: 'parent', width: 8 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter:(value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'created',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const upclSupplySubcategoriesExportConfig: ModuleExportConfig = {
    moduleName: 'upclSupplySubcategory',
    title: 'UPCL Supply Subcategories Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Name', field: 'name', width: 22 },
      { header: 'Type', field: 'type', width: 12 },
      { header: 'Supply Category ID', field: 'supplyCategoryId', width: 14 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const upclVoltageExportConfig: ModuleExportConfig = {
    moduleName: 'upclVoltage',
    title: 'UPCL Voltage Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Voltage Group', field: 'voltageGroup', width: 12 },
      { header: 'Voltage Description', field: 'voltageDesc', width: 18 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const ujsDivisionExportConfig: ModuleExportConfig = {
    moduleName: 'ujsDivision',
    title: 'UJS Division Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Division ID', field: 'divisionId', width: 10 },
      { header: 'Office Name', field: 'officeName', width: 18 },
      { header: 'Address', field: 'address', width: 24 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const labourFactoryTypeMasterExportConfig: ModuleExportConfig = {
    moduleName: 'labourFactoryTypeMaster',
    title: 'Labour Factory Type Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Factory Type', field: 'factoryType', width: 20 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const labourFactorySec85ExportConfig: ModuleExportConfig = {
    moduleName: 'labourFactorySec85',
    title: 'Labour Factory Sec85 Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Special Provision Name', field: 'specialProvisionName', width: 26 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const pollutionControlEquipmentsExportConfig: ModuleExportConfig = {
    moduleName: 'pollutionControlEquipment',
    title: 'Pollution Control Equipments Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Equipment Name', field: 'equipmentName', width: 24 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const currentLanduseExportConfig: ModuleExportConfig = {
    moduleName: 'currentLanduse',
    title: 'Current Landuse Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Name', field: 'name', width: 20 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const landAllotmentStageExportConfig: ModuleExportConfig = {
    moduleName: 'landAllotmentStage',
    title: 'Land Allotment Stage Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Name', field: 'name', width: 20 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  

export const upclDivisionSubdivisionsExportConfig: ModuleExportConfig = {
    moduleName: 'upclDivisionSubdivision',
    title: 'UPCL Division Subdivisions Master',
    columns: [
      { header: 'ID', field: 'id', width: 10 },
      { header: 'Division ID', field: 'divisionId', width: 12 },
      { header: 'Division Code', field: 'divisionCode', width: 12 },
      { header: 'Division Name', field: 'divisionName', width: 18 },
      { header: 'Subdivision ID', field: 'subdivisionId', width: 12 },
      { header: 'Subdivision Code', field: 'subdivisionCode', width: 12 },
      { header: 'Subdivision Name', field: 'subdivisionName', width: 18 },
      {
        header: 'Active Status',
        field: 'isActive',
        width: 16,
        formatter: (value) => (value ? "Active" : "Inactive"),
      },
      {
        header:'Created Date',
        field:'createdAt',
        width: 18,
        formatter:(value) => value ? new Date(value).toLocaleDateString('en-IN') : '',
      }
    ],
 }  
