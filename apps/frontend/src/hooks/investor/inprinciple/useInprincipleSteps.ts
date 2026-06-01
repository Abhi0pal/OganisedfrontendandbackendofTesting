import { buildCompanyDetailsStep } from '@/components/(investor)/inprinciple/steps/CompanyDetails';
import { buildAuthorisedSignatoryPromoterDetailsStep } from '@/components/(investor)/inprinciple/steps/AuthorisedSignatoryPromoterDetails';
import { buildProposedProjectDetailsStep } from '@/components/(investor)/inprinciple/steps/ProposedProjectDetails';
import { buildProjectFinanceStep } from '@/components/(investor)/inprinciple/steps/ProjectFinance';
import { buildProjectRequirementStep } from '@/components/(investor)/inprinciple/steps/ProjectRequirement';
import { buildSupportingDocumentsStep } from '@/components/(investor)/inprinciple/steps/SupportingDocuments';
import { buildPaymentStep } from '@/components/(investor)/inprinciple/steps/Payment';
import { buildApplicationSigningStep } from '@/components/(investor)/inprinciple/steps/ApplicationSigning';
import { buildSummaryStep } from '@/components/(investor)/inprinciple/steps/Summary';

type UseInprincipleStepsParams = {
  countries: any[];
  corpStates: any[];
  corrStates: any[];
  corpDistrictOptions: any[];
  corpTehsilOptions: any[];
  corrDistrictOptions: any[];
  corrTehsilOptions: any[];
  panPattern: RegExp;
  digitsPattern: RegExp;
  emailPattern: RegExp;
  validateOptionalDigits: (min: number, max: number, label: string) => (value: string) => true | string;
  validateOptionalEmail: (value: string) => true | string;
  setCorpCountryId: (value: string | number) => void;
  setCorpStateId: (value?: string | number) => void;
  setCorpDistrictId: (value?: string | number) => void;
  setCorrCountryId: (value: string | number) => void;
  setCorrStateId: (value?: string | number) => void;
  setCorrDistrictId: (value?: string | number) => void;
  setFormMethodsRef: (methods: any) => void;
  promoters: any[];
  setPromoters: (items: any[]) => void;
  formUploads: Record<string, any>;
  setFormUploads: (uploads: Record<string, any>) => void;
  uploadingFiles: Record<string, boolean>;
  setFileInputResetKey: (value: number | ((prev: number) => number)) => void;
  aadhaarPattern: RegExp;
  renderUploadField: (name: string, label: string, accept: string, requiredMessage: string) => (methods: any) => any;
  renderFileCell: (fileInfo: any, label: string) => any;
  renderBooleanIcon: (value: string | boolean | null | undefined) => any;
  formatTextValue: (value: string | null | undefined) => string;
  capacityItems: any[];
  setCapacityItems: (items: any[]) => void;
  productItems: any[];
  setProductItems: (items: any[]) => void;
  nicCodes: any[];
  hsnCodes: any[];
  filteredNicCodes: any[];
  filteredHsnCodes: any[];
  setFilteredNicCodes: (items: any[]) => void;
  setFilteredHsnCodes: (items: any[]) => void;
  sectorOptions: any[];
  conditionalRequired: (fieldPath: string, expectedValue: string, message: string) => (value: any) => true | string;
  getFieldError: (methods: any, name: string) => string | undefined;
  computeFinanceDerived: (methods: any) => void;
  computeFinanceMeansTotal: (methods: any) => void;
  yesNoOptions: any[];
  casteOptions: any[];
  pollutionActivityOptions: any[];
  projectDistrictOptions: any[];
  projectTehsilOptions: any[];
  projectVillages: any[];
  landRequirementOptions: any[];
  landOwnershipOptions: any[];
  landUseOptions: any[];
  developmentAuthorityOptions: any[];
  industrialAreaOptions: any[];
  siidculEstateOptions: any[];
  msmeEstateOptions: any[];
  electricitySourceOptions: any[];
  waterSourceOptions: any[];
  electricityDetails: any[];
  setElectricityDetails: (items: any[]) => void;
  waterDetails: any[];
  setWaterDetails: (items: any[]) => void;
  setProjectDistrictId: (value: string | number) => void;
  setProjectTehsilId: (value: string | number) => void;
  serviceId: string;
  deptId?: number;
  submissionId: number | null;
  paymentRows: any[];
  paymentLoading: boolean;
  isPaymentSuccess: boolean;
  canRetry: boolean;
  onPay: (amount: number) => void;
  onReceipt: (row: any) => void;
  // Existing investor flow
  isExistingMode?: boolean;
  isFormLocked?: boolean;
  existingEmployment?: number | null;
  existingFinance?: any;
  singleBusinessId?: string | null;
  isDiversification?: boolean;
  sbSelectorDisabled?: boolean;
  sbOptions?: { label: string; value: number }[];
  sbLoading?: boolean;
  sbError?: string | null;
  onSbChange?: (value: number, methods: any) => void;
  rbiReason?: string;
  nonCompliantMandatoryDocs?: string[];
};

