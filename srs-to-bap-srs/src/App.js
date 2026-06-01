import { useState, useRef } from "react";

const PROXY = "http://localhost:3001";
const MIME_PDF = "application/pdf";
const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const isSupportedInputFile = (f) => {
  if (!f) return false;
  const name = (f.name || "").toLowerCase();
  return f.type === MIME_PDF || f.type === MIME_DOCX || name.endsWith(".pdf") || name.endsWith(".docx");
};

const getInputMimeType = (f) => {
  const name = (f?.name || "").toLowerCase();
  if (f?.type === MIME_DOCX || name.endsWith(".docx")) return MIME_DOCX;
  if (f?.type === MIME_PDF || name.endsWith(".pdf")) return MIME_PDF;
  return "";
};

// ── EY Brand Tokens ───────────────────────────────────────────────────────────
const EY = {
  yellow:     "#FFE600",
  yellowDeep: "#FFD600",
  yellowPale: "#FFF9C4",
  yellowMid:  "#FFF3A3",
  yellowFaint:"#FFFDE7",
  charcoal:   "#333333",
  charcoalMid:"#555555",
  gray:       "#999999",
  grayLight:  "#CCCCCC",
  grayFaint:  "#F5F5F5",
  white:      "#FFFFFF",
  red:        "#C53030",
  redBg:      "#FFF5F5",
};

const getErrMsg = (err) => {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    if (err.message) return String(err.message);
    if (err.error) return typeof err.error === "string" ? err.error : JSON.stringify(err.error);
    try { return JSON.stringify(err); } catch (_) {}
  }
  return String(err);
};

const toStr = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    if (v.rule)        return String(v.rule);
    if (v.description) return String(v.description);
    if (v.text)        return String(v.text);
    if (v.value)       return String(v.value);
    if (v.condition)   return String(v.condition);
    if (v.field)       return String(v.field);
    if (v.name)        return String(v.name);
    if (v.message)     return String(v.message);
    try { return JSON.stringify(v); } catch (_) { return "[object]"; }
  }
  return String(v);
};

const normStrArr = (arr) => Array.isArray(arr) ? arr.map(toStr).filter(Boolean) : [];
const normField  = (f) => ({
  ...f,
  fieldName:       toStr(f.fieldName),
  toolTip:         toStr(f.toolTip || f.tooltip || f.tool_tip || ""),
  type:            toStr(f.type),
  mandatory:       toStr(f.mandatory),
  validationNotes: toStr(f.validationNotes),
  options:         f.options   != null ? toStr(f.options)     : null,
  sourceType:      f.sourceType != null ? toStr(f.sourceType) : null,
  grid:            f.grid ?? 6,
  fieldNumber:     f.fieldNumber ?? 0,
});
const normSection = (s) => ({ ...s, sectionId: toStr(s.sectionId), sectionName: toStr(s.sectionName), note: s.note ? toStr(s.note) : null, conditionalRules: normStrArr(s.conditionalRules), fields: Array.isArray(s.fields) ? s.fields.map(normField) : [] });
const normPage    = (p) => ({ ...p, pageName: toStr(p.pageName), sections: Array.isArray(p.sections) ? p.sections.map(normSection) : [] });
const normUC      = (uc) => ({ ...uc, useCaseId: toStr(uc.useCaseId), useCaseName: toStr(uc.useCaseName), actors: toStr(uc.actors), preconditions: normStrArr(uc.preconditions), basicFlow: normStrArr(uc.basicFlow), businessRuleValidations: normStrArr(uc.businessRuleValidations), postConditions: normStrArr(uc.postConditions) });
const normStatus  = (s) => ({ status: toStr(s.status || s.name || s.state || ""), description: toStr(s.description || s.desc || s.text || "") });
const normalizeData = (d) => {
  if (!d || typeof d !== "object") return d;
  return { ...d, formMetadata: Object.fromEntries(Object.entries(d.formMetadata || {}).map(([k, v]) => [k, toStr(v)])), pages: Array.isArray(d.pages) ? d.pages.map(normPage) : [], businessRules: normStrArr(d.businessRules), applicationStatusFlow: Array.isArray(d.applicationStatusFlow) ? d.applicationStatusFlow.map(normStatus) : [], useCases: Array.isArray(d.useCases) ? d.useCases.map(normUC) : [] };
};
const toBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = (e) => rej(new Error("FileReader failed: " + (e?.message || "unknown"))); r.readAsDataURL(file); });

