import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

// ===================================
// Types
// ===================================

export interface InspectionChecklistItem {
    id: number;
    title: string;
    type: string;
    isMandatory: boolean;
}

export interface InspectionChecklist {
    id: number;
    serviceId: number;
    version: string;
    items: InspectionChecklistItem[];
    service?: {
        service_name: string;
    }
}

export interface InspectionObservation {
    id: string;
    observationText: string;
    severity: string;
    status: string;
    checklistItemId?: number;
    evidenceUrl?: string[];
    responses?: InspectionObservationResponse[];
    createdAt: string;
}

export interface InspectionObservationResponse {
    id: string;
    message: string;
    attachments: string[];
    isInternal: boolean;
    createdAt: string;
}

export interface InspectionTransaction {
    id: string;
    applicationId: string;
    serviceId: number;
    status: string;
    scheduledDate: string;
    inspectionDate?: string;
    inspectorType: string;
    departmentInspectorId?: string;
    thirdPartyInspectorId?: number;
    reportUploadedAt?: string;
    reportPublishedAt?: string;
    aiSummary?: string;
    service: {
        id: number;
        service_name: string;
        service_id: string;
        department?: {
            id: number;
            name: string;
            abbreviation?: string;
        };
    };
    checklist?: InspectionChecklist;
    observations: InspectionObservation[];
    evidence?: { id: string; fileType: string; fileUrl: string }[];
    createdAt: string;
    updatedAt: string;
}

// ===================================
// Checklist Hooks (Admin)
// ===================================

export const useInspectionChecklists = (serviceId?: number) => {
    return useQuery({
        queryKey: ['inspection-checklists', serviceId],
        queryFn: async () => {
            const params = serviceId ? { serviceId } : {};
            const response = await apiClient.get('/inspections/checklists', { params });
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        },
    });
};

export const useInspectionChecklist = (id: number) => {
    return useQuery({
        queryKey: ['inspection-checklist', id],
        queryFn: async () => {
            const response = await apiClient.get(`/inspections/checklists/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
};

export const useCreateInspectionChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post('/inspections/checklists', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-checklists'] });
        },
    });
};

export const useUpdateInspectionChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiClient.put(`/inspections/checklists/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-checklists'] });
        },
    });
};

export const useDeleteInspectionChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiClient.delete(`/inspections/checklists/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-checklists'] });
        },
    });
};

// ===================================
// Checklist Hooks (JD Portal)
// ===================================

export const useJDInspectionChecklists = (serviceId?: number) => {
    return useQuery({
        queryKey: ['jd-inspection-checklists', serviceId],
        queryFn: async () => {
            const params = serviceId ? { serviceId } : {};
            const response = await apiClient.get('/inspections/jd-portal/checklists', { params });
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        },
    });
};

export const useJDInspectionChecklist = (id: number) => {
    return useQuery({
        queryKey: ['jd-inspection-checklist', id],
        queryFn: async () => {
            const response = await apiClient.get(`/inspections/jd-portal/checklists/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
};

export const useJDCreateInspectionChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post('/inspections/jd-portal/checklists', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jd-inspection-checklists'] });
        },
    });
};

export const useJDUpdateInspectionChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiClient.put(`/inspections/jd-portal/checklists/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jd-inspection-checklists'] });
        },
    });
};

export const useJDDeleteInspectionChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiClient.delete(`/inspections/jd-portal/checklists/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jd-inspection-checklists'] });
        },
    });
};

// ===================================
// Inspection Transaction Hooks (Investor)
// ===================================

export const useMyInspections = () => {
    return useQuery<InspectionTransaction[]>({
        queryKey: ['my-inspections'],
        queryFn: async () => {
            const response = await apiClient.get('/inspections/my-inspections');
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        },
    });
};

