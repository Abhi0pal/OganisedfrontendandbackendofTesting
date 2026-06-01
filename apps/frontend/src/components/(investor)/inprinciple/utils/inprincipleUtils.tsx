type UploadedFileInfo = {
  filePath: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  status?: string;
};

type DependsOnConfig = {
  field: string;
  value: string | string[];
  show?: boolean;
};

export const toTitleCase = (text: string) =>
  text
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formatOptions = (options?: { value: string | number; label: string }[]) =>
  (options || []).map((item) => ({
    ...item,
    label: item.label ? toTitleCase(item.label) : item.label,
  }));

export const decodeParam = (value?: string | null) => {
  if (!value) return '';
  return value;
};

export const encodeParam = (value: string | number) => String(value);

export const mergeDeep = (base: any, override: any) => {
  if (Array.isArray(base) || Array.isArray(override)) {
    return override ?? base;
  }
  if (base && typeof base === 'object' && override && typeof override === 'object') {
    const result: Record<string, any> = { ...base };
    Object.keys(override).forEach((key) => {
      result[key] = mergeDeep(base?.[key], override[key]);
    });
    return result;
  }
  return override ?? base;
};

export const getProcessingLevel = (data: any) => {
  const rawValue = data?.finance?.cost?.plant;
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return 'District';
  }
  return numericValue > 50 ? 'State' : 'District';
};

export const getApplicationStatusLabel = (statusCode?: string | null) => {
  const code = String(statusCode || '').trim().toUpperCase();
  const map: Record<string, string> = {
    P: 'Pending',
    DP: 'Document Pending',
    I: 'Incomplete / Draft',
    PD: 'Payment Due',
    R: 'Rejected',
    H: 'Revert Back to Investor',
    RBI: 'Revert Back to Investor',
    F: 'Forwarded',
    A: 'Approved',
  };
  return map[code] || 'N/A';
};

export const getStatusBadgeClass = (statusCode?: string | null) => {
  const code = String(statusCode || '').trim().toUpperCase();
  const map: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    I: 'bg-yellow-100 text-yellow-700',
    P: 'bg-yellow-100 text-yellow-700',
    R: 'bg-red-100 text-red-700',
    RBI: 'bg-orange-100 text-orange-700',
    H: 'bg-orange-100 text-orange-700',
    DP: 'bg-orange-100 text-orange-700',
    PD: 'bg-orange-100 text-orange-700',
    F: 'bg-blue-100 text-blue-700',
  };
  return map[code] || 'bg-gray-100 text-gray-700';
};

export const getValueByPath = (data: any, path: string) =>
  path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), data);

export const isFilledValue = (value: any) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'boolean') return value === true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const isDependsOnVisible = (field: { dependsOn?: DependsOnConfig }, values: any) => {
  if (!field.dependsOn) return true;
  const watchedValue = getValueByPath(values, field.dependsOn.field);
  const targetValues = Array.isArray(field.dependsOn.value)
    ? field.dependsOn.value
    : [field.dependsOn.value];
  const conditionMet = targetValues.includes(watchedValue);
  return field.dependsOn.show ? conditionMet : !conditionMet;
};

