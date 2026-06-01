/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api-client";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  FileUp,
  BarChart3,
  LayoutDashboard,
  ClipboardList,
} from "lucide-react";

interface TestCase {
  [key: string]: any;
  expectedStatus?: "Pass" | "Fail";
}

interface ValidationMetrics {
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  } | null;
  severityBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
}

interface ValidationResult {
  actualResult: string;
  status: "Pass" | "Fail";
  testingTime: string;
  defectId: string;
  severity: string;
  defectType: string;
  remarks: string;
}

type TabType = "validation" | "analysis" | "results";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("validation");
  const [dots, setDots] = useState("");
  const [srsText, setSrsText] = useState("");
  const [srsFileName, setSrsFileName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [jsonFileName, setJsonFileName] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const srsPdfInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isProcessing) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const COLORS = {
    primary: "#F6E600",
    lightGray: "#E5E5EA",
    secondLightGray: "#C7C7D1",
    faintReadableGray: "#7A7A85",
    mediumGray: "#3A3A45",
    white: "#FFFFFF",
    softYellow: "#FFFDE7",
    softYellow2: "#FFF9C4",
    redBg: "#FFF1F2",
    redBorder: "#FECDD3",
    redText: "#BE123C",
    greenSoft: "#ECFDF5",
    greenBorder: "#A7F3D0",
    greenText: "#047857",
    gradientStart: "#FFFFFF",
    gradientEnd: "#FFF6BF",
  };

  const handleSrsPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file for the SRS.");
      return;
    }

    setSrsFileName(file.name);
    setIsProcessing(true);
    setError(null);

    try {
      const pdfjsModule = await import("pdfjs-dist");
      const pdfjsLib = (pdfjsModule as any).default || pdfjsModule;

      if (!pdfjsLib || typeof pdfjsLib.getDocument !== "function") {
        throw new Error(
          "PDF library failed to load correctly. Please try again.",
        );
      }

      const version = pdfjsLib.version || "4.0.379";
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
      });

      const pdf = await loadingTask.promise;
      if (!pdf) {
        throw new Error("Failed to load PDF document.");
      }

      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          if (textContent && Array.isArray(textContent.items)) {
            const pageText = textContent.items
              .map((item: any) => {
                if (item && typeof item.str === "string") return item.str;
                return "";
              })
              .join(" ");
            fullText += pageText + "\n";
          }
        } catch (pageErr) {
          console.warn(`Failed to extract text from page ${i}`, pageErr);
        }
      }

      const trimmedText = fullText.trim();
      if (!trimmedText) {
        throw new Error(
          "The PDF appears to be empty or contains only images/scanned text.",
        );
      }

      setSrsText(trimmedText);
      setError(null);
    } catch (err: any) {
      console.error("PDF Processing Error:", err);
      setError(
        "PDF Error: " +
          (err.message ||
            "An unexpected error occurred while reading the PDF."),
      );
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJsonFile =
      file.type === "application/json" ||
      file.name.toLowerCase().endsWith(".json");

    if (!isJsonFile) {
      setError("Please upload a valid JSON file.");
      return;
    }

    setJsonFileName(file.name);
    setIsProcessing(true);
    setError(null);

    try {
      const rawText = await file.text();

      if (!rawText.trim()) {
        throw new Error("The JSON file is empty.");
      }

      const parsedJson = JSON.parse(rawText);
      const formattedJson = JSON.stringify(parsedJson, null, 2);

      setJsonText(formattedJson);
      setError(null);
    } catch (err: any) {
      console.error("JSON Processing Error:", err);
      setError(
        "JSON Error: " +
          (err.message ||
            "An unexpected error occurred while reading the JSON file."),
      );
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const processedData = data.map((row) => {
          const expectedKey = Object.keys(row).find(
            (key) =>
              /expected|target|status|result/i.test(key) &&
              /pass|fail/i.test(String(row[key])),
          );

          if (expectedKey) {
            const val = String(row[expectedKey]).toLowerCase();
            row.expectedStatus = val.includes("pass") ? "Pass" : "Fail";
          }

          return row;
        });

        setTestCases(processedData as TestCase[]);
        setError(null);
      } catch (err) {
        setError(
          "Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.",
        );
      }
    };

    reader.readAsBinaryString(file);
  };

  const validateTestCases = async () => {
    if (!srsText || !jsonText || testCases.length === 0) {
      setError(
        "Please upload SRS PDF, JSON file, and Excel test cases before validation.",
      );
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const newResults: ValidationResult[] = new Array(testCases.length);
    const BATCH_SIZE = 5;
    const CONCURRENT_BATCHES = 3;

    try {
      const model = "gemini-2.5-flash";

      const batches = [];
      for (let i = 0; i < testCases.length; i += BATCH_SIZE) {
        batches.push({
          data: testCases.slice(i, i + BATCH_SIZE),
          startIndex: i,
        });
      }

      let completedCount = 0;

      for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
        const currentBatches = batches.slice(i, i + CONCURRENT_BATCHES);

        await Promise.all(
          currentBatches.map(async (batchInfo) => {
            const batchIndices = Array.from(
              { length: batchInfo.data.length },
              (_, k) => batchInfo.startIndex + k,
            );

            try {
              const prompt = `
You are a professional QA Engineer.

Validate the following ${batchInfo.data.length} test cases using BOTH:
1. SRS (business requirements / expected behavior)
2. JSON data (actual structure / values / configuration)

SRS Content:
${srsText}

JSON Data:
${jsonText}

Test Cases to Validate:
${JSON.stringify(batchInfo.data, null, 2)}

Validation rules:
- First check whether the test case is supported by the SRS requirements.
- Then check whether the JSON supports or contradicts that requirement.
- Mark as Pass only when the test case is reasonably aligned with the SRS and the JSON does not contradict it.
- If the SRS requires something but the JSON is missing the needed field, value, structure, mapping, flag, or condition, mark as Fail.
- If the JSON contains something but the SRS does not support that requirement, mention that clearly.
- Do not assume anything not present in the SRS or JSON.
- Base your decision only on the uploaded SRS and JSON.

Return an array of results in strictly valid JSON format, where each object corresponds to the test case at the same index in the input list.

Each object must have:
- actualResult: A detailed explanation based on both SRS and JSON.
- status: Exactly "Pass" or "Fail".
- testingTime: Estimated time to execute manually in days (e.g., "0.1", "0.5").
- defectId: A unique ID if failed (e.g., "DEF-001"), otherwise empty string.
- severity: "Critical", "High", "Medium", "Low", or "N/A".
- defectType: "Functional", "UI", "Performance", "Security", "Data", or "N/A".
- remarks: Any additional notes or reasons for the status.
              `;

              const response = await apiClient.post("/api/test-case/generate", {
                srsText,
                jsonText,
                testCases: batchInfo.data,
                model,
              });

              const batchResults = response.data.results as ValidationResult[];

              batchResults.forEach((res, idx) => {
                if (batchIndices[idx] !== undefined) {
                  newResults[batchIndices[idx]] = res;
                }
              });

              batchIndices.forEach((originalIdx) => {
                if (!newResults[originalIdx]) {
                  newResults[originalIdx] = {
                    actualResult: "Error: No result returned",
                    status: "Fail",
                    testingTime: "0",
                    defectId: "ERR",
                    severity: "N/A",
                    defectType: "N/A",
                    remarks: "AI skipped this item.",
                  };
                }
              });
            } catch (innerErr: any) {
              console.error(
                `Error validating batch starting at ${batchInfo.startIndex}:`,
                innerErr,
              );
              const errMsg = innerErr.response?.data?.message || innerErr.response?.data?.error || innerErr.message || "Unknown error";
              batchIndices.forEach((idx) => {
                newResults[idx] = {
                  actualResult: "Error during batch validation",
                  status: "Fail",
                  testingTime: "0",
                  defectId: "ERR",
                  severity: "N/A",
                  defectType: "N/A",
                  remarks: errMsg,
                };
              });
            }

            completedCount += batchInfo.data.length;
            setProgress(
              Math.min(
                100,
                Math.round((completedCount / testCases.length) * 100),
              ),
            );
          }),
        );
      }

      const finalResults = newResults.filter(Boolean);
      setResults(finalResults);
      calculateMetrics(finalResults);
      setActiveTab("results");
    } catch (err: any) {
      console.error(err);
      setError(
        "An error occurred during validation: " +
          (err.message || "Unknown error"),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateMetrics = (validationResults: ValidationResult[]) => {
    const total = validationResults.length;
    const passed = validationResults.filter((r) => r.status === "Pass").length;
    const failed = total - passed;
    const accuracy = total > 0 ? (passed / total) * 100 : 0;

    const severityBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};

    validationResults.forEach((r) => {
      severityBreakdown[r.severity] = (severityBreakdown[r.severity] || 0) + 1;
      typeBreakdown[r.defectType] = (typeBreakdown[r.defectType] || 0) + 1;
    });

    let cm = null;
    let precision = 0;
    let recall = 0;
    let f1Score = 0;

    const hasExpected = testCases.some((tc) => tc.expectedStatus);
    if (hasExpected) {
      let tp = 0,
        tn = 0,
        fp = 0,
        fn = 0;

      testCases.forEach((tc, i) => {
        const actual = validationResults[i]?.status;
        const expected = tc.expectedStatus;
        if (!actual || !expected) return;

        if (expected === "Pass" && actual === "Pass") tp++;
        if (expected === "Fail" && actual === "Fail") tn++;
        if (expected === "Fail" && actual === "Pass") fp++;
        if (expected === "Pass" && actual === "Fail") fn++;
      });

      cm = { tp, tn, fp, fn };
      precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      f1Score =
        precision + recall > 0
          ? (2 * precision * recall) / (precision + recall)
          : 0;
    }

    setMetrics({
      total,
      passed,
      failed,
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix: cm,
      severityBreakdown,
      typeBreakdown,
    });
  };

  const downloadExcel = () => {
    if (results.length === 0 || results.length !== testCases.length) {
      setError("Results are not ready or mismatch with test cases.");
      return;
    }

    const combinedData = testCases.map((tc, index) => {
      const res = results[index];
      if (!res) return tc;

      return {
        ...tc,
        "Actual Result": res.actualResult || "",
        "Pass/Failed": res.status || "",
        "Testing Time (Days)": res.testingTime || "",
        "Man Days/Defect ID": res.defectId || "",
        "Defect Severity": res.severity || "",
        "Defect Type": res.defectType || "",
        Remarks: res.remarks || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(combinedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Validation Results");
    XLSX.writeFile(wb, `Validated_${fileName || "TestCases"}.xlsx`);
  };

  const reset = () => {
    setSrsText("");
    setSrsFileName("");
    setJsonText("");
    setJsonFileName("");
    setTestCases([]);
    setResults([]);
    setMetrics(null);
    setFileName("");
    setError(null);
    setProgress(0);
    setActiveTab("validation");

    if (excelInputRef.current) excelInputRef.current.value = "";
    if (srsPdfInputRef.current) srsPdfInputRef.current.value = "";
    if (jsonInputRef.current) jsonInputRef.current.value = "";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Navigation Bar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: COLORS.white,
          borderBottom: `1px solid ${COLORS.lightGray}`,
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: COLORS.primary,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            
          </div>
          <span style={{ fontWeight: 800, fontSize: "18px", color: COLORS.mediumGray }}>
           
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "validation", label: "Start Validation", icon: LayoutDashboard },
            { id: "analysis", label: "Analysis", icon: BarChart3 },
            { id: "results", label: "Test Cases Output", icon: ClipboardList },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s ease",
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === tab.id ? COLORS.softYellow : "transparent",
                color: activeTab === tab.id ? COLORS.mediumGray : COLORS.faintReadableGray,
              }}
            >
              <tab.icon style={{ width: "16px", height: "16px" }} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ width: "120px", display: "flex", justifyContent: "flex-end" }}>
          {isProcessing && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.faintReadableGray, fontSize: "12px" }}>
              <Loader2 className="animate-spin" style={{ width: "16px", height: "16px" }} />
              {progress}%
            </div>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px" }}>
        <AnimatePresence mode="wait">
          {activeTab === "validation" && (
            <motion.div
              key="validation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <header style={{ marginBottom: "48px", textAlign: "center" }}>
                <h1 style={{ fontSize: "40px", fontWeight: 800, color: COLORS.mediumGray, marginBottom: "16px" }}>
                  Execute Test Cases
                </h1>
                <p style={{ color: COLORS.faintReadableGray, maxWidth: "640px", margin: "0 auto" }}>
                  Upload your project documents to begin the AI-powered validation process.
                </p>
              </header>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                {/* SRS Upload */}
                <div style={{ backgroundColor: COLORS.white, padding: "24px", borderRadius: "24px", border: `1px solid ${COLORS.lightGray}`, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: COLORS.mediumGray }}>1. SRS Document</h3>
                    <button
                      onClick={() => srsPdfInputRef.current?.click()}
                      style={{ padding: "8px 12px", borderRadius: "8px", backgroundColor: COLORS.primary, border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Upload PDF
                    </button>
                    <input type="file" ref={srsPdfInputRef} onChange={handleSrsPdfUpload} accept="application/pdf" className="hidden" style={{ display: "none" }}/>
                  </div>
                  <textarea
                    value={srsText}
                    onChange={(e) => setSrsText(e.target.value)}
                    placeholder="SRS content will appear here..."
                    style={{ width: "100%", height: "200px", padding: "16px", borderRadius: "12px", border: `1px solid ${COLORS.lightGray}`, fontSize: "14px", resize: "none", outline: "none" }}
                  />
                  {srsFileName && <div style={{ marginTop: "12px", fontSize: "12px", color: COLORS.greenText, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 style={{ width: "14px" }} /> {srsFileName}</div>}
                </div>

                {/* JSON Upload */}
                <div style={{ backgroundColor: COLORS.white, padding: "24px", borderRadius: "24px", border: `1px solid ${COLORS.lightGray}`, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: COLORS.mediumGray }}>2. JSON Data</h3>
                    <button
                      onClick={() => jsonInputRef.current?.click()}
                      style={{ padding: "8px 12px", borderRadius: "8px", backgroundColor: COLORS.primary, border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Upload JSON
                    </button>
                    <input type="file" ref={jsonInputRef} onChange={handleJsonUpload} accept=".json" className="hidden" style={{ display: "none" }}/>
                  </div>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="JSON content will appear here..."
                    style={{ width: "100%", height: "200px", padding: "16px", borderRadius: "12px", border: `1px solid ${COLORS.lightGray}`, fontSize: "14px", resize: "none", outline: "none", fontFamily: "monospace" }}
                  />
                  {jsonFileName && <div style={{ marginTop: "12px", fontSize: "12px", color: COLORS.greenText, display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 style={{ width: "14px" }} /> {jsonFileName}</div>}
                </div>

                {/* Excel Upload */}
                <div style={{ backgroundColor: COLORS.white, padding: "24px", borderRadius: "24px", border: `1px solid ${COLORS.lightGray}`, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: COLORS.mediumGray }}>3. Test Cases</h3>
                    <button
                      onClick={() => excelInputRef.current?.click()}
                      style={{ padding: "8px 12px", borderRadius: "8px", backgroundColor: COLORS.primary, border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Upload Excel
                    </button>
                    <input type="file" ref={excelInputRef} onChange={handleExcelUpload} accept=".xlsx,.xls" className="hidden" style={{ display: "none" }}/>
                  </div>
                  <div
                    onClick={() => excelInputRef.current?.click()}
                    style={{ width: "100%", height: "200px", border: `2px dashed ${COLORS.lightGray}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "#F9FAFB" }}
                  >
                    {testCases.length > 0 ? (
                      <div style={{ textAlign: "center" }}>
                        <FileSpreadsheet style={{ width: "40px", height: "40px", color: COLORS.primary, margin: "0 auto 12px" }} />
                        <p style={{ fontWeight: 700, fontSize: "14px" }}>{fileName}</p>
                        <p style={{ fontSize: "12px", color: COLORS.faintReadableGray }}>{testCases.length} cases loaded</p>
                      </div>
                    ) : (
                      <>
                        <Upload style={{ width: "32px", height: "32px", color: COLORS.secondLightGray, marginBottom: "12px" }} />
                        <p style={{ fontSize: "14px", color: COLORS.faintReadableGray }}>Click to upload .xlsx</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", backgroundColor: COLORS.redBg, color: COLORS.redText, borderRadius: "12px", fontSize: "14px", border: `1px solid ${COLORS.redBorder}` }}>
                    <AlertCircle style={{ width: "16px" }} /> {error}
                  </div>
                )}
                <button
                  onClick={validateTestCases}
                  disabled={isProcessing || !srsText || !jsonText || testCases.length === 0}
                  style={{
                    padding: "16px 48px",
                    borderRadius: "16px",
                    backgroundColor: isProcessing || !srsText || !jsonText || testCases.length === 0 ? COLORS.secondLightGray : COLORS.primary,
                    color: COLORS.mediumGray,
                    fontWeight: 800,
                    fontSize: "18px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(246,230,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                  {isProcessing ? "Validating..." : "Test"}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {!metrics ? (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <BarChart3 style={{ width: "64px", height: "64px", color: COLORS.secondLightGray, margin: "0 auto 24px" }} />
                  <h2 style={{ fontSize: "24px", fontWeight: 700, color: COLORS.mediumGray }}>No Analysis Data</h2>
                  <p style={{ color: COLORS.faintReadableGray }}>Complete a validation to see metrics and analysis.</p>
                </div>
              ) : (
                <>
                  <header style={{ marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, color: COLORS.mediumGray }}>Validation Analysis</h1>
                  </header>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                    {[
                      
                      { label: "Passed", value: metrics.passed, color: COLORS.greenText },
                      { label: "Failed", value: metrics.failed, color: COLORS.redText },
                      { label: "Total Cases", value: metrics.total, color: COLORS.mediumGray },
                    ].map((stat, i) => (
                      <div key={i} style={{ backgroundColor: COLORS.white, padding: "24px", borderRadius: "20px", border: `1px solid ${COLORS.lightGray}` }}>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: COLORS.faintReadableGray, textTransform: "uppercase", marginBottom: "8px" }}>{stat.label}</p>
                        <p style={{ fontSize: "32px", fontWeight: 800, color: stat.color }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
                    <div style={{ backgroundColor: COLORS.white, padding: "32px", borderRadius: "24px", border: `1px solid ${COLORS.lightGray}` }}>
                      <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Defect Severity</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {Object.entries(metrics.severityBreakdown).map(([sev, count]) => (
                          <div key={sev}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "6px" }}>
                              <span style={{ fontWeight: 600 }}>{sev}</span>
                              <span style={{ fontWeight: 700 }}>{count}</span>
                            </div>
                            <div style={{ height: "8px", backgroundColor: "#F3F4F6", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${((count as number) / metrics.total) * 100}%`, backgroundColor: sev === "Critical" ? "#EF4444" : sev === "High" ? "#F97316" : COLORS.primary }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ backgroundColor: COLORS.white, padding: "32px", borderRadius: "24px", border: `1px solid ${COLORS.lightGray}` }}>
                      <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Defect Types</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                        {Object.entries(metrics.typeBreakdown).map(([type, count]) => (
                          <div key={type} style={{ padding: "12px 20px", borderRadius: "12px", backgroundColor: COLORS.softYellow, border: `1px solid ${COLORS.primary}`, textAlign: "center", minWidth: "120px" }}>
                            <p style={{ fontSize: "24px", fontWeight: 800, color: COLORS.mediumGray }}>{count}</p>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: COLORS.faintReadableGray }}>{type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: 800, color: COLORS.mediumGray }}>Validation Results</h1>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={downloadExcel}
                    disabled={results.length === 0}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", backgroundColor: COLORS.primary, border: "none", fontWeight: 700, cursor: "pointer" }}
                  >
                    <Download style={{ width: "18px" }} /> Export Excel
                  </button>
                  <button
                    onClick={reset}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", backgroundColor: COLORS.white, border: `1px solid ${COLORS.lightGray}`, fontWeight: 700, cursor: "pointer" }}
                  >
                    <RefreshCw style={{ width: "18px" }} /> Reset
                  </button>
                </div>
              </div>

              {results.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", backgroundColor: COLORS.white, borderRadius: "24px", border: `1px solid ${COLORS.lightGray}` }}>
                  <ClipboardList style={{ width: "64px", height: "64px", color: COLORS.secondLightGray, margin: "0 auto 24px" }} />
                  <h2 style={{ fontSize: "24px", fontWeight: 700, color: COLORS.mediumGray }}>No Results Yet</h2>
                  <p style={{ color: COLORS.faintReadableGray }}>Run a validation to see detailed test case results.</p>
                </div>
              ) : (
                <div style={{ backgroundColor: COLORS.white, borderRadius: "24px", border: `1px solid ${COLORS.lightGray}`, overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${COLORS.lightGray}` }}>
                          <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: COLORS.faintReadableGray, textTransform: "uppercase" }}>ID</th>
                          <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: COLORS.faintReadableGray, textTransform: "uppercase" }}>Status</th>
                          <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: COLORS.faintReadableGray, textTransform: "uppercase" }}>Severity</th>
                          <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: COLORS.faintReadableGray, textTransform: "uppercase" }}>Type</th>
                          <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: COLORS.faintReadableGray, textTransform: "uppercase" }}>Actual Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((res, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.lightGray}`, transition: "background-color 0.2s ease" }} className="hover:bg-gray-50">
                            <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600 }}>#{idx + 1}</td>
                            <td style={{ padding: "16px 24px" }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 12px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 700,
                                backgroundColor: res.status === "Pass" ? COLORS.greenSoft : COLORS.redBg,
                                color: res.status === "Pass" ? COLORS.greenText : COLORS.redText
                              }}>
                                {res.status === "Pass" ? <CheckCircle2 style={{ width: "14px" }} /> : <XCircle style={{ width: "14px" }} />}
                                {res.status}
                              </span>
                            </td>
                            <td style={{ padding: "16px 24px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: COLORS.mediumGray }}>{res.severity}</span>
                            </td>
                            <td style={{ padding: "16px 24px" }}>
                              <span style={{ fontSize: "12px", color: COLORS.faintReadableGray }}>{res.defectType}</span>
                            </td>
                            <td style={{ padding: "16px 24px", fontSize: "14px", color: COLORS.mediumGray, maxWidth: "400px" }}>
                              <p style={{ margin: 0, lineHeight: 1.5 }}>{res.actualResult}</p>
                              {res.remarks && <p style={{ margin: "4px 0 0", fontSize: "12px", color: COLORS.faintReadableGray, fontStyle: "italic" }}>Note: {res.remarks}</p>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
//added css