export const useInspectionDetail = (id: string) => {
    return useQuery<InspectionTransaction>({
        queryKey: ['inspection-detail', id],
        queryFn: async () => {
            const response = await apiClient.get(`/inspections/transactions/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
};

export const useRespondToObservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ observationId, message, attachments }: { observationId: string; message: string; attachments?: string[] }) =>
            apiClient.post(`/inspections/observations/${observationId}/respond`, { message, attachments }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-inspections'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-detail'] });
        },
    });
};

export const useChecklistResponses = (inspectionId: string) => {
    return useQuery<InspectionChecklistResponse[]>({
        queryKey: ['checklist-responses', inspectionId],
        queryFn: async () => {
            const response = await apiClient.get(`/inspections/transactions/${inspectionId}/checklist-responses`);
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        },
        enabled: !!inspectionId,
    });
};

export const useSubmitChecklistResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            inspectionId,
            checklistItemId,
            responseValue,
            remarks,
            evidenceUrls,
            evidenceFiles
        }: {
            inspectionId: string;
            checklistItemId: number;
            responseValue: string;
            remarks?: string;
            evidenceUrls?: string[];
            evidenceFiles?: { name: string; type: string; base64: string }[];
        }) =>
            apiClient.post(`/inspections/transactions/${inspectionId}/checklist-responses/single`, {
                checklistItemId,
                response: responseValue,
                remarks,
                evidenceUrls,
                evidenceFiles
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['checklist-responses', variables.inspectionId] });
            queryClient.invalidateQueries({ queryKey: ['inspection-detail', variables.inspectionId] });
        },
    });
};

// ===================================
// SWS: Inspector Workflow Hooks
// ===================================

export interface InspectionChecklistResponse {
    id: string;
    checklistItemId: number;
    response: string;
    remarks?: string;
    evidenceUrls: string[];
    respondedAt: string;
}

export interface InspectionEvidence {
    id: string;
    checklistItemId?: number;
    fileType: string;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    geoTag?: { lat: number; lng: number };
    uploaderRole: string;
    createdAt: string;
}

export interface InspectionFeedback {
    id: string;
    rating: number;
    comment?: string;
    submittedAt: string;
}

export interface InspectionAuditLog {
    id: string;
    action: string;
    fromValue?: string;
    toValue?: string;
    performedAt: string;
}

export interface InspectionAnalytics {
    statusCounts: Record<string, number>;
    slaMetrics: {
        compliant: number;
        breached: number;
        complianceRate: string | number;
    };
    avgTimeToReportHours: string;
    riskDistribution: Record<string, number>;
    totalInspections: number;
}

// Extended transaction type for inspector view
export interface InspectionTransactionExtended extends InspectionTransaction {
    riskCategory?: string;
    applicantViewedAt?: string;
    reportUploadedAt?: string;
    checklistResponses?: InspectionChecklistResponse[];
    evidence?: InspectionEvidence[];
    feedback?: InspectionFeedback;
}

export const useAssignedInspections = () => {
    return useQuery<InspectionTransactionExtended[]>({
        queryKey: ['assigned-inspections'],
        queryFn: async () => {
            const response = await apiClient.get('/inspections/assigned');
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        },
    });
};

export const useSubmitChecklistResponses = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ inspectionId, responses }: {
            inspectionId: string;
            responses: Array<{
                checklistItemId: number;
                response: string;
                remarks?: string;
                evidenceUrls?: string[];
            }>;
        }) => apiClient.post(`/inspections/transactions/${inspectionId}/checklist-responses`, { responses }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assigned-inspections'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-detail'] });
        },
    });
};

export const useFinalizeReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (inspectionId: string) =>
            apiClient.post(`/inspections/transactions/${inspectionId}/finalize`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assigned-inspections'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-detail'] });
        },
    });
};

// ===================================
// SWS: Evidence Hooks
// ===================================

export const useUploadInspectorEvidence = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ inspectionId, data }: {
            inspectionId: string;
            data: {
                checklistItemId?: number;
                fileType: string;
                fileUrl: string;
                fileName?: string;
                fileSize?: number;
                geoTag?: { lat: number; lng: number };
            };
        }) => apiClient.post(`/inspections/inspector/transactions/${inspectionId}/evidence`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-detail'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-evidence'] });
        },
    });
};

export const useDeleteInspectorEvidence = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ inspectionId, fileUrl }: { inspectionId: string; fileUrl: string }) =>
            apiClient.delete(`/inspections/inspector/transactions/${inspectionId}/evidence`, { params: { fileUrl } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-detail'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-evidence'] });
        },
    });
};

export const useFileUpload = () => {
    return useMutation({
        mutationFn: (formData: FormData) => apiClient.post('/upload/evidence', formData),
    });
};

export const useUploadEvidence = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ inspectionId, data }: {
            inspectionId: string;
            data: {
                checklistItemId?: number;
                fileType: string;
                fileUrl: string;
                fileName?: string;
                fileSize?: number;
                geoTag?: { lat: number; lng: number };
            };
        }) => apiClient.post(`/inspections/transactions/${inspectionId}/evidence`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-detail'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-evidence'] });
        },
    });
};

export const useInspectionEvidence = (inspectionId: string) => {
    return useQuery<InspectionEvidence[]>({
        queryKey: ['inspection-evidence', inspectionId],
        queryFn: async () => {
            const response = await apiClient.get(`/inspections/transactions/${inspectionId}/evidence`);
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        },
        enabled: !!inspectionId,
    });
};

// ===================================
// SWS: Feedback Hooks
// ===================================

export const useSubmitFeedback = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ inspectionId, rating, comment }: {
            inspectionId: string;
            rating: number;
            comment?: string;
        }) => apiClient.post(`/inspections/transactions/${inspectionId}/feedback`, { rating, comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-detail'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-feedback'] });
        },
    });
};

export const useInspectionFeedback = (inspectionId: string) => {
    return useQuery<InspectionFeedback | null>({
        queryKey: ['inspection-feedback', inspectionId],
        queryFn: async () => {
            const response = await apiClient.get(`/inspections/transactions/${inspectionId}/feedback`);
            return response.data;
        },
        enabled: !!inspectionId,
    });
};

// ===================================
// SWS: Audit Log Hooks
// ===================================

export const useInspectionAuditLogs = (inspectionId: string) => {
    return useQuery<InspectionAuditLog[]>({
        queryKey: ['inspection-audit-logs', inspectionId],
        queryFn: async () => {
            const response = await apiClient.get(`/inspections/transactions/${inspectionId}/audit-logs`);
            return Array.isArray(response.data) ? response.data : response.data.data || [];
        },
        enabled: !!inspectionId,
    });
};

// ===================================
// SWS: Analytics Hooks (CIS Dashboard)
// ===================================

export const useInspectionAnalytics = (departmentId?: number) => {
    return useQuery<InspectionAnalytics>({
        queryKey: ['inspection-analytics', departmentId],
        queryFn: async () => {
            const params = departmentId ? { departmentId } : {};
            const response = await apiClient.get('/inspections/analytics', { params });
            return response.data;
        },
    });
};

// ===================================
// SWS: Mark Viewed
// ===================================

export const useMarkInspectionViewed = () => {
    return useMutation({
        mutationFn: (inspectionId: string) =>
            apiClient.post(`/inspections/transactions/${inspectionId}/mark-viewed`),
    });
};

// ===================================
// CIS DASHBOARD HOOKS
// ===================================

export interface CISDepartmentStats {
    id: number;
    name: string;
    fullName: string;
    planned: number;
    completed: number;
    pending: number;
    reschedulePending: number;
    overdue: number;
    sla: number;
}

export interface CISRiskDistribution {
    name: string;
    value: number;
}

export interface CISDashboardData {
    departments: CISDepartmentStats[];
    riskDistribution: CISRiskDistribution[];
    totals: {
        planned: number;
        completed: number;
        pending: number;
        reschedulePending: number;
        overdue: number;
        sla: number;
    };
    financialYear: string;
}

export interface CISInspectionReportItem {
    id: string;
    sno: number;
    inspectionId: string;
    generationDate: string;
    districtName: string;
    unitName: string;
    address: string;
    contact: string;
    department: string;
    departmentId: number;
    inspectorName: string;
    allocationDate: string | null;
    inspectionType: string;
    isThirdParty: boolean;
    completionDate: string | null;
    reportStatus: string;
    hasMedia: boolean;
    investorFeedback: number | null;
    complianceScore: number | null;
    riskCategory: string;
    slaStatus: string;
    slaDueDate: string | null;
    feeDetails: string | null;
    totalFeeCharge: number | null;
    rescheduleRequested?: boolean;
    rescheduleReason?: string;
    financialYear: string;
}

export interface CISReportResponse {
    data: CISInspectionReportItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CISReportFilters {
    financialYear?: string;
    departmentId?: number;
    districtId?: number;
    riskCategory?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    rescheduleRequested?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export const useCISDashboard = (financialYear: string = '2025-2026') => {
    return useQuery<CISDashboardData>({
        queryKey: ['cis-dashboard', financialYear],
        queryFn: async () => {
            const response = await apiClient.get('/inspections/cis/dashboard', {
                params: { financialYear }
            });
            return response.data;
        },
    });
};

export const useCISReport = (filters: CISReportFilters = {}) => {
    return useQuery<CISReportResponse>({
        queryKey: ['cis-report', filters],
        queryFn: async () => {
            const response = await apiClient.get('/inspections/cis/report', { params: filters });
            return response.data;
        },
    });
};

export const useCISDistricts = () => {
    return useQuery<{ id: number; name: string }[]>({
        queryKey: ['cis-districts'],
        queryFn: async () => {
            const response = await apiClient.get('/inspections/cis/districts');
            return Array.isArray(response.data) ? response.data : [];
        },
    });
};

export const useCISDepartments = () => {
    return useQuery<{ id: number; name: string; abbreviation: string }[]>({
        queryKey: ['cis-departments'],
        queryFn: async () => {
            const response = await apiClient.get('/inspections/cis/departments');
            return Array.isArray(response.data) ? response.data : [];
        },
    });
};

export interface CISInspector {
    id: string;
    name: string;
    designation: string;
    email: string;
    mobile: string;
    departmentId: number;
    score?: number;
    stats?: {
        active: number;
        overdue: number;
    };
}

export const useRecommendedInspector = () => {
    return useMutation<{ inspector: CISInspector; reason: string; score: number }, Error, { departmentId: number; type: 'DEPARTMENT_OFFICIAL' | 'THIRD_PARTY'; districtId?: number }>({
        mutationFn: async ({ departmentId, type, districtId }) => {
            const response = await apiClient.get('/inspections/cis/inspectors/recommend', {
                params: { departmentId, inspectorType: type, districtId }
            });
            return response.data;
        },
    });
};

// Interface for CIS Inspection Detail
export interface CISInspectionDetail {
    id: string;
    inspectionId: string;
    financialYear: string;
    status: string;
    inspectionType: string;
    isThirdParty: boolean;
    unit: {
        submissionId?: string; // Backend might not return this if not mapped, but safe to keep optional
        name: string;
        address: string;
        contactPerson: string;
        contactNumber: string;
        email: string;
        sector: string;
        category: string;
        investmentAmount?: number;
        employmentGenerated?: number;
    };
    location: {
        district: string;
        districtId?: number;
        block: string;
        village: string;
    };
    department: {
        id?: number;
        name?: string;
        abbreviation?: string;
    };
    service: {
        id?: number;
        name?: string;
        serviceId?: string;
    };
    inspector?: {
        id: string;
        name: string;
        email: string;
        mobile?: string;
    } | null;
    thirdPartyInspector?: {
        id: number;
        firmName: string;
        contactPerson: string;
        email: string;
        phone: string;
        accreditationNumber?: string;
    } | null;

    // Flattened fields as per backend response
    riskCategory: string;
    complianceScore?: number;
    priority: string;

    scheduledDate?: string;
    allocatedAt?: string;
    startedAt?: string;
    completedAt?: string;

    slaDueDate?: string;
    slaDays?: number;
    slaBreached: boolean;

    checklist?: {
        id: number;
        name: string;
        description?: string;
        items: Array<{
            id: number;
            question: string;
            description?: string;
            responseType: string;
            isMandatory: boolean;
            displayOrder: number;
            response?: {
                id: string;
                response: string;
                remarks?: string;
                evidenceUrls?: string[];
            } | null;
        }>;
    } | null;

    // These might be needed if backend returns them separately, but backend seems to return checklist.items.response
    checklistResponses?: any[];

    observations: Array<{
        id: string;
        title: string;
        description: string;
        severity: string;
        status: string;
        createdAt: string;
        responses: Array<{
            id: string;
            message: string;
            responderType: string;
            createdAt: string;
        }>;
    }>;

    evidence: Array<{
        id: string;
        fileType: string;
        fileUrl: string;
        fileName?: string;
        fileSize?: number;
        geoLat?: number;
        geoLng?: number;
        capturedAt?: string;
        createdAt: string;
    }>;

    feedback?: {
        rating: number;
        comment?: string;
        submittedAt: string;
    } | null;

    feeDetails?: any;
    totalFeeCharge?: number | null;

    timeline: Array<{
        id: string;
        action: string;
        fromValue?: string;
        toValue?: string;
        performedBy?: string;
        createdAt: string;
        details?: any;
    }>;

    comments?: string;
    rescheduleRequested?: boolean;
    rescheduleReason?: string;
}

export const useCISInspectionDetail = (id: string) => {
    return useQuery<CISInspectionDetail>({
        queryKey: ['cis-inspection-detail', id],
        queryFn: async () => {
            const response = await apiClient.get(`/inspections/cis/detail/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
};

// ===================================
// CIS SCHEDULING HOOKS
// ===================================

export interface CISUnit {
    id: number;
    applicationId: string;
    name: string;
    district: string;
    districtId: number;
    sector: string;
    address: string;
    contact: string;
}

export interface CISInspector {
    id: string;
    name: string;
    email: string;
    mobile: string;
    activeInspections: number;
}

export const useCISUnits = (districtId?: number) => {
    return useQuery<CISUnit[]>({
        queryKey: ['cis-units', districtId],
        queryFn: async () => {
            const params = districtId ? { districtId } : {};
            const response = await apiClient.get('/inspections/cis/units', { params });
            return Array.isArray(response.data) ? response.data : [];
        },
        enabled: districtId !== undefined,
    });
};

export const useCISInspectors = (departmentId: number, inspectorType: 'DEPARTMENT' | 'THIRD_PARTY' = 'DEPARTMENT', districtId?: number) => {
    return useQuery<{ id: string; name: string; activeInspections: number; type?: string }[]>({
        queryKey: ['cis-inspectors', departmentId, inspectorType, districtId],
        queryFn: async () => {
            const type = inspectorType === 'THIRD_PARTY' ? 'THIRD_PARTY' : 'DEPARTMENT_OFFICIAL';
            const response = await apiClient.get(`/inspections/cis/inspectors/${departmentId}`, {
                params: { inspectorType: type, districtId }
            });
            const data = Array.isArray(response.data) ? response.data : [];
            // Normalize the response to match expected format
            return data.map((insp: any) => ({
                id: String(insp.id),
                name: insp.name || insp.organization || 'Unknown',
                activeInspections: insp.currentActiveTasks || 0,
                type: insp.type
            }));
        },
        enabled: departmentId > 0,
    });
};

export interface InspectorScheduleEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
}

export const useRescheduleInspection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, date, reason }: { id: string; date: string; reason?: string }) => {
            const response = await apiClient.post('/inspections/cis/reschedule', {
                inspectionId: id,
                newDate: date,
                reason
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cis-report'] });
            queryClient.invalidateQueries({ queryKey: ['cis-dashboard'] });
        }
    });
};