export const computeCompletedSteps = (
  values: any,
  steps: any[],
  savedStep?: number,
  forceFromSavedStep?: boolean,
  inprincipleDocuments: any[] = [],
  uploadedDocuments: Record<string, UploadedFileInfo> = {}
) => {
  const extraRequiredByStep: Record<number, string[]> = {
    0: ['company.corp.country_code', 'company.corp.mobile'],
  };

  const completed: number[] = [];
  const savedStepCount = Number.isFinite(savedStep) ? Number(savedStep) : 0;
  const normalizedSavedStep = savedStepCount > 0 ? savedStepCount - 1 : -1;
  void normalizedSavedStep;

  if (forceFromSavedStep && savedStepCount > 0) {
    const maxStep = Math.min(savedStepCount - 1, steps.length - 1);
    for (let i = 0; i <= maxStep; i += 1) {
      completed.push(i);
    }
  }

  steps.forEach((step, index) => {
    if (completed.includes(index)) {
      return;
    }
    const requiredFields = step.sections.flatMap((section: any) =>
      section.fields.filter((field: any) => field?.validation?.required)
    );
    const requiredPaths = requiredFields
      .filter((field: any) => isDependsOnVisible(field, values))
      .map((field: any) => field.name);
    const extraPaths = extraRequiredByStep[index] || [];
    const allPaths = [...requiredPaths, ...extraPaths];
    const hasRequired = allPaths.length > 0;
    const isStepComplete = hasRequired
      ? allPaths.every((path) => isFilledValue(getValueByPath(values, path)))
      : step.sections.some((section: any) =>
        section.fields.some((field: any) => {
          if (!field?.name || field.type === 'custom') return false;
          if (!isDependsOnVisible(field, values)) return false;
          return isFilledValue(getValueByPath(values, field.name));
        })
      );
    let meetsRowRequirement = true;
    if (step.title === 'Authorised Signatory & Promoter Details') {
      const entries = values?.promoter?.entries || [];
      meetsRowRequirement = Array.isArray(entries) && entries.length > 0;
    }
    if (step.title === 'Proposed Project Details') {
      const capacityItems = values?.project?.capacity_items || [];
      const productItems = values?.project?.product_items || [];
      meetsRowRequirement =
        Array.isArray(capacityItems) &&
        capacityItems.length > 0 &&
        Array.isArray(productItems) &&
        productItems.length > 0;
    }
    if (step.title === 'Supporting Documents') {
      meetsRowRequirement =
        getNonCompliantMandatoryDocumentNames(
          inprincipleDocuments,
          uploadedDocuments
        ).length === 0;
    }

    if (isStepComplete && meetsRowRequirement) {
      completed.push(index);
    }
  });

  const supportingIndex = steps.findIndex((step) => step.title === 'Supporting Documents');
  if (supportingIndex !== -1) {
    const allRequiredUploaded =
      getNonCompliantMandatoryDocumentNames(
        inprincipleDocuments,
        uploadedDocuments
      ).length === 0;
    if (!allRequiredUploaded) {
      const nextCompleted = completed.filter((idx) => idx !== supportingIndex);
      completed.length = 0;
      completed.push(...nextCompleted);
    }
  }

  const fallbackNext = completed.length ? Math.min(completed.length, steps.length - 1) : 0;
  const nextStep =
    savedStepCount > 0
      ? Math.min(savedStepCount, steps.length - 1)
      : fallbackNext;
  return { completed, nextStep };
};

export const getMissingDocumentNames = (
  types: any[] = [],
  uploadedDocuments: Record<string, UploadedFileInfo> = {}
) => {
  const missingChecklist = (types || []).flatMap((type: any) =>
    (type.checklists || [])
      .filter((item: any) => !!item.isRequired)
      .filter((item: any) => !uploadedDocuments[String(item.id)]?.filePath)
      .map((item: any) => item.name || 'Document')
  );
  const missingTypes = (types || [])
    .filter((type: any) => !!type?.isRequired)
    .filter((type: any) => {
      const ids = (type.checklists || []).map((item: any) => String(item.id));
      return !ids.some((id: string) => !!uploadedDocuments[id]?.filePath);
    })
    .map((type: any) => type.name || 'Document Type');
  return [...new Set([...missingChecklist, ...missingTypes])];
};

export const getRejectedMandatoryDocumentNames = (
  types: any[] = [],
  uploadedDocuments: Record<string, UploadedFileInfo> = {}
) => {
  const rejectedChecklist = (types || []).flatMap((type: any) =>
    (type.checklists || [])
      .filter((item: any) => !!item.isRequired)
      .filter((item: any) => {
        const uploaded = uploadedDocuments[String(item.id)];
        const status = String(uploaded?.status || '').toUpperCase();
        return !!uploaded?.filePath && status === 'R';
      })
      .map((item: any) => item.name || 'Document')
  );
  return [...new Set(rejectedChecklist)];
};

export const getNonCompliantMandatoryDocumentNames = (
  types: any[] = [],
  uploadedDocuments: Record<string, UploadedFileInfo> = {}
) => {
  const missing = getMissingDocumentNames(types, uploadedDocuments);
  const rejected = getRejectedMandatoryDocumentNames(types, uploadedDocuments);
  return [...new Set([...missing, ...rejected])];
};

