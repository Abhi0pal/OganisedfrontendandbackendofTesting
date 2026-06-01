'use client';

import { DynamicForm, DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { useOrganisationNature } from '@/hooks/master/useOrganisationNature';
import { useDistricts } from '@/hooks/master/useDistricts';
import { useBlocks } from '@/hooks/master/useBlocks';
import { useUpclDivisionSubdivisions } from '@/hooks/master/useUpclDivisionSubdivisions';
import { useCurrentLanduse } from '@/hooks/master/useCurrentLanduse';
import { useLabourFactoryTypeMaster } from '@/hooks/master/useLabourFactoryTypeMaster';
import { useLabourFactorySec85 } from '@/hooks/master/useLabourFactorySec85';
import { useUjsDivisions } from '@/hooks/master/useUjsDivisions';
import { useUpclSupplyCategories } from '@/hooks/master/useUpclSupplyCategories';
import { useUpclSupplySubcategories } from '@/hooks/master/useUpclSupplySubcategories';
import { useUpclVoltage } from '@/hooks/master/useUpclVoltage';
import apiClient from '@/lib/api-client';
import CommonDocumentPage from '@/components/common/CommonDocumentPage';
import { useCommonDocuments } from '@/hooks/common/useCommonDocuments';

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_");

type Translator = ((key: string) => string) & { has?: (key: string) => boolean };

const translateValue = (t: Translator, group: string, value: string) => {
    const key = `${group}.${slugify(value)}`;
    return t.has?.(key) ? t(key) : value;
};

const translateOptional = (t: Translator, group: string, value?: string) =>
    value ? translateValue(t, group, value) : value;

const localizeFormConfig = (config: DynamicFormConfig, t: Translator) => ({
    ...config,
    steps: config.steps.map((step) => ({
        ...step,
        title: translateValue(t, "titles", step.title),
        description: translateOptional(t, "descriptions", step.description),
        sections: step.sections.map((section) => ({
            ...section,
            title: translateValue(t, "titles", section.title),
            fields: section.fields.map((field) => ({
                ...field,
                label: translateValue(t, "labels", field.label ?? ''),
                placeholder: translateOptional(t, "placeholders", field.placeholder),
                helpText: translateOptional(t, "helpText", field.helpText),
                options: field.options,
            })),
        })),
    })),
});

export default function UnifiedApplicationPage() {
    const t = useTranslations("UnifiedApplication");
    type Option = { label: string; value: string };

    const [districts, setDistricts] = useState<Option[]>([]);
    const [organisationNatures, setOrganisationNatures] = useState<Option[]>([]);
    const [districtOptions, setDistrictOptions] = useState<Option[]>([]);
    const [blockOptions, setBlockOptions] = useState<Option[]>([]);
    const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
    const [divisionOfficeOptions, setDivisionOfficeOptions] = useState<Option[]>([]);
    const [subDivisionOfficeOptions, setSubDivisionOfficeOptions] = useState<Option[]>([]);
    const [selectedDivisionOfficeId, setSelectedDivisionOfficeId] = useState<string>('');
    const [currentLanduseOptions, setCurrentLanduseOptions] = useState<Option[]>([]);
    const [factoryTypeOptions, setFactoryTypeOptions] = useState<Option[]>([]);
    const [factorySec85Options, setFactorySec85Options] = useState<Option[]>([]);
    const [ujsDivisionOptions, setUjsDivisionOptions] = useState<Option[]>([]);
    const [supplyCategoryOptions, setSupplyCategoryOptions] = useState<Option[]>([]);
    const [supplySubcategoryOptions, setSupplySubcategoryOptions] = useState<Option[]>([]);
    const [selectedSupplyCategoryId, setSelectedSupplyCategoryId] = useState<string>('');
    const [supplyVoltageOptions, setSupplyVoltageOptions] = useState<Option[]>([]);
    const [selectionContext, setSelectionContext] = useState<{
        caf?: string;
        selectedServices?: Array<{
            id: number;
            serviceId: string;
            departmentId: number;
        }>;
    } | null>(null);
    const [submissionId, setSubmissionId] = useState<number | null>(null);
    const [draftValues, setDraftValues] = useState<Record<string, any> | null>(null);
    const [initialStep, setInitialStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [savingDraft, setSavingDraft] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);
    const [architectLookupLoading, setArchitectLookupLoading] = useState(false);
    const [architectLookupError, setArchitectLookupError] = useState<string | null>(null);
    const [architectLookupData, setArchitectLookupData] = useState<{
        architectNo?: string | null;
        firmName?: string | null;
        name?: string | null;
        phone?: string | null;
        validTo?: string | null;
    } | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const totalSteps = 6;
    const requestedStepParam = searchParams?.get('step');
    const requestedStep = Number(requestedStepParam);
    const hasRequestedStep = Number.isFinite(requestedStep) && requestedStep >= 0 && requestedStep < totalSteps;

    // Fetch organisation natures using the hook
    const { data: organisationNatureData, isLoading: isLoadingOrganisationNatures } = useOrganisationNature({ isActive: true });

    // Fetch districts using the hook
    const { data: districtData, isLoading: isLoadingDistricts } = useDistricts({ isActive: true });

    // Fetch blocks using the hook, dependent on selected district
    const { data: blockData, isLoading: isLoadingBlocksHook } = useBlocks({ isActive: true, districtId: selectedDistrictId ? parseInt(selectedDistrictId) : undefined });

    // Fetch UPCL division/subdivision data
    const { data: divisionSubdivisionsData, isLoading: isLoadingSupplySubcategories } = useUpclDivisionSubdivisions({ isActive: true });
    const { data: currentLanduseData } = useCurrentLanduse({ isActive: true });
    const { data: labourFactoryTypeData } = useLabourFactoryTypeMaster({ isActive: true });
    const { data: labourFactorySec85Data } = useLabourFactorySec85({ isActive: true });
    const { data: ujsDivisionData } = useUjsDivisions({ isActive: true });
    const { data: supplyCategoryData } = useUpclSupplyCategories({ isActive: true });
    const { data: supplySubcategoriesData } = useUpclSupplySubcategories({ isActive: true });
    const { data: upclVoltageData } = useUpclVoltage({ isActive: true });

    // Populate organisation natures when data is loaded
    useEffect(() => {
        if (organisationNatureData) {
            setOrganisationNatures(organisationNatureData.map((item: { id: number; name: string }) => ({
                label: item.name,
                value: String(item.id)
            })));
        }
    }, [organisationNatureData]);

    // Populate district options when data is loaded
    useEffect(() => {
        if (districtData) {
            setDistrictOptions(districtData.map((item: { id: number; name: string }) => ({
                label: item.name,
                value: String(item.id)
            })));
        }
    }, [districtData]);

    // Populate block options when data is loaded
    useEffect(() => {
        if (blockData) {
            setBlockOptions(blockData.map((item: { id: number; name: string }) => ({
                label: item.name,
                value: String(item.id)
            })));
        } else {
            setBlockOptions([]);
        }
    }, [blockData]);

    // Populate current landuse options when data is loaded
    useEffect(() => {
        if (currentLanduseData) {
            const options: Option[] = currentLanduseData.map((item: { id: number; name: string }) => ({
                label: item.name,
                value: String(item.id)
            }));
            options.sort((a, b) => a.label.localeCompare(b.label));
            setCurrentLanduseOptions(options);
        }
    }, [currentLanduseData]);

    // Populate factory type options when data is loaded
    useEffect(() => {
        if (labourFactoryTypeData) {
            const options: Option[] = labourFactoryTypeData.map((item: { id: number; factoryType: string }) => ({
                label: item.factoryType,
                value: String(item.id)
            }));
            options.sort((a, b) => a.label.localeCompare(b.label));
            setFactoryTypeOptions(options);
        }
    }, [labourFactoryTypeData]);

    // Populate factory sec85 options when data is loaded
    useEffect(() => {
        if (labourFactorySec85Data) {
            const options: Option[] = labourFactorySec85Data.map((item: { id: number; specialProvisionName: string }) => ({
                label: item.specialProvisionName,
                value: String(item.id)
            }));
            options.sort((a, b) => a.label.localeCompare(b.label));
            setFactorySec85Options(options);
        }
    }, [labourFactorySec85Data]);

    // Populate UJS sub-division options when data is loaded
    useEffect(() => {
        if (ujsDivisionData) {
            const options: Option[] = ujsDivisionData.map((item: { id: number; officeName: string }) => ({
                label: item.officeName,
                value: String(item.id)
            }));
            options.sort((a, b) => a.label.localeCompare(b.label));
            setUjsDivisionOptions(options);
        }
    }, [ujsDivisionData]);

    // Populate UPCL supply category options when data is loaded
    useEffect(() => {
        if (supplyCategoryData) {
            const options: Option[] = supplyCategoryData.map((item: { id: string; name: string }) => ({
                label: item.name,
                value: String(item.id)
            }));
            options.sort((a, b) => a.label.localeCompare(b.label));
            setSupplyCategoryOptions(options);
        }
    }, [supplyCategoryData]);

    // Populate UPCL supply voltage options when data is loaded
    useEffect(() => {
        if (upclVoltageData) {
            const options: Option[] = upclVoltageData.map((item: { id: string; voltageDesc: string; voltageGroup: string }) => ({
                label: `${item.voltageDesc} (${item.voltageGroup})`,
                value: String(item.id)
            }));
            options.sort((a, b) => a.label.localeCompare(b.label));
            setSupplyVoltageOptions(options);
        }
    }, [upclVoltageData]);

    // Populate UPCL supply subcategory options when category selected
    useEffect(() => {
        if (!supplySubcategoriesData || !selectedSupplyCategoryId) {
            setSupplySubcategoryOptions([]);
            return;
        }

        const filtered = supplySubcategoriesData.filter(
            (item: { supplyCategoryId: string }) => String(item.supplyCategoryId) === String(selectedSupplyCategoryId)
        );

        const options: Option[] = filtered.map((item: { id: string; name: string }) => ({
            label: item.name,
            value: String(item.id)
        }));
        options.sort((a, b) => a.label.localeCompare(b.label));
        setSupplySubcategoryOptions(options);
    }, [supplySubcategoriesData, selectedSupplyCategoryId]);

    // Populate division office options when data is loaded
    useEffect(() => {
        if (!divisionSubdivisionsData) {
            setDivisionOfficeOptions([]);
            return;
        }

        const divisionMap = new Map<string, string>();
        divisionSubdivisionsData.forEach((item: { divisionId: string; divisionName: string }) => {
            if (!divisionMap.has(item.divisionId)) {
                divisionMap.set(item.divisionId, item.divisionName);
            }
        });

        const options: Option[] = Array.from(divisionMap.entries()).map(([id, name]) => ({
            label: name,
            value: String(id),
        }));

        options.sort((a, b) => a.label.localeCompare(b.label));

        setDivisionOfficeOptions(options);
    }, [divisionSubdivisionsData]);

    // Populate sub-division office options when division changes
    useEffect(() => {
        if (!divisionSubdivisionsData || !selectedDivisionOfficeId) {
            setSubDivisionOfficeOptions([]);
            return;
        }

        const filtered = divisionSubdivisionsData.filter(
            (item: { divisionId: string }) => String(item.divisionId) === String(selectedDivisionOfficeId)
        );

        const subdivisionMap = new Map<string, string>();
        filtered.forEach((item: { subdivisionId: string; subdivisionName: string }) => {
            if (!subdivisionMap.has(item.subdivisionId)) {
                subdivisionMap.set(item.subdivisionId, item.subdivisionName);
            }
        });

        const options: Option[] = Array.from(subdivisionMap.entries()).map(([id, name]) => ({
            label: name,
            value: String(id),
        }));

        options.sort((a, b) => a.label.localeCompare(b.label));
        setSubDivisionOfficeOptions(options);
    }, [divisionSubdivisionsData, selectedDivisionOfficeId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = sessionStorage.getItem('unified-selection');
        if (!stored) return;
        try {
            const parsed = JSON.parse(stored);
            setSelectionContext(parsed);
        } catch (error) {
            console.error('Failed to parse unified selection context', error);
        }
    }, []);

    const primaryService = selectionContext?.selectedServices?.[0];
    const serviceId = '963.0';
    const deptId = Number(primaryService?.departmentId || 0);
    const cafId = Number(selectionContext?.caf || 0) || undefined;

    const {
        documents: checklistDocuments,
        uploadedDocuments,
        fetchUploads,
        syncDocuments,
    } = useCommonDocuments(serviceId, submissionId || undefined, deptId);

    const missingRequiredDocuments = useMemo(
        () =>
            (checklistDocuments || [])
                .filter((doc: any) => String(doc?.isRequired || '').toUpperCase() === 'Y')
                .filter((doc: any) => !uploadedDocuments?.[String(doc.id)]),
        [checklistDocuments, uploadedDocuments]
    );

    useEffect(() => {
        const submissionIdParam = searchParams?.get('submissionId');
        const parsed = Number(submissionIdParam || 0);
        if (Number.isFinite(parsed) && parsed > 0) {
            setSubmissionId(parsed);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!serviceId) return;
        if (submissionId) return;
        const loadLatestEditable = async () => {
            try {
                const res = await apiClient.get('/investor/departmentservice/unifiedapplication/applications', {
                    params: { serviceId },
                });
                const items = Array.isArray(res?.data) ? res.data : [];
                const editable = items.find((item: any) =>
                    ['I', 'DP', 'PD'].includes(String(item?.status || '').toUpperCase())
                );
                if (editable?.submissionId) {
                    setSubmissionId(Number(editable.submissionId));
                }
            } catch (error) {
                console.error('Unable to resolve editable application', error);
            }
        };
        loadLatestEditable();
    }, [serviceId, submissionId]);

    useEffect(() => {
        if (!submissionId) return;
        const loadDraft = async () => {
            setDraftLoading(true);
            try {
                const res = await apiClient.get('/investor/departmentservice/unifiedapplication/draft', {
                    params: { submissionId },
                });
                const draft = res?.data;
                const status = String(draft?.status || '').toUpperCase();
                if (!['I', 'DP', 'PD', 'RBI'].includes(status)) {
                    setDraftValues(null);
                    setInitialStep(0);
                    setCompletedSteps([]);
                    return;
                }
                const formData = (draft?.formData || {}) as Record<string, any>;
                setDraftValues(formData);
                const savedStep = Number(formData?.__currentStep ?? 0);
                const clampedStep =
                    Number.isFinite(savedStep) && savedStep >= 0
                        ? Math.min(savedStep, totalSteps - 1)
                        : 0;
                const resolvedStep = hasRequestedStep ? requestedStep : clampedStep;
                setInitialStep(resolvedStep);
                setCompletedSteps(
                    resolvedStep > 0
                        ? Array.from({ length: resolvedStep }, (_v, i) => i)
                        : []
                );
            } catch (error) {
                console.error('Failed to load draft', error);
            } finally {
                setDraftLoading(false);
            }
        };
        loadDraft();
    }, [submissionId, router, hasRequestedStep, requestedStep]);

    // Mock function to fetch districts based on state
    const fetchDistricts = (stateValue: string) => {
        const districtData: Record<string, { label: string; value: string }[]> = {
            uttarakhand: [
                { label: 'Dehradun', value: 'dehradun' },
                { label: 'Haridwar', value: 'haridwar' },
                { label: 'Nainital', value: 'nainital' },
                { label: 'Udham Singh Nagar', value: 'usn' },
            ],
            up: [
                { label: 'Lucknow', value: 'lucknow' },
                { label: 'Noida', value: 'noida' },
                { label: 'Agra', value: 'agra' },
            ],
            delhi: [
                { label: 'New Delhi', value: 'new_delhi' },
                { label: 'South Delhi', value: 'south_delhi' },
                { label: 'North Delhi', value: 'north_delhi' },
            ],
        };
        setDistricts(districtData[stateValue] || []);
    };

    const resolveDistrictId = (data: any) => {
        const candidates = [
            data?.unit?.district,
            data?.project?.district,
            data?.applicant?.district,
            data?.land?.district,
            selectedDistrictId,
        ];
        for (const candidate of candidates) {
            const value = Number(candidate);
            if (Number.isFinite(value) && value > 0) {
                return value;
            }
        }
        return 1;
    };

    const resolveUnitName = (data: any) =>
        String(
            data?.unit?.name_of_unit ||
            data?.applicant?.applicant_name ||
            data?.project?.project_name ||
            ''
        );

    const saveDraft = async (data: any, currentStep: number) => {
        const payload = {
            serviceId,
            departmentId: deptId || undefined,
            formData: { ...data, __currentStep: currentStep },
            unitName: resolveUnitName(data),
            districtId: resolveDistrictId(data),
            cafId,
            currentStep,
        };
        setSavingDraft(true);
        try {
            if (submissionId) {
                await apiClient.post('/investor/departmentservice/unifiedapplication/update', {
                    submissionId,
                    ...payload,
                });
                return submissionId;
            }
            const res = await apiClient.post('/investor/departmentservice/unifiedapplication/save', payload);
            const savedId = Number(res?.data?.submissionId || res?.data?.id || 0);
            if (savedId) {
                setSubmissionId(savedId);
                return savedId;
            }
            return null;
        } finally {
            setSavingDraft(false);
        }
    };

    const lookupArchitect = async (architectNo: string) => {
        const value = String(architectNo || '').trim();
        if (!value) {
            setArchitectLookupData(null);
            setArchitectLookupError(null);
            return;
        }
        setArchitectLookupLoading(true);
        setArchitectLookupError(null);
        try {
            const res = await apiClient.post(
                '/investor/departmentservice/unifiedapplication/architect/lookup',
                { architectNo: value }
            );
            const payload = res?.data?.data || res?.data || null;
            if (!payload) {
                setArchitectLookupData(null);
                setArchitectLookupError('No architect details found.');
                return;
            }
            setArchitectLookupData({
                architectNo: payload?.architectNo ?? value,
                firmName: payload?.firmName ?? null,
                name: payload?.name ?? null,
                phone: payload?.phone ?? null,
                validTo: payload?.validTo ?? null,
            });
        } catch (error: any) {
            setArchitectLookupData(null);
            setArchitectLookupError(
                error?.response?.data?.message || 'Unable to fetch architect details.'
            );
        } finally {
            setArchitectLookupLoading(false);
        }
    };

    const submitAndRedirectToPayment = async (data: any) => {
        if (missingRequiredDocuments.length > 0) {
            alert('Please upload all required documents before payment.');
            return false;
        }
        await syncDocuments();
        const savedId = await saveDraft(data, 5);
        if (!savedId) {
            alert('Unable to save application.');
            return false;
        }
        router.push(`/investor/departmentservice/unifiedapplication/payment?submissionId=${savedId}`);
        return true;
    };

    const formConfig: DynamicFormConfig = {
        id: 'new-application',
        showStepIndicator: true,
        allowStepNavigation: true,
        submitButtonText: 'Submit and PayNow',
        nextButtonTextByStep: {
            4: 'Submit and Pay Now',
        },
        steps: [
            // ========== Step 1: Applicant Information ==========
            {
                id: 'step-1',
                title: 'Basic Information',
                description: '',
                sections: [
                    {
                        id: 'application-info',
                        title: 'Application Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'project.project_type',
                                label: 'Project Type',
                                type: 'select',
                                options: [
                                    { label: 'New Project', value: 'new' },
                                    { label: 'Expansion', value: 'expansion' }
                                ],
                                validation: { required: 'Please select project type' }
                            },
                            {
                                name: 'project.proposed_start_date',
                                label: 'Proposed Start Date',
                                type: 'date',
                                validation: { required: 'Proposed start date required' }

                            },
                            {
                                name: 'project.proposed_end_date',
                                label: 'Proposed End Date',
                                type: 'date',
                                validation: { required: 'Proposed start date required' }
                            }

                        ]
                    },
                    {
                        id: 'applicant-details',
                        title: 'Applicant Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'applicant.applicant_name',
                                label: 'Applicant Name',
                                type: 'text',
                                validation: { required: 'Please enter name' }
                            },
                            {
                                name: 'applicant.applicant_address',
                                label: 'Applicant Address',
                                type: 'text',
                                validation: { required: 'Please enter address' }
                            },
                            {
                                name: 'applicant.mobile_number',
                                label: 'Applicant Mobile No.',
                                type: 'number',
                                validation: { required: 'Please enter mobile no.' }
                            },
                            {
                                name: 'applicant.applicant_email',
                                label: 'Applicant Email',
                                type: 'email',
                                placeholder: 'example@email.com',
                                validation: {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                                }
                            }
                        ]
                    },

                    {
                        id: 'owner-details',
                        title: 'Owner Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'owner.owner_name',
                                label: 'Owner Name',
                                type: 'text',
                                validation: { required: 'Please enter owner name' }
                            },
                            {
                                name: 'owner.nature_of_organisation',
                                label: 'Nature of Organisation',
                                type: 'select',
                                options: organisationNatures,
                                validation: { required: 'Please select nature of organisation' }
                            },
                            {
                                name: 'owner.owner_mobile_number',
                                label: 'Onwner Mobile No.',
                                type: 'number',
                                validation: { required: 'Please enter mobile no.' }
                            },
                            {
                                name: 'owner.owner_email',
                                label: 'Owner Email',
                                type: 'email',
                                placeholder: 'example@email.com',
                                validation: {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                                }
                            }
                        ]
                    },
                    {
                        id: 'unit-details',
                        title: 'Unit Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'unit.name_of_unit',
                                label: 'Name of Unit',
                                type: 'text',
                                validation: { required: 'Please enter name of unit' }
                            },
                            {
                                name: 'unit.pan_number_of_unit',
                                label: 'Unit PAN Number',
                                type: 'text',
                                placeholder: 'ABCDE1234F',
                                validation: {
                                    required: 'PAN is required',
                                    pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Invalid PAN format (e.g., ABCDE1234F)' }
                                }
                            },
                            {
                                name: 'unit.gstn_of_organisation',
                                label: 'GSTIN of Organisation',
                                type: 'text',
                                placeholder: '22AAAAA0000A1Z5',
                                validation: {
                                    pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, message: 'Invalid GSTIN format' }
                                }
                            },
                            {
                                name: 'unit.nature_of_unit',
                                label: 'Nature of Unit',
                                type: 'select',
                                options: [
                                    { label: 'Manufacturing', value: 'Manufacturing Sector' },
                                    { label: 'Service', value: 'Service Sector' }
                                ],
                                validation: { required: 'Please select nature of unit' }
                            },
                            {
                                name: 'unit.proposed_address_of_project',
                                label: 'Proposed Address of Project',
                                type: 'textarea',
                                validation: { required: 'Please enter proposed address of project' }
                            },
                            {
                                name: 'unit.mobile_no_of_unit',
                                label: 'Unit Mobile No.',
                                type: 'number',
                                validation: {
                                    required: 'Mobile number is required',
                                    pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
                                }
                            },
                            {
                                name: 'unit.email_of_unit',
                                label: 'Unit Email',
                                type: 'email',
                                placeholder: 'example@email.com',
                                validation: {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                                }
                            },
                            {
                                name: 'unit.plot_khasra_no',
                                label: 'Unit Plot/Khasra No.',
                                type: 'text',
                                validation: { required: 'Unit Plot/Khasra No. is required' }

                            },
                            {
                                name: 'unit.pincode_of_unit',
                                label: 'Unit PIN Code',
                                type: 'text',
                                validation: { required: 'Unit PIN Code is required' }

                            },
                            {
                                name: 'unit.district_of_unit',
                                label: 'District of Unit',
                                type: 'select',
                                options: districtOptions,
                                validation: { required: 'Unit district is required' },
                                onChange: (districtId: string, formMethods) => {
                                    // reset block when district changes
                                    formMethods.setValue('unit.block_of_unit', '');
                                    setSelectedDistrictId(districtId);
                                }
                            },
                            {
                                name: 'unit.block_of_unit',
                                label: 'Block of Unit',
                                type: 'select',
                                options: blockOptions,
                                disabled: isLoadingBlocksHook || blockOptions.length === 0,
                                validation: { required: 'Unit block is required' }

                            }
                        ]
                    },
                    {
                        id: 'contact-person-details',
                        title: 'Contact Person Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'contactperson.auhorise_person_name',
                                label: 'Name of Authorized Person / Coordinator',
                                type: 'text',
                                validation: { required: 'Please enter authorize person name' }
                            },
                            {
                                name: 'contactperson.auhorise_person_email',
                                label: 'Email of Authorized Person / Coordinator',
                                type: 'email',
                                placeholder: 'example@email.com',
                                validation: {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                                }
                            },
                            {
                                name: 'contactperson.owner_mobile_number',
                                label: 'Mobile No. of Authorized Person / Coordinator',
                                type: 'number',
                                validation: { required: 'Please enter mobile no.' }
                            }
                        ]
                    }
                ]
            },
            // ========== Step 2: Project Details ==========
            {
                id: 'step-2',
                title: 'Project / Site Details',
                description: '',
                sections: [
                    {
                        id: 'project-details',
                        title: 'Details of Land and Building',
                        columns: 2,
                        fields: [
                            {
                                name: 'project.unit_address_plot_area',
                                label: 'Unit Plot Area',
                                type: 'text',
                                validation: { required: 'Please select plot area' }
                            },
                            {
                                name: 'project.total_covered_area',
                                label: 'Total Covered Area',
                                type: 'text',
                                validation: { required: 'Please enter total covered area' }
                            },
                            {
                                name: 'project.building_height_m',
                                label: 'Building Height(m)',
                                type: 'text',
                                validation: { required: 'Building Height(m) is required' }
                            },
                            {
                                name: 'project.approach_road_width',
                                label: 'Approach Road Width',
                                type: 'text',
                                validation: { required: 'Investment amount is required' }
                            },
                            {
                                name: 'project.current_land_use',
                                label: 'Current Land Use',
                                type: 'select',
                                options: currentLanduseOptions,
                                validation: { required: 'Current land use is required' }
                            },
                            {
                                name: 'project.building_category',
                                label: 'Building Category',
                                type: 'select',
                                options: [
                                    { label: 'High-Rise', value: 'High-Rise' },
                                    { label: 'Low-Rise', value: 'Low-Rise' }
                                ],
                                validation: { required: 'Please select building category' }
                            },
                            {
                                name: 'project.building_sub_category',
                                label: 'Building Sub Category',
                                type: 'text',
                                validation: { required: 'Building sub category is required' }
                            },
                            {
                                name: 'project.no_of_entrance',
                                label: 'No. of entrance',
                                type: 'number',
                                validation: { required: 'No. of entrance is required' }
                            },
                            {
                                name: 'project.no_of_exit',
                                label: 'No. of exit',
                                type: 'number',
                                validation: { required: 'No. of exit is required' }
                            },
                            {
                                name: 'project.upper_floors',
                                label: 'Upper Floor(s)',
                                type: 'number',
                                validation: { required: 'Upper Floor(s) is required' }
                            },
                            {
                                name: 'project.maximum_height_of_building',
                                label: 'Maximum Height of Building',
                                type: 'text',
                                validation: { required: 'Maximum Height of Building is required' }
                            },
                            {
                                name: 'project.no_of_floors',
                                label: 'No. of floors',
                                type: 'number',
                                validation: { required: 'No. of floors is required' }
                            },
                            {
                                name: 'project.no_of_basements',
                                label: 'No of Basements',
                                type: 'number',
                                validation: { required: 'No of Basements is required' }
                            },
                            {
                                name: 'project.no_of_blocks',
                                label: 'No. of Blocks',
                                type: 'number',
                                validation: { required: 'No. of Blocks is required' }
                            },
                            {
                                name: 'project.minimum_distance_between_blocks',
                                label: 'Minimum Distance b/w Blocks',
                                type: 'text',
                                validation: { required: 'Minimum Distance b/w Blocks is required' }
                            },
                            {
                                name: 'project.ground_floor_covered_area',
                                label: 'Ground Floor Covered Area',
                                type: 'text',
                                validation: { required: 'Ground floor covered area is required' }
                            },
                            {
                                name: 'project.basement_covered_area',
                                label: 'Basement Covered Area',
                                type: 'text',
                                validation: { required: 'Basement covered area is required' }
                            },
                            {
                                name: 'project.height_of_tallest_block',
                                label: 'Height of Tallest Block',
                                type: 'text',
                                validation: { required: 'Height of tallest block is required' }
                            }
                        ]
                    },
                    {
                        id: 'setback-details',
                        title: 'Set Back Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'setback.front',
                                label: 'Front',
                                type: 'text',
                                validation: { required: 'Please enter front set back' }
                            },
                            {
                                name: 'setback.rear',
                                label: 'Rear',
                                type: 'text',
                                validation: { required: 'Please enter Rear set back' }
                            },
                            {
                                name: 'setback.side1',
                                label: 'Side 1',
                                type: 'text',
                                validation: { required: 'Please enter side 1' }
                            },
                            {
                                name: 'setback.side2',
                                label: 'Side 2',
                                type: 'text',
                                validation: { required: 'Please enter side 1' }
                            }
                        ]
                    },
                    {
                        id: 'ocuupancy-details',
                        title: 'Ocuupancy Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'ocuupancy.number_of_rooms',
                                label: 'No. of Rooms (For Hotel/Guest House & Hostel)',
                                type: 'number',
                                validation: { required: 'No. of rooms are required' }
                            },
                            {
                                name: 'ocuupancy.number_of_flats',
                                label: 'Number of Flats (For Residential Apartment)',
                                type: 'number',
                                validation: { required: 'No. of flats are required' }
                            },
                            {
                                name: 'ocuupancy.number_of_beds',
                                label: 'No. of Beds (For Hospital/Nursing Home)',
                                type: 'number',
                                validation: { required: 'No. of beds are required' }
                            },
                            {
                                name: 'ocuupancy.educational_seating_capacity',
                                label: 'Educational - Seating Capacity (For Stadium-Outdoor/Indoor)',
                                type: 'number',
                                validation: { required: 'No. of beds are required' }
                            },
                            {
                                name: 'ocuupancy.number_of_employee',
                                label: 'Number of Employee (For Industry)',
                                type: 'number',
                                validation: { required: 'No. of employee are required' }
                            },
                            {
                                name: 'ocuupancy.details_of_hazardous_material',
                                label: 'Details of Hazardous Materials (If Any)',
                                type: 'text'
                            }
                        ]
                    },
                    {
                        id: 'gps-location',
                        title: ' Mention GPS location of the site (GPS point of 4 corner of periphery)',
                        columns: 2,
                        fields: [
                            {
                                name: 'gps_location',
                                label: 'GPS Location',
                                type: 'addmore',
                                colSpan: 2,
                                addMoreConfig: {
                                    columns: [
                                        {
                                            name: 'longitude_second',
                                            label: 'Longitude (Second)',
                                            type: 'text',
                                            placeholder: 'Longitude (Second)',
                                            width: '200px',
                                           // validation: { required: 'Longitude (Second) is required' }
                                        },
                                        {
                                            name: 'latitude_minute',
                                            label: 'Latitude (Minute)',
                                            type: 'text',
                                            placeholder: 'Latitude (Minute)',
                                            width: '150px',
                                           // validation: { required: 'Longitude (Second) is required' }
                                        },
                                        {
                                            name: 'latitude_second',
                                            label: 'Latitude (Second)',
                                            type: 'text',
                                            placeholder: 'Latitude (Second)',
                                            width: '150px',
                                        },
                                        {
                                            name: 'longitude_degree',
                                            label: 'Longitude (Degree)',
                                            type: 'text',
                                            placeholder: 'Longitude (Degree)',
                                            width: '150px',
                                        },
                                        {
                                            name: 'longitude_minute',
                                            label: 'Longitude (Minute)',
                                            type: 'text',
                                            placeholder: 'Longitude (Minute)',
                                            width: '150px',
                                        },
                                        {
                                            name: 'latitude_degree',
                                            label: 'Latitude (Degree)',
                                            type: 'text',
                                            placeholder: 'Latitude (Degree)',
                                            width: '150px',
                                        },
                                       
                                    ],
                                    minRows: 1,
                                    maxRows: 10,
                                    addButtonText: 'Add GPS Location',
                                    defaultRow: { quantity: 1, rate: 0 }
                                }
                            }
                        ]
                    }

                ]
            },
            // ========== Step 3: Location & Land ==========
            {
                id: 'step-3',
                title: 'Technical & Statutory Clearances / Professional Details',
                description: '',
                sections: [
                    {
                        id: 'technical-details',
                        title: 'Technical Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'technical.architect_registration_no',
                                label: 'Architect Registration No.',
                                type: 'text',
                                validation: { required: 'Please enter achitect registration no.' },
                                onBlur: (value) => {
                                    lookupArchitect(String(value || ''));
                                }                                
                            },
                            {
                                name: 'technical.architect_registration_lookup',
                                type: 'custom',
                                colSpan: 2,
                                skipStepValidation: true,
                                render: () => (
                                    <div className="mt-2">
                                        {architectLookupLoading && (
                                            <p className="text-sm text-gray-500">Fetching architect details...</p>
                                        )}
                                        {architectLookupError && (
                                            <p className="text-sm text-red-600">{architectLookupError}</p>
                                        )}
                                        {architectLookupData && !architectLookupLoading && (
                                            <div className="overflow-x-auto rounded-md border border-gray-300">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-[#f8f8f8]">
                                                        <tr>
                                                            <th className="border px-3 py-2 text-left">Field</th>
                                                            <th className="border px-3 py-2 text-left">Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td className="border px-3 py-2">Architect No</td>
                                                            <td className="border px-3 py-2">{architectLookupData.architectNo || '--'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border px-3 py-2">Firm Name</td>
                                                            <td className="border px-3 py-2">{architectLookupData.firmName || '--'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border px-3 py-2">Name</td>
                                                            <td className="border px-3 py-2">{architectLookupData.name || '--'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border px-3 py-2">Phone</td>
                                                            <td className="border px-3 py-2">{architectLookupData.phone || '--'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border px-3 py-2">Valid To</td>
                                                            <td className="border px-3 py-2">{architectLookupData.validTo || '--'}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ),
                            }
                        ]
                    },
                    {
                        id: 'se-details',
                        title: 'Structural Engineer Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'technical.se_registration_no',
                                label: 'Structural Engineer - Registration No.',
                                type: 'text',
                                validation: { required: 'Please select structural engineer - registration no.' }
                            }
                        ]
                    },
                    // Conditional: Government Land Details
                    {
                        id: 'fire-details',
                        title: 'Essential Provision- Fire',
                        columns: 2,
                        fields: [
                            {
                                name: 'technical.width_of_stairs',
                                label: 'Width of Stairs',
                                type: 'text',
                                validation: { required: 'Please enter width of stairs' }
                            },
                            {
                                name: 'technical.provision_of_lift',
                                label: 'Provision of Lift',
                                type: 'select',
                                options: [
                                    { label: 'Yes', value: 'Yes' },
                                    { label: 'No', value: 'No' }
                                ],
                                validation: { required: 'Provision of lift is required' }
                            },
                            {
                                name: 'technical.no_of_stair_cases',
                                label: 'No. of Stair Cases',
                                type: 'text',
                                validation: { required: 'Please enter no. of stair cases' }
                            },
                        ]
                    },
                    {
                        id: 'water-details',
                        title: 'Essential Provision - Water',
                        columns: 2,
                        fields: [
                            {
                                name: 'technical.arrangement_of_solid',
                                label: 'Arrangement of Solid /Bio- Sludge Management',
                                type: 'text',
                                validation: { required: 'Arrangement of Solid /Bio- Sludge Management is required' }
                            },
                            {
                                name: 'technical.arrangement_of_rain_water',
                                label: 'Arrangement of Rainwater Harvesting',
                                type: 'text',
                                validation: { required: 'Arrangement of Rainwater Harvesting is required' }
                            },
                            {
                                name: 'technical.purpose_of_rain_water_harvesting',
                                label: 'Purpose of Rainwater Harvesting',
                                type: 'text',
                                validation: { required: 'Purpose of Rainwater Harvesting is required' }
                            },
                            {
                                name: 'technical.requirement_of_water_per_day_in_litre',
                                label: 'Requirement of Water Per Day (in Liters)',
                                type: 'number',
                                validation: { required: 'Requirement of Water Per Day (in Liters) is required' }
                            },
                            {
                                name: 'technical.tank_size',
                                label: 'Tanks Size (in litres)',
                                type: 'number',
                                validation: { required: 'Tanks Size (in litres) is required' }
                            },
                            {
                                name: 'technical.sub_division_id',
                                label: 'UJS Sub Division ',
                                type: 'select',
                                options: ujsDivisionOptions,
                                validation: { required: 'UJS Sub Division is required' }
                            }
                        ]
                    },
                    {
                        id: 'upcl-details',
                        title: 'Essential Provision - UPCL',
                        columns: 2,
                        fields: [
                            {
                                name: 'technical.category_of_supply',
                                label: 'Category of supply',
                                type: 'select',
                                options: supplyCategoryOptions,
                                onChange: (categoryId: string, formMethods) => {
                                    formMethods.setValue('technical.subcatgeory_of_supply', '');
                                    setSelectedSupplyCategoryId(categoryId);
                                },
                                validation: { required: 'Category of supply is required' }
                            },
                            {
                                name: 'technical.subcatgeory_of_supply',
                                label: 'UPCL - Subcategory of supply',
                                type: 'select',
                                options: supplySubcategoryOptions,
                                disabled: supplySubcategoryOptions.length === 0,
                                validation: { required: 'UPCL - Subcategory of supply is required' }
                            },
                            {
                                name: 'technical.applied_load',
                                label: 'Applied Load',
                                type: 'number',
                                validation: { required: 'Applied Load is required' }
                            },
                            {
                                name: 'technical.applied_load_unit',
                                label: 'Applied Load Unit',
                                type: 'text',
                                validation: { required: 'Applied Load Unit is required' }
                            },
                            {
                                name: 'technical.supply_voltage',
                                label: 'Supply Voltage',
                                type: 'select',
                                options: supplyVoltageOptions,
                                validation: { required: 'Supply Voltage is required' }
                            },
                            {
                                name: 'technical.division_office',
                                label: 'Division office',
                                type: 'select',
                                options: divisionOfficeOptions,
                                validation: { required: 'Division office is required' },
                                onChange: (divisionId: string, formMethods) => {
                                    formMethods.setValue('project.sub_division', '');
                                    setSelectedDivisionOfficeId(divisionId);
                                }
                            },
                            {
                                name: 'technical.sub_division',
                                label: 'Sub-Division office',
                                type: 'select',
                                options: subDivisionOfficeOptions,
                                disabled: isLoadingSupplySubcategories || subDivisionOfficeOptions.length === 0,
                                validation: { required: 'Sub-Division office is required' }
                            },
                            {
                                name: 'technical.is_existing_electricity_connection',
                                label: 'Is Existing electricity connection at premises ?',
                                type: 'select',
                                options:[{ label: 'Yes', value: 'Yes' },
                                    { label: 'No', value: 'No' }],
                                validation: { required: 'Is Existing electricity connection at premises ?' }
                            },
                            {
                                name: 'technical.prepaid_postpaid',
                                label: 'Prepaid/Postpaid',
                                type: 'select',
                                options:[{ label: 'Prepaid', value: 'Prepaid' },
                                    { label: 'Postpaid', value: 'Postpaid' }],
                                validation: { required: 'Prepaid/Postpaid is required' }
                            },
                            {
                                name: 'technical.billing_address',
                                label: 'Billing Address',
                                type: 'text',
                                validation: { required: 'Billing Address is required' }
                            }
                        ]
                    },
                    {
                        id: 'forest-details',
                        title: 'Essential Provision - Forest',
                        columns: 2,
                        fields: [
                            {
                                name: 'technical.thana_chauki_name',
                                label: 'Thana/ Chauki Name',
                                type: 'text',
                                validation: { required: 'Thana/ Chauki Name is required' }
                            },
                            {
                                name: 'technical.circle_name',
                                label: 'Circle Name',
                                type: 'text',
                                validation: { required: 'Circle Name is required' }
                            },
                            {
                                name: 'technical.industry_site',
                                label: 'Industry Site',
                                type: 'text',
                                validation: { required: 'Industry Site is required' }
                            }
                        ]
                    },
                    {
                        id: 'labour-details',
                        title: 'Essential Provision - Labour',
                        columns: 2,
                        fields: [
                            {
                                name: 'technical.factory_type',
                                label: 'Factory Type',
                                type: 'select',
                                options: factoryTypeOptions,
                                validation: { required: 'Factory Type is required' }
                            },
                            {
                                name: 'technical.the_first_schedule',
                                label: 'The First Schedule',
                                type: 'select',
                                options: factorySec85Options,
                                validation: { required: 'The First Schedule is required' }
                            },
                            {
                                name: 'technical.no_of_workers',
                                label: 'No Of Workers',
                                type: 'number',
                                validation: { required: 'No Of Workers is required' }
                            }
                        ]
                    }
                ]
            },
            // ========== Step 4: Services Required ==========
            {
                id: 'step-4',
                title: 'Pollution Related Details',
                description: '',
                sections: [
                    {
                        id: 'pollution-details',
                        title: ' Essential Provision of PCB - Product Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'pollution.product_name',
                                label: 'Product Name',
                                type: 'text',
                                validation: { required: 'Product Name is required' }
                            },
                            {
                                name: 'pollution.quantity',
                                label: 'Quantity',
                                type: 'text',
                                validation: { required: 'Quantity is required' }
                            },
                            {
                                name: 'pollution.unit_of_product',
                                label: 'Units of Product',
                                type: 'text',
                                validation: { required: 'Units of Product is required' }
                            },
                            {
                                name: 'pollution.intermediate_product',
                                label: 'Intermediate Product',
                                type: 'text',
                                validation: { required: 'Intermediate Product is required' }
                            },
                            {
                                name: 'pollution.qty_metric_tone',
                                label: 'Qty(Metric Tonnes/month)',
                                type: 'text',
                                validation: { required: 'Qty(Metric Tonnes/month) is required' }
                            },
                            {
                                name: 'pollution.unit_of_intermediate_product',
                                label: 'Unit of Intermediate Product',
                                type: 'text',
                                validation: { required: 'Unit of Intermediate Product is required' }
                            }
                        ]
                    },
                    {
                        id: 'pcb_raw_material',
                        title: 'Essential Provision of PCB - Raw Material Detail',
                        columns: 2,
                        fields: [
                            {
                                name: 'pollution.name_of_raw_material',
                                label: 'Name of Raw Material',
                                type: 'text',
                                validation: { required: 'Name of Raw Material is required' }
                            },
                            {
                                name: 'pollution.tradename_of_raw_material',
                                label: 'Trade Name of Raw-Material',
                                type: 'text',
                                validation: { required: 'Trade Name of Raw-Material is required' }
                            },
                            {
                                name: 'pollution.quality_of_raw_material',
                                label: 'Quantity Of Raw Material',
                                type: 'text',
                                validation: { required: 'Quantity Of Raw Material is required' }
                            },
                            {
                                name: 'pollution.principal_use',
                                label: 'Principle Use',
                                type: 'text',
                                validation: { required: 'Principle Use is required' }
                            }
                        ]
                    },
                    {
                        id: 'pcb_solid_waste_material',
                        title: 'Essential Provision of PCB - Solid Waste Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'pollution.nature_of_waste',
                                label: 'Nature of Waste',
                                type: 'text',
                                validation: { required: 'Nature of Waste is required' }
                            },
                            {
                                name: 'pollution.approximate_composition',
                                label: 'Approximate Composition',
                                type: 'text',
                                validation: { required: 'Approximate Composition is required' }
                            },
                            {
                                name: 'pollution.quantity_metric_tone_year',
                                label: 'Quantity (in Metric Tonnes/Year)',
                                type: 'text',
                                validation: { required: 'Quantity (in Metric Tonnes/Year) is required' }
                            },
                            {
                                name: 'pollution.hazardous',
                                label: 'Hazardous',
                                type: 'text',
                                validation: { required: 'Hazardous is required' }
                            },
                            {
                                name: 'pollution.mode_of_disposal',
                                label: 'Mode of Disposal',
                                type: 'text',
                                validation: { required: 'Mode of Disposal is required' }
                            }
                        ]
                    },
                    {
                        id: 'pcb_water_consumption_details',
                        title: ' Essential Provision of PCB - Water Consumption Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'pollution.source_consumption',
                                label: 'Source Consumption',
                                type: 'text',
                                validation: { required: 'Source Consumption is required' }
                            },
                            {
                                name: 'pollution.quantity_kl_d',
                                label: 'Quantity (KL/D)',
                                type: 'text',
                                validation: { required: 'Quantity (KL/D) is required' }
                            }
                        ]
                    },
                    {
                        id: 'pcb_water_effluent_details',
                        title: 'Essential Provision of PCB - Water Effluent Characteristics Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'pollution.waste_water_gen_quantity',
                                label: 'Waste Water Generation Quantity (Kl/D)',
                                type: 'text',
                                validation: { required: 'Waste Water Generation Quantity (Kl/D) is required' }
                            },
                            {
                                name: 'pollution.name_of_effluent',
                                label: 'Name of Effluent',
                                type: 'text',
                                validation: { required: 'Name of Effluent is required' }
                            },
                            {
                                name: 'pollution.charterstics',
                                label: 'Characteristics',
                                type: 'text',
                                validation: { required: 'Characteristics is required' }
                            },
                            {
                                name: 'pollution.available_information',
                                label: 'Available Information',
                                type: 'text',
                                validation: { required: 'Available Information is required' }
                            }
                        ]
                    },
                    {
                        id: 'pcb_stack_details',
                        title: 'Essential Provision of PCB - Stack Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'pollution.stack_top',
                                label: 'Stack Top',
                                type: 'select',
                                options: [
                                    { label: 'Circular', value: 'Circular' },
                                    { label: 'Round', value: 'Round' }
                                ],
                                validation: { required: 'Stack Top is required' }

                            },
                            {
                                name: 'pollution.gas_quantity',
                                label: 'Gas Quantity(m^3/hr)',
                                type: 'text',
                                validation: { required: 'Gas Quantity(m^3/hr) is required' }
                            },
                            {
                                name: 'pollution.fuel_gas_temprature',
                                label: "Flue Gas Temperature('C)",
                                type: 'text',
                                validation: { required: "Flue Gas Temperature('C) is required" }
                            },
                            {
                                name: 'pollution.exit_velocity_of_gas_sec',
                                label: 'Exit Velocity Of The Gas/sec',
                                type: 'text',
                                validation: { required: 'Exit Velocity Of The Gas/sec is required' }
                            },
                            {
                                name: 'pollution.exit_velocity_of_gas_sec_unit',
                                label: 'Unit',
                                type: 'text',
                                validation: { required: 'Exit Velocity Of The Gas/sec Unit is required' }
                            },
                            {
                                name: 'pollution.pollution_control_equipment',
                                label: 'Pollution Control Equipments',
                                type: 'text',
                                validation: { required: 'Pollution Control Equipments is required' }
                            },
                            {
                                name: 'pollution.stack_draft_type',
                                label: 'Stack Draft Type',
                                type: 'select',
                                options:[{ label: 'FD Fan', value: 'FD Fan' },
                                        { label: 'ID Fan', value: 'ID Fan' },
                                        { label: 'Natural Draft', value: 'Natural Draft' }],
                                validation: { required: 'Stack Draft Type is required' }
                            },
                            {
                                name: 'pollution.material_of_construction_of_stack',
                                label: 'Material Of Construction of Stack',
                                type: 'text',
                                validation: { required: 'Material Of Construction of Stack is required' }
                            },
                            {
                                name: 'pollution.in_case_of_stack_attached_to_others',
                                label: 'In case of Stack attached to others',
                                type: 'text',
                                validation: { required: 'In case of Stack attached to others is required' }
                            },
                            {
                                name: 'pollution.stack_height_above_ground',
                                label: 'Stack Height above Ground Level(in Meters)',
                                type: 'number',
                                validation: { required: 'Stack Height above Ground Level(in Meters) is required' }
                            },
                            {
                                name: 'pollution.height_of_sample_form',
                                label: 'Height of sample form and multi-platform(in Meters)',
                                type: 'number',
                                validation: { required: 'Height of sample form and multi-platform(in Meters) is required' }
                            },
                            {
                                name: 'pollution.stack_height_above_roof',
                                label: 'Stack Height above roof(in Meters)',
                                type: 'number',
                                validation: { required: 'Stack Height above roof(in Meters) is required' }
                            }
                        ]
                    },
                    {
                        id: 'pcb_air_consumption_details',
                        title: ' Essential Provision of PCB - Air Consumption Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'pollution.fuel',
                                label: 'Fuel',
                                type: 'text',
                                validation: { required: 'Fuel is required' }
                            },
                            {
                                name: 'pollution.consumption',
                                label: 'Consumption (tpd/kld)',
                                type: 'text',
                                validation: { required: 'Consumption (tpd/kld) is required' }
                            },
                            {
                                name: 'pollution.use',
                                label: 'Use',
                                type: 'text',
                                validation: { required: 'Use is required' }
                            }
                        ]
                    },
                    {
                        id: 'pcb_other_details',
                        title: 'Other Details',
                        columns: 2,
                        fields: [
                            {
                                name: 'pollution.any_expected_pollutants',
                                label: 'Any expected Pollutants',
                                type: 'text',
                                validation: { required: 'Any expected Pollutants is required' }
                            },
                            {
                                name: 'pollution.type_of_pollutants',
                                label: 'Type of Pollutants',
                                type: 'text',
                                validation: { required: 'Type of Pollutants is required' }
                            }
                        ]
                    }
                ]
            },
            // ========== Step 5: Documents & Declaration ==========
            {
                id: 'step-5',
                title: 'Documents & Declaration',
                description: 'Upload required documents and provide declaration',
                sections: [
                    {
                        id: 'documents',
                        title: 'Upload Documents',
                        columns: 1,
                        fields: [
                            {
                                name: 'documents.table',
                                type: 'custom',
                                skipStepValidation: true,
                                render: () => (
                                    <div className="space-y-4">
                                        {!submissionId ? (
                                            <div className="text-sm text-gray-500">
                                                Please click Save and Proceed once to enable document uploads.
                                            </div>
                                        ) : (
                                            <CommonDocumentPage
                                                serviceId={serviceId}
                                                submissionId={submissionId}
                                                deptId={deptId}
                                            />
                                        )}
                                        {!!submissionId && missingRequiredDocuments.length > 0 && (
                                            <p className="text-sm text-amber-700">
                                                Upload all required documents to continue.
                                            </p>
                                        )}
                                    </div>
                                )
                            }
                        ]
                    },
                    {
                        id: 'declaration',
                        title: 'Declaration',
                        columns: 1,
                        fields: [
                            {
                                name: 'declaration.accuracy',
                                label: 'I hereby declare that all the information provided above is true and accurate to the best of my knowledge. I understand that any false information may lead to rejection of my application.',
                                type: 'checkbox',
                                validation: { required: 'You must accept this declaration' }
                            },
                            {
                                name: 'declaration.terms',
                                label: 'I agree to the Terms and Conditions and Privacy Policy of the Single Window Clearance System. I consent to the processing of my data for the purpose of this application.',
                                type: 'checkbox',
                                validation: { required: 'You must agree to terms and conditions' }
                            },
                            {
                                name: 'declaration.communication',
                                label: 'I agree to receive updates about my application via SMS and Email.',
                                type: 'checkbox'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'step-6',
                title: 'Payment',
                description: 'Proceed to fee summary and payment',
                sections: [
                    {
                        id: 'payment-redirect',
                        title: 'Payment',
                        columns: 1,
                        fields: [
                            {
                                name: 'payment.redirect',
                                type: 'custom',
                                skipStepValidation: true,
                                render: () => (
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-700">
                                            Payment step selected. Click below to open the payment page.
                                        </p>
                                        <button
                                            type="button"
                                            className="rounded-md bg-[#e9090c] px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                            onClick={() =>
                                                router.push(
                                                    `/investor/departmentservice/unifiedapplication/payment?submissionId=${submissionId || ''}`
                                                )
                                            }
                                        >
                                            Open Payment Page
                                        </button>
                                    </div>
                                ),
                            },
                        ],
                    },
                ],
            }
        ],
        onSubmit: async (data) => {
            try {
                await submitAndRedirectToPayment(data);
            } catch (error: any) {
                console.error(error);
                alert(error?.response?.data?.message || 'Failed to save application.');
            }
        },
        onStepChange: async (
            step: number,
            data: any,
            meta?: { fromStep?: number; toStep?: number }
            ) => {
            const from = meta?.fromStep;
            const to = meta?.toStep;

            // Allow backward navigation (to < from)
            if (typeof from === 'number' && typeof to === 'number' && to < from) {
                return true;
            }

            // Jumping from Documents (index 4) to Payment (index 5) => submit and redirect
            if (typeof from === 'number' && typeof to === 'number' && from === 4 && to === 5) {
                await submitAndRedirectToPayment(data);
                return false;
            }

            try {
                const savedId = await saveDraft(data, step);
                if (!savedId) {
                alert('Failed to save draft.');
                return false;
                }

                if (typeof to === 'number' && to >= 0) {
                setCompletedSteps(to > 0 ? Array.from({ length: to }, (_v, i) => i) : []);
                }

                await fetchUploads();
                return true;
            } catch (error: any) {
                console.error(error);
                alert(error?.response?.data?.message || 'Failed to save draft.');
                return false;
            }
        }

    };

    return (
        <div className="max-w mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
                <p className="text-gray-500 mt-1">
                    {t("mandatoryFields")} <span style={{ color: '#dc2626' }}>*</span>
                </p>
                {(draftLoading || savingDraft) && (
                    <p className="text-xs text-gray-500 mt-2">
                        {draftLoading ? 'Loading draft...' : 'Saving draft...'}
                    </p>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <DynamicForm
                    config={localizeFormConfig(formConfig, t)}
                    defaultValues={draftValues || {}}
                    initialStep={initialStep}
                    initialCompletedSteps={completedSteps}
                />
            </div>
        </div>
    );
}
