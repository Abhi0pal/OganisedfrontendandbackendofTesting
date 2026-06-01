'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DynamicForm, DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';
import { useMasterOptions, useNicCodes, useHsnCodes } from '@/hooks/investor/inprinciple/useMasterOptions';
import { useCommonDocuments } from '@/hooks/common/useCommonDocuments';
import { useServiceSectors } from '@/hooks/master/useServicesectors';
import { usePollutionCategories } from '@/hooks/master/usePollutionCategories';
import { useServiceDms } from '@/hooks/master/useServiceDms';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useInprincipleDocumentUploads } from '@/hooks/investor/inprinciple/useInprincipleDocumentUploads';
import { useInprinciplePayments } from '@/hooks/investor/inprinciple/useInprinciplePayments';
import {
  useApprovedSbSubmissions,
  fetchApprovedSbSubmission,
} from '@/hooks/investor/inprinciple/useApprovedSbSubmissions';
import {
  areStepArraysEqual,
  computeCompletedSteps,
  computeFinanceDerived,
  computeFinanceMeansTotal,
  decodeParam,
  encodeParam,
  buildUploadFieldRenderer,
  formatOptions,
  formatTextValue,
  getFieldError,
  getNonCompliantMandatoryDocumentNames,
  getRejectedMandatoryDocumentNames,
  getFileKind,
  getFileUrl,
  getProcessingLevel,
  mergeDeep,
} from '@/components/(investor)/inprinciple/utils/inprincipleUtils';
import { normalizeYesNo, toNumber } from '@/components/(investor)/inprinciple/utils/numberUtils';
import { normalizeDmsTypes } from '@/components/(investor)/inprinciple/utils/inprincipleDms';
import {
  electricitySourceOptions,
  landOwnershipOptions,
  landRequirementOptions,
  landUseOptions,
  waterSourceOptions,
  yesNoOptions,
} from '@/components/(investor)/inprinciple/utils/inprincipleOptions';
import { useInprincipleSteps } from '@/hooks/investor/inprinciple/useInprincipleSteps';

type UploadedFileInfo = {
  filePath: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  status?: string;
};

type ServiceChecklistItem = {
  id: number;
  name: string;
  isRequired?: string | boolean;
};