export const areStepArraysEqual = (a: number[], b: number[]) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const getFieldError = (methods: any, name: string) => {
  const parts = name.split('.');
  let current = methods?.formState?.errors;
  for (const part of parts) {
    current = current?.[part];
  }
  return current?.message as string | undefined;
};

export const computeFinanceDerived = (methods: any) => {
  if (!methods) return;
  const cost = methods.getValues('finance.cost') || {};
  const sum = ['land', 'building', 'plant', 'working_capital', 'contingency', 'others']
    .map((key) => parseFloat(cost?.[key] || 0))
    .reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);
  const total = Number.isFinite(sum) ? sum.toString() : '';
  if (methods.getValues('finance.cost.total') !== total) {
    methods.setValue('finance.cost.total', total, { shouldValidate: true });
  }

  const plantValue = parseFloat(cost?.plant || 0);
  if (!Number.isFinite(plantValue)) {
    if (methods.getValues('finance.project_category') !== '') {
      methods.setValue('finance.project_category', '', { shouldValidate: true });
    }
    return;
  }
  if (Number.isFinite(plantValue)) {
    let category = 'Large';
    if (plantValue < 2) category = 'Micro';
    else if (plantValue < 10) category = 'Small';
    else if (plantValue < 50) category = 'Medium';
    if (methods.getValues('finance.project_category') !== category) {
      methods.setValue('finance.project_category', category, { shouldValidate: true });
    }
  }
};

export const computeFinanceMeansTotal = (methods: any) => {
  if (!methods) return;
  const means = methods.getValues('finance.means') || {};
  const sum = ['promoter_equity', 'institution_equity', 'foreign_equity', 'term_loans', 'others']
    .map((key) => parseFloat(means?.[key] || 0))
    .reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);
  const total = Number.isFinite(sum) ? sum.toString() : '';
  if (methods.getValues('finance.means.total') !== total) {
    methods.setValue('finance.means.total', total, { shouldValidate: true });
  }
};

export const formatTextValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  const text = String(value);
  if (text.includes('@')) return text;
  const normalized = text.replace(/_/g, ' ').trim();
  if (!normalized) return '-';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const getFileKind = (file?: UploadedFileInfo | null) => {
  if (!file) return 'unknown';
  const mime = file.mimeType?.toLowerCase() || '';
  const name = file.originalName?.toLowerCase() || '';
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('image/') || name.match(/\.(png|jpe?g)$/)) return 'image';
  return 'file';
};

export const getFileUrl = (file: UploadedFileInfo) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (file.filePath.startsWith('http://') || file.filePath.startsWith('https://')) {
    return file.filePath;
  }
  if (!baseUrl) {
    return file.filePath;
  }
  return `${baseUrl}${file.filePath.startsWith('/') ? '' : '/'}${file.filePath}`;
};

export const buildUploadFieldRenderer = (options: {
  formUploads: Record<string, any>;
  fileInputResetKey: number;
  uploadInprincipleFile: (fieldName: string, file: File, methods: any) => void;
  renderFileCell: (file: any, label: string) => any;
}) => {
  const { formUploads, fileInputResetKey, uploadInprincipleFile, renderFileCell } = options;
  return (fieldName: string, label: string, accept: string, requiredMessage?: string) =>
    (methods: any) => {
      const currentPath = methods.watch(fieldName);
      const uploaded = formUploads[fieldName];
      const resolvedPath = typeof currentPath === 'string' ? currentPath : '';
      const fileInfo =
        uploaded ||
        (resolvedPath
          ? {
              filePath: resolvedPath,
              fileName: resolvedPath.split('/').pop() || 'document',
              originalName: resolvedPath.split('/').pop() || 'document',
              mimeType: '',
              size: 0,
            }
          : null);

      return (
        <div className="mb-2.5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {requiredMessage && <span className="text-red-600 ml-1">*</span>}
          </label>
          {requiredMessage && (
            <input type="hidden" {...methods.register(fieldName, { required: requiredMessage })} />
          )}
          <input
            type="file"
            accept={accept}
            key={`${fieldName}-${fileInputResetKey}`}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                uploadInprincipleFile(fieldName, file, methods);
              }
            }}
          />
          {fileInfo && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              {renderFileCell(fileInfo, label)}
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Replace</span>
            </div>
          )}
        </div>
      );
    };
};
