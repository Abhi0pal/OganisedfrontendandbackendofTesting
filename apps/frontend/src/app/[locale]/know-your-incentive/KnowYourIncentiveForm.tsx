"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useTranslations } from "next-intl"; // Added translation hook

interface KnowYourIncentiveFormProps {
  submitAction: (queryString: string) => Promise<any>;
}

interface MasterEndpoints {
  applyingFor: string;
  sector: string;
  subSector: string;
  policy: string;
  category: string;
  unitLocation: string;
  blocks: string;
}

/** Hook to fetch master data */
const useMasterData = (endpoint: string) => {
  return useQuery({
    queryKey: ["master", endpoint],
    queryFn: async () => {
      const res = await apiClient.get(`/master/${endpoint}`);
      return res.data;
    },
  });
};

/** Hook to fetch mapped MSME options for a policy */
const usePolicyMsme = (policyId: string | undefined) => {
  return useQuery({
    queryKey: ["policyMsme", policyId],
    queryFn: async () => {
      if (!policyId) return [];
      // Updated the URL to match /policy/:id/msme-year
      const res = await apiClient.get(
        `/know-your-incentive/policy/${policyId}/msme-year`
      );
      return res.data || [];
    },
    enabled: !!policyId,
  });
};

export default function KnowYourIncentiveForm({
  submitAction,
}: KnowYourIncentiveFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [results, setResults] = useState<any[]>([]);
  const [filteredSubSectors, setFilteredSubSectors] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("KnowYourIncentive"); // Initialize translation
  const masterEndpoints: MasterEndpoints = {
    applyingFor: "unit-types",
    sector: "sectors",
    subSector: "sub-sectors",
    policy: "policies",
    category: "unit-categories",
    unitLocation: "land-categories",
    blocks: "blocks",
  };

  /** Fetch all master data using React Query */
  const masters: any = {};
  Object.entries(masterEndpoints).forEach(([key, endpoint]) => {
    const query = useMasterData(endpoint);
    masters[key] = query.data || [];
  });

  /** Fetch MSME options based on selected policy */
  const { data: msmeOptions = [] } = usePolicyMsme(formData.policy_id);

  /** Filter sub-sectors based on selected sector */
  useEffect(() => {
    if (!formData.sector_value) {
      setFilteredSubSectors([]);
      return;
    }
    const filtered = masters.subSector?.filter(
      (item: any) =>
        item.sector && String(item.sector.id) === String(formData.sector_value)
    );
    setFilteredSubSectors(filtered || []);
  }, [formData.sector_value, masters.subSector]);

  /** Filter categories based on selected MSME year ID */
  useEffect(() => {
    // We check against msme_year_value because that is the name assigned to the select input
    if (!formData.msme_year_value) {
      setFilteredCategories([]);
      return;
    }

    const selectedMsmeId = String(formData.msme_year_value);

    // Filtering masters.category based on msmeYearId in your JSON data
    const filtered = masters.category.filter(
      (c: any) => String(c.msmeYearId) === selectedMsmeId
    );

    setFilteredCategories(filtered || []);
  }, [formData.msme_year_value, masters.category]);

  /** Handle form input changes */
  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    if (name === "sector_value") {
      setFormData((prev: any) => ({
        ...prev,
        sector_value: value,
        sub_sector_value: "",
      }));
    } else if (name === "policy_id") {
      setFormData((prev: any) => ({
        ...prev,
        policy_id: value,
        msme_year_value: "",
        unit_category_value: "",
      }));
    } else if (name === "msme_year_value") {
      setFormData((prev: any) => ({
        ...prev,
        msme_year_value: value,
        unit_category_value: "",
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  /** Submit form using React Query mutation */
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const queryString = new URLSearchParams(formData).toString();
      return submitAction(queryString);
    },
    onMutate: () => {
      setIsSubmitting(true);
      setError(null);
      setResults([]);
    },
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (err: any) => {
      setError(err?.message || "Something went wrong");
    },
    onSettled: () => setIsSubmitting(false),
  });

  if (Object.values(masters).some((m) => !m))
    return <div className="p-5">{t("loading")}</div>;

  return (
    <div className="p-5 mt-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="bg-white p-4 rounded shadow border"
      >
        <h5 className="mb-4">{t("title")}</h5>
        {error && (
          <div className="alert alert-danger py-2">{t("errorMessage")}</div>
        )}

        {/* Form grid */}
        <div className="row g-3">
          {/* Applying For */}
          <div className="col-12 col-md-3">
            <label className="form-label">{t("applyingFor")} *</label>
            <select
              name="unit_type_value"
              value={formData.unit_type_value || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.applyingFor.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div className="col-12 col-md-3">
            <label className="form-label">{t("industryType")} *</label>
            <select
              name="sector_value"
              value={formData.sector_value || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.sector.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Sector */}
          {formData.sector_value && filteredSubSectors.length > 0 && (
            <div className="col-12 col-md-3">
              <label className="form-label">{t("subSector")} *</label>
              <select
                name="sub_sector_value"
                value={formData.sub_sector_value || ""}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">{t("selectPlaceholder")}</option>
                {filteredSubSectors.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Policy */}
          <div className="col-12 col-md-3">
            <label className="form-label">{t("policyLabel")} *</label>
            <select
              name="policy_id"
              value={formData.policy_id || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.policy.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.policy_name}
                </option>
              ))}
            </select>
          </div>

          {/* MSME */}
          {msmeOptions.length > 0 && (
            <div className="col-12 col-md-3">
              <label className="form-label">{t("isMsmeLabel")} *</label>
              <select
                name="msme_year_value"
                value={formData.msme_year_value || ""}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">{t("selectPlaceholder")}</option>
                {msmeOptions.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          {formData.msme_year_value && filteredCategories.length > 0 && (
            <div className="col-12 col-md-3">
              <label className="form-label">{t("categoryLabel")} *</label>
              <select
                name="unit_category_value"
                value={formData.unit_category_value || ""}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">{t("selectPlaceholder")}</option>
                {filteredCategories.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Unit Location */}
          <div className="col-12 col-md-3">
            <label className="form-label">{t("unitLocationLabel")} *</label>
            <select
              name="land_type_value"
              value={formData.land_type_value || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.unitLocation.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Block */}
          <div className="col-12 col-md-3">
            <label className="form-label">{t("blockLabel")} *</label>
            <select
              name="block_value"
              value={formData.block_value || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.blocks.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-3 d-flex justify-content-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary rounded-5"
          >
            {isSubmitting ? t("checkingBtn") : t("checkIncentiveBtn")}{" "}
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="mt-4">
        <div className="bg-white p-3 rounded shadow border">
          <h5 className="mb-3">{t("applicableIncentivesTitle")}</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm">
              <thead className="table-light text-center">
                <tr>
                  <th>{t("sNo")}</th>
                  <th>{t("policyName")}</th>
                  <th>{t("incentiveType")}</th>
                  <th>{t("description")}</th>
                  <th>{t("limitation")}</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && !isSubmitting && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-2">
                      {t("noDetailsFound")}
                    </td>
                  </tr>
                )}

                {results.map((row, index) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td>{row.policy_name || "-"}</td>
                    <td>{row.incentive_name || "-"}</td>
                    <td>{row.description || "-"}</td>
                    <td>{row.limitation || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small text-muted mt-2 fst-italic">
              {t("disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
