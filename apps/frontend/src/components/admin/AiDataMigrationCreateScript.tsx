"use client";

// import "./migration.css";
import "./style.css";
import { useState } from "react";

type MappingRow = {
  source: string;
  target: string;
  logic: string;
};

type TypeMap = Record<string, string>;

export default function AiDataMigrationCreateScript() {
  // const BASE_URL =
  //   process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const BASE_URL = "http://localhost:8001";
  const [ssms, setSsms] = useState("");
  const [pg, setPg] = useState("");
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

  //Mainak
  const [lastBatchId, setLastBatchId] = useState("");
  const [lastTargetTable, setLastTargetTable] = useState("");
  //Mainak

  const normalize = (str: string) =>
    (str || "").trim().toLowerCase();

  const extractTableName = (sql: string) => {
    const match = sql.match(/create\s+table\s+([^\s(]+)/i);

    if (!match) return "";

    let name = match[1].replace(/\[|\]/g, "");

    if (name.includes(".")) {
      name = name.split(".").pop() || "";
    }

    return name;
  };

  const canRollback = !!lastBatchId && !!pg.trim();

  const cleanType = (type: string) => {
    if (!type) return "";

    let t = type.toLowerCase();

    t = t.replace(/,/g, "");
    t = t.replace(/default\s+[^ ]+/g, "");
    t = t.replace(/not null/g, "");
    t = t.replace(/\bnull\b/g, "");
    t = t.replace(/primary key/g, "");
    t = t.replace(/unique/g, "");
    t = t.trim();

    if (t.startsWith("character varying")) return "character";
    if (t.startsWith("varchar")) return "varchar";
    if (t.startsWith("int")) return "integer";
    if (t.startsWith("integer")) return "integer";
    if (t.startsWith("bigint")) return "bigint";
    if (t.startsWith("smallint")) return "smallint";
    if (t.startsWith("text")) return "text";
    if (t.startsWith("timestamp")) return "timestamp";
    if (t.startsWith("datetime")) return "datetime";
    if (t.startsWith("char")) return "char";

    return t.replace(/\(.*?\)/g, "").trim();
  };

  const extractColumnTypes = (sql: string): TypeMap => {
    const map: TypeMap = {};
    const lines = sql.split("\n");

    lines.forEach((line) => {
      let row = line.trim();

      if (!row) return;
      if (row.toUpperCase().includes("CONSTRAINT")) return;

      let colName = "";
      let type = "";

      if (row.startsWith("[")) {
        const colMatch = row.match(/\[([^\]]+)\]/);

        if (!colMatch) return;

        colName = colMatch[1];

        const typeMatch = row.match(/\]\s*\[([^\]]+)\]/);

        if (typeMatch) {
          type = typeMatch[1];
        } else {
          const alt = row.match(
            /\]\s*([a-zA-Z]+(\([^)]+\))?)/
          );

          if (alt) type = alt[1];
        }
      } else {
        const parts = row.split(/\s+/);

        if (parts.length < 2) return;

        colName = parts[0].replace(/"|,/g, "");
        type = parts.slice(1).join(" ");
      }

      map[normalize(colName)] = cleanType(type);
    });

    return map;
  };

  const getSampleValue = (type: string) => {
    const t = type.toLowerCase();

    if (t.includes("bigint")) return "1001";
    if (t.includes("int")) return "1";

    if (
      t.includes("char") ||
      t.includes("text") ||
      t.includes("varchar")
    ) {
      return "abcd";
    }

    if (
      t.includes("date") ||
      t.includes("time")
    ) {
      return "2026-04-13";
    }

    return "val";
  };

  const usedTargets = rows
    .map((r) => r.target)
    .filter((x) => x && x !== "N/A");

  const analyze = async () => {
    if (!ssms.trim() || !pg.trim()) {
      setStatus("⚠️ Both schemas required.");
      return;
    }

    try {
      setStatus("⏳ Analyzing...");
      setRows([]);

      const res = await fetch(`${BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ssms, pg })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(
          data.detail || data.error || "Analyze failed"
        );
      }

      const mappings = data.mapping || [];
      const srcCols = data.source_columns || [];
      const tgtCols = data.target_columns || [];

      const mappedSources = new Set(
        mappings.map((m: MappingRow) =>
          normalize(m.source)
        )
      );

      const extraRows: MappingRow[] = [];

      srcCols.forEach((col: string) => {
        if (!mappedSources.has(normalize(col))) {
          extraRows.push({
            source: col,
            target: "",
            logic: ""
          });
        }
      });

      setRows([...mappings, ...extraRows]);
      setSourceColumns(srcCols);
      setTargetColumns(tgtCols);

      setSourceTypes(extractColumnTypes(ssms));
      setTargetTypes(extractColumnTypes(pg));

      const srcTable = extractTableName(ssms);
      const tgtTable = extractTableName(pg);

      setSourceHeader(
        srcTable ? `Source (${srcTable})` : "Source"
      );

      setTargetHeader(
        tgtTable ? `Target (${tgtTable})` : "Target"
      );

      setStatus(`✅ Accuracy: ${data.accuracy}%`);
    } catch (error: any) {
      setStatus(`❌ ${error.message}`);
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
        value && value !== "N/A"
          ? "Mapped by user"
          : "";
    }

    setRows(updated);
  };

  const migrate = async () => {
    if (rows.length === 0) {
      setStatus("⚠️ Please analyze first.");
      return;
    }

    if (!flagColumn.trim()) {
      setStatus("⚠️ Enter column name.");
      return;
    }

    try {
      setStatus("⏳ Migrating...");

      const res = await fetch(`${BASE_URL}/migrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mappings: rows,
          migrated_val: Number(flagValue),
          flag_column: flagColumn,
          ssms: ssms,
          pg: pg
        })
      });

      const data = await res.json();

      if (data.status === "success") {
        //Mainak
        setLastBatchId(data.batch_id || "");
        setLastTargetTable(data.target_table || "");
        //Mainak
        setStatus(
          `🚀 Migration successful! (${flagColumn} = ${flagValue})`
        );
      } else {
        throw new Error(
          data.error || "Migration failed"
        );
      }
    } catch (error: any) {
      setStatus(`❌ ${error.message}`);
    }
  };

  const rollback = async () => {
    if (!lastBatchId) {
      setStatus("❌ No batch available to rollback");
      return;
    }

    if (!pg.trim()) {
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
          pg: pg,
          batch_id: lastBatchId
        })
      });

      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        throw new Error(
          data.detail || data.error || "Rollback failed"
        );
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
      <main>

        <div className="container">
          <textarea
            placeholder="Paste SQL Server create script..."
            value={ssms}
            onChange={(e) =>
              setSsms(e.target.value)
            }
          />

          <textarea
            placeholder="Paste PostgreSQL create script..."
            value={pg}
            onChange={(e) =>
              setPg(e.target.value)
            }
          />
        </div>

        <div className="buttons">
          <button
            onClick={analyze}
            disabled={
              !ssms.trim() || !pg.trim()
            }
          ><i className="pi pi-sparkles me-2"></i>
            Analyze
          </button>

          <button
            onClick={migrate}
            disabled={rows.length === 0}
          ><i className="pi pi-database me-2"></i>
            Migrate
          </button>
          <button onClick={rollback} disabled={!canRollback}>
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
            type="text"
            placeholder="migrated_flag"
            value={flagColumn}
            onChange={(e) =>
              setFlagColumn(e.target.value)
            }
          />

          <label>
            <b className="flag-label-color">
              Migrated Value:
            </b>
          </label>

          <input
            type="number"
            value={flagValue}
            onChange={(e) =>
              setFlagValue(
                Number(e.target.value)
              )
            }
          />
        </div>

        <div className="status">{status}</div>

        {rows.length > 0 && (
          <table className="table-UI"
          // style={{ display: "table" }}
          >
            <thead>
              <tr>
                <th>{sourceHeader}</th>
                <th>{targetHeader}</th>
                <th>Logic</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => {
                const srcType =
                  sourceTypes[normalize(row.source)] || "";

                const tgtType =
                  targetTypes[normalize(row.target)] || "";

                return (
                  <tr key={i}>
                    <td>
                      <div className="table-box-dropdown">
                        <select
                          value={row.source}
                          onChange={(e) =>
                            updateRow(
                              i,
                              "source",
                              e.target.value
                            )
                          }
                        >
                          <option value="N/A">
                            N/A
                          </option>

                          {sourceColumns.map((col) => (
                            <option
                              key={col}
                              value={col}
                            >
                              {col}
                            </option>
                          ))}
                        </select>

                        <input
                          className="input-box"
                          readOnly
                          value={
                            srcType
                              ? `${srcType} (eg. ${getSampleValue(
                                srcType
                              )})`
                              : ""
                          }
                        />
                      </div>
                    </td>

                    <td>
                      <div className="table-box-dropdown"
                      // style={{
                      //   display: "flex",
                      //   alignItems: "center",
                      //   justifyContent: "center",
                      //   gap: "0px",
                      //   paddingLeft: "6px"
                      // }}
                      >
                        <select
                          value={row.target}
                          onChange={(e) =>
                            updateRow(
                              i,
                              "target",
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            -- Select --
                          </option>

                          <option value="N/A">
                            N/A
                          </option>

                          {targetColumns.map((col) => (
                            <option
                              key={col}
                              value={col}
                              disabled={
                                usedTargets.includes(
                                  col
                                ) &&
                                row.target !== col
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
                              ? `${tgtType} (eg. ${getSampleValue(
                                tgtType
                              )})`
                              : ""
                          }
                        />
                      </div>
                    </td>

                    <td>
                      <input
                        value={row.logic}
                        onChange={(e) =>
                          updateRow(
                            i,
                            "logic",
                            e.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}