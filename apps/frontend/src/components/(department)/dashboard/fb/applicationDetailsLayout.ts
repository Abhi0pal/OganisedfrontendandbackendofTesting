type FieldSchemaLike = {
  fieldCode: string;
  label: string;
  categoryCode?: string | null;
  categoryName?: string | null;
  gridSpan?: number;
  preference?: number;
};

type DocumentLike = {
  documentName: string;
  fileName?: string | null;
  fileUrl?: string | null;
  status?: string | null;
  statusLabel?: string | null;
};

type SectionField = {
  label: string;
  value: unknown;
  fieldCode?: string;
  gridSpan?: number;
  preference?: number;
};

export type ApplicationDisplaySection = {
  key: string;
  title: string;
  fields: SectionField[];
};

type SectionTemplateField = {
  label: string;
  fieldCodes?: string[];
  labelAliases?: string[];
  documentNames?: string[];
};

type SectionTemplate = {
  key: string;
  title: string;
  fields: SectionTemplateField[];
};

const TEMPLATE: SectionTemplate[] = [
  {
    key: 'promoter-basic',
    title: 'Promoter Basic Details',
    fields: [
      { label: 'Type', fieldCodes: ['UK-FCL-03884_0'], labelAliases: ['promoter type', 'type'] },
      { label: 'Constitution of Promoter', fieldCodes: ['UK-FCL-03885_0'] },
      { label: 'Name', fieldCodes: ['UK-FCL-03886_0'], labelAliases: ['promoter name', 'name'] },
      { label: 'PAN Card', fieldCodes: ['UK-FCL-03887_0'], labelAliases: ['promoter pan', 'pan card', 'pan'] },
      { label: 'GSTIN', fieldCodes: ['UK-FCL-03888_0'], labelAliases: ['promoter gstin', 'gstin'] },
      { label: 'Email', fieldCodes: ['UK-FCL-00003_0'], labelAliases: ['email id', 'email'] },
      { label: 'Mobile', fieldCodes: ['UK-FCL-00004_0'], labelAliases: ['mobile number', 'mobile'] },
      { label: 'Date of Incorporation', fieldCodes: ['UK-FCL-03889_0'] },
    ],
  },
  {
    key: 'promoter-address',
    title: 'Promoter Address',
    fields: [
      { label: 'Address line 1', fieldCodes: ['UK-FCL-03890_0'], labelAliases: ['address line 1'] },
      { label: 'Address line 2', fieldCodes: ['UK-FCL-03891_0'], labelAliases: ['address line 2'] },
      { label: 'Country', fieldCodes: ['UK-FCL-00005_1'] },
      { label: 'State', fieldCodes: ['UK-FCL-00013_0'] },
      { label: 'District', fieldCodes: ['UK-FCL-00015_0'] },
      { label: 'Mandal', fieldCodes: ['UK-FCL-03892_0', 'UK-FCL-00007_0'] },
      { label: 'Village', fieldCodes: ['UK-FCL-00042_0'] },
      { label: 'Pin code', fieldCodes: ['UK-FCL-00017_0'], labelAliases: ['pin code'] },
    ],
  },
  {
    key: 'project-identification',
    title: 'Project Identification',
    fields: [
      { label: 'Name', fieldCodes: ['UK-FCL-03893_0'], labelAliases: ['project name', 'name'] },
      { label: 'Category', fieldCodes: ['UK-FCL-00010_0'], labelAliases: ['project category', 'category'] },
      { label: 'Type', fieldCodes: ['UK-FCL-00038_11'], labelAliases: ['project type', 'type'] },
      { label: 'Start Date', fieldCodes: ['UK-FCL-03894_0'], labelAliases: ['project start date', 'start date'] },
      { label: 'Completion Date', fieldCodes: ['UK-FCL-03895_0'], labelAliases: ['proposed completion date', 'completion date'] },
      { label: 'Description', fieldCodes: ['UK-FCL-03896_0'], labelAliases: ['project description', 'description'] },
    ],
  },
  {
    key: 'project-location',
    title: 'Project Location',
    fields: [
      { label: 'Land ownership type', fieldCodes: ['UK-FCL-00006_0'], labelAliases: ['land ownership type'] },
      { label: 'District', fieldCodes: ['UK-FCL-00015_0'] },
      { label: 'Mandal', fieldCodes: ['UK-FCL-00007_0', 'UK-FCL-03892_0'] },
      { label: 'Village', fieldCodes: ['UK-FCL-00042_0'] },
      { label: 'Local body type', fieldCodes: ['UK-FCL-00004_1'], labelAliases: ['local body type'] },
      { label: 'Survey/Plot No.', fieldCodes: ['UK-FCL-03897_0'], labelAliases: ['survey / plot no', 'survey plot no'] },
      { label: 'Address', fieldCodes: ['UK-FCL-03898_0'], labelAliases: ['project address', 'address'] },
    ],
  },
  {
    key: 'project-land',
    title: 'Project Land Details',
    fields: [
      { label: 'Land Area', fieldCodes: ['UK-FCL-03899_0'], labelAliases: ['land area sqm', 'land area'] },
      { label: 'Built up area', fieldCodes: ['UK-FCL-01881_0'], labelAliases: ['total built up area', 'built up area'] },
      { label: 'No. of buildings', fieldCodes: ['UK-FCL-01000_0'], labelAliases: ['no of buildings', 'no. of buildings'] },
      { label: 'No. of floors', fieldCodes: ['UK-FCL-01882_0'], labelAliases: ['no of floors', 'no. of floors'] },
    ],
  },
  {
    key: 'project-cost',
    title: 'Project Cost',
    fields: [
      { label: 'Estimated Project Cost', fieldCodes: ['UK-FCL-00006_2'], labelAliases: ['estimated project cost'] },
      { label: 'Cost of Land', fieldCodes: ['UK-FCL-00020_0'], labelAliases: ['cost of land'] },
      { label: 'Cost of Construction', fieldCodes: ['UK-FCL-00021_0'], labelAliases: ['cost of construction'] },
      { label: 'Other Costs', fieldCodes: ['UK-FCL-00022_0'], labelAliases: ['other costs', 'other cost'] },
      { label: 'Total Project Cost', fieldCodes: ['UK-FCL-00023_0'], labelAliases: ['total project cost'] },
    ],
  },
  {
    key: 'bank-docs',
    title: 'Bank Details',
    fields: [
      { label: 'Land Title Deed', documentNames: ['land title deed'] },
      { label: 'Approved Building Plan', documentNames: ['approved building plan'] },
      { label: 'CA Certificate', documentNames: ['ca certificate'] },
      { label: 'Engineer Certificate', documentNames: ['engineer certificate'] },
      { label: 'Architect Certificate', documentNames: ['architect certificate'] },
      { label: 'Encumbrance Certificate', documentNames: ['encumbrance certificate'] },
    ],
  },
];