const mandStyle = (m) => {
  if (m === "Mandatory")     return { background: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2" };
  if (m === "Conditional")   return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
  if (m?.startsWith("Auto")) return { background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" };
  return                            { background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" };
};

const S = {
  page:    { fontFamily: "'Segoe UI', Arial, sans-serif", background: EY.grayFaint, minHeight: "100vh", color: EY.charcoal },
  topBar:  { background: EY.charcoal, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 },
  logoMark:{ width: 36, height: 36, background: EY.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: EY.charcoal, letterSpacing: "-0.5px", flexShrink: 0 },
  hero:    { background: EY.yellow, padding: "40px 40px 36px", borderBottom: "4px solid #333333" },
  heroInner:{ maxWidth: 980, margin: "0 auto" },
  body:    { maxWidth: 980, margin: "0 auto", padding: "32px 40px" },
  card:    { background: EY.white, border: "1px solid #CCCCCC", borderTop: "3px solid #FFE600", marginBottom: 24, padding: "28px 32px" },
  cardDark:{ background: EY.charcoal, border: "none", borderTop: "4px solid #FFE600", marginBottom: 24, padding: "28px 32px" },
  stepBadge:{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: EY.yellow, color: EY.charcoal, fontWeight: 900, fontSize: 13, flexShrink: 0 },
  btnPrimary:(dis) => ({ background: dis ? EY.grayLight : EY.yellow, color: dis ? EY.gray : EY.charcoal, border: "none", padding: "12px 26px", fontWeight: 700, fontSize: 13, cursor: dis ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: 0.3, display: "inline-flex", alignItems: "center", gap: 8 }),
  btnOutline:(dis) => ({ background: EY.white, color: dis ? EY.gray : EY.charcoal, border: "2px solid " + (dis ? EY.grayLight : EY.charcoal), padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: dis ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: 0.3, display: "inline-flex", alignItems: "center", gap: 8 }),
  btnGhost:{ background: "transparent", color: EY.white, border: "1px solid #666", padding: "8px 18px", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 },
};

export default function App() {
  const [file, setFile]               = useState(null);
  const [status, setStatus]           = useState("idle");
  const [progress, setProgress]       = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [srsData, setSrsData]         = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [proxyOnline, setProxyOnline] = useState(null);
  const fileRef = useRef();

  const checkProxy = async () => {
    setProxyOnline("checking");
    try { const res = await fetch(`${PROXY}/health`, { signal: AbortSignal.timeout(4000) }); const json = await res.json().catch(() => ({})); setProxyOnline(res.ok && json.ok ? true : false); }
    catch { setProxyOnline(false); }
  };

  const onFile = (f) => {
    if (!f) return;
    if (!isSupportedInputFile(f)) {
      setStatus("error");
      setErrorMsg("Unsupported file type. Please upload a .pdf or .docx file.");
      return;
    }
    setFile(f);
    setStatus("idle");
    setSrsData(null);
    setErrorMsg("");
    setProgressPct(0);
    setProgress("");
  };

  const extract = async () => {
    if (!file) return;
    setStatus("extracting"); setErrorMsg(""); setSrsData(null); setProgressPct(0);
    try {
      setProgress("Checking proxy server..."); setProgressPct(10);
      let health;
      try { health = await fetch(`${PROXY}/health`, { signal: AbortSignal.timeout(4000) }); }
      catch (_) { throw new Error("Cannot reach proxy at localhost:3001.\n\nRun:\n  node proxy/gemini_proxy.js YOUR_GEMINI_API_KEY"); }
      if (!health.ok) throw new Error("Proxy returned an error. Try restarting it.");
      setProxyOnline(true);
      setProgress("Reading file..."); setProgressPct(25);
      const fileBase64 = await toBase64(file);
      const mimeType = getInputMimeType(file);
      if (!mimeType) throw new Error("Unsupported file type. Please upload a .pdf or .docx file.");
      setProgress("Sending to Gemini 2.5 Flash..."); setProgressPct(40);
      let animPct = 40, msgIdx = 0;
      const msgs = ["Pass 1/6: Extracting metadata...","Pass 2/6: Pages 1–2 (Company, Signatory)...","Pass 3/6: Pages 3–4 (Project, Finance)...","Pass 4/6: Pages 5–6 (Requirements, Assistance)...","Pass 5/6: Page 7 (Documents)...","Pass 6/6: Appendices (Rules, Statuses, Use Cases)...","Merging all passes — finalising 143 fields..."];
      const ani = setInterval(() => { animPct = Math.min(animPct + 2, 88); setProgressPct(animPct); if (animPct % 10 === 0 && msgIdx < msgs.length - 1) msgIdx++; setProgress(msgs[msgIdx]); }, 3000);
      let res;
      try {
        res = await fetch(`${PROXY}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64, fileName: file.name, mimeType }),
        });
      }
      catch (_) { clearInterval(ani); throw new Error("Lost connection to proxy. Is it still running?"); }
      clearInterval(ani);
      setProgress("Parsing SRS data..."); setProgressPct(92);
      let json; try { json = await res.json(); } catch (_) { throw new Error(`Proxy returned non-JSON (HTTP ${res.status})`); }
      if (!json.ok) throw new Error(json.error || `Extraction failed (HTTP ${res.status})`);
      setSrsData(normalizeData(json.data)); setProgressPct(100); setProgress("Extraction complete!"); setStatus("done");
    } catch (err) { setStatus("error"); setErrorMsg(getErrMsg(err)); }
  };

  const downloadSRS = async () => {
    if (!srsData) return; setStatus("generating"); setProgress("Formatting via Gemini...");
    try { const res = await fetch(`${PROXY}/format`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ srsData }) }); const json = await res.json(); if (!json.ok) throw new Error(json.error); const blob = new Blob([json.text], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `BAP_SRS_${(srsData.formMetadata?.formName || "CAF").replace(/\s+/g, "_")}.txt`; a.click(); URL.revokeObjectURL(url); setStatus("done"); setProgress("Downloaded!"); }
    catch (err) { setStatus("error"); setErrorMsg("Format failed: " + getErrMsg(err)); }
  };
  const downloadJSON = () => { if (!srsData) return; const blob = new Blob([JSON.stringify(srsData, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `BAP_SRS_${(srsData.formMetadata?.formName || "CAF").replace(/\s+/g, "_")}.json`; a.click(); URL.revokeObjectURL(url); };
  const downloadPdf = async () => {
    if (!srsData) return; setStatus("generating"); setProgress("Generating PDF...");
    try { const res = await fetch(`${PROXY}/pdf`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ srsData }) }); if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `PDF error (HTTP ${res.status})`); } const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `BAP_SRS_${(srsData.formMetadata?.formName || "CAF").replace(/\s+/g, "_")}.pdf`; a.click(); URL.revokeObjectURL(url); setStatus("done"); setProgress("PDF downloaded!"); }
    catch (err) { setStatus("error"); setErrorMsg("PDF failed: " + getErrMsg(err)); }
  };
  const downloadDocx = async () => {
    if (!srsData) return; setStatus("generating"); setProgress("Generating Word document...");
    try { const res = await fetch(`${PROXY}/docx`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ srsData }) }); if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `Word error (HTTP ${res.status})`); } const blob = new Blob([await res.arrayBuffer()], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `BAP_SRS_${(srsData.formMetadata?.formName || "CAF").replace(/\s+/g, "_")}.docx`; a.click(); URL.revokeObjectURL(url); setStatus("done"); setProgress("Word document downloaded!"); }
    catch (err) { setStatus("error"); setErrorMsg("Word failed: " + getErrMsg(err)); }
  };

  const totalFields   = srsData?.pages?.reduce((a, p) => a + p.sections.reduce((b, s) => b + (s.fields?.length || 0), 0), 0) ?? 0;
  const totalRules    = srsData?.businessRules?.length ?? 0;
  const totalPages    = srsData?.pages?.length ?? 0;
  const totalUseCases = srsData?.useCases?.length ?? 0;
  const canExtract    = !!file && !["extracting", "generating"].includes(status);
  const isProxyCause  = errorMsg.includes("localhost:3001") || errorMsg.toLowerCase().includes("proxy");

  return (
    <div style={S.page}>

      {/* ── Top bar ── */}
      <div style={S.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={S.logoMark}>EY</div>
          <span style={{ color: "#CCCCCC", fontSize: 13, fontWeight: 400 }}>Government of Karnataka · KUM Single Window System</span>
        </div>
        <span style={{ color: "#666", fontSize: 11, letterSpacing: 1 }}>SRS GENERATOR v11</span>
      </div>

      {/* ── Hero ── */}
      <div style={S.hero}>
        <div style={S.heroInner}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: EY.charcoal, opacity: 0.55, textTransform: "uppercase", marginBottom: 10 }}>BAP · FormBuilder · Gemini 2.5 Flash</div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: EY.charcoal, margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-0.5px" }}>FRS → BAP SRS Generator</h1>
          <p style={{ fontSize: 14, color: EY.charcoal, opacity: 0.65, margin: 0, lineHeight: 1.7 }}>
            Upload your Functional Requirements Specification PDF &nbsp;·&nbsp; 6-pass AI extraction &nbsp;·&nbsp; 143 fields with Tool Tips &nbsp;·&nbsp; Download as PDF, Word or JSON
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={S.body}>

        {/* Setup */}
        <div style={S.cardDark}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={S.stepBadge}>⚙</div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: EY.white }}>One-time setup — start the proxy server</h2>
          </div>
          <p style={{ fontSize: 13, color: "#AAAAAA", marginBottom: 16, lineHeight: 1.7 }}>
            Gemini blocks direct browser requests (CORS). Run this proxy once in a terminal — takes 10 seconds.
          </p>
          <div style={{ background: "#1A1A1A", border: "1px solid #444", padding: "16px 20px", fontFamily: "monospace", fontSize: 13, lineHeight: 2, marginBottom: 16 }}>
            <div style={{ color: "#555" }}># Open a terminal in this project folder:</div>
            <div style={{ color: "#E5E5E5" }}>node proxy/gemini_proxy.js <span style={{ color: EY.yellow }}>YOUR_GEMINI_API_KEY</span></div>
            <div style={{ color: "#555" }}># Get your key: https://aistudio.google.com/apikey</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={checkProxy} style={S.btnGhost}>🔌 Check proxy status</button>
            {proxyOnline === "checking" && <span style={{ fontSize: 13, color: EY.gray }}>Checking...</span>}
            {proxyOnline === true  && <span style={{ fontSize: 13, color: EY.yellow, fontWeight: 700 }}>✔ Proxy online — ready!</span>}
            {proxyOnline === false && <span style={{ fontSize: 13, color: "#FC8181", fontWeight: 700 }}>✘ Not found — start it first</span>}
          </div>
        </div>

        {/* Step 1 Upload */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={S.stepBadge}>1</div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: EY.charcoal }}>Upload FRS Document (PDF/DOCX)</h2>
          </div>
          <div
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
            style={{ border: `2px dashed ${file ? EY.yellowDeep : EY.grayLight}`, background: file ? EY.yellowFaint : EY.grayFaint, padding: "44px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
          >
            <div style={{ fontSize: 42, marginBottom: 10 }}>{file ? "📄" : "📁"}</div>
            {file ? (
              <><div style={{ fontWeight: 700, color: EY.charcoal, fontSize: 15 }}>{file.name}</div><div style={{ fontSize: 12, color: EY.gray, marginTop: 6 }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div></>
            ) : (
              <><div style={{ fontWeight: 600, color: EY.charcoalMid, fontSize: 14 }}>Click or drag a PDF or DOCX here</div><div style={{ fontSize: 12, color: EY.gray, marginTop: 6 }}>Functional Requirements Specification document (.pdf or .docx)</div></>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => onFile(e.target.files[0])} style={{ display: "none" }} />
        </div>

        {/* Step 2 Extract */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={S.stepBadge}>2</div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: EY.charcoal }}>Extract SRS Data via Gemini 2.5 Flash</h2>
          </div>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: EY.charcoalMid, lineHeight: 1.7 }}>
            6 targeted AI passes — metadata → pages 1–2 → 3–4 → 5–6 → page 7 → appendices — deep-merged.
            Captures all 143 fields, business rules, statuses and generates Tool Tips for every single field.
          </p>
          <button onClick={extract} disabled={!canExtract} style={S.btnPrimary(!canExtract)}>
            {status === "extracting" ? "⏳  Extracting..." : "▶  Extract from FRS"}
          </button>

          {["extracting", "done", "generating"].includes(status) && progress && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: status === "done" ? "#166534" : EY.charcoalMid, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                {status === "done" ? "✔" : "⏳"} {progress}
              </div>
              <div style={{ height: 4, background: EY.grayLight, overflow: "hidden" }}>
                <div style={{ height: "100%", width: progressPct + "%", background: progressPct === 100 ? "#16A34A" : EY.yellow, transition: "width 0.4s ease" }} />
              </div>
            </div>
          )}

          {status === "error" && errorMsg && (
            <div style={{ marginTop: 20, padding: "16px 20px", background: EY.redBg, borderLeft: "4px solid #C53030" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: EY.red, marginBottom: 6 }}>✘ Error</div>
              <div style={{ fontSize: 13, color: "#742A2A", whiteSpace: "pre-line", lineHeight: 1.6 }}>{errorMsg}</div>
              {isProxyCause && (
                <div style={{ marginTop: 12, background: "#1A1A1A", padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: EY.yellow }}>
                  node proxy/gemini_proxy.js YOUR_API_KEY
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {srsData && (
          <>
            {/* Stat tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[{ label: "Pages", value: totalPages, icon: "📑" }, { label: "Fields", value: totalFields, icon: "▦" }, { label: "Business Rules", value: totalRules, icon: "⚖" }, { label: "Use Cases", value: totalUseCases, icon: "👤" }].map((s) => (
                <div key={s.label} style={{ background: EY.white, border: "1px solid #CCCCCC", borderTop: "4px solid #FFE600", padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: EY.charcoal, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: EY.gray, marginTop: 8, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div style={S.card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: EY.charcoal, textTransform: "uppercase", letterSpacing: 1.5 }}>Form Metadata</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 32px" }}>
                {Object.entries(srsData.formMetadata || {}).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 10, fontSize: 13, borderBottom: "1px solid #F5F5F5", paddingBottom: 8 }}>
                    <span style={{ color: EY.gray, minWidth: 130, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, paddingTop: 1, flexShrink: 0 }}>{k.replace(/([A-Z])/g, " $1")}</span>
                    <span style={{ color: v ? EY.charcoal : EY.red, fontWeight: v ? 500 : 700 }}>{v || "missing content"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pages & Sections */}
            <div style={S.card}>
              <h3 style={{ margin: "0 0 20px", fontSize: 11, fontWeight: 700, color: EY.charcoal, textTransform: "uppercase", letterSpacing: 1.5 }}>Pages &amp; Sections</h3>
              {srsData.pages?.map((page) => (
                <div key={page.pageNumber} style={{ marginBottom: 28 }}>
                  <div style={{ background: EY.charcoal, color: EY.yellow, fontWeight: 700, fontSize: 12, padding: "10px 16px", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ background: EY.yellow, color: EY.charcoal, padding: "2px 10px", fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>PAGE {page.pageNumber}</span>
                    {page.pageName}
                  </div>
                  {page.sections?.map((sec) => (
                    <div key={sec.sectionId} style={{ marginBottom: 14, border: "1px solid #CCCCCC" }}>
                      <div style={{ background: EY.yellowPale, borderBottom: "1px solid #CCCCCC", padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: EY.charcoal }}>§ {sec.sectionId} — {sec.sectionName}</span>
                        {sec.isRepeatable && <span style={{ fontSize: 10, background: EY.yellow, color: EY.charcoal, padding: "2px 8px", fontWeight: 700, letterSpacing: 0.5 }}>ADD MORE · min {sec.minRows ?? 1} · max {sec.maxRows ?? 10}</span>}
                      </div>
                      {sec.note && <div style={{ fontSize: 12, color: EY.charcoalMid, fontStyle: "italic", padding: "8px 14px", background: "#FAFAFA", borderBottom: "1px solid #CCCCCC" }}>ℹ {sec.note}</div>}
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: EY.yellow }}>
                              {["#", "Field Name", "Tool Tip", "Type", "Grid", "Mandatory", "Validation / Notes"].map((h) => (
                                <th key={h} style={{ padding: "9px 10px", textAlign: "left", color: EY.charcoal, fontWeight: 700, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", borderRight: "1px solid #FFD600", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sec.fields?.map((f, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? EY.white : EY.yellowFaint, borderBottom: "1px solid #CCCCCC" }}>
                                <td style={{ padding: "7px 10px", color: EY.gray, fontWeight: 700, fontSize: 11, borderRight: "1px solid #E5E5E5", whiteSpace: "nowrap" }}>{f.fieldNumber}</td>
                                <td style={{ padding: "7px 10px", fontWeight: 700, color: EY.charcoal, borderRight: "1px solid #E5E5E5", whiteSpace: "nowrap" }}>{f.fieldName}</td>
                                <td style={{ padding: "7px 10px", fontStyle: "italic", color: EY.charcoalMid, borderRight: "1px solid #E5E5E5", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.toolTip}>{f.toolTip || <span style={{ color: EY.red, fontWeight: 700 }}>missing content</span>}</td>
                                <td style={{ padding: "7px 10px", borderRight: "1px solid #E5E5E5" }}>
                                  <span style={{ background: EY.yellow, color: EY.charcoal, padding: "2px 7px", fontSize: 10, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{f.type}</span>
                                </td>
                                <td style={{ padding: "7px 10px", textAlign: "center", color: EY.charcoal, fontWeight: 700, borderRight: "1px solid #E5E5E5" }}>{f.grid}</td>
                                <td style={{ padding: "7px 10px", borderRight: "1px solid #E5E5E5" }}>
                                  <span style={{ ...mandStyle(f.mandatory), padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>{f.mandatory}</span>
                                </td>
                                <td style={{ padding: "7px 10px", color: EY.charcoalMid, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.validationNotes}>{f.validationNotes || <span style={{ color: EY.red, fontWeight: 700 }}>missing content</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {sec.conditionalRules?.length > 0 && (
                        <div style={{ background: EY.yellowPale, borderTop: "1px solid #CCCCCC", padding: "10px 14px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: EY.charcoal, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Conditional Rules</div>
                          {sec.conditionalRules.map((r, i) => <div key={i} style={{ fontSize: 11, color: EY.charcoalMid, marginBottom: 4, display: "flex", gap: 6 }}><span style={{ color: EY.yellowDeep, fontWeight: 900 }}>▶</span>{r}</div>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Business Rules */}
            {srsData.businessRules?.length > 0 && (
              <div style={S.card}>
                <h3 style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: EY.charcoal, textTransform: "uppercase", letterSpacing: 1.5 }}>Business Rules</h3>
                {srsData.businessRules.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #F5F5F5", fontSize: 13 }}>
                    <span style={{ background: EY.yellow, color: EY.charcoal, padding: "3px 8px", fontSize: 10, fontWeight: 900, flexShrink: 0, alignSelf: "flex-start", letterSpacing: 0.5, whiteSpace: "nowrap" }}>BR-{i + 1}</span>
                    <span style={{ color: EY.charcoal, lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Status Flow */}
            {srsData.applicationStatusFlow?.length > 0 && (
              <div style={S.card}>
                <h3 style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: EY.charcoal, textTransform: "uppercase", letterSpacing: 1.5 }}>Application Status Flow</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>
                  {srsData.applicationStatusFlow.map((s, i) => (
                    <div key={i} style={{ border: "1px solid #CCCCCC", borderTop: "3px solid #FFE600", padding: "12px 14px", background: EY.white }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: EY.charcoal, marginBottom: 4 }}>{s.status}</div>
                      <div style={{ fontSize: 11, color: EY.gray, lineHeight: 1.5 }}>{s.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Use Cases */}
            {srsData.useCases?.length > 0 && (
              <div style={S.card}>
                <h3 style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: EY.charcoal, textTransform: "uppercase", letterSpacing: 1.5 }}>Use Cases</h3>
                {srsData.useCases.map((uc, i) => (
                  <div key={i} style={{ border: "1px solid #CCCCCC", borderLeft: "4px solid #FFE600", padding: "14px 18px", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: EY.charcoal, marginBottom: 6 }}>{uc.useCaseId} — {uc.useCaseName}</div>
                    <div style={{ fontSize: 12, color: EY.gray, marginBottom: 10 }}><strong style={{ color: EY.charcoal }}>Actors:</strong> {uc.actors}</div>
                    {uc.basicFlow?.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 700, color: EY.charcoal, marginBottom: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Basic Flow</div>
                        {uc.basicFlow.slice(0, 5).map((step, j) => <div key={j} style={{ color: EY.charcoalMid, marginBottom: 4, fontSize: 12, display: "flex", gap: 8 }}><span style={{ color: EY.yellow, fontWeight: 900, flexShrink: 0 }}>{j + 1}.</span>{step}</div>)}
                        {uc.basicFlow.length > 5 && <div style={{ color: EY.gray, fontSize: 11, marginTop: 4 }}>+ {uc.basicFlow.length - 5} more steps...</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 3 Download */}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={S.stepBadge}>3</div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: EY.charcoal }}>Download BAP SRS</h2>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={downloadPdf}  disabled={status === "generating"} style={S.btnPrimary(status === "generating")}>{status === "generating" ? "⏳  Generating..." : "↓  Download PDF"}</button>
                <button onClick={downloadDocx} disabled={status === "generating"} style={S.btnOutline(status === "generating")}>{status === "generating" ? "⏳" : "↓  Download Word (.docx)"}</button>
                <button onClick={downloadSRS}  disabled={status === "generating"} style={S.btnOutline(status === "generating")}>{status === "generating" ? "⏳" : "↓  Download TXT"}</button>
                <button onClick={downloadJSON} style={S.btnOutline(false)}>↓  Download JSON</button>
              </div>
              {status === "generating" && progress && <div style={{ marginTop: 12, fontSize: 13, color: EY.charcoalMid, fontWeight: 600 }}>⏳ {progress}</div>}
              <p style={{ margin: "16px 0 0", fontSize: 11, color: EY.gray, lineHeight: 1.7, borderTop: "1px solid #F5F5F5", paddingTop: 14 }}>
                <strong>PDF</strong> — Landscape A4, EY-styled, Tool Tip column &nbsp;·&nbsp; <strong>Word</strong> — Editable .docx &nbsp;·&nbsp; <strong>TXT</strong> — Plain text &nbsp;·&nbsp; <strong>JSON</strong> — DB-ready for FormBuilder
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: EY.charcoal, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={S.logoMark}>EY</div>
          <span style={{ color: "#666", fontSize: 11 }}>© EY · Government of Karnataka · KUM Single Window System</span>
        </div>
        <span style={{ color: "#666", fontSize: 11 }}>Powered by Gemini 2.5 Flash</span>
      </div>

    </div>
  );
}
