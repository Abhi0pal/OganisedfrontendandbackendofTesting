"use client";

import KnowYourIncentiveForm from "./KnowYourIncentiveForm";
import apiClient from "@/lib/api-client";

export default function KnowYourIncentivePage() {
  const handleSubmit = async (queryString: string) => {
    try {
      const res = await apiClient.get(
        `/know-your-incentive/filter?${queryString}`
      );
      return res.data || [];
    } catch (error: any) {
      console.error("Fetch error:", error);
      return {
        error: error.response?.data?.message || "Failed to fetch results",
      };
    }
  };

  return <KnowYourIncentiveForm submitAction={handleSubmit} />;
}