export const useInprincipleSteps = (params: UseInprincipleStepsParams) => {
  const {
    countries,
    corpStates,
    corrStates,
    corpDistrictOptions,
    corpTehsilOptions,
    corrDistrictOptions,
    corrTehsilOptions,
    panPattern,
    digitsPattern,
    emailPattern,
    validateOptionalDigits,
    validateOptionalEmail,
    setCorpCountryId,
    setCorpStateId,
    setCorpDistrictId,
    setCorrCountryId,
    setCorrStateId,
    setCorrDistrictId,
    setFormMethodsRef,
    promoters,
    setPromoters,
    formUploads,
    setFormUploads,
    uploadingFiles,
    setFileInputResetKey,
    aadhaarPattern,
    renderUploadField,
    renderFileCell,
    renderBooleanIcon,
    formatTextValue,
    capacityItems,
    setCapacityItems,
    productItems,
    setProductItems,
    nicCodes,
    hsnCodes,
    filteredNicCodes,
    filteredHsnCodes,
    setFilteredNicCodes,
    setFilteredHsnCodes,
    sectorOptions,
    conditionalRequired,
    getFieldError,
    computeFinanceDerived,
    computeFinanceMeansTotal,
    yesNoOptions,
    casteOptions,
    pollutionActivityOptions,
    projectDistrictOptions,
    projectTehsilOptions,
    projectVillages,
    landRequirementOptions,
    landOwnershipOptions,
    landUseOptions,
    developmentAuthorityOptions,
    industrialAreaOptions,
    siidculEstateOptions,
    msmeEstateOptions,
    electricitySourceOptions,
    waterSourceOptions,
    electricityDetails,
    setElectricityDetails,
    waterDetails,
    setWaterDetails,
    setProjectDistrictId,
    setProjectTehsilId,
    serviceId,
    submissionId,
    deptId,
    paymentRows,
    paymentLoading,
    isPaymentSuccess,
    canRetry,
    onPay,
    onReceipt,
    isExistingMode,
    isFormLocked,
    existingEmployment,
    existingFinance,
    singleBusinessId,
    isDiversification,
    sbSelectorDisabled,
    sbOptions,
    sbLoading,
    sbError,
    onSbChange,
    rbiReason,
    nonCompliantMandatoryDocs,
  } = params;

  return [
    buildCompanyDetailsStep({
      countries: countries || [],
      corpStates: corpStates || [],
      corrStates: corrStates || [],
      corpDistrictOptions,
      corpTehsilOptions,
      corrDistrictOptions,
      corrTehsilOptions,
      panPattern,
      digitsPattern,
      emailPattern,
      validateOptionalDigits,
      validateOptionalEmail,
      setCorpCountryId,
      setCorpStateId,
      setCorpDistrictId,
      setCorrCountryId,
      setCorrStateId,
      setCorrDistrictId,
      setFormMethodsRef,
      isExistingMode,
      isFormLocked,
      sbSelectorDisabled,
      sbOptions,
      sbLoading,
      sbError,
      onSbChange,
    }),
    buildAuthorisedSignatoryPromoterDetailsStep({
      promoters,
      setPromoters,
      formUploads,
      setFormUploads,
      uploadingFiles,
      setFileInputResetKey,
      digitsPattern,
      emailPattern,
      aadhaarPattern,
      validateOptionalDigits,
      renderUploadField,
      renderFileCell,
      renderBooleanIcon,
      formatTextValue,
      isExistingMode,
      isFormLocked,
    }),
    buildProposedProjectDetailsStep({
      capacityItems,
      setCapacityItems,
      productItems,
      setProductItems,
      nicCodes: nicCodes || [],
      hsnCodes: hsnCodes || [],
      filteredNicCodes,
      filteredHsnCodes,
      setFilteredNicCodes,
      setFilteredHsnCodes,
      sectorOptions,
      digitsPattern,
      conditionalRequired,
      getFieldError,
      setFormMethodsRef,
      isExistingMode,
      isFormLocked,
      existingEmployment,
      isDiversification,
    }),
    buildProjectFinanceStep({
      computeFinanceDerived,
      computeFinanceMeansTotal,
      isExistingMode,
      isFormLocked,
      existingFinance,
    }),
    buildProjectRequirementStep({
      yesNoOptions,
      casteOptions,
      pollutionActivityOptions,
      projectDistrictOptions,
      projectTehsilOptions,
      projectVillages: projectVillages || [],
      landRequirementOptions,
      landOwnershipOptions,
      landUseOptions,
      developmentAuthorityOptions,
      industrialAreaOptions,
      siidculEstateOptions,
      msmeEstateOptions,
      electricitySourceOptions,
      waterSourceOptions,
      electricityDetails,
      setElectricityDetails,
      waterDetails,
      setWaterDetails,
      digitsPattern,
      conditionalRequired,
      getFieldError,
      renderUploadField,
      setProjectDistrictId,
      setProjectTehsilId,
      isExistingMode,
      isFormLocked,
    }),
    buildSupportingDocumentsStep({
      serviceId,
      submissionId,
      deptId,
    }),
    buildPaymentStep({
      setFormMethodsRef,
      submissionId,
      singleBusinessId,
      paymentRows,
      paymentLoading,
      isPaymentSuccess,
      canRetry,
      onPay,
      onReceipt,
    }),
    buildApplicationSigningStep({
      setFormMethodsRef,
      rbiReason,
    }),
    buildSummaryStep({
      setFormMethodsRef,
      rbiReason,
      nonCompliantMandatoryDocs,
    }),
  ];
};
