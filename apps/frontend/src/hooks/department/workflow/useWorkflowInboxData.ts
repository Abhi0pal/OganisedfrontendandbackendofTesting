import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

export type WorkflowInboxItem = {
  id: number;
  submissionId: number;
  serviceId: string;
  serviceName: string;
  unitName: string;
  investorName: string;
  department: string;
  receivedDate: string;
  currentStep: number;
  currentRoleId: number;
  dueAt?: string | null;
  slaBreached?: boolean;
  status: string;
  statusLabel: string;
  actionUrl: string;
};

export type WorkflowInboxData = {
  counts: {
    pending: number;
    total: number;
  };
  items: WorkflowInboxItem[];
  page: number;
  limit: number;
  total: number;
};

export type WorkflowInboxQueryParams = {
  serviceId?: string;
  page?: number;
  limit?: number;
  tab?: string;
  enabled?: boolean;
};

export const useWorkflowInboxData = (params?: WorkflowInboxQueryParams) =>
  useQuery<WorkflowInboxData>({
    queryKey: [
      "workflow-inbox-data",
      params?.tab || "",
      params?.serviceId || "",
      params?.page || 1,
      params?.limit || 20,
    ],
    enabled: params?.enabled ?? true,
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.tab) qs.set("tab", String(params.tab));
      if (params?.serviceId) qs.set("serviceId", String(params.serviceId));
      if (Number.isFinite(Number(params?.page)) && Number(params?.page) > 0) {
        qs.set("page", String(params?.page));
      }
      if (Number.isFinite(Number(params?.limit)) && Number(params?.limit) > 0) {
        qs.set("limit", String(params?.limit));
      }
      const queryString = qs.toString();
      const res = await apiClient.get(
        queryString
          ? `/fb-dashboard/inbox?${queryString}`
          : "/fb-dashboard/inbox",
      );
      const payload = res.data as WorkflowInboxData;
      return {
        ...payload,
        items: Array.isArray(payload?.items)
          ? payload.items.map((item) => ({
              ...item,
              serviceId: String(item?.serviceId || ""),
              serviceName: String(item?.serviceName || ""),
              unitName: String(item?.unitName || ""),
              investorName: String(item?.investorName || ""),
              department: String(item?.department || ""),
              receivedDate: String(item?.receivedDate || ""),
              actionUrl: String(item?.actionUrl || ""),
            }))
          : [],
      };
    },
  });
