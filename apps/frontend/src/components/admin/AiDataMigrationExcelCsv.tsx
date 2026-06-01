"use client";

import "./style.css";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Toast } from "primereact/toast";

type PreviewItem = {
  fileName: string;
  rows: any[];
};

type MappingRow = {
  source: string;
  target: string;
  logic: string;
};

type TypeMap = Record<string, string>;

type SourceOption = {
  label: string;
  value: string;
  fileName: string;
  header: string;
};

const SOURCE_SEPARATOR = "||";

export default function AiDataMigrationCreateScript() {
  const toast = useRef<Toast>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [pgScript, setPgScript] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [targetColumns, setTargetColumns] = useState<string[]>([]);
  const [sourceTypes, setSourceTypes] = useState<TypeMap>({});
  const [targetTypes, setTargetTypes] = useState<TypeMap>({});
  const [sourceHeader, setSourceHeader] = useState("Source");
  const [targetHeader, setTargetHeader] = useState("Target");
  const [flagColumn, setFlagColumn] = useState("");
  const [flagValue, setFlagValue] = useState(1);
  const [commonKey, setCommonKey] = useState("TRAN_no");
  const [lastBatchId, setLastBatchId] = useState("");
  const [lastTargetTable, setLastTargetTable] = useState("");

  const BASE_URL = "http://localhost:8001";

  const normalize = (str: string) => (str || "").trim().toLowerCase();

  const buildSourceValue = (fileName: string, header: string) =>
    `${fileName}${SOURCE_SEPARATOR}${header}`;

  const parseSourceValue = (value: string) => {
    if (!value || value === "N/A") {
      return {
        fileName: "",
        header: value || ""
      };
    }

    if (!value.includes(SOURCE_SEPARATOR)) {
      return {
        fileName: "",
        header: value
      };
    }

    const [fileName, ...rest] = value.split(SOURCE_SEPARATOR);

    return {
      fileName,
      header: rest.join(SOURCE_SEPARATOR)
    };
  };

  const getHeaderFromSourceValue = (value: string) =>
    parseSourceValue(value).header;

  const excelSourceOptions: SourceOption[] = previewData.flatMap((item) => {
    const headers = Array.isArray(item.rows[0]) ? item.rows[0] : [];

    return headers
      .filter((header) => String(header || "").trim())
      .map((header) => {
        const headerText = String(header).trim();

        return {
          label: `${item.fileName}.${headerText}`,
          value: buildSourceValue(item.fileName, headerText),
          fileName: item.fileName,
          header: headerText
        };
      });
  });

  const isValidFile = (file: File) =>
    file.name.toLowerCase().endsWith(".csv") ||
    file.name.toLowerCase().endsWith(".xlsx");

  const canAnalyze = files.length > 0 && pgScript.trim() !== "";
  const canMigrate = rows.length > 0;
  const canRollback = !!lastBatchId && !!pgScript.trim();

  const cleanType = (type: string) => {
    if (!type) return "";

    let t = type.toLowerCase();

    t = t.replace(/,/g, "");
    t = t.replace(/default\s+[^ ]+/g, "");
    t = t.replace(/not null/g, "");
    t = t.replace(/\bnull\b/g, "");
    t = t.trim();

    if (t.startsWith("character varying")) return "character";
    if (t.startsWith("varchar")) return "varchar";
    if (t.startsWith("int")) return "integer";
    if (t.startsWith("bigint")) return "bigint";
    if (t.startsWith("text")) return "text";
    if (t.startsWith("timestamp")) return "timestamp";

    return t.replace(/\(.*?\)/g, "").trim();
  };

  const extractColumnTypes = (sql: string): TypeMap => {
    const map: TypeMap = {};

    const match = sql.match(/\(([\s\S]*)\)/);

    if (!match) return map;

    const lines = match[1].split(",");

    lines.forEach((line) => {
      const row = line.trim();

      if (!row) return;
      if (row.toUpperCase().includes("CONSTRAINT")) return;

      const parts = row.split(/\s+/);

      if (parts.length < 2) return;

      const col = parts[0].replace(/"|,/g, "");
      const type = parts.slice(1).join(" ");

      map[normalize(col)] = cleanType(type);
    });

    return map;
  };

  const getSampleValue = (type: string) => {
    const t = type.toLowerCase();

    if (t.includes("bigint")) return "1001";
    if (t.includes("int")) return "1";

    if (t.includes("char") || t.includes("text") || t.includes("varchar")) {
      return "abcd";
    }

    if (t.includes("date") || t.includes("time")) {
      return "2026-04-13";
    }

    return "val";
  };

  const usedTargets = rows
    .map((r) => r.target)
    .filter((x) => x && x !== "N/A");

  const handleFiles = (selected: File[]) => {
    const valid = selected.filter(isValidFile);

    if (valid.length !== selected.length) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid File",
        detail: "Only Excel/CSV files allowed",
        life: 3000
      });
    }

    const existingNames = new Set(
      files.map((file) => file.name.toLowerCase())
    );

    const uniqueNewFiles = valid.filter(
      (file) => !existingNames.has(file.name.toLowerCase())
    );

    const duplicateFiles = valid.filter((file) =>
      existingNames.has(file.name.toLowerCase())
    );

    if (duplicateFiles.length > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Duplicate Files",
        detail: `Already uploaded: ${duplicateFiles
          .map((f) => f.name)
          .join(", ")}`,
        life: 4000
      });
    }

    if (uniqueNewFiles.length === 0) {
      return;
    }

    setFiles((prev) => [...prev, ...uniqueNewFiles]);

    uniqueNewFiles.forEach((file) => {
      previewFile(file);
    });

    toast.current?.show({
      severity: "success",
      summary: "Uploaded",
      detail: `${uniqueNewFiles.length} file(s) added`,
      life: 2500
    });
  };

  const removeFile = (index: number) => {
    const updated = [...files];
    const removed = updated[index];

    updated.splice(index, 1);

    setFiles(updated);

    setPreviewData((prev) =>
      prev.filter(
        (item) => item.fileName.toLowerCase() !== removed.name.toLowerCase()
      )
    );

    setRows([]);
    setSourceColumns([]);
    setSourceTypes({});
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    const isCSV = file.name.toLowerCase().endsWith(".csv");

    reader.onload = (e) => {
      let workbook;

      if (isCSV) {
        workbook = XLSX.read(e.target?.result, {
          type: "string"
        });
      } else {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);

        workbook = XLSX.read(data, {
          type: "array"
        });
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(sheet, {
        header: 1
      });

      if (!json.length) return;

      setPreviewData((prev) => {
        const alreadyExists = prev.some(
          (item) => item.fileName.toLowerCase() === file.name.toLowerCase()
        );

        if (alreadyExists) {
          return prev;
        }

        return [
          ...prev,
          {
            fileName: file.name,
            rows: json.slice(0, 6)
          }
        ];
      });
    };

    if (isCSV) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  };

  const analyze = async () => {
    try {
      setStatus("⏳ Analyzing...");

      const formData = new FormData();

      files.forEach((file) => formData.append("files[]", file));
      formData.append("pg_script", pgScript);

      const res = await fetch(`${BASE_URL}/analyze-excel-csv`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Analyze failed");
      }

      const mappings = data.mappings || data.mapping || [];
      const srcCols = data.source_columns || [];
      const tgtCols = data.target_columns || [];

      const sourceValueLookup = new Map(
        excelSourceOptions.map((option) => [normalize(option.header), option.value])
      );

      const cleanedMappings = mappings
        .filter((m: MappingRow) => m.source && m.source !== "N/A")
        .map((m: MappingRow) => {
          const mappedValue =
            sourceValueLookup.get(normalize(m.source)) || m.source;

          return {
            ...m,
            source: mappedValue
          };
        });

      const mapped = new Set(
        cleanedMappings.map((m: MappingRow) =>
          normalize(getHeaderFromSourceValue(m.source))
        )
      );

      const extraRows: MappingRow[] = [];

      srcCols.forEach((col: string) => {
        if (!mapped.has(normalize(col))) {
          const optionValue = sourceValueLookup.get(normalize(col)) || col;

          extraRows.push({
            source: optionValue,
            target: "",
            logic: ""
          });
        }
      });

      setSourceColumns(srcCols);
      setTargetColumns(tgtCols);
      setRows([...cleanedMappings, ...extraRows]);

      const excelTypes: TypeMap = {};

      previewData.forEach((item) => {
        const headers = item.rows[0] || [];
        const firstRow = item.rows[1] || [];

        headers.forEach((h: any, i: number) => {
          const val = firstRow[i];
          const sourceKey = buildSourceValue(item.fileName, String(h).trim());

          excelTypes[normalize(sourceKey)] =
            typeof val === "number" ? "integer" : "varchar";
        });
      });

      setSourceTypes(excelTypes);
      setTargetTypes(extractColumnTypes(pgScript));
      setSourceHeader("Source (Excel)");
      setTargetHeader("Target");

      setStatus(`✅ Accuracy: ${data.accuracy || 0}%`);
    } catch (err: any) {
      setStatus(`❌ ${err.message}`);
    }
  };

  const updateRow = (
    index: number,
    field: keyof MappingRow,
    value: string
  ) => {
    const updated = [...rows];
    updated[index][field] = value;

    if (field === "target") {
      updated[index].logic =
        value && value !== "N/A" ? "Mapped by user" : "";
    }

    setRows(updated);
  };

  const migrate = async () => {
    try {
      setStatus("⏳ Migrating...");

      if (!flagColumn.trim()) {
        setStatus("❌ Flag column name is required");
        return;
      }

      if (!commonKey.trim()) {
        setStatus("❌ Common key is required");
        return;
      }

      const finalMappings = rows.filter(
        (r) =>
          r.source &&
          r.source !== "N/A" &&
          r.target &&
          r.target !== "N/A"
      );

      if (finalMappings.length === 0) {
        setStatus("❌ No valid mappings selected");
        return;
      }

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files[]", file);
      });

      formData.append("pg_script", pgScript);
      formData.append("mappings", JSON.stringify(finalMappings));
      formData.append("flag_column", flagColumn);
      formData.append("common_key", commonKey);
      formData.append("migrated_val", String(flagValue));

      const res = await fetch(`${BASE_URL}/migrate-excel-csv`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Migration failed");
      }

      setLastBatchId(data.batch_id || "");
      setLastTargetTable(data.target_table || "");
      setStatus(
        `✅ Migration successful. Inserted ${data.inserted_rows || 0} row(s). Batch ID: ${data.batch_id || "N/A"}`
      );
    } catch (err: any) {
      setStatus(`❌ ${err.message}`);
    }
  };

  const rollback = async () => {
    if (!lastBatchId) {
      setStatus("❌ No batch available to rollback");
      return;
    }

    if (!pgScript.trim()) {
      setStatus("❌ PG script is required for rollback");
      return;
    }

    try {
      setStatus("⏳ Rolling back...");

      const res = await fetch(`${BASE_URL}/rollback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pg: pgScript,
          batch_id: lastBatchId
        })
      });

      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        throw new Error(data.detail || data.error || "Rollback failed");
      }

      setStatus(
        `↩️ Rollback successful. Deleted ${data.deleted_rows || 0} row(s) from batch ${data.batch_id}.`
      );

      setLastBatchId("");
      setLastTargetTable("");
    } catch (err: any) {
      setStatus(`❌ ${err.message}`);
    }
  };

  return (
    <div className="migration-page">
      <Toast ref={toast} position="top-right" />

      <main>
        <div className="upload-wrapper">
          <div className="upload-box">
            <label className="upload-title">Upload Excel/CSV Files</label>

            <label className="custom-file-upload">
              <span className="choose-btn">Choose Files</span>

              <span className="file-text">
                {files.length > 0
                  ? `${files.length} file(s) chosen`
                  : "No files chosen"}
              </span>

              <input
                type="file"
                multiple
                accept=".csv,.xlsx"
                onChange={(e) => {
                  handleFiles(Array.from(e.target.files || []));
                  e.target.value = "";
                }}
              />
            </label>

            {files.length > 0 && (
              <p className="uploaded-label">Uploaded Files :-</p>
            )}

            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="file-item">
                <span>{file.name}</span>
                <button onClick={() => removeFile(i)}>X</button>
              </div>
            ))}
          </div>

          <div className="upload-box">
            <label className="upload-title">Paste PGAdmin Create Script</label>

            <textarea
              className="script-box"
              rows={1}
              value={pgScript}
              onInput={(e: any) => {
                e.target.style.height = "320px";
                e.target.style.height =
                  Math.max(320, e.target.scrollHeight) + "px";
              }}
              onChange={(e) => setPgScript(e.target.value)}
            />
          </div>
        </div>

        <div className="buttons">
          <button disabled={!canAnalyze} onClick={analyze}>
            <i className="pi pi-sparkles me-2"></i>
            Analyze
          </button>

          <button disabled={!canMigrate} onClick={migrate}>
            <i className="pi pi-database me-2"></i>
            Migrate
          </button>

          <button disabled={!canRollback} onClick={rollback}>
            <i className="pi pi-replay me-2"></i>
            Rollback
          </button>
        </div>

        <div className="flag-box migration">
          <label>
            <b className="flag-label-color">
              Flag Column Name:
              <span className="mandatory-migration"> *</span>
            </b>
          </label>

          <input
            value={flagColumn}
            placeholder="migrated_flag"
            onChange={(e) => setFlagColumn(e.target.value)}
          />

          <label>
            <b className="flag-label-color">Migrated Value:</b>
          </label>

          <input
            type="number"
            value={flagValue}
            onChange={(e) => setFlagValue(Number(e.target.value))}
          />

          <label>
            <b className="flag-label-color">
              Common Key:
              <span className="mandatory-migration"> *</span>
            </b>
          </label>

          <input
            value={commonKey}
            placeholder="TRAN_no"
            onChange={(e) => setCommonKey(e.target.value)}
          />
        </div>

        <div className="status">{status}</div>

        {previewData.length > 0 && (
          <h2 className="section-heading">Preview of Excel/CSV Files</h2>
        )}

        {lastBatchId && (
          <div className="status">
            Active Batch ID: {lastBatchId}
            {lastTargetTable ? ` | Target Table: ${lastTargetTable}` : ""}
          </div>
        )}

        {previewData.map((item, index) => (
          <details key={item.fileName} className="preview-box" open={index === 0}>
            <summary className="migration-page summary">
               {item.fileName}
            </summary>

            <table>
              <thead>
                <tr>
                  {item.rows[0]?.map((col: any, i: number) => (
                    <th key={`${item.fileName}-head-${i}`}>{col}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {item.rows.slice(1).map((row, i) => (
                  <tr key={`${item.fileName}-row-${i}`}>
                    {item.rows[0].map((_: any, j: number) => (
                      <td key={`${item.fileName}-cell-${i}-${j}`}>
                        {row[j] ?? "NA"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}

        {rows.length > 0 && (
          <>
            <h2 className="section-heading mapping-heading">
              Source - Target Mappings
            </h2>

            <details className="preview-box" open>
              <summary className="migration-page summary">
                📂 View Mappings
              </summary>

              <table className="table-UI">
                <thead>
                  <tr>
                    <th>{sourceHeader}</th>
                    <th>{targetHeader}</th>
                    <th>Logic</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, i) => {
                    const srcType = sourceTypes[normalize(row.source)] || "";
                    const tgtType = targetTypes[normalize(row.target)] || "";

                    return (
                      <tr key={`map-row-${i}`}>
                        <td>
                          <div className="table-box-dropdown">
                            <select
                              value={row.source}
                              onChange={(e) =>
                                updateRow(i, "source", e.target.value)
                              }
                            >
                              <option value="N/A">N/A</option>

                              {excelSourceOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            <input
                              className="input-box"
                              readOnly
                              value={
                                srcType
                                  ? `${srcType} (eg. ${getSampleValue(srcType)})`
                                  : ""
                              }
                            />
                          </div>
                        </td>

                        <td>
                          <div className="table-box-dropdown">
                            <select
                              value={row.target}
                              onChange={(e) =>
                                updateRow(i, "target", e.target.value)
                              }
                            >
                              <option value="">-- Select --</option>
                              <option value="N/A">N/A</option>

                              {targetColumns.map((col) => (
                                <option
                                  key={col}
                                  value={col}
                                  disabled={
                                    usedTargets.includes(col) && row.target !== col
                                  }
                                >
                                  {col}
                                </option>
                              ))}
                            </select>

                            <input
                              className="input-box"
                              readOnly
                              value={
                                tgtType
                                  ? `${tgtType} (eg. ${getSampleValue(tgtType)})`
                                  : ""
                              }
                            />
                          </div>
                        </td>

                        <td>
                          <input
                            value={row.logic}
                            onChange={(e) =>
                              updateRow(i, "logic", e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          </>
        )}
      </main>
    </div>
  );
}