function normalize(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function flattenFormData(formData: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  const visit = (node: unknown, depth = 0) => {
    if (depth > 5) return; // Prevent infinite recursion
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;

    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      // Prioritize deeper values if they match field codes
      if (value !== undefined && value !== null) {
        flat[key] = value;
      }
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        visit(value, depth + 1);
      }
    }
  };

  visit(formData);
  return flat;
}

function fallbackSections(
  fieldSchema: FieldSchemaLike[],
  formData: Record<string, unknown>,
): ApplicationDisplaySection[] {
  const flatData = flattenFormData(formData);
  const categoryOrder: string[] = [];
  const categoryNames: Record<string, string> = {};
  const grouped: Record<string, SectionField[]> = {};

  // 1. Identify categories and their order
  for (const f of fieldSchema) {
    const key = String(f.categoryCode || f.categoryName || 'General');
    if (!categoryOrder.includes(key)) {
      categoryOrder.push(key);
      categoryNames[key] = String(f.categoryName || 'General');
    }
  }

  // 2. Group fields by category
  for (const f of fieldSchema) {
    const categoryKey = String(f.categoryCode || f.categoryName || 'General');
    
    // Check in flatData (case-insensitive for robustness)
    let value = flatData[f.fieldCode];
    if (value === undefined || value === null || value === '') {
      value = flatData[f.fieldCode.toLowerCase()];
    }
    
    // If still not found, check if it's inside a 'fields' object directly (backend fallback)
    if ((value === undefined || value === null || value === '') && formData.fields) {
      value = (formData.fields as any)[f.fieldCode] || (formData.fields as any)[f.fieldCode.toLowerCase()];
    }

    if (value === undefined || value === null || value === '') continue;

    if (!grouped[categoryKey]) grouped[categoryKey] = [];
    grouped[categoryKey].push({
      label: f.label,
      value,
      fieldCode: f.fieldCode,
      gridSpan: f.gridSpan,
      preference: f.preference,
    });
  }

  // 3. Build initial sections
  const initialSections = categoryOrder
    .filter((key) => (grouped[key]?.length || 0) > 0)
    .map((key) => ({
      key,
      title: categoryNames[key] || 'General',
      fields: grouped[key].sort((a, b) => (a.preference || 0) - (b.preference || 0)),
    }));

  // 4. Merge small sections for better layout
  const mergedSections: ApplicationDisplaySection[] = [];
  let current: ApplicationDisplaySection | null = null;

  for (const section of initialSections) {
    if (!current) {
      current = { ...section };
    } else if (current.fields.length < 3 || section.fields.length < 3) {
      current.fields = [...current.fields, ...section.fields];
      if (current.title !== section.title && current.title.length < 40) {
        current.title = `${current.title} & ${section.title}`;
      }
    } else {
      mergedSections.push(current);
      current = { ...section };
    }
  }
  if (current) mergedSections.push(current);

  return mergedSections;
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

export function buildApplicationDisplaySections(options: {
  fieldSchema: FieldSchemaLike[];
  formData: Record<string, unknown>;
  documents?: DocumentLike[];
}): ApplicationDisplaySection[] {
  const { fieldSchema, formData, documents = [] } = options;
  if (!Array.isArray(fieldSchema) || fieldSchema.length === 0) {
    return [];
  }

  const flatData = flattenFormData(formData || {});

  const byNormalizedLabel = new Map<string, Array<{ label: string; value: unknown; fieldCode: string; gridSpan?: number; preference?: number }>>();
  for (const field of fieldSchema) {
    const value = flatData[field.fieldCode] ?? flatData[field.fieldCode.toLowerCase()];
    const normalizedLabel = normalize(field.label);
    if (!byNormalizedLabel.has(normalizedLabel)) byNormalizedLabel.set(normalizedLabel, []);
    byNormalizedLabel.get(normalizedLabel)!.push({
      label: field.label,
      value,
      fieldCode: field.fieldCode,
      gridSpan: field.gridSpan,
      preference: field.preference,
    });
  }

  const docsByName = new Map<string, DocumentLike>();
  for (const doc of documents || []) {
    const key = normalize(doc.documentName || '');
    if (!key) continue;
    docsByName.set(key, doc);
  }

  let filledCount = 0;
  const sections: ApplicationDisplaySection[] = TEMPLATE.map((section) => {
    const fields: SectionField[] = section.fields.map((templateField) => {
      let value: unknown = undefined;
      let fieldCode: string | undefined = undefined;
      let gridSpan: number | undefined = undefined;
      let preference: number | undefined = undefined;

      if (Array.isArray(templateField.documentNames) && templateField.documentNames.length > 0) {
        const match = templateField.documentNames
          .map((name) => docsByName.get(normalize(name)))
          .find(Boolean);
        if (match) {
          if (match.fileUrl) {
            value = {
              filePath: match.fileUrl,
              fileName: match.fileName || match.documentName || 'View document',
            };
          } else {
            value = match.statusLabel || match.status || '';
          }
        }
      }

      if (isEmptyValue(value) && Array.isArray(templateField.fieldCodes)) {
        for (const code of templateField.fieldCodes) {
          const candidate = flatData[code] ?? flatData[code.toLowerCase()];
          if (!isEmptyValue(candidate)) {
            value = candidate;
            fieldCode = code;
            const schemaMatch = fieldSchema.find(s => s.fieldCode === code);
            gridSpan = schemaMatch?.gridSpan;
            preference = schemaMatch?.preference;
            break;
          }
        }
      }

      if (isEmptyValue(value) && Array.isArray(templateField.labelAliases)) {
        for (const alias of templateField.labelAliases) {
          const normalizedAlias = normalize(alias);
          const candidate = (byNormalizedLabel.get(normalizedAlias) || []).find(
            (entry) => !isEmptyValue(entry.value),
          );
          if (candidate) {
            value = candidate.value;
            fieldCode = candidate.fieldCode;
            gridSpan = candidate.gridSpan;
            preference = candidate.preference;
            break;
          }
        }
      }

      if (!isEmptyValue(value)) filledCount += 1;

      return {
        label: templateField.label,
        value,
        fieldCode,
        gridSpan,
        preference,
      };
    });

    return {
      key: section.key,
      title: section.title,
      fields: fields.sort((a, b) => (a.preference || 0) - (b.preference || 0)),
    };
  });

  if (filledCount < 6) {
    return fallbackSections(fieldSchema, formData || {});
  }

  return sections;
}
