import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

/* =========================
   TYPES
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

export interface IncentiveApplicationSubmission {
  id: number;
  userId: number;
  incentiveId: number;
  departmentId: number;

  cafId?: number;
  parentAppId?: number;
  districtId?: number;
  unitName?: string;
  registrationNo?: string;

  postData: any;
  applicationStatus: ApplicationStatus;
  status: string;

  installmentNo?: number;
  fy?: string;

  createdOn: string;
  modifiedOn?: string;
}

/* =========================
   QUERY: LIST APPLICATIONS
========================= */

export const useIncentiveApplicationSubmissions = (filters?: {
  incentiveId?: number;
  applicationStatus?: ApplicationStatus;
  userId?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ["incentive-application-submission", filters],
    enabled: filters?.enabled ?? !!filters?.userId,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.incentiveId) {
        params.append("incentiveId", filters.incentiveId.toString());
      }

      if (filters?.applicationStatus) {
        params.append("applicationStatus", filters.applicationStatus);
      }

      if (filters?.userId) {
        params.append("userId", filters.userId.toString());
      }

      const res = await apiClient.get(
        `/incentive-application-submission?${params.toString()}`
      );

      return res.data as IncentiveApplicationSubmission[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

/* =========================
   QUERY: SINGLE APPLICATION
========================= */

export const useIncentiveApplicationSubmission = (id?: number) => {
  return useQuery({
    queryKey: ["incentive-application-submission", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(
        `/incentive-application-submission/${id}`
      );
      return res.data as IncentiveApplicationSubmission;
    },
  });
};

/* =========================
   MUTATION: CREATE / UPSERT
========================= */

export const useCreateIncentiveApplicationSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(
        "/incentive-application-submission",
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["incentive-application-submission"],
      });
    },
  });
};

/* =========================
   MUTATION: UPDATE
========================= */

export const useUpdateIncentiveApplicationSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: any;
    }) => {
      const res = await apiClient.put(
        `/incentive-application-submission/${id}`,
        data
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incentive-application-submission", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["incentive-application-submission"],
      });
    },
  });
};

/* =========================
   MUTATION: DELETE
========================= */

export const useDeleteIncentiveApplicationSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(
        `/incentive-application-submission/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["incentive-application-submission"],
      });
    },
  });
};
