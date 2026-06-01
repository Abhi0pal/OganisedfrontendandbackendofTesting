"use client";

import { useEffect, useState, useMemo } from "react";
import { Fragment } from "react";
import apiClient from "@/lib/api-client";
import { useTranslations } from "next-intl"; // Added translation hook
import { useRegionCategories } from "@/hooks/master/useRegionCategories";

interface IncentiveCalculatorFormProps {
  // submitAction is expected to handle the dynamic payload (policy_id_1, policy_id_2, etc.)
  submitAction: (payload: any) => Promise<any>;
}

// Interface for the combined comparison result format (flexible for up to 4 policies)
interface ComparisonResult {
  policy_1_result: any[];
  policy_2_result?: any[];
  policy_3_result?: any[];
  policy_4_result?: any[];
  error?: string;
}

interface MasterEndpoints {
  applyingFor: string;
  sector: string;
  subSector: string;
  policy: string;
  category: string;
  unitLocation: string;
  blocks: string;
  beneficiarytypes: string;
  anchortypes: string;
  msme: string;
}

// Maximum number of policies allowed for comparison
const MAX_POLICIES = 4;
const MIN_POLICIES_FOR_COMPARE = 2; // Policies required to initiate comparison logic

export default function IncentiveCalculatorForm({
  submitAction,
}: IncentiveCalculatorFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [masters, setMasters] = useState<any>({});
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [financialParams, setFinancialParams] = useState<any[]>([]);

  const { data: regionCategories, isLoading } = useRegionCategories();

  // UPDATED STATE: Stores selected policy IDs (min 1, max 4)
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([""]);

  // Single result array for single mode, or a temporary holder
  const [results, setResults] = useState<any[]>([]);

  // NEW STATE: Holds the combined comparison result object
  const [comparisonResults, setComparisonResults] =
    useState<ComparisonResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredSubSectors, setFilteredSubSectors] = useState<any[]>([]);
  const [msmeOptions, setMsmeOptions] = useState<any[]>([]);

  // Derived state to check if we are in comparison mode
  const isComparing = useMemo(
    () => selectedPolicies.length >= MIN_POLICIES_FOR_COMPARE,
    [selectedPolicies],
  );

  // Get all currently selected policy IDs (excluding empty strings)
  const activePolicyIds = useMemo(
    () => selectedPolicies.filter((id) => id !== ""),
    [selectedPolicies],
  );
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // The primary policy ID is always the first one
  const primaryPolicyId = selectedPolicies[0];

  const masterEndpoints: MasterEndpoints = {
    applyingFor: "unit-types",
    sector: "sectors",
    subSector: "sub-sectors",
    policy: "policies",
    category: "unit-categories",
    unitLocation: "land-categories",
    blocks: "blocks",
    beneficiarytypes: "beneficiary-types",
    anchortypes: "anchor-types",
    msme: "msme-year",
  };
  const t = useTranslations("IncentiveCalculator"); // Initialize translation

  useEffect(() => {
    // Logic to filter sub-sectors based on selected sector
    if (!formData.sector_value) {
      setFilteredSubSectors([]);
      return;
    }

    const filtered = masters.subSector?.filter(
      (item: any) =>
        item.sector && String(item.sector.id) === String(formData.sector_value),
    );

    setFilteredSubSectors(filtered || []);
  }, [formData.sector_value, masters.subSector]);

  useEffect(() => {
    // Initial loading of master data
    const loadMasters = async () => {
      const entries = await Promise.all(
        Object.entries(masterEndpoints).map(async ([key, endpoint]) => {
          try {
            const res = await apiClient.get(`/master/${endpoint}`);
            const data = res.data;
            return [key, Array.isArray(data) ? data : []];
          } catch (e) {
            console.error(`Error fetching master data for ${key}:`, e);
            return [key, []];
          }
        }),
      );

      const allMasters = Object.fromEntries(entries);
      setMasters(allMasters);
      setFilteredCategories(allMasters.category || []);
      setLoading(false);
    };

    loadMasters();
  }, []);

  // Effect to handle policy-dependent masters (Financial Params, MSME Options)
  useEffect(() => {
    if (!primaryPolicyId) {
      setFinancialParams([]);
      setMsmeOptions([]);
      return;
    }

    const fetchPolicyData = async (policyId: string) => {
      // 1. Fetch Financial Parameters (Only for the primary policy)
      try {
        const res = await apiClient.get(
          `/incentive-calculator/policy/${policyId}/map-financial-parameters`,
        );
        const params = res.data || [];
        setFinancialParams(params);

        const fpObj: any = {};
        params.forEach((p: any) => {
          fpObj[`financial_parameter_${p.id}`] = "";
        });

        setFormData((prev: any) => ({
          ...prev,
          ...fpObj, // Initialize financial parameter fields
        }));
      } catch (err) {
        setFinancialParams([]);
        console.error("Error fetching financial parameters:", err);
      }

      // 2. Fetch MSME Options (Only for the primary policy)
      try {
        const res = await apiClient.get(
          `/incentive-calculator/policy/${policyId}/msme-year`,
        );
        const data = res.data || [];

        if (!data || data.length === 0) {
          setMsmeOptions([]);
          setFilteredCategories([]);
          setFormData((prev: any) => ({
            ...prev,
            msme_year_value: "",
            unit_category_value: "",
          }));
        } else {
          setMsmeOptions(data);
        }
      } catch (error) {
        console.error("Error fetching MSME:", error);
        setMsmeOptions([]);
      }
    };

    fetchPolicyData(primaryPolicyId);
  }, [primaryPolicyId]); // Dependency on the first selected policy ID

  const handleChange = async (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    // --- Policy Selection Logic (Dynamic) ---
    if (name.startsWith("policy_id_")) {
      const index = parseInt(name.split("_")[2]) - 1; // policy_id_1 -> index 0

      setSelectedPolicies((prev) => {
        const newPolicies = [...prev];
        newPolicies[index] = value;

        // If the primary policy (index 0) is changed/cleared, clear all others
        if (index === 0) {
          return value ? newPolicies : [""];
        }

        // If a non-primary policy is cleared, keep the policy array compact
        // by filtering out the empty string only if it's not the last element
        if (!value) {
          return newPolicies.filter((id, i) => i === 0 || id !== "");
        }

        return newPolicies;
      });
    }

    // --- Sector Change Logic ---
    if (name === "sector_value") {
      setFormData((prev: any) => ({
        ...prev,
        sub_sector_value: "", // reset sub sector when sector changes
      }));
    }

    // --- MSME Selection Logic ---
    if (name === "msme_year_value") {
      const selectedMSME = Number(value);
      if (!value) {
        setFilteredCategories([]);
        setFormData((prev: any) => ({ ...prev, unit_category_value: "" }));
      } else {
        const filtered = masters.category?.filter(
          (c: any) => c.msmeYear && Number(c.msmeYearId) === selectedMSME,
        );
        setFilteredCategories(filtered || []);
        setFormData((prev: any) => ({ ...prev, unit_category_value: "" }));
      }
    }

    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  /**
   * Helper function to create the final payload for the API call.
   * This handles both single and comparison payloads dynamically.
   */
  const createPayload = (currentFormData: any) => {
    const financial_parameters: any = {};
    const otherFields: any = {};
    const payload: any = {};

    Object.entries(currentFormData).forEach(([key, value]) => {
      if (key.startsWith("financial_parameter_")) {
        financial_parameters[key] = value ? Number(value) : null;
      } else {
        otherFields[key] = value || null;
      }
    });

    activePolicyIds.forEach((policyId, index) => {
      payload[`policy_id_${index + 1}`] = policyId ? String(policyId) : null;
    });

    Object.keys(otherFields).forEach((key) => {
      payload[key] = key.endsWith("_value")
        ? Number(otherFields[key])
        : otherFields[key];
    });

    // ✅ FIX: Stringify the nested object so it travels safely in the URL
    payload.financial_parameters = JSON.stringify(financial_parameters);

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults([]);
    setComparisonResults(null);

    const selectedBlockId = formData.block_value;
    if (!selectedBlockId) {
      alert("Please select a block");
      return;
    }

    const selectedBlock = masters.blocks?.find(
      (b: any) => String(b.id) === String(selectedBlockId),
    );

    if (!selectedBlock) {
      alert("Invalid block selected");
      return;
    }

    // ✅ Look up the category id from the hook using the code (e.g., "B")
    const categoryCode = String(selectedBlock.unitCategory).toUpperCase();

    // If your hook returns data in { data: ... }
    const categories = regionCategories ?? []; // from useRegionCategories()

    // Try matching by code first; fallback to name if needed
    const matchedCategory =
      categories.find(
        (c: any) => String(c.code).toUpperCase() === categoryCode,
      ) ||
      // Optional fallback: categories where only "name" matches letters like "A/B/C/D"
      categories.find(
        (c: any) => String(c.name).toUpperCase() === categoryCode,
      );

    if (!matchedCategory?.id) {
      // Helpful debug logs:
      console.warn("Could not map unitCategory to region category id.", {
        unitCategory: selectedBlock.unitCategory,
        categories,
      });
      setError("Could not map block unit category to region category.");
      return;
    }

    // ✅ Enrich the form data using the numeric id
    const enrichedFormData = {
      ...formData,
      region_category_value: matchedCategory.id, // <-- backend expects the id
    };

    setIsSubmitting(true);

    // ✅ Build the final payload from the enriched data
    const finalPayload = createPayload(enrichedFormData);

    // (Optional) If your endpoint is dynamic, use it; otherwise ensure submitAction uses it internally
    const endpoint = isComparing
      ? "/incentive-calculator/compare"
      : "/incentive-calculator/filter";

    // Validation
    if (activePolicyIds.length === 0) {
      setIsSubmitting(false);
      return setError(t("validation.selectAtLeastOnePolicy"));
    }

    if (isComparing && activePolicyIds.length < MIN_POLICIES_FOR_COMPARE) {
      setIsSubmitting(false);
      return setError(
        t("validation.minPolicyComparison", {
          count: MIN_POLICIES_FOR_COMPARE,
        }),
      );
    }

    try {
      // If submitAction expects (payload, endpoint), pass both; otherwise ensure it routes internally.
      const response = await submitAction(finalPayload /*, endpoint */);

      if (response.error) {
        setError(response.error);
      } else {
        if (isComparing) {
          setComparisonResults(response as ComparisonResult);
          setResults([]);
        } else {
          setResults(response as any[]);
          setComparisonResults(null);
        }
      }
    } catch (err) {
      setError(t("validation.unexpectedError"));
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to add a new policy slot for comparison
  const handleAddPolicySlot = () => {
    if (selectedPolicies.length < MAX_POLICIES) {
      setSelectedPolicies((prev) => [...prev, ""]);
    }
  };

  // Function to remove a policy slot
  const handleRemovePolicySlot = (indexToRemove: number) => {
    setSelectedPolicies((prev) => {
      // Only allow removing if more than 1 policy slot remains
      if (prev.length > 1) {
        return prev.filter((_, index) => index !== indexToRemove);
      }
      return prev;
    });
    setComparisonResults(null);
  };

  if (loading) return <div className="p-5">{t("loading")}</div>;

  // Function to render the results table for a single policy (Policy 1)
  const renderResultsTable = (data: any[]) => {
    const policyName = data.length > 0 ? data[0].policy_name : t("policyLabel");

    // ... (renderResultsTable body remains the same for single view)
    // Removed for brevity in the final output, but should be kept in the code
    return (
      <div className="mb-4">
        <h5 className="fw-semibold mb-3">
          {t("applicableIncentivesFor", { policyName })}{" "}
        </h5>

        <div className="table-responsive">
          <table className="table table-bordered table-hover small w-100">
            <thead className="table-light text-start">
              <tr>
                <th className="text-center">{t("table.sNo")}</th>
                <th>{t("table.incentiveType")}</th>
                <th>{t("table.percentBenefit")}</th>
                <th>{t("table.capLimit")}</th>
                <th>{t("table.eligibilityNotes")}</th>
                <th>{t("table.calculatedIncentive")}</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    {t("table.noIncentiveDetails")}
                  </td>
                </tr>
              )}

              {data.length > 0 &&
                data.map((row: any, index: number) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>

                    <td>{row.incentive_name || "-"}</td>

                    <td className="text-nowrap">
                      {row.benefit_percent_amount
                        ? `${row.benefit_percent_amount} %`
                        : "-"}
                    </td>

                    <td className="text-nowrap">
                      {row.cap_limit
                        ? `₹ ${Number(row.cap_limit).toLocaleString("en-IN")}`
                        : "-"}
                    </td>

                    <td className="small">{row.eligibility_notes || "-"}</td>

                    <td className="text-nowrap fw-semibold">
                      {row.incentive_amount
                        ? `₹ ${Number(row.incentive_amount).toLocaleString(
                            "en-IN",
                          )}`
                        : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Function to render combined comparison results - DYNAMIC
  // Assuming useState is available in the component's scope (e.g., from IncentiveCalculatorForm)
  // We will need to define or accept the state variables for managing expansion.

  const renderComparisonTable = (
    data: ComparisonResult,
    activePolicyIds: string[],
    masters: any,
    // Add props for managing expansion state
    expandedRow: string | null,
    setExpandedRow: (type: string | null) => void,
  ) => {
    // Helper function to handle row expansion toggle
    const toggleRow = (type: string) => {
      setExpandedRow(expandedRow === type ? null : type);
    };

    // --- (Keep helper functions formatAmount and the new renderDetailCell) ---

    // Helper function to format incentive amount
    const formatAmount = (amount: number | string) =>
      amount ? `₹ ${Number(amount).toLocaleString("en-IN")}` : "-";

    // Helper function to render the detailed content for ONE incentive instance
    const renderIncentiveDetail = (result: any) => (
      <div className="d-flex flex-column text-start p-2 w-100">
        {/* Main Amount Highlight */}
        <div className="mb-2">
          <span className="fw-bold fs-5 text-primary">
            {formatAmount(result?.incentive_amount)}
          </span>
        </div>

        {/* Detail Rows */}
        <div className="border-top pt-2 mt-1">
          <div className="mb-1">
            <span className="text-secondary">
              <strong className="text-dark">{t("details.benefit")}:</strong>{" "}
              {result?.benefit_percent_amount
                ? `${result.benefit_percent_amount}%`
                : t("details.fixedAmount")}
            </span>
          </div>

          <div className="mb-1">
            <span className="text-secondary">
              <strong className="text-dark">{t("details.cap")}:</strong>{" "}
              {result?.cap_limit
                ? formatAmount(result.cap_limit)
                : t("details.noLimit")}
            </span>
          </div>

          <div className="mt-2">
            <span
              className="text-muted fst-italic d-block"
              style={{ lineHeight: "1.4" }}
            >
              <strong className="text-dark not-italic">
                {t("details.notes")}:
              </strong>{" "}
              {result?.eligibility_notes || t("details.noSpecificConditions")}
            </span>
          </div>
        </div>
      </div>
    );
    // Helper function to render the full detail cell (handling multiple results)
    // This is passed an array of results for that policy and incentive type
    const renderDetailCell = (results: any[] | undefined) => {
      if (!results || results.length === 0) return null;

      return (
        <div className="d-flex flex-column">
          {results.map((result, idx) => (
            // If multiple results exist for the same name (e.g., different interest subsidies), render them all
            <div key={idx}>{renderIncentiveDetail(result)}</div>
          ))}
        </div>
      );
    };

    // --- (Start of Main Logic - Policy Data Aggregation) ---

    // Collect all unique incentive types from all policies
    const allIncentiveTypes = new Set<string>();
    // Change structure to store Map<IncentiveName, Result[]> (as per previous fix)
    const policyResults: { [key: string]: Map<string, any[]> } = {};
    const policyNames: { [key: number]: string } = {};

    activePolicyIds.forEach((policyId, index) => {
      const resultKey = `policy_${index + 1}_result`;
      const resultsArray =
        (data[resultKey as keyof ComparisonResult] as any[] | undefined) || [];
      const policyIndex = index + 1;

      const resultsMap = new Map<string, any[]>();

      resultsArray.forEach((r: any) => {
        const name = r.incentive_name;
        allIncentiveTypes.add(name);

        if (resultsMap.has(name)) {
          resultsMap.get(name)?.push(r);
        } else {
          resultsMap.set(name, [r]);
        }
      });

      policyResults[resultKey] = resultsMap;

      // Determine Policy Name with Translation Fallback
      const policyName =
        resultsArray.length > 0
          ? resultsArray[0].policy_name
          : masters.policy.find((p: any) => String(p.id) === String(policyId))
              ?.name || t("policyFallback", { index: policyIndex }); // Use t() here

      policyNames[policyIndex] = policyName;
    });

    const incentiveTypesArray = Array.from(allIncentiveTypes).sort();

    // --- (Start of Returned JSX) ---

    return (
      <div className="mt-4">
        <h5 className="fw-semibold mb-3">{t("comparison.title")}</h5>
        <div className="table-responsive">
          <table className="table table-bordered table-hover w-100">
            <thead className="table-light text-start">
              <tr>
                <th className="text-center" style={{ width: "70px" }}>
                  {t("table.sNo")}
                </th>

                <th style={{ width: "25%" }}>{t("table.incentiveType")}</th>

                {activePolicyIds.map((_, index) => (
                  <th key={index} className="text-center fw-bold">
                    {/* policyNames[index + 1] is already localized in your logic layer */}
                    {policyNames[index + 1]}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="border-top-0">
              {incentiveTypesArray.map((type, index) => {
                const isExpanded = expandedRow === type;
                const hasIncentive = activePolicyIds.some((_, policyIndex) => {
                  const policyKey = `policy_${policyIndex + 1}_result`;
                  return policyResults[policyKey]?.has(type);
                });

                return (
                  <Fragment key={type}>
                    {/* Primary Row */}
                    <tr
                      className={hasIncentive ? "table-light" : ""}
                      style={{ cursor: hasIncentive ? "pointer" : "default" }}
                      onClick={() => hasIncentive && toggleRow(type)}
                    >
                      <td className="text-center align-middle">{index + 1}</td>

                      <td className="align-middle fw-medium">
                        <div className="d-flex align-items-center justify-content-between">
                          <span>{type}</span>
                          {hasIncentive && (
                            <span className="text-danger ms-2">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          )}
                        </div>
                      </td>

                      {activePolicyIds.map((_, policyIndex) => {
                        const policyKey = `policy_${policyIndex + 1}_result`;
                        const resultsMap = policyResults[policyKey];
                        const hasResult = resultsMap?.has(type);

                        return (
                          <td
                            key={policyIndex}
                            className="text-center align-middle"
                          >
                            {hasResult ? (
                              <span className="fw-bold text-success">
                                {t("status.yes")}
                              </span>
                            ) : (
                              <span className="text-muted">
                                {t("status.no")}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Expansion Row */}
                    {isExpanded && (
                      <tr className="bg-white">
                        <td className="text-center align-top bg-light text-muted small">
                          {index + 1}.1
                        </td>

                        <td className="bg-light align-top">
                          <div
                            className="p-3 fw-bold small text-uppercase text-secondary"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {t("comparison.detailsFor", { type })}
                          </div>
                        </td>

                        {activePolicyIds.map((_, policyIndex) => {
                          const policyKey = `policy_${policyIndex + 1}_result`;
                          const resultsMap = policyResults[policyKey];
                          const resultsArray = resultsMap?.get(type);

                          return (
                            <td
                              key={`detail-${policyIndex}`}
                              className="align-top bg-light p-2"
                            >
                              {resultsArray && resultsArray.length > 0 ? (
                                <div className="border rounded bg-white p-2 shadow-sm">
                                  {renderDetailCell(resultsArray)}
                                </div>
                              ) : (
                                <div className="p-3 text-muted text-center small fst-italic">
                                  {t("status.na")}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 mt-5">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow border"
      >
        <h5 className="mb-4">
          {t("calculator.title")}{" "}
          {isComparing ? `(${t("calculator.comparisonMode")})` : ""}
        </h5>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        {/* Form Grid - Policies now placed in a dedicated section */}
        <div className="row pb-4">
          {/* Applying For */}
          <div className="col-12 col-md-3">
            <label className="form-label fw-medium">{t("applyingFor")} *</label>
            <select
              name="unit_type_value"
              value={formData.unit_type_value || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.applyingFor?.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Industry Type */}
          <div className="col-12 col-md-3">
            <label className="form-label fw-medium">
              {t("industryType")} *
            </label>
            <select
              name="sector_value"
              value={formData.sector_value || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.sector?.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Sector */}
          {formData.sector_value && filteredSubSectors.length > 0 && (
            <div className="col-12 col-md-3">
              <label className="form-label fw-medium">{t("subSector")}</label>
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

          {/* MSME */}
          {msmeOptions.length > 0 && (
            <div className="col-12 col-md-3">
              <label className="form-label fw-medium">
                {t("isMsmeLabel")} *
              </label>
              <select
                name="msme_year_value"
                value={formData.msme_year_value || ""}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">{t("selectPlaceholder")}</option>
                {masters.msme?.map((m: any) => {
                  if (
                    msmeOptions.find(
                      (opt: any) => String(opt.id) === String(m.id),
                    )
                  ) {
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    );
                  }
                  return null;
                })}
              </select>
            </div>
          )}

          {/* Category */}
          {formData.msme_year_value && filteredCategories.length > 0 && (
            <div className="col-12 col-md-3">
              <label className="form-label fw-medium">
                {t("categoryLabel")} *
              </label>
              <select
                name="unit_category_value"
                value={formData.unit_category_value || ""}
                onChange={handleChange}
                className="form-select"
                required
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
            <label className="form-label fw-medium">
              {t("unitLocationLabel")} *
            </label>
            <select
              name="land_type_value"
              value={formData.land_type_value || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.unitLocation?.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Block */}
          <div className="col-12 col-md-3">
            <label className="form-label fw-medium">{t("blockLabel")} *</label>
            <select
              name="block_value"
              value={formData.block_value || ""}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.blocks?.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Beneficiary Type */}
          <div className="col-12 col-md-3">
            <label className="form-label fw-medium">
              {t("beneficiaryType")} *
            </label>
            <select
              name="beneficiary_type_value"
              value={formData.beneficiary_type_value || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.beneficiarytypes?.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Anchor Unit */}
          <div className="col-12 col-md-3">
            <label className="form-label fw-medium">{t("anchorUnit")} *</label>
            <select
              name="anchor_unit_value"
              value={formData.anchor_unit_value || ""}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">{t("selectPlaceholder")}</option>
              {masters.anchortypes?.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* POLICY SELECTION ROW */}
        <div className="border-top pt-4">
          <h6 className="fw-bold mb-3">{t("policySelection.title")}</h6>

          <div className="row g-3">
            {selectedPolicies.map((policyId, index) => (
              <div key={index} className="col-12 col-md-3">
                <div className="d-flex align-items-end gap-2">
                  <div className="flex-grow-1">
                    <label className="form-label fw-medium small">
                      {index === 0
                        ? `${t("policyLabel")} *`
                        : t("policySelection.compareWith", {
                            index: index + 1,
                          })}
                    </label>
                    <select
                      name={`policy_id_${index + 1}`}
                      value={policyId}
                      onChange={handleChange}
                      className="form-select"
                      required={index === 0}
                    >
                      <option value="">{t("selectPlaceholder")}</option>
                      {masters.policy
                        ?.filter((o: any) => {
                          const isSelected = selectedPolicies.some(
                            (id, i) =>
                              i !== index && String(id) === String(o.id),
                          );
                          return !isSelected;
                        })
                        .map((o: any) => (
                          <option key={o.id} value={o.id}>
                            {o.policy_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Remove Button */}
                  {index > 0 && selectedPolicies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePolicySlot(index)}
                      className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                      style={{ width: "40px", height: "38px" }}
                      title={t("policySelection.removePolicy")}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Policy Button */}
            {selectedPolicies.length < MAX_POLICIES && (
              <div className="col-12 col-md-3 d-flex align-items-end">
                <button
                  type="button"
                  onClick={handleAddPolicySlot}
                  className="btn btn-outline-primary w-100"
                  disabled={!primaryPolicyId}
                  style={{ height: "38px" }}
                >
                  <i className="bi bi-plus"></i>{" "}
                  {t("policySelection.addPolicy")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DYNAMIC FINANCIAL PARAMETERS */}
        {financialParams.length > 0 && (
          <div className="mt-4 border-top pt-4">
            <h3 className="h6 fw-bold mb-3">
              {t("calculator.financialParameters", {
                basis: t("calculator.firstPolicyBasis"),
              })}
            </h3>
            {/* Using Bootstrap Grid: row-cols-md-3 or 4 makes it responsive */}
            <div className="row g-3">
              {financialParams.map((fp: any) => (
                <div key={fp.id} className="col-12 col-md-4 col-lg-3">
                  <div className="mb-3">
                    <label className="form-label small fw-medium">
                      {fp.name}
                    </label>
                    <input
                      type={fp.dataType || "number"}
                      name={`financial_parameter_${fp.id}`}
                      value={formData[`financial_parameter_${fp.id}`] || ""}
                      onChange={handleChange}
                      className="form-control"
                      placeholder={t("calculator.enterValue", {
                        label: fp.name,
                      })}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-3 d-flex justify-content-end">
          <button
            type="submit"
            disabled={isSubmitting || activePolicyIds.length === 0}
            className="btn btn-danger rounded-5 px-4"
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {t("checkingBtn")}
              </>
            ) : isComparing ? (
              t("compareIncentivesBtn")
            ) : (
              t("checkIncentiveBtn")
            )}
          </button>
        </div>
      </form>

      {/* Results Section */}
      <div className="mt-8">
        <div className="bg-white p-4 rounded-3 shadow border">
          {isSubmitting && (
            <div className="p-4 text-center text-muted">
              <div
                className="spinner-border spinner-border-sm text-secondary me-2"
                role="status"
              ></div>
              <span>{t("calculatingResults")}</span>
            </div>
          )}

          {/* Display Combined Comparison Table (2+ policies) */}
          {comparisonResults && !isSubmitting && isComparing && (
            <>
              {renderComparisonTable(
                comparisonResults,
                activePolicyIds,
                masters,
                expandedRow,
                setExpandedRow,
              )}
              <p className="small text-muted mt-6 italic">{t("disclaimer")}</p>
            </>
          )}

          {/* Display Single Policy Results */}
          {!isSubmitting && results.length > 0 && !isComparing && (
            <>
              {renderResultsTable(results)}

              {/* Compare Button - only show after successful results for Policy 1 and not in comparison mode */}
              <div className="d-flex justify-content-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolicies((prev) =>
                      prev.length === 1 ? [...prev, ""] : prev,
                    );
                    setResults([]);
                    setComparisonResults(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded btn btn-primary transition-colors"
                >
                  {t("compareWithAnotherBtn")}
                </button>
              </div>

              <p className="small text-muted mt-3 italic">{t("disclaimer")}</p>
            </>
          )}

          {/* Initial/Empty State */}
          {!isSubmitting &&
            results.length === 0 &&
            !error &&
            !comparisonResults && (
              <div className="mt-4">
                <h2 className="h5 fw-semibold mb-4">
                  {t("applicableIncentivesTitle")}
                </h2>
                <div className="p-4 text-center text-muted">
                  {t("formInstruction", {
                    action: isComparing
                      ? t("compareIncentivesBtn")
                      : t("checkIncentiveBtn"),
                  })}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