export const useRequestReschedule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            const response = await apiClient.post('/inspections/inspector/request-reschedule', {
                inspectionId: id,
                reason
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspector-dashboard'] });
        }
    });
};

export const useInspectorSchedule = (inspectorId: string | number | null) => {
    return useQuery<InspectorScheduleEvent[]>({
        queryKey: ['inspector-schedule', inspectorId],
        queryFn: async () => {
            if (!inspectorId) return [];

            try {
                const response = await apiClient.get(`/inspections/cis/inspectors/${inspectorId}/schedule`);
                const events = Array.isArray(response.data) ? response.data : [];

                return events.map((event: any) => ({
                    id: event.id,
                    title: event.title,
                    start: new Date(event.start),
                    end: new Date(event.end),
                    allDay: event.allDay || false,
                    status: event.status
                }));
            } catch (error) {
                console.error('Failed to fetch inspector schedule:', error);
                return [];
            }
        },
        enabled: !!inspectorId,
    });
};

export interface ScheduleInspectionData {
    unitId: number;
    inspectionType: 'SINGLE' | 'JOINT';
    departmentIds: number[];
    inspectorAssignments?: Record<number, string>;
    scheduledDate: string;
    comments?: string;
}

export const useScheduleInspection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ScheduleInspectionData) =>
            apiClient.post('/inspections/cis/schedule', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cis-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['cis-report'] });
        },
    });
};