export default function InprincipleNewProjectPage() {
  const { user, loading, logout } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [promoters, setPromoters] = useState<any[]>([]);
  const [waterDetails, setWaterDetails] = useState<any[]>([]);
  const [electricityDetails, setElectricityDetails] = useState<any[]>([]);
  const [capacityItems, setCapacityItems] = useState<any[]>([]);
  const [productItems, setProductItems] = useState<any[]>([]);
  const [formUploads, setFormUploads] = useState<Record<string, UploadedFileInfo>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [fileInputResetKey, setFileInputResetKey] = useState(0);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, any> | null>(null);
  const [draftLoadedId, setDraftLoadedId] = useState<number | null>(null);
  const [selectedSbId, setSelectedSbId] = useState<number | null>(null);
  const [sbPrefillLoading, setSbPrefillLoading] = useState(false);
  const [sbPrefillError, setSbPrefillError] = useState<string | null>(null);
  const [sbPrefilledId, setSbPrefilledId] = useState<number | null>(null);
  const [existingEmployment, setExistingEmployment] = useState<number | null>(null);
  const [existingFinance, setExistingFinance] = useState<Record<string, any> | null>(null);
  const [initialStep, setInitialStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [latestRbiReason, setLatestRbiReason] = useState<string | null>(null);
  const [serviceChecklist, setServiceChecklist] = useState<ServiceChecklistItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [authModalTitle, setAuthModalTitle] = useState('Session Message');
  const [shouldLogout, setShouldLogout] = useState(false);
  const lastDraftStepRef = useRef<number | null>(null);
  const formStepsRef = useRef<any[]>([]);
  const formMethodsRef = useRef<any>(null);

  const [corpCountryId, setCorpCountryId] = useState<string | number>();
  const [corpStateId, setCorpStateId] = useState<string | number>();
  const [corpDistrictId, setCorpDistrictId] = useState<string | number>();

  const [corrCountryId, setCorrCountryId] = useState<string | number>();
  const [corrStateId, setCorrStateId] = useState<string | number>();
  const [corrDistrictId, setCorrDistrictId] = useState<string | number>();

  const [projectDistrictId, setProjectDistrictId] = useState<string | number>();
  const [projectTehsilId, setProjectTehsilId] = useState<string | number>();

  const { data: countries } = useMasterOptions('COUNTRY');
  const { data: corpStates } = useMasterOptions('STATE', corpCountryId, !!corpCountryId);
  const { data: corpDistricts } = useMasterOptions('DISTRICT', corpStateId, !!corpStateId);
  const { data: corpTehsils } = useMasterOptions('BLOCK', corpDistrictId, !!corpDistrictId);

  const { data: corrStates } = useMasterOptions('STATE', corrCountryId, !!corrCountryId);
  const { data: corrDistricts } = useMasterOptions('DISTRICT', corrStateId, !!corrStateId);
  const { data: corrTehsils } = useMasterOptions('BLOCK', corrDistrictId, !!corrDistrictId);

  const indiaCountryId = useMemo(
    () => countries?.find((item) => item.label?.toLowerCase() === 'india')?.value,
    [countries]
  );
  const { data: ukStates } = useMasterOptions('STATE', indiaCountryId, !!indiaCountryId);
  const uttarakhandStateId = useMemo(
    () => ukStates?.find((item) => item.label?.toLowerCase() === 'uttarakhand')?.value,
    [ukStates]
  );
  const { data: projectDistricts } = useMasterOptions('DISTRICT', uttarakhandStateId, !!uttarakhandStateId);
  const { data: projectTehsils } = useMasterOptions('BLOCK', projectDistrictId, !!projectDistrictId);
  const { data: projectVillages } = useMasterOptions('VILLAGE', projectTehsilId, !!projectTehsilId);

  const { data: nicCodes } = useNicCodes();
  const { data: hsnCodes } = useHsnCodes();
  const [filteredNicCodes, setFilteredNicCodes] = useState<{ value: string | number; label: string }[]>([]);
  const [filteredHsnCodes, setFilteredHsnCodes] = useState<{ value: string | number; label: string }[]>([]);
  const { data: sectorsRaw } = useServiceSectors({ isActive: true });
  const { data: pollutionCategories = [] } = usePollutionCategories({ isActive: true });

  const sectorOptions = useMemo(
    () => (sectorsRaw || []).map((item: { id: number; name: string }) => ({ value: item.id, label: item.name })),
    [sectorsRaw]
  );

  const pollutionActivityOptions = useMemo(
    () =>
      (pollutionCategories || []).map((item) => ({
        value: item.id,
        label: item.activityName,
        category: item.category,
      })),
    [pollutionCategories]
  );

  // Static option lists are kept in a shared file for reuse and easier updates.

  const developmentAuthorityOptions = [
    { label: 'Mussoorie Dehradun Development Authority (MDDA)', value: 'mdda' },
    { label: 'Haridwar Roorkee Development Authority (HRDA)', value: 'hrda' },
    { label: 'Haldwani Kathgodam Development Authority (HKDA)', value: 'hkda' },
    { label: 'Nainital Lake Development Authority (NLDA)', value: 'nlda' },
    { label: 'Rishikesh Development Authority (RDA)', value: 'rda' },
  ];

  const casteOptions = [
    { label: 'General', value: 'general' },
    { label: 'SC', value: 'sc' },
    { label: 'ST', value: 'st' },
    { label: 'OBC', value: 'obc' },
  ];

  const industrialAreaOptions: { label: string; value: string }[] = [];
  const siidculEstateOptions: { label: string; value: string }[] = [];
  const msmeEstateOptions: { label: string; value: string }[] = [];

  const corpDistrictOptions = useMemo(() => formatOptions(corpDistricts as any), [corpDistricts]);
  const corpTehsilOptions = useMemo(() => formatOptions(corpTehsils as any), [corpTehsils]);
  const corrDistrictOptions = useMemo(() => formatOptions(corrDistricts as any), [corrDistricts]);
  const corrTehsilOptions = useMemo(() => formatOptions(corrTehsils as any), [corrTehsils]);
  const projectDistrictOptions = useMemo(
    () => formatOptions(projectDistricts as any),
    [projectDistricts]
  );
  const projectTehsilOptions = useMemo(() => formatOptions(projectTehsils as any), [projectTehsils]);

  useEffect(() => {
    setFilteredNicCodes([...(nicCodes || [])] as { value: string | number; label: string }[]);
  }, [nicCodes]);

  useEffect(() => {
    setFilteredHsnCodes([...(hsnCodes || [])] as { value: string | number; label: string }[]);
  }, [hsnCodes]);

  const proposalParam = (searchParams?.get('proposal') || '').toLowerCase();
  const serviceId = searchParams?.get('serviceId') || '943.0';
  const departmentId = searchParams?.get('departmentId') || '';
  const submissionIdParam = searchParams?.get('submissionId');
  const modeParam = searchParams?.get('mode');

  const proposalTypeByServiceId: Record<string, string> = {
    '943.0': 'new',
  };

  useEffect(() => {
    const decodedSubmissionId = decodeParam(submissionIdParam);
    const parsedId = Number(decodedSubmissionId);
    if (Number.isFinite(parsedId) && parsedId > 0) {
      setSubmissionId(parsedId);
    }
  }, [submissionIdParam]);

  useEffect(() => {
    decodeParam(modeParam);
  }, [modeParam]);

  useEffect(() => {
    lastDraftStepRef.current = null;
  }, [submissionId]);

  useEffect(() => {
    const loadServiceChecklist = async () => {
      if (!serviceId) {
        setServiceChecklist([]);
        return;
      }
      try {
        const res = await apiClient.get('/investor/inprinciple/documents', {
          params: { serviceId },
        });
        setServiceChecklist(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to fetch service checklist', error);
        setServiceChecklist([]);
      }
    };
    loadServiceChecklist();
  }, [serviceId]);

  useEffect(() => {
    const loadLatestRbiReason = async () => {
      if (!submissionId) {
        setLatestRbiReason(null);
        return;
      }
      try {
        const res = await apiClient.get('/investor/inprinciple/history', {
          params: { submissionId },
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        const rbiRow = rows.find(
          (row: any) =>
            String(row?.status || '').toUpperCase() === 'RBI' &&
            String(row?.comments || '').trim() &&
            String(row?.comments || '').trim().toLowerCase() !== 'total'
        );
        setLatestRbiReason(rbiRow?.comments ? String(rbiRow.comments) : null);
      } catch (error) {
        console.error('Failed to fetch RBI reason', error);
        setLatestRbiReason(null);
      }
    };
    loadLatestRbiReason();
  }, [submissionId]);

  const proposalType = useMemo(() => {
    if (proposalParam) {
      switch (proposalParam) {
        case 'extension':
        case 'modernisation':
        case 'diversification':
        case 'amendment':
        case 'expansion':
          return proposalParam;
        default:
          break;
      }
    }
    const draftProposal = String(draftValues?.company?.proposal_type || '').toLowerCase();
    if (draftProposal) {
      return draftProposal;
    }
    if (serviceId && proposalTypeByServiceId[serviceId]) {
      return proposalTypeByServiceId[serviceId];
    }
    return 'new';
  }, [proposalParam, serviceId, draftValues]);
  const isExistingMode = useMemo(
    () => ['expansion', 'modernisation', 'diversification'].includes(String(proposalType || '').toLowerCase()),
    [proposalType]
  );
  const isDiversification = useMemo(
    () => String(proposalType || '').toLowerCase() === 'diversification',
    [proposalType]
  );
  const companyName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';

  const { dms } = useCommonDocuments(serviceId);
  const { data: serviceDms } = useServiceDms(serviceId);
  const {
    items: approvedSbItems,
    loading: approvedSbLoading,
    error: approvedSbError,
  } = useApprovedSbSubmissions(isExistingMode ? serviceId : undefined);
  const inprincipleDocuments = useMemo(() => normalizeDmsTypes(dms), [dms]);
  const complianceDocuments = useMemo(() => {
    if (serviceChecklist.length > 0) {
      return [
        {
          id: 'service-checklist',
          name: 'Service Checklist',
          checklists: serviceChecklist.map((item) => ({
            id: Number(item.id),
            name: item.name || `Document ${item.id}`,
            isRequired:
              String(item?.isRequired || '').toUpperCase() === 'Y' ||
              item?.isRequired === true,
          })),
        },
      ];
    }
    return inprincipleDocuments;
  }, [serviceChecklist, inprincipleDocuments]);
  const {
    uploadedDocuments,
    documentsAppStatus,
    fetchUploads,
  } = useInprincipleDocumentUploads(submissionId, serviceId);
  const nonCompliantMandatoryDocs = useMemo(
    () =>
      getNonCompliantMandatoryDocumentNames(
        complianceDocuments,
        uploadedDocuments
      ),
    [complianceDocuments, uploadedDocuments]
  );
  const {
    paymentRows,
    loading: paymentLoading,
    fetchPayments,
    hasSuccessfulPayment,
    canRetry: canRetryPayment,
    createPayment,
    updatePayment,
  } = useInprinciplePayments(submissionId, isExistingMode ? selectedSbId : submissionId);

  const allowedDocumentStatuses = useMemo(() => ['I', 'RBI', 'H', 'DP', 'PD'], []);
  const canUploadDocuments = useMemo(
    () => !documentsAppStatus || allowedDocumentStatuses.includes(documentsAppStatus),
    [documentsAppStatus, allowedDocumentStatuses]
  );
  const approvedSbOptions = useMemo(
    () =>
      (approvedSbItems || []).map((item) => ({
        value: Number(item.submissionId),
        label: `${item.ubuId || 'SB'} (CAF ID: ${item.submissionId})`,
      })),
    [approvedSbItems]
  );
  const selectedSbInfo = useMemo(
    () => (approvedSbItems || []).find((item) => Number(item.submissionId) === Number(selectedSbId)),
    [approvedSbItems, selectedSbId]
  );
  const isFormLocked = useMemo(() => {
    if (!isExistingMode) return false;
    if (!selectedSbId) return true;
    if (sbPrefillLoading) return true;
    return Number(sbPrefilledId || 0) !== Number(selectedSbId || 0);
  }, [isExistingMode, selectedSbId, sbPrefillLoading, sbPrefilledId]);
  const serviceTitle = useMemo(() => {
    const baseName = serviceDms?.serviceName || 'In-Principle Application';
    const typeLabel =
      proposalType === 'expansion'
        ? 'Expansion'
        : proposalType === 'modernisation'
          ? 'Modernisation'
          : proposalType === 'diversification'
            ? 'Diversification'
            : '';
    return typeLabel ? `${baseName} ${typeLabel}` : baseName;
  }, [serviceDms, proposalType]);

  const handlePayGovPayment = async (amount: number) => {
    if (!submissionId) {
      alert('Submission ID not found.');
      return;
    }
    try {
      const payment = await createPayment(amount);
      const paymentId = Number(payment?.paymentId || 0);
      if (!paymentId) {
        alert('Unable to create payment.');
        return;
      }
      const success = window.confirm('Simulate payment success?');
      await updatePayment(paymentId, success ? 'S' : 'F');
      alert(success ? 'Payment successful.' : 'Payment failed.');
      await fetchPayments();
    } catch (error) {
      console.error(error);
      alert('Payment failed.');
    }
  };

  const handleReceipt = (row: any) => {
    const params = new URLSearchParams();
    params.set('paymentId', String(row?.paymentId || ''));
    params.set('ref', String(row?.pgMeTrnRefNo || ''));
    params.set('amount', String(row?.amount || ''));
    params.set('date', String(row?.created || ''));
    params.set('status', String(row?.statusCode || ''));
    params.set('mode', String(row?.paymentMode || 'PayGov'));
    params.set('submissionId', String(submissionId || ''));
    params.set('applicant', String(companyName || user?.email || ''));
    window.open(`/investor/inprinciple/receipt?${params.toString()}`, '_blank');
  };

  const defaultValues = useMemo(
    () => ({
      company: {
        proposal_type: proposalType,
        name: companyName,
        corr_same_as_corp: true,
      },
    }),
    [proposalType, companyName]
  );

  const formDefaults = useMemo(
    () => mergeDeep(defaultValues, draftValues || {}),
    [defaultValues, draftValues]
  );

  const autoSelectRef = useRef({ corp: false, corr: false });
  const draftAddressRef = useRef<{ corp?: any; corr?: any }>({});

  // Shared loader to apply submission data into form state + local arrays.
  const applyLoadedFormData = useCallback(
    (formData: Record<string, any>) => {
      if (!formData) return;
      const corp = formData?.company?.corp || {};
      const corr = formData?.company?.corr || {};
      const land = formData?.requirement?.land || {};
      const draftPromoters =
        formData?.promoter?.entries ||
        formData?.promoter_entries ||
        formData?.promoters ||
        formData?.promoterDetails ||
        [];
      const draftWaterDetails = formData?.requirement?.water?.details || [];
      const draftPowerDetails = formData?.requirement?.power?.details || [];
      const draftCapacityItems = formData?.project?.capacity_items || [];
      const draftProductItems = formData?.project?.product_items || [];

      if (corp.country) setCorpCountryId(corp.country);
      if (corp.state) setCorpStateId(corp.state);
      if (corp.district) setCorpDistrictId(corp.district);

      if (corr.country) setCorrCountryId(corr.country);
      if (corr.state) setCorrStateId(corr.state);
      if (corr.district) setCorrDistrictId(corr.district);

      if (land.district) setProjectDistrictId(land.district);
      if (land.block) setProjectTehsilId(land.block);

      if (Array.isArray(draftPromoters)) {
        setPromoters(draftPromoters);
        formMethodsRef.current?.setValue?.('promoter.entries', draftPromoters);
      }
      if (Array.isArray(draftWaterDetails)) {
        setWaterDetails(draftWaterDetails);
        formMethodsRef.current?.setValue?.('requirement.water.details', draftWaterDetails);
      }
      if (Array.isArray(draftPowerDetails)) {
        setElectricityDetails(draftPowerDetails);
        formMethodsRef.current?.setValue?.('requirement.power.details', draftPowerDetails);
      }
      const normalizedGstAvailable = normalizeYesNo(formData?.company?.gst_available);
      const normalizedStartup = normalizeYesNo(formData?.company?.is_startup);

      if (normalizedGstAvailable === 'yes' || normalizedGstAvailable === 'no') {
        formMethodsRef.current?.setValue?.('company.gst_available', normalizedGstAvailable, {
          shouldValidate: false,
        });
        formMethodsRef.current?.clearErrors?.('company.gst_available');
      }

      if (normalizedStartup === 'yes' || normalizedStartup === 'no') {
        formMethodsRef.current?.setValue?.('company.is_startup', normalizedStartup, {
          shouldValidate: false,
        });
      }
      formMethodsRef.current?.clearErrors?.(['company.gst_available', 'company.is_startup']);

      if (Array.isArray(draftCapacityItems)) {
        setCapacityItems(draftCapacityItems);
        formMethodsRef.current?.setValue?.('project.capacity_items', draftCapacityItems);
      }
      if (Array.isArray(draftProductItems)) {
        setProductItems(draftProductItems);
        formMethodsRef.current?.setValue?.('project.product_items', draftProductItems);
      }
    },
    [
      setCorpCountryId,
      setCorpStateId,
      setCorpDistrictId,
      setCorrCountryId,
      setCorrStateId,
      setCorrDistrictId,
      setProjectDistrictId,
      setProjectTehsilId,
      setPromoters,
      setWaterDetails,
      setElectricityDetails,
      setCapacityItems,
      setProductItems,
    ]
  );

  useEffect(() => {
    if (!draftValues || !formMethodsRef.current) return;
    const methods = formMethodsRef.current;
    const corp = draftValues?.company?.corp || {};
    const corr = draftValues?.company?.corr || {};
    draftAddressRef.current = { corp, corr };
    autoSelectRef.current = { corp: false, corr: false };

    if (corp.country) {
      methods.setValue('company.corp.country', corp.country);
    }

    if (corr.country) {
      methods.setValue('company.corr.country', corr.country);
    }
  }, [draftValues, corpStates, corpDistricts, corpTehsils, corrStates, corrDistricts, corrTehsils]);

  useEffect(() => {
    const methods = formMethodsRef.current;
    if (!methods) return;
    const corp = draftAddressRef.current.corp || {};
    if (!autoSelectRef.current.corp && corp.country && corpStates) {
      if (corp.state) methods.setValue('company.corp.state', corp.state);
      if (corp.district) methods.setValue('company.corp.district', corp.district);
      if (corp.block) methods.setValue('company.corp.block', corp.block);
      autoSelectRef.current.corp = true;
    }
  }, [corpStates, corpDistricts, corpTehsils]);

  useEffect(() => {
    const methods = formMethodsRef.current;
    if (!methods) return;
    const corr = draftAddressRef.current.corr || {};
    if (!autoSelectRef.current.corr && corr.country && corrStates) {
      if (corr.state) methods.setValue('company.corr.state', corr.state);
      if (corr.district) methods.setValue('company.corr.district', corr.district);
      if (corr.block) methods.setValue('company.corr.block', corr.block);
      autoSelectRef.current.corr = true;
    }
  }, [corrStates, corrDistricts, corrTehsils]);

  useEffect(() => {
    const decodedSubmissionId = decodeParam(submissionIdParam);
    const parsedId = Number(decodedSubmissionId);
    const mode = decodeParam(modeParam);
    if (!parsedId || mode !== 'edit' || draftLoadedId === parsedId) return;

    const loadDraft = async () => {
      setDraftLoading(true);
      try {
        const res = await apiClient.get('/investor/inprinciple/draft', {
          params: { submissionId: parsedId },
        });
        const formData = res?.data?.formData || {};
        setDraftValues(formData);
        setDraftLoadedId(parsedId);
        const savedStep = Number(formData?.__currentStep ?? -1);

        const documents = formData?.documents || {};
        const loadedUploads: Record<string, UploadedFileInfo> = {};
        Object.entries(documents).forEach(([docKey, filePath]) => {
          if (!filePath || typeof filePath !== 'string') return;
          const fileName = filePath.split('/').pop() || 'document';
          loadedUploads[docKey] = {
            filePath,
            fileName,
            originalName: fileName,
            mimeType: '',
            size: 0,
          };
        });
        if (Object.keys(loadedUploads).length) {
          setFormUploads(loadedUploads);
        }

        applyLoadedFormData(formData);
      } catch (error) {
        console.error('Failed to load draft application', error);
        setAuthModalTitle('Load Draft Failed');
        setAuthModalMessage('Unable to load draft data. Please try again.');
        setShowAuthModal(true);
        setShouldLogout(false);
      } finally {
        setDraftLoading(false);
      }
    };

    loadDraft();
  }, [submissionIdParam, modeParam, draftLoadedId, applyLoadedFormData]);

  const handleSbSelection = useCallback(
    async (value: number) => {
      const nextId = Number(value || 0) || null;
      setSelectedSbId(nextId);
      setSbPrefilledId(null);
      setSbPrefillError(null);
      setExistingEmployment(null);
      setSubmissionId(null);
      setDraftLoadedId(null);
      setFormUploads({});
      if (!nextId) {
        setPromoters([]);
        setCapacityItems([]);
        setProductItems([]);
        setWaterDetails([]);
        setElectricityDetails([]);
        setDraftValues(null);
        return;
      }
      setSbPrefillLoading(true);
      try {
        const res = await fetchApprovedSbSubmission(nextId);
        const formData = res?.fieldValue || {};
        const merged = mergeDeep({}, formData || {});
        if (merged.__currentStep !== undefined) {
          merged.__currentStep = 0;
        }

        // Ensure proposal type + SB link are aligned with the selected action.
        merged.company = {
          ...(merged.company || {}),
          proposal_type: proposalType,
          sb_submission_id: nextId,
          gst_available: normalizeYesNo(merged.company?.gst_available),
          is_startup: normalizeYesNo(merged.company?.is_startup),
        };

        const existingEmploymentValue = Number(merged?.project?.total_direct_employment || 0);
        const normalizedExistingEmployment = Number.isFinite(existingEmploymentValue)
          ? existingEmploymentValue
          : 0;

        merged.project = {
          ...(merged.project || {}),
          existing_direct_employment: normalizedExistingEmployment,
        };

        const nextCapacityItems = Array.isArray(merged?.project?.capacity_items)
          ? merged.project.capacity_items
          : [];
        const normalizedCapacity = nextCapacityItems.map((item: any) => ({
          ...item,
          is_new: item?.is_new ?? false,
          existing_proposed_capacity:
            item?.existing_proposed_capacity ?? item?.proposed_capacity ?? '',
        }));

        const nextProductItems = Array.isArray(merged?.project?.product_items)
          ? merged.project.product_items
          : [];
        const normalizedProduct = nextProductItems.map((item: any) => ({
          ...item,
          is_new: item?.is_new ?? false,
          existing_annual_capacity: item?.existing_annual_capacity ?? item?.annual_capacity ?? '',
        }));

        merged.project.capacity_items = normalizedCapacity;
        merged.project.product_items = normalizedProduct;

        if (!merged.finance_existing) {
          merged.finance_existing = JSON.parse(JSON.stringify(merged.finance || {}));
        }
        setExistingFinance(merged.finance_existing || merged.finance || null);

        setExistingEmployment(normalizedExistingEmployment);
        setDraftValues(merged);
        applyLoadedFormData(merged);
        setSbPrefilledId(nextId);
      } catch (error: any) {
        setSbPrefillError(error?.response?.data?.message || 'Unable to load SB application.');
        setDraftValues(null);
      } finally {
        setSbPrefillLoading(false);
      }
    },
    [proposalType, applyLoadedFormData]
  );

  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
  const digitsPattern = /^\d+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const aadhaarPattern = /^\d{12}$/;

  const validateOptionalDigits = (min: number, max: number, label: string) => (value: string) => {
    if (!value) return true;
    if (!digitsPattern.test(value)) return `${label} should contain digits only`;
    if (value.length < min) return `${label} must be at least ${min} digits`;
    if (value.length > max) return `${label} must be at most ${max} digits`;
    return true;
  };

  const validateOptionalEmail = (value: string) => {
    if (!value) return true;
    return emailPattern.test(value) || 'Please enter a valid email';
  };

  const updateCompletionState = useCallback(
    (completed: number[], nextStep: number, updateInitial = true) => {
      setCompletedSteps((prev) => (areStepArraysEqual(prev, completed) ? prev : completed));
      if (updateInitial) {
        setInitialStep((prev) => (prev === nextStep ? prev : nextStep));
      }
    },
    []
  );

  const markCompletedThroughStep = (stepIndex: number) => {
    setCompletedSteps((prev) => {
      const prevMax = prev.length ? Math.max(...prev) : -1;
      const maxStep = Math.max(prevMax, stepIndex, 0);
      const completed = Array.from({ length: maxStep + 1 }, (_, i) => i);
      return areStepArraysEqual(prev, completed) ? prev : completed;
    });
  };

  const getMergedDraftData = (data: any, stepIndex: number) => {
    const merged = mergeDeep(draftValues || {}, data || {});
    const prevStepCount = Number(merged?.__currentStep ?? 0);
    const latestStepCount = Math.max(prevStepCount, stepIndex + 1, 0);

    const safePromoters =
      (Array.isArray(merged?.promoter?.entries) && merged.promoter.entries) ||
      (Array.isArray(data?.promoter?.entries) && data.promoter.entries) ||
      promoters;
    const safeWaterDetails =
      (Array.isArray(merged?.requirement?.water?.details) && merged.requirement.water.details) ||
      (Array.isArray(data?.requirement?.water?.details) && data.requirement.water.details) ||
      waterDetails;
    const safePowerDetails =
      (Array.isArray(merged?.requirement?.power?.details) && merged.requirement.power.details) ||
      (Array.isArray(data?.requirement?.power?.details) && data.requirement.power.details) ||
      electricityDetails;
    const safeCapacityItems =
      (Array.isArray(merged?.project?.capacity_items) && merged.project.capacity_items) ||
      (Array.isArray(data?.project?.capacity_items) && data.project.capacity_items) ||
      capacityItems;
    const safeProductItems =
      (Array.isArray(merged?.project?.product_items) && merged.project.product_items) ||
      (Array.isArray(data?.project?.product_items) && data.project.product_items) ||
      productItems;

    const nextMerged = {
      ...merged,
      promoter: {
        ...(merged?.promoter || {}),
        entries: safePromoters || [],
      },
      requirement: {
        ...(merged?.requirement || {}),
        water: {
          ...(merged?.requirement?.water || {}),
          details: safeWaterDetails || [],
        },
        power: {
          ...(merged?.requirement?.power || {}),
          details: safePowerDetails || [],
        },
      },
      project: {
        ...(merged?.project || {}),
        capacity_items: safeCapacityItems || [],
        product_items: safeProductItems || [],
      },
      __currentStep: latestStepCount,
    };

    const hasValues = (value: any) => {
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'object') return Object.values(value).some(hasValues);
      return true;
    };

    const shouldKeepProject = hasValues(draftValues?.project);
    if (!shouldKeepProject && stepIndex < 2 && !hasValues(nextMerged.project)) {
      delete (nextMerged as any).project;
    }

    const shouldKeepPromoter = hasValues(draftValues?.promoter);
    if (!shouldKeepPromoter && stepIndex < 1 && !hasValues(nextMerged.promoter)) {
      delete (nextMerged as any).promoter;
    }

    const shouldKeepAuthorized = hasValues(draftValues?.authorized);
    if (!shouldKeepAuthorized && stepIndex < 1 && !hasValues(nextMerged.authorized)) {
      delete (nextMerged as any).authorized;
    }

    const shouldKeepRequirement = hasValues(draftValues?.requirement);
    if (!shouldKeepRequirement && stepIndex < 4 && !hasValues(nextMerged.requirement)) {
      delete (nextMerged as any).requirement;
    }

    const shouldKeepFinance = hasValues(draftValues?.finance);
    if (!shouldKeepFinance && stepIndex < 3 && !hasValues(nextMerged.finance)) {
      delete (nextMerged as any).finance;
    }

    const shouldKeepDocuments = hasValues(draftValues?.documents);
    if (!shouldKeepDocuments && stepIndex < 5 && !hasValues(nextMerged.documents)) {
      delete (nextMerged as any).documents;
    }

    const shouldKeepPayment = hasValues(draftValues?.payment);
    if (!shouldKeepPayment && stepIndex < 6 && !hasValues(nextMerged.payment)) {
      delete (nextMerged as any).payment;
    }

    const shouldKeepSigning = hasValues(draftValues?.signing);
    if (!shouldKeepSigning && stepIndex < 7 && !hasValues(nextMerged.signing)) {
      delete (nextMerged as any).signing;
    }

    const shouldKeepSummary = hasValues(draftValues?.summary);
    if (!shouldKeepSummary && stepIndex < 8 && !hasValues(nextMerged.summary)) {
      delete (nextMerged as any).summary;
    }

    return nextMerged;
  };

  const saveDraft = async (data: any, stepIndex: number) => {
    if (loading || !user?.id) {
      console.warn('Draft save skipped: user not authenticated yet.');
      setAuthModalTitle('Session Expired');
      setAuthModalMessage('Session expired. Please login again.');
      setShowAuthModal(true);
      setShouldLogout(true);
      return false;
    }
    if (savingDraft) return false;
    if (lastDraftStepRef.current === stepIndex) return true;

    const mergedData = getMergedDraftData(data, stepIndex);
    const districtId = Number(
      mergedData?.requirement?.land?.district || mergedData?.company?.corp?.district || 0
    );
    const unitName = mergedData?.company?.name || '';
    const processingLevel = getProcessingLevel(mergedData);

    setSavingDraft(true);
    try {
      const payload = {
        submissionId,
        serviceId,
        departmentId: departmentId ? Number(departmentId) : undefined,
        formTypeId: 1,
        processingLevel,
        formData: mergedData,
        unitName,
        districtId,
        cafType: proposalType,
        parentSubId: isExistingMode ? Number(selectedSbId || 0) : undefined,
        cafId: isExistingMode ? Number(selectedSbId || 0) : undefined,
        currentStep: stepIndex,
      };
      if (submissionId) {
        delete (payload as any).parentSubId;
        delete (payload as any).cafId;
      }

      const response = submissionId
        ? await apiClient.post('/investor/inprinciple/update', payload)
        : await apiClient.post('/investor/inprinciple/submit', payload);

      const nextSubmissionId =
        response?.data?.submissionId ||
        response?.data?.submission_id ||
        response?.data?.id ||
        submissionId;

      if (!submissionId && nextSubmissionId) {
        setSubmissionId(Number(nextSubmissionId));
      } else if (!submissionId && !nextSubmissionId) {
        setAuthModalMessage('Draft save failed. Please try again.');
        setShowAuthModal(true);
        setShouldLogout(false);
        return false;
      }
      if (!submissionId && nextSubmissionId) {
        const encodedSubmission = encodeParam(nextSubmissionId);
        const encodedMode = encodeParam('edit');
        const encodedService = encodeParam(serviceId);
        const encodedDept = departmentId ? encodeParam(departmentId) : '';
        const params = new URLSearchParams();
        params.set('submissionId', encodedSubmission);
        params.set('mode', encodedMode);
        if (encodedService) params.set('serviceId', encodedService);
        if (encodedDept) params.set('departmentId', encodedDept);
        router.replace(`/investor/inprinciple/new?${params.toString()}`);
      }
      setDraftValues(mergedData);
      lastDraftStepRef.current = stepIndex;
      return true;
    } catch (error: any) {
      const errorData = error?.response?.data;
      const extractMessage = () => {
        if (!errorData) return 'Draft save failed. Please try again.';
        if (typeof errorData === 'string') return errorData;
        if (Array.isArray(errorData?.message)) return errorData.message.join(', ');
        if (errorData?.message) return String(errorData.message);
        if (errorData?.detail) return String(errorData.detail);
        if (errorData?.error) return String(errorData.error);
        return 'Draft save failed. Please try again.';
      };

      if (error?.response?.status === 401) {
        console.error('Draft save failed: unauthorized.', error?.response?.data);
        setAuthModalTitle('Unauthorized');
        setAuthModalMessage(extractMessage());
        setShowAuthModal(true);
        setShouldLogout(false);
        return false;
      }
      console.error('Draft save failed', error);
      setAuthModalTitle('Draft Save Failed');
      setAuthModalMessage(extractMessage());
      setShowAuthModal(true);
      setShouldLogout(false);
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  const renderBooleanIcon = (value: unknown) => {
    const isTrue = value === true || value === 'yes' || value === 'true';
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}
      >
        <i className={`pi ${isTrue ? 'pi-check' : 'pi-times'}`} />
      </span>
    );
  };

  const uploadInprincipleFile = async (fieldName: string, file: File, methods: any) => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5 MB.');
      return;
    }
    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await apiClient.post('/investor/inprinciple/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded: UploadedFileInfo = {
        filePath: res.data.filePath,
        fileName: res.data.fileName || file.name,
        originalName: res.data.originalName || file.name,
        mimeType: res.data.mimeType || file.type,
        size: res.data.size || file.size,
      };

      setFormUploads((prev) => ({ ...prev, [fieldName]: uploaded }));
      methods.setValue(fieldName, uploaded.filePath);
    } catch (error) {
      console.error(error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const renderFileCell = (file: UploadedFileInfo | null | undefined, label: string) => {
    if (!file) return <span className="text-gray-400">-</span>;
    const kind = getFileKind(file);
    const iconClass =
      kind === 'pdf' ? 'pi pi-file-pdf text-red-600' : 'pi pi-image text-blue-600';
    return (
      <a
        href={getFileUrl(file)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <i className={iconClass} />
        <span className="text-xs">Open</span>
      </a>
    );
  };

  const renderUploadField = buildUploadFieldRenderer({
    formUploads,
    fileInputResetKey,
    uploadInprincipleFile,
    renderFileCell,
  });

  const conditionalRequired =
    (fieldPath: string, expectedValue: string, message: string) => (value: any) => {
      const methods = formMethodsRef.current;
      if (!methods?.getValues) return true;
      const current = methods.getValues(fieldPath);
      if (current === expectedValue) {
        if (value === null || value === undefined || String(value).trim() === '') {
          return message;
        }
      }
      return true;
    };

  const formSteps = useInprincipleSteps({
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
    setFormMethodsRef: (methods) => {
      formMethodsRef.current = methods;
    },
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
    nicCodes: nicCodes || [],
    hsnCodes: hsnCodes || [],
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
    setProjectDistrictId,
    setProjectTehsilId,
    serviceId,
    submissionId,
    deptId: departmentId ? Number(departmentId) : 0,
    paymentRows,
    paymentLoading,
    isPaymentSuccess: hasSuccessfulPayment,
    canRetry: canRetryPayment,
    onPay: handlePayGovPayment,
    onReceipt: handleReceipt,
    isExistingMode,
    isFormLocked,
    existingEmployment,
    existingFinance,
    isDiversification,
    singleBusinessId: selectedSbInfo?.ubuId || null,
    sbSelectorDisabled: sbPrefillLoading || approvedSbLoading,
    sbOptions: approvedSbOptions,
    sbLoading: approvedSbLoading,
    sbError: sbPrefillError || approvedSbError,
    onSbChange: (value) => handleSbSelection(value),
    rbiReason: latestRbiReason || undefined,
    nonCompliantMandatoryDocs,
  });

  const formConfig: DynamicFormConfig = {
    id: 'inprinciple-application',
    showStepIndicator: true,
    allowStepNavigation: true,
    validateOnStepChange: true,
    submitButtonText: 'Submit Application',
    steps: formSteps,
    onSubmit: async (data) => {
      if (isExistingMode) {
        if (!selectedSbId) {
          alert('Please select an approved SB ID before submitting.');
          return;
        }
        if (isFormLocked) {
          alert('Please wait for SB data to load.');
          return;
        }
      }
      const districtId = Number(data?.requirement?.land?.district || 0);
      if (!districtId) {
        alert('Please select District in Project Requirement > Land Details before submitting.');
        return;
      }
      if (!Array.isArray(data?.promoter?.entries) || data.promoter.entries.length === 0) {
        alert('Please add at least one promoter before submitting.');
        return;
      }
      if (!Array.isArray(data?.project?.capacity_items) || data.project.capacity_items.length === 0) {
        alert('Please add at least one Proposed Capacity entry before submitting.');
        return;
      }
      if (!Array.isArray(data?.project?.product_items) || data.project.product_items.length === 0) {
        alert('Please add at least one Product Details entry before submitting.');
        return;
      }
      if (isExistingMode) {
        const capacityItemsToCheck = data?.project?.capacity_items || [];
        const productItemsToCheck = data?.project?.product_items || [];

        const hasCapacityUpdate = capacityItemsToCheck.some((item: any) => {
          if (item?.is_new) return true;
          const existing = toNumber(item?.existing_proposed_capacity ?? item?.proposed_capacity);
          const current = toNumber(item?.proposed_capacity);
          return current > existing;
        });
        const hasProductUpdate = productItemsToCheck.some((item: any) => {
          if (item?.is_new) return true;
          const existing = toNumber(item?.existing_annual_capacity ?? item?.annual_capacity);
          const current = toNumber(item?.annual_capacity);
          return current > existing;
        });
        if (!hasCapacityUpdate) {
          alert('Please update at least one Proposed Capacity row with a higher value.');
          return;
        }
        if (!hasProductUpdate) {
          alert('Please update at least one Product Details row with a higher value.');
          return;
        }

        const hasInvalidCapacity = capacityItemsToCheck.some((item: any) => {
          if (item?.is_new) return false;
          const existing = toNumber(item?.existing_proposed_capacity ?? item?.proposed_capacity);
          const current = toNumber(item?.proposed_capacity);
          return current < existing;
        });
        if (hasInvalidCapacity) {
          alert('Proposed Annual Capacity cannot be less than existing capacity for any activity.');
          return;
        }

        const hasInvalidProduct = productItemsToCheck.some((item: any) => {
          if (item?.is_new) return false;
          const existing = toNumber(item?.existing_annual_capacity ?? item?.annual_capacity);
          const current = toNumber(item?.annual_capacity);
          return current < existing;
        });
        if (hasInvalidProduct) {
          alert('Annual Capacity cannot be less than existing capacity for any product.');
          return;
        }

        const currentEmployment = toNumber(data?.project?.total_direct_employment);
        const existingEmp = toNumber(existingEmployment);
        if (currentEmployment < existingEmp) {
          alert('Total Direct Employment cannot be less than existing employment.');
          return;
        }
      }
      if (data?.requirement?.power?.required === 'yes') {
        const powerDetails = data?.requirement?.power?.details || [];
        if (!Array.isArray(powerDetails) || powerDetails.length === 0) {
          alert('Please add at least one Electricity entry before submitting.');
          return;
        }
      }
      if (data?.requirement?.water?.required === 'yes') {
        const waterDetailsList = data?.requirement?.water?.details || [];
        if (!Array.isArray(waterDetailsList) || waterDetailsList.length === 0) {
          alert('Please add at least one Water entry before submitting.');
          return;
        }
      }
      if (!submissionId) {
        alert('Please save the application once before final submission.');
        return;
      }
      const nonCompliantDocList = getNonCompliantMandatoryDocumentNames(
        complianceDocuments,
        uploadedDocuments
      );
      if (nonCompliantDocList.length > 0) {
        const rejectedMandatory = getRejectedMandatoryDocumentNames(
          complianceDocuments,
          uploadedDocuments
        );
        if (rejectedMandatory.length > 0) {
          alert(
            `Please upload a new version for rejected mandatory documents before final submission.\nRejected documents: ${rejectedMandatory.join(
              ', '
            )}`
          );
          return;
        }
        alert(
          `Please upload all mandatory documents before final submission.\nMissing documents: ${nonCompliantDocList.join(
            ', '
          )}`
        );
        return;
      }

      try {
        await apiClient.post('/investor/inprinciple/update', {
          submissionId,
          serviceId,
          departmentId: departmentId ? Number(departmentId) : undefined,
          formData: { ...data, __currentStep: formConfig.steps.length },
          unitName: data?.company?.name || '',
          districtId,
          cafType: proposalType,
          currentStep: formConfig.steps.length,
          isFinalSubmit: true,
        });

        alert('Application submitted successfully!');
        router.push('/investor/dashboard');
      } catch (error: any) {
        const status = Number(error?.response?.status || 0);
        if (status !== 400) {
          console.error(error);
        }
        const code = String(error?.response?.data?.error || '').toUpperCase();
        const message = String(error?.response?.data?.message || '');
        const isWorkflowInstanceMissing =
          status === 404 &&
          (code === 'NOT_FOUND' ||
            message.toLowerCase().includes('workflow instance not found'));

        if (isWorkflowInstanceMissing) {
          alert(
            'Your submission could not be completed. Please try submitting again. If the issue continues, contact support/admin.',
          );
          return;
        }

        alert(
          error?.response?.data?.message ||
            'Application submission failed. Please try again.',
        );
      }
    },
    onStepChange: async (step, data, meta) => {
      const fromStep = Number.isFinite(meta?.fromStep)
        ? Number(meta?.fromStep)
        : Math.max(step - 1, 0);
      if (Number.isFinite(meta?.toStep) && Number(meta?.toStep) < fromStep) {
        return true;
      }
      if (isExistingMode) {
        if (!selectedSbId) {
          alert('Please select an approved SB ID before proceeding.');
          return false;
        }
        if (isFormLocked) {
          alert('Please wait for SB data to load.');
          return false;
        }
      }
      const draftStep = Math.max(fromStep, 0);
      const steps = formConfig.steps;
      const currentStep = draftStep;
      const currentTitle = steps[currentStep]?.title || '';
      const toStep = Number.isFinite(meta?.toStep) ? Number(meta?.toStep) : step;
      if (isExistingMode && currentTitle === 'Proposed Project Details') {
        const capacityItemsToCheck = data?.project?.capacity_items || [];
        const productItemsToCheck = data?.project?.product_items || [];
        const hasInvalidCapacity = capacityItemsToCheck.some((item: any) => {
          const existing = toNumber(item?.existing_proposed_capacity ?? item?.proposed_capacity);
          const current = toNumber(item?.proposed_capacity);
          return current < existing;
        });
        if (hasInvalidCapacity) {
          alert('Proposed Annual Capacity cannot be less than existing capacity for any activity.');
          return false;
        }
        const hasInvalidProduct = productItemsToCheck.some((item: any) => {
          const existing = toNumber(item?.existing_annual_capacity ?? item?.annual_capacity);
          const current = toNumber(item?.annual_capacity);
          return current < existing;
        });
        if (hasInvalidProduct) {
          alert('Annual Capacity cannot be less than existing capacity for any product.');
          return false;
        }
      }
      const supportingIndex = steps.findIndex((s) => s.title === 'Supporting Documents');
      if (supportingIndex !== -1 && toStep > supportingIndex) {
        const nonCompliantList = getNonCompliantMandatoryDocumentNames(
          complianceDocuments,
          uploadedDocuments
        );
        if (nonCompliantList.length > 0) {
          const rejectedMandatory = getRejectedMandatoryDocumentNames(
            complianceDocuments,
            uploadedDocuments
          );
          const rejectedSuffix = rejectedMandatory.length
            ? `\nRejected mandatory documents require re-upload: ${rejectedMandatory.join(', ')}`
            : '';
          alert(
            `Please make Supporting Documents compliant before proceeding.\nNon-compliant mandatory documents: ${nonCompliantList.join(
              ', '
            )}${rejectedSuffix}`
          );
          return false;
        }
      }

      if (currentTitle === 'Authorised Signatory & Promoter Details') {
        const entries = data?.promoter?.entries || [];
        if (!Array.isArray(entries) || entries.length === 0) {
          alert('Please add at least one promoter.');
          return false;
        }
      }

      if (currentTitle === 'Proposed Project Details') {
        const formCapacityItems = data?.project?.capacity_items || [];
        const formProductItems = data?.project?.product_items || [];
        const localCapacityItems = capacityItems;
        const localProductItems = productItems;
        const resolvedCapacityItems =
          (Array.isArray(formCapacityItems) && formCapacityItems.length > 0
            ? formCapacityItems
            : localCapacityItems) || [];
        const resolvedProductItems =
          (Array.isArray(formProductItems) && formProductItems.length > 0
            ? formProductItems
            : localProductItems) || [];
        if (resolvedCapacityItems.length > 0 && formCapacityItems.length === 0) {
          formMethodsRef.current?.setValue?.('project.capacity_items', resolvedCapacityItems);
        }
        if (resolvedProductItems.length > 0 && formProductItems.length === 0) {
          formMethodsRef.current?.setValue?.('project.product_items', resolvedProductItems);
        }
        if (!Array.isArray(resolvedCapacityItems) || resolvedCapacityItems.length === 0) {
          alert('Please add at least one Proposed Capacity entry.');
          return false;
        }
        if (!Array.isArray(resolvedProductItems) || resolvedProductItems.length === 0) {
          alert('Please add at least one Product Details entry.');
          return false;
        }

        if (isExistingMode) {
          const hasCapacityUpdate = resolvedCapacityItems.some((item: any) => {
            if (item?.is_new) return true;
            const existing = toNumber(item?.existing_proposed_capacity ?? item?.proposed_capacity);
            const current = toNumber(item?.proposed_capacity);
            return current > existing;
          });
          const hasProductUpdate = resolvedProductItems.some((item: any) => {
            if (item?.is_new) return true;
            const existing = toNumber(item?.existing_annual_capacity ?? item?.annual_capacity);
            const current = toNumber(item?.annual_capacity);
            return current > existing;
          });
          if (!hasCapacityUpdate) {
            alert('Please update at least one Proposed Capacity row with a higher value.');
            return false;
          }
          if (!hasProductUpdate) {
            alert('Please update at least one Product Details row with a higher value.');
            return false;
          }

          const hasInvalidCapacity = resolvedCapacityItems.some((item: any) => {
            if (item?.is_new) return false;
            const existing = toNumber(item?.existing_proposed_capacity ?? item?.proposed_capacity);
            const current = toNumber(item?.proposed_capacity);
            return current < existing;
          });
          if (hasInvalidCapacity) {
            alert('Proposed Annual Capacity cannot be less than existing capacity for any activity.');
            return false;
          }

          const hasInvalidProduct = resolvedProductItems.some((item: any) => {
            if (item?.is_new) return false;
            const existing = toNumber(item?.existing_annual_capacity ?? item?.annual_capacity);
            const current = toNumber(item?.annual_capacity);
            return current < existing;
          });
          if (hasInvalidProduct) {
            alert('Annual Capacity cannot be less than existing capacity for any product.');
            return false;
          }

          const currentEmployment = toNumber(data?.project?.total_direct_employment);
          const existingEmp = toNumber(existingEmployment);
          if (currentEmployment < existingEmp) {
            alert('Total Direct Employment cannot be less than existing employment.');
            return false;
          }
        }
      }

      if (currentTitle === 'Project Requirement') {
        const electricityRequired = data?.requirement?.power?.required === 'yes';
        const formElectricityDetails = data?.requirement?.power?.details || [];
        const resolvedElectricityDetails =
          (Array.isArray(formElectricityDetails) && formElectricityDetails.length > 0
            ? formElectricityDetails
            : electricityDetails) || [];
        if (electricityRequired && resolvedElectricityDetails.length === 0) {
          alert('Please add at least one Electricity entry.');
          return false;
        }
        const waterRequired = data?.requirement?.water?.required === 'yes';
        const formWaterDetails = data?.requirement?.water?.details || [];
        const resolvedWaterDetails =
          (Array.isArray(formWaterDetails) && formWaterDetails.length > 0
            ? formWaterDetails
            : waterDetails) || [];
        if (waterRequired && resolvedWaterDetails.length === 0) {
          alert('Please add at least one Water entry.');
          return false;
        }
      }

      if (currentTitle === 'Supporting Documents') {
        const nonCompliantList = getNonCompliantMandatoryDocumentNames(
          complianceDocuments,
          uploadedDocuments
        );
        if (nonCompliantList.length > 0) {
          const rejectedMandatory = getRejectedMandatoryDocumentNames(
            complianceDocuments,
            uploadedDocuments
          );
          const rejectedSuffix = rejectedMandatory.length
            ? `\nRejected mandatory documents require re-upload: ${rejectedMandatory.join(', ')}`
            : '';
          alert(
            `Please make Supporting Documents compliant before proceeding.\nNon-compliant mandatory documents: ${nonCompliantList.join(
              ', '
            )}${rejectedSuffix}`
          );
          return false;
        }
      }

      if (currentTitle === 'Payment') {
        const category = String(data?.finance?.project_category || '').toLowerCase();
        const gender = String(data?.authorized?.gender || '').toLowerCase();
        const authCategory = String(data?.authorized?.category || '').toLowerCase();

        let baseAmount = 0;
        if (category === 'micro') {
          baseAmount = 0;
        } else if (category === 'small') {
          baseAmount = 1000;
        } else if (category === 'medium') {
          baseAmount = 5000;
        } else if (category === 'large') {
          baseAmount = 10000;
        } else {
          baseAmount = 0;
        }

        const discountEligible =
          gender === 'female' || authCategory === 'sc' || authCategory === 'st';
        const payableAmount = discountEligible ? baseAmount / 2 : baseAmount;
        const totalPaid = paymentRows
          .filter((row) => String(row?.statusCode) === 'S')
          .reduce((sum, row) => sum + Number(row?.amount || 0), 0);
        const remainingAmount = Math.max(0, payableAmount - totalPaid);

        if (remainingAmount > 0) {
          alert('Please complete payment before proceeding.');
          return false;
        }
      }

      const ok = await saveDraft(data, draftStep);
      if (ok === false) {
        return false;
      }
      if (currentTitle === 'Supporting Documents' && submissionId) {
        try {
          await apiClient.post('/common/documents/sync', {
            submissionId,
            serviceId,
            deptId: departmentId ? Number(departmentId) : 0,
          });
          await fetchUploads();
        } catch (error) {
          console.error('Document sync failed', error);
        }
      }
      markCompletedThroughStep(draftStep);
      console.log(`Moved to step ${step + 1}`);
      return true;
    },
  };

  useEffect(() => {
    formStepsRef.current = formSteps;
  }, [formSteps]);

  useEffect(() => {
    if (shouldLogout) {
      logout();
    }
  }, [shouldLogout, logout]);

  useEffect(() => {
    if (!draftValues) return;
    const shouldSkipAutoComplete =
      isExistingMode && !!sbPrefilledId && !submissionId && !draftLoadedId;
    if (shouldSkipAutoComplete) {
      updateCompletionState([], 0, true);
      return;
    }
    if (isExistingMode) {
      const savedStep = Number(draftValues?.__currentStep ?? 0);
      const stepsForCompute = formStepsRef.current.length ? formStepsRef.current : formConfig.steps;
      const safeSavedStep = Number.isFinite(savedStep) ? Math.max(savedStep, 0) : 0;
      const maxStep = Math.min(Math.max(safeSavedStep - 1, -1), stepsForCompute.length - 1);
      const completed = maxStep >= 0 ? Array.from({ length: maxStep + 1 }, (_, i) => i) : [];
      const nextStep = safeSavedStep > 0 ? Math.min(safeSavedStep, stepsForCompute.length - 1) : 0;
      updateCompletionState(completed, nextStep, true);
      return;
    }
    const savedStep = Number(draftValues?.__currentStep ?? -1);
    const stepsForCompute = formStepsRef.current.length ? formStepsRef.current : formConfig.steps;
    const { completed, nextStep } = computeCompletedSteps(
      draftValues,
      stepsForCompute,
      savedStep,
      true,
      complianceDocuments,
      uploadedDocuments
    );
    updateCompletionState(completed, nextStep, true);
    if (formMethodsRef.current) {
      setTimeout(() => computeFinanceDerived(formMethodsRef.current), 0);
      setTimeout(() => computeFinanceMeansTotal(formMethodsRef.current), 0);
    }
  }, [
    draftValues,
    uploadedDocuments,
    complianceDocuments,
    updateCompletionState,
    isExistingMode,
    sbPrefilledId,
    submissionId,
    draftLoadedId,
    formConfig.steps,
  ]);

  useEffect(() => {
    if (!isExistingMode) return;
    if (existingEmployment !== null) return;
    const existing = Number(
      draftValues?.project?.existing_direct_employment ??
        draftValues?.project?.total_direct_employment ??
        0
    );
    if (Number.isFinite(existing)) {
      setExistingEmployment(existing);
    }
  }, [draftValues, isExistingMode, existingEmployment]);

  useEffect(() => {
    if (!isExistingMode) return;
    if (existingFinance) return;
    const baseline = (draftValues as any)?.finance_existing || draftValues?.finance;
    if (baseline) {
      setExistingFinance(baseline as any);
    }
  }, [draftValues, isExistingMode, existingFinance]);

  useEffect(() => {
    if (!isExistingMode) return;
    const sbId = Number(draftValues?.company?.sb_submission_id || 0);
    if (sbId && Number(sbId) !== Number(selectedSbId || 0)) {
      setSelectedSbId(sbId);
    }
    if (sbId && Number(sbId) !== Number(sbPrefilledId || 0)) {
      setSbPrefilledId(sbId);
    }
  }, [draftValues, isExistingMode, selectedSbId, sbPrefilledId]);

  useEffect(() => {
    if (!isExistingMode) return;
    if (!draftValues) return;
    if (!formMethodsRef.current) return;
    const gstAvailable = normalizeYesNo(draftValues?.company?.gst_available);
    const startup = normalizeYesNo(draftValues?.company?.is_startup);
    if (gstAvailable === 'yes' || gstAvailable === 'no') {
      formMethodsRef.current.setValue('company.gst_available', gstAvailable, {
        shouldValidate: true,
        shouldTouch: true,
      });
    }
    if (startup === 'yes' || startup === 'no') {
      formMethodsRef.current.setValue('company.is_startup', startup, {
        shouldValidate: true,
        shouldTouch: true,
      });
    }
    formMethodsRef.current.trigger?.(['company.gst_available', 'company.is_startup']);
  }, [draftValues, isExistingMode]);

  return (
    <div className="max-w mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{serviceTitle}</h1>
            <p className="text-gray-500 mt-1">
              Fields marked with <span style={{ color: '#dc2626' }}>*</span> are mandatory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow hover:from-amber-500 hover:to-orange-600"
            >
              Fill form using DPR
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow hover:from-emerald-600 hover:to-teal-600"
            >
              Fill form with Voice Command
            </button>
            <div className="text-xs text-gray-500 min-w-[60px] text-right">
              {savingDraft ? 'Saving?' : ''}
            </div>
          </div>
        </div>
        {toastMessage && (
          <div className="mt-3 inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {toastMessage}
          </div>
        )}
        {draftLoading && (
          <div className="mt-2 text-xs text-gray-500">Loading draft data...</div>
        )}
      </div>
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-gray-900">{authModalTitle}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  if (shouldLogout) {
                    logout();
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ?
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">{authModalMessage}</p>
          </div>
        </div>
      )}
      <div className="">
        <DynamicForm
          key={`${proposalType}-${companyName || 'company'}`}
          config={formConfig}
          defaultValues={formDefaults}
          initialStep={initialStep}
          initialCompletedSteps={completedSteps}
        />
      </div>
    </div>
  );
};







