"use client";

import IncentiveCalculatorForm from "./IncentiveCalculatorForm";
import apiClient from "@/lib/api-client";

export default function IncentiveCalculatorPage() {
  /**
   * Handles form submission using the centralized apiClient.
   * Converts the payload into a query string for GET requests.
   */
  const handleSubmit = async (payload: any) => {
    try {
      // 1. Check if comparison is requested
      const isComparison = payload.policy_id_1 && payload.policy_id_2;

      // 2. Prepare the correct endpoint and payload transformation
      let endpoint = "";
      let finalParams = { ...payload };

      if (isComparison) {
        endpoint = "/incentive-calculator/compare";
      } else {
        endpoint = "/incentive-calculator/filter";

        // Transform policy_id_1 to policy_id for the single filter API
        const { policy_id_1, policy_id_2, policy_id_3, policy_id_4, ...rest } =
          payload;
        finalParams = {
          ...rest,
          policy_id: policy_id_1,
        };
      }

      // 3. Convert the object to a URL Query String
      // Filtering out null/undefined values to keep the URL clean
      const cleanParams = Object.fromEntries(
        Object.entries(finalParams).filter(([_, v]) => v != null && v !== "")
      );
      const queryString = new URLSearchParams(cleanParams as any).toString();

      // 4. Execute the GET request using apiClient
      const res = await apiClient.get(`${endpoint}?${queryString}`);

      // Axios returns data in the .data property
      return res.data || [];
    } catch (error: any) {
      console.error("Submission error:", error);
      return {
        error: error.response?.data?.message || "Failed to fetch results",
      };
    }
  };

  return <IncentiveCalculatorForm submitAction={handleSubmit} />;
}