// ===================================
// CIS INSPECTION DETAIL
// ===================================





// ===================================
// INSPECTOR DASHBOARD HOOKS
// ===================================

export interface InspectorDashboardStats {
    scheduled: number;
    active: number;
    completed: number;
    slaBreached: number;
    total: number;
}

export interface InspectorDashboardResponse {
    stats: InspectorDashboardStats;
    data: any[];
}

export const useInspectorDashboard = (status?: string) => {
    return useQuery<InspectorDashboardResponse>({
        queryKey: ['inspector-dashboard', status],
        queryFn: async () => {
            const params = status ? { status } : {};
            const response = await apiClient.get('/inspections/inspector/dashboard', { params });
            return response.data;
        },
    });
};

export const useSubmitReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) =>
            apiClient.post('/inspections/inspector/submit-report', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspector-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['cis-inspection-detail'] });
        },
    });
};

// ===================================
// AI: SMART OBSERVATION GENERATOR
// ===================================

export const useGenerateObservations = () => {
    return useMutation<
        { observations: Array<{ observationText: string; severity: string; relatedChecklistItem: number }>; message: string },
        Error,
        {
            inspectionId: string;
            responses: Array<{
                checklistItemId: number;
                response: string;
                remarks?: string;
                question?: string;
            }>;
        }
    >({
        mutationFn: async (data) => {
            const response = await apiClient.post('/inspections/inspector/generate-observations', data);
            return response.data;
        },
    });
};

export const useGenerateRecommendation = () => {
    return useMutation<
        { recommendation: string },
        Error,
        {
            inspectionId: string;
            unitName?: string;
            responses: Array<{
                checklistItemId: number;
                response: string;
                remarks?: string;
                question?: string;
            }>;
        }
    >({
        mutationFn: async (data) => {
            const response = await apiClient.post('/inspections/inspector/generate-recommendation', data);
            return response.data;
        },
    });
};
// ===================================
// AI: ENTERPRISE PDF CHECKLIST GENERATOR
// ===================================

export const useGenerateFromPdf = () => {
    return useMutation({
        mutationFn: async (data: { file: File; steeringInstructions?: string }) => {
            const formData = new FormData();
            formData.append('file', data.file);
            if (data.steeringInstructions) {
                formData.append('steeringInstructions', data.steeringInstructions);
            }
            const response = await apiClient.post('/inspections/cis/generate-checklist-from-pdf', formData, {
                timeout: 120000,
            });
            return response.data;
        },
    });
};
