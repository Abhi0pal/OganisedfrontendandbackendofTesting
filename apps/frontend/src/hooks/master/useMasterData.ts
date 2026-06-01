import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

//  Departments
export const useDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.get(
        "/master/data?master_code=DEPARTMENT"
      );
      return res.data;
    },
  });
};

//  SubDepartments
export const useSubDepartments = () => {
  return useQuery({
    queryKey: ["subDepartments"],
    queryFn: async () => {
      const res = await apiClient.get(
        "/master/data?master_code=SUB_DEPARTMENT"
      );
      return res.data;
    },
  });
};