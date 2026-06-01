import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export type FbInboxItem = {
  id: number;
  submissionId: number;
  serviceId: string;
  serviceName: string;
  unitName: string;
  investorName: string;
  department: string;
  receivedDate: string;
  status: string;
  statusLabel: string;
  actionUrl: string;
  dueAt?: string | null;
  slaBreached?: boolean;
};

export type FbInboxData = {
  items: FbInboxItem[];
  total: number;
  page: number;
  limit: number;
  counts: { pending: number; total: number };
};

export type FbInboxParams = {
  tab?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export const useFbInbox = (params?: FbInboxParams) =>
  useQuery<FbInboxData>({
    queryKey: ['fb-inbox', params?.tab || '', params?.serviceId || '', params?.page || 1, params?.limit || 20],
    enabled: params?.enabled ?? true,
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.tab)       qs.set('tab',       String(params.tab));
      if (params?.serviceId) qs.set('serviceId', String(params.serviceId));
      if (params?.page  && params.page  > 0) qs.set('page',  String(params.page));
      if (params?.limit && params.limit > 0) qs.set('limit', String(params.limit));

      const res = await apiClient.get(`/fb-dashboard/inbox?${qs.toString()}`);
      const payload = res.data as FbInboxData;
      return {
        ...payload,
        items: Array.isArray(payload?.items)
          ? payload.items.map((item) => ({
              ...item,
              serviceId:    String(item.serviceId    || ''),
              serviceName:  String(item.serviceName  || ''),
              unitName:     String(item.unitName     || ''),
              investorName: String(item.investorName || ''),
              department:   String(item.department   || ''),
              receivedDate: String(item.receivedDate || ''),
              actionUrl:    String(item.actionUrl    || ''),
            }))
          : [],
      };
    },
  });

export type FbFieldSchema = {
  fieldCode:    string;
  label:        string;
  categoryCode: string | null;
  categoryName: string;
  inputType:    string;
  gridSpan?:     number;
  preference?:   number;
};

export type FbApplicationView = {
  submissionId: number;
  status:       string;
  statusLabel:  string;
  serviceId:    string;
  serviceName:  string;
  unitName:     string;
  formData:     Record<string, unknown>;
  fieldSchema:  FbFieldSchema[];
  createdDate:  string | null;
  updatedDate:  string | null;
};

export type FbTimelineRow = {
  sequence:                         number;
  actionTakenBy:                    string;
  actionTakenOn:                    string;
  actionType:                       string;
  comments:                         string;
  forwardedTo:                      string;
  timeTakenByApplicantSeconds:      number;
  timeTakenByDepartmentSeconds:     number;
  timeTakenByLineDepartmentSeconds: number;
};

export const useFbTimeline = (submissionId?: number) =>
  useQuery<FbTimelineRow[]>({
    queryKey: ['fb-timeline', submissionId],
    enabled: !!submissionId && submissionId > 0,
    queryFn: async () => {
      const res = await apiClient.get(`/fb-dashboard/timeline?submissionId=${submissionId}`);
      return res.data;
    },
  });

export type FbPrintData = FbApplicationView & { photoUrl: string | null };

export const useFbPrintData = (submissionId?: number) =>
  useQuery<FbPrintData>({
    queryKey: ['fb-print-data', submissionId],
    enabled: !!submissionId && submissionId > 0,
    queryFn: async () => {
      const res = await apiClient.get(`/fb-dashboard/print-data?submissionId=${submissionId}`);
      return res.data;
    },
  });

export const useFbApplicationView = (submissionId?: number) =>
  useQuery<FbApplicationView>({
    queryKey: ['fb-application-view', submissionId],
    enabled: !!submissionId && submissionId > 0,
    queryFn: async () => {
      const res = await apiClient.get(`/fb-dashboard/application-view?submissionId=${submissionId}`);
      return res.data;
    },
  });

export type OfficerFormField = {
  fieldCode:   string;
  label:       string;
  inputType:   string;
  isRequired:  boolean;
  isReadonly:  boolean;
  placeholder: string | null;
  helpText:    string | null;
  gridSpan:    number;
  preference:  number;
  addMoreGroups?: any[];
  payload?:    any;
};

export type OfficerFormCategory = {
  categoryCode: string;
  categoryName: string;
  fields:       OfficerFormField[];
};

export type OfficerFormData = {
  formName:   string | null;
  formTypeId: number | null;
  step:       number | null;
  allowPaymentDemand?: boolean;
  categories: OfficerFormCategory[];
  paymentDetails?: {
    paymentId: number;
    amount: number;
    statusCode: string;
    txnStatus: string;
    created: string;
    bifurcationDetails?: any[];
  } | null;
};

export const useOfficerForm = (submissionId?: number) =>
  useQuery<OfficerFormData>({
    queryKey: ['officer-form', submissionId],
    enabled: !!submissionId && submissionId > 0,
    queryFn: async () => {
      const res = await apiClient.get(`/fb-dashboard/officer-form?submissionId=${submissionId}`);
      return res.data;
    },
  });

export type DocVerificationItem = {
  mappingId:    number;
  documentName: string;
  fileName:     string;
  status:       string;
  statusLabel:  string;
  comments:     string;
  fileUrl:      string | null;
};

export type DocVerificationData = {
  enabled:   boolean;
  documents: DocVerificationItem[];
};

export const useDocumentVerification = (submissionId?: number) =>
  useQuery<DocVerificationData>({
    queryKey: ['doc-verification', submissionId],
    enabled: !!submissionId && submissionId > 0,
    queryFn: async () => {
      const res = await apiClient.get(`/fb-dashboard/document-verification?submissionId=${submissionId}`);
      return res.data;
    },
  });

export const useFbCounts = (enabled = true) =>
  useQuery<{ byTab: Record<string, number>; total: number }>({
    queryKey: ['fb-counts'],
    enabled,
    queryFn: async () => {
      const res = await apiClient.get('/fb-dashboard/counts');
      return res.data;
    },
  });
