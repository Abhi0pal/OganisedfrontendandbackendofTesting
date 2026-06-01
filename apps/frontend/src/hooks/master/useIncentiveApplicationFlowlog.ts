import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

/* =========================
   ENUMS (Aligned with Prisma)
========================= */

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PAYMENT"
  | "PAYMENT_DONE"
  | "FORWARDED"
  | "FORWARDED_DISTRICT"
  | "FORWARDED_DEPARTMENT"
  | "RAISE_QUERY"
  | "REVERTED"
  | "REVERT_BACK"
  | "APPROVED"
  | "CONDITIONALLY_APPROVE"
  | "REJECTED"
  | "FORWARDED_TO_SLEC"
  | "FORWARD_FOR_DISBURSEMENT"
  | "DISBURSED"
  | "ARCHIVED";

export type ApprovalStatus = "V" | "P";

export type RecordStatus = "Y" | "N";

export type RecommendationStatus = "recommended" | "not_recommended";

/* =========================
   SCHEMA / INTERFACE
========================= */

export interface IncentiveApplicationFlowlog {
  id: number;

  applicationId: number;
  currentRoleId: number;
  nextRoleId?: number | null;
  userId?: number | null;

  approvedAmountByDepartment?: string | null;
  remarks?: string | null;
  delayRemarks?: string | null;
  additionalPostData?: string | null;

  approvalStatus: ApprovalStatus;
  actionStatus: ApplicationStatus;

  userAgent?: string | null;
  remoteIpAddress?: string | null;

  status: RecordStatus;

  createdDate?: string | null;
  modifiedOn: string;

  file?: string | null;
  uploadedFileName?: string | null;

  approvedIncentive?: any;
  recommendation?: RecommendationStatus | null;
}

/* =========================
   QUERY: LIST FLOWLOGS
========================= */

export const useIncentiveApplicationFlowlogs = (filters?: {
  applicationId?: number;
  actionStatus?: ApplicationStatus;
}) => {
  return useQuery({
    queryKey: ["incentive-application-flowlog", filters],
    enabled: !!filters?.applicationId,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.applicationId) {
        params.append("applicationId", filters.applicationId.toString());
      }

      if (filters?.actionStatus) {
        params.append("actionStatus", filters.actionStatus);
      }

      const res = await apiClient.get(
        `/incentive-application-flowlog?${params.toString()}`
      );

      return res.data as IncentiveApplicationFlowlog[];
    },
  });
};

/* =========================
   QUERY: SINGLE FLOWLOG
========================= */

export const useIncentiveApplicationFlowlog = (id?: number) => {
  return useQuery({
    queryKey: ["incentive-application-flowlog", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(
        `/incentive-application-flowlog/${id}`
      );
      return res.data as IncentiveApplicationFlowlog;
    },
  });
};

/* =========================
   MUTATION: CREATE FLOWLOG
========================= */

export const useCreateIncentiveApplicationFlowlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Partial<IncentiveApplicationFlowlog>
    ) => {
      const res = await apiClient.post(
        "/incentive-application-flowlog",
        data
      );
      return res.data as IncentiveApplicationFlowlog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incentive-application-flowlog"],
      });

      if (variables.applicationId) {
        queryClient.invalidateQueries({
          queryKey: [
            "incentive-application-flowlog",
            { applicationId: variables.applicationId },
          ],
        });
      }
    },
  });
};

/* =========================
   MUTATION: UPDATE FLOWLOG
========================= */

export const useUpdateIncentiveApplicationFlowlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<IncentiveApplicationFlowlog>;
    }) => {
      const res = await apiClient.put(
        `/incentive-application-flowlog/${id}`,
        data
      );
      return res.data as IncentiveApplicationFlowlog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incentive-application-flowlog", variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["incentive-application-flowlog"],
      });
    },
  });
};

/* =========================
   MUTATION: DELETE FLOWLOG
========================= */

export const useDeleteIncentiveApplicationFlowlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(
        `/incentive-application-flowlog/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["incentive-application-flowlog"],
      });
    },
  });
};
