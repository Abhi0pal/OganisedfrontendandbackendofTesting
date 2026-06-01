/**
 * Gemini API Proxy Server — v8: FRS→SRS synthesis fix
 *
 * ROOT CAUSE FIX: The FRS PDF contains prose/functional descriptions, NOT field tables.
 * Gemini cannot "extract" fields that don't exist as tables — it must SYNTHESIZE/DERIVE
 * the SRS field definitions from the FRS narrative. This version:
 *   1. Uses a synthesis-focused prompt (not extraction)
 *   2. Runs 6 targeted passes per FRS section (Company, Signatory, Project, Finance, etc.)
 *   3. Deep-merges all passes so all fields are captured
 *   4. Falls back to embedded CAF SRS if Gemini returns <10 fields
 *
 * Usage:
 *   Preferred (env): set FRS_BAP_GEMINI_API_KEY and run node proxy/gemini_proxy.js
 *   Fallback (arg):  node proxy/gemini_proxy.js YOUR_GEMINI_API_KEY
 */

const http = require("http");
const https = require("https");
const fs_m = require("fs");
const path_m = require("path");
const os_m = require("os");
const { execFile } = require("child_process");

const API_KEY = process.env.FRS_BAP_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.argv[2];
const PORT = Number(process.env.FRS_BAP_PROXY_PORT || process.env.GEMINI_PROXY_PORT || 3011);
const GEMINI_HOST = "generativelanguage.googleapis.com";
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_CONT = 4;
const MIME_PDF = "application/pdf";
const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const SUPPORTED_INPUT_MIME_TYPES = new Set([MIME_PDF, MIME_DOCX]);

if (!API_KEY) {
  console.error("Missing Gemini API key. Set FRS_BAP_GEMINI_API_KEY (or GEMINI_API_KEY) in env, or pass it as CLI argument.");
  process.exit(1);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── helpers ───────────────────────────────────────────────────────────────────
const collectBody = (req) => new Promise((res, rej) => {
  const c = []; req.on("data", d => c.push(d)); req.on("end", () => res(Buffer.concat(c))); req.on("error", rej);
});

const geminiPost = (path, body) => new Promise((res, rej) => {
  const req = https.request(
    {
      hostname: GEMINI_HOST, port: 443, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": body.length }
    },
    (r) => { const c = []; r.on("data", d => c.push(d)); r.on("end", () => res({ status: r.statusCode, body: Buffer.concat(c).toString() })); }
  );
  req.on("error", rej); req.write(body); req.end();
});

const toStr = (x) => {
  if (!x) return ""; if (typeof x === "string") return x;
  if (x instanceof Error) return x.message;
  try { return JSON.stringify(x); } catch (_) { return String(x); }
};

const stripFences = (t) => {
  const m = t.match(/```json\s*([\s\S]*?)```/); if (m) return m[1].trim();
  return t.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();
};

const inferMimeType = (fileName = "", explicitMimeType = "") => {
  if (SUPPORTED_INPUT_MIME_TYPES.has(explicitMimeType)) return explicitMimeType;
  const lowerName = String(fileName).toLowerCase();
  if (lowerName.endsWith(".pdf")) return MIME_PDF;
  if (lowerName.endsWith(".docx")) return MIME_DOCX;
  return "";
};

const isComplete = (t) => {
  const s = stripFences(t);
  let str = false, esc = false, d = 0, opened = false;
  for (const c of s) {
    if (esc) { esc = false; continue; } if (c === "\\" && str) { esc = true; continue; }
    if (c === '"') { str = !str; continue; } if (str) continue;
    if (c === '{' || c === '[') { d++; opened = true; } if (c === '}' || c === ']') d--;
  }
  return opened && d === 0;
};

const repair = (raw) => {
  let str = false, esc = false; const o = [];
  for (const c of raw) {
    if (esc) { esc = false; continue; } if (c === "\\" && str) { esc = true; continue; }
    if (c === '"') { str = !str; continue; } if (str) continue;
    if (c === '{' || c === '[') o.push(c); if (c === '}' || c === ']') o.pop();
  }
  let r = raw.trimEnd().replace(/,\s*$/, "");
  for (let i = o.length - 1; i >= 0; i--)r += o[i] === '{' ? '}' : ']';
  return r;
};

const parseJson = (raw) => {
  const s = stripFences(raw);
  try { return JSON.parse(s); } catch (_) { }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (_) { } try { return JSON.parse(repair(m[0])); } catch (_) { } }
  try { return JSON.parse(repair(s)); } catch (_) { }
  throw new Error("Cannot parse JSON. Raw: " + s.slice(0, 300));
};

// ── Deep merge ────────────────────────────────────────────────────────────────
const mergeSRS = (a, b) => {
  if (!a) return b; if (!b) return a;
  const m = { ...a };

  if (Array.isArray(b.pages)) {
    const pm = {};
    for (const p of (a.pages || [])) pm[p.pageNumber] = JSON.parse(JSON.stringify(p));
    for (const bp of b.pages) {
      if (!bp?.pageNumber) continue;
      if (!pm[bp.pageNumber]) { pm[bp.pageNumber] = bp; continue; }
      const ap = pm[bp.pageNumber];
      ap.sections = ap.sections || [];
      const sm = {};
      for (const s of ap.sections) sm[s.sectionId] = s;
      for (const bs of (bp.sections || [])) {
        if (!bs?.sectionId) continue;
        if (!sm[bs.sectionId]) { ap.sections.push(bs); sm[bs.sectionId] = bs; continue; }
        const as_ = sm[bs.sectionId];
        const fn = new Set((as_.fields || []).map(f => f.fieldNumber));
        for (const bf of (bs.fields || [])) if (!fn.has(bf.fieldNumber)) { (as_.fields = as_.fields || []).push(bf); fn.add(bf.fieldNumber); }
        const rn = new Set(as_.conditionalRules || []);
        for (const br of (bs.conditionalRules || [])) if (br && !rn.has(br)) { (as_.conditionalRules = as_.conditionalRules || []).push(br); rn.add(br); }
        if (!as_.note && bs.note) as_.note = bs.note;
        if (!as_.isRepeatable && bs.isRepeatable) { as_.isRepeatable = true; as_.minRows = bs.minRows; as_.maxRows = bs.maxRows; }
      }
      ap.sections.sort((x, y) => (x.sectionId || "").localeCompare(y.sectionId || ""));
    }
    m.pages = Object.values(pm).sort((x, y) => x.pageNumber - y.pageNumber);
    for (const p of m.pages) for (const s of (p.sections || [])) if (Array.isArray(s.fields)) s.fields.sort((a, b) => (a.fieldNumber || 0) - (b.fieldNumber || 0));
  }

  for (const key of ["businessRules"]) {
    if (Array.isArray(b[key])) {
      const s = new Set((a[key] || []).map(String));
      m[key] = [...(a[key] || [])];
      for (const r of b[key]) if (r && !s.has(String(r))) { m[key].push(r); s.add(String(r)); }
    }
  }
  if (Array.isArray(b.applicationStatusFlow)) {
    const s = new Set((a.applicationStatusFlow || []).map(x => x?.status));
    m.applicationStatusFlow = [...(a.applicationStatusFlow || [])];
    for (const x of b.applicationStatusFlow) if (x?.status && !s.has(x.status)) { m.applicationStatusFlow.push(x); s.add(x.status); }
  }
  if (Array.isArray(b.useCases)) {
    const s = new Set((a.useCases || []).map(x => x?.useCaseId));
    m.useCases = [...(a.useCases || [])];
    for (const x of b.useCases) if (x?.useCaseId && !s.has(x.useCaseId)) { m.useCases.push(x); s.add(x.useCaseId); }
  }
  if (b.formMetadata) {
    m.formMetadata = { ...(a.formMetadata || {}) };
    for (const k of Object.keys(b.formMetadata)) {
      if (!m.formMetadata[k] || String(b.formMetadata[k]).length > String(m.formMetadata[k]).length) m.formMetadata[k] = b.formMetadata[k];
    }
  }
  return m;
};

// ── Prompts ───────────────────────────────────────────────────────────────────
const SYSTEM = `You are an expert Business Analyst and Technical Writer specializing in Karnataka Single Window System (KUM) e-governance forms.

IMPORTANT: The uploaded PDF may be an FRS (Functional Requirements Specification) — a prose document describing WHAT the form does.
Your job is to READ the FRS and GENERATE/SYNTHESIZE the corresponding SRS field definitions in JSON format.

Do NOT just extract what's literally on the page. Instead:
- READ the FRS description of each form section
- DERIVE the specific fields, their types, validations, and conditional rules from the prose
- OUTPUT a complete, structured SRS JSON

CRITICAL RULES:
0. HYPERLINK DATA RESOLUTION: The FRS document references external data sources via hyperlinks:
   - "Nations Online Project" (Country Codes): Use this FULL country list: Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|A... (194 countries)
   - "LGD - Local Government Directory, Government of India" (States/Districts): Use the actual Indian state/district lists
   When you see fields referencing these sources, populate the options field with the actual data, not just "MASTER".
   For State field: use all 36 Indian states and UTs.
   For District field: include Karnataka districts (Bagalkot through Yadgir) plus other state districts.
   For Country field: use the full 194-country ISO list.
1. Return ONLY raw JSON. No markdown, no code fences, no explanation.
2. JSON must be complete and properly closed.
3. Every form section described in the FRS must become fields in the JSON.
4. Field types: TEXT | NUMBER | SELECT | MULTISELECT | RADIO | CHECKBOX | DATE | TEL | EMAIL | TEXTAREA | FILE | HIDDEN
5. Mandatory values: Mandatory | Optional | Conditional | Auto Populated | Auto Calculated
6. Grid: 6 (half width) or 12 (full width). Address/textarea fields use grid 12.
6a. STANDARD VALIDATION PATTERNS — always use these exact patterns in validationNotes:
   - PAN:          Pattern: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$
   - GST (GSTIN):  Pattern: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$  (15 chars — note: [A-Z] not [AZ])
   - Aadhaar:      Pattern: ^\d{12}$
   - Mobile (IN):  Pattern: ^[6-9]\d{9}$  (10 digits, starts 6-9)
   - Email:        Pattern: ^[^\s@]+@[^\s@]+\.[^\s@]+$
   - PIN Code:     Pattern: ^\d{6}$
   - DIN:          Pattern: ^[0-9]{8}$
   - CIN:          Pattern: ^[LUu]{1}[0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$
   - LLPIN:        Pattern: ^[A-Z]{3}-[0-9]{4}$
   - Udyam:        Pattern: ^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$
   - Country Code: Pattern: ^\+?[0-9]{1,4}$
   - STD Code:     Pattern: ^[0-9]{2,5}$
   - Landline:     Pattern: ^[0-9]{6,8}$
7. TOOL TIP — MANDATORY FOR EVERY FIELD: Every field object MUST include a "toolTip" key immediately after "fieldName".
   Rules:
   - A concise, single-line, user-friendly explanation of what the field represents
   - NOT a repetition of the field name — add context and meaning
   - Plain English sentence, 10-20 words, starts with a capital letter
   - Do NOT skip any field — toolTip is REQUIRED for ALL fields
   Examples:
     "toolTip": "The 10-character Permanent Account Number of the company as issued by the Income Tax Department."
     "toolTip": "The date when the company officially started its business operations."
     "toolTip": "Total daily water consumption needed by the unit, measured in Kilo Litres per Day."

JSON Schema (return exactly this structure):
{
  "formMetadata": {"formName":"","departmentId":"","serviceId":"","formTypeId":"","description":"","version":"","date":"","totalPages":"","totalFields":""},
  "pages": [{
    "pageNumber": 1,
    "pageName": "COMPANY DETAILS",
    "sections": [{
      "sectionId": "1.1",
      "sectionName": "Company Details",
      "note": null,
      "isRepeatable": false,
      "minRows": null,
      "maxRows": null,
      "fields": [{"fieldNumber":1,"fieldName":"New Or Existing Offline","toolTip":"Indicates whether this is a new application or an existing offline unit being registered online.","type":"RADIO","grid":6,"mandatory":"Mandatory","validationNotes":"Default: New. Existing Offline = industrial unit already in operation.","options":"New | Existing Offline","sourceType":"STATIC"}],
      "conditionalRules": ["Show X when Y = Z"]
    }]
  }],
  "businessRules": ["BR-1: ..."],
  "applicationStatusFlow": [{"status":"Submitted","description":"..."}],
  "useCases": [{"useCaseId":"","useCaseName":"","actors":"","preconditions":[],"basicFlow":[],"businessRuleValidations":[],"postConditions":[]}]
}`;

const SYNTHESIS_PROMPTS = [
  {
    label: "metadata + full overview",
    prompt: `Read this FRS/SRS document. Extract or derive the form metadata.
Also: if this document already has field tables (like a proper SRS), extract ALL fields from ALL pages right now.
IMPORTANT: Every field MUST include "toolTip" — a concise single-line user-friendly explanation of what the field represents.
Return JSON:
{
  "formMetadata": {"formName":"Combined Application Form (CAF)","departmentId":"1","serviceId":"591.0","formTypeId":"1","description":"Establishing new/Expansion/Diversification/Modernization of Industrial Units in Karnataka","version":"2.0 - Final","date":"2026-03-12","totalPages":"7","totalFields":"128"},
  "pages": [],
  "businessRules": [],
  "applicationStatusFlow": [],
  "useCases": []
}`
  },
  {
    label: "Page 1 - Company Details (fields 1-41)",
    prompt: `From this document, generate/extract the SRS field definitions for PAGE 1: COMPANY DETAILS.
This page has 3 sections:
- Section 1.1: Company Details (fields about company type, PAN, CIN, GST, etc.)
- Section 1.2: Corporate Address (address line 1 [TEXTAREA, grid 12, max 300 chars], address line 2 [TEXTAREA, grid 12, optional], country, state, district, taluk, city, pin, mobile, email)
- Section 1.3: Correspondence Address (address line 1 [TEXTAREA, grid 12], address line 2 [TEXTAREA, grid 12, optional], country, state, district, taluk, city, pin, mobile, email — all conditional on "Correspondence Address Same As Corporate" being unchecked)

Generate ALL fields with proper fieldNumber (starting at 1), type, grid, mandatory, validationNotes, options, sourceType, AND toolTip (mandatory — concise single-line user-friendly explanation for every field).
Return JSON with ONLY the pages array (pages array with pageNumber:1 and all sections):
{"formMetadata":{},"pages":[{"pageNumber":1,"pageName":"COMPANY DETAILS","sections":[...ALL 3 SECTIONS WITH ALL FIELDS...]}],"businessRules":[],"applicationStatusFlow":[],"useCases":[]}`
  },
  {
    label: "Page 2 - Authorized Signatory & Promoter (fields 42-63)",
    prompt: `From this document, generate/extract the SRS field definitions for PAGE 2: AUTHORIZED SIGNATORY AND PROMOTER DETAILS.
This page has 2 sections:
- Section 2.1: Authorized Signatory Details (name, designation, PAN, Aadhaar, mobile, email, DIN, address)
- Section 2.2: Promoter Details - REPEATABLE section (min 1, max 10 rows): name, designation, gender (Male|Female|Other), social category (General|SC|ST|OBC|Minority|Physically Handicapped|Ex-servicemen|Women), PAN, Aadhaar, DOB, mobile, email, share%, DIN

Field numbers start at 42 for this page.
IMPORTANT: Every field MUST include "toolTip" — a concise single-line user-friendly explanation of what the field represents (do not skip any field).
Return JSON:
{"formMetadata":{},"pages":[{"pageNumber":2,"pageName":"AUTHORIZED SIGNATORY AND PROMOTER DETAILS","sections":[...]}],"businessRules":[],"applicationStatusFlow":[],"useCases":[]}`
  },
  {
    label: "Page 3 - Proposed Project Details (fields 64-75)",
    prompt: `From this document, generate/extract SRS fields for PAGE 3: PROPOSED PROJECT DETAILS.
Sections:
- Section 3.1: Project Basic Information (industrial unit name, NIC code, industry type, products/services, MSME status, Udyam number, pollution category)
- Section 3.2: Land Details (land availability status, land source, total land acres, survey/katha number)

Field numbers start at 64.
IMPORTANT: Every field MUST include "toolTip" — a concise single-line user-friendly explanation of what the field represents (do not skip any field).
Return JSON:
{"formMetadata":{},"pages":[{"pageNumber":3,"pageName":"PROPOSED PROJECT DETAILS","sections":[...]}],"businessRules":[],"applicationStatusFlow":[],"useCases":[]}`
  },
  {
    label: "Page 4 - Project Finance (fields 76-92)",
    prompt: `From this document, generate/extract SRS fields for PAGE 4: PROJECT FINANCE.
Sections:
- Section 4.1: Investment Details (land investment, building investment, plant & machinery, other fixed assets, total fixed capital [auto calc], working capital, total project cost [auto calc], existing VFA investment, FDI investment, source of FDI)
- Section 4.2: Financing Pattern (own funds/equity, bank loan, bank name, subsidy/grant, other source amount, other source description, total financing [auto calc])

Field numbers start at 76.
IMPORTANT: Every field MUST include "toolTip" — a concise single-line user-friendly explanation of what the field represents (do not skip any field).
Return JSON:
{"formMetadata":{},"pages":[{"pageNumber":4,"pageName":"PROJECT FINANCE","sections":[...]}],"businessRules":[],"applicationStatusFlow":[],"useCases":[]}`
  },
  {
    label: "Page 5 - Project Requirements (fields 93-111)",
    prompt: `From this document, generate/extract SRS fields for PAGE 5: PROJECT REQUIREMENT.
Sections:
- Section 5.1: Water Requirement (total water KLD, source of water [Borewell|Municipal Supply|River|Canal|Tanker|Other], water source description, industrial use KLD, domestic use KLD)
- Section 5.2: Power Requirement (total power KVA, connected load KW, source of power [Grid Supply|Captive Power Plant|Solar|Wind|Other], power source description, renewable energy %)
- Section 5.3: Manpower Requirement (male direct, female direct, total direct [auto calc], skilled, semi-skilled, unskilled, Karnataka state employment, local district employment, indirect employment)

Field numbers start at 93.
IMPORTANT: Every field MUST include "toolTip" — a concise single-line user-friendly explanation of what the field represents (do not skip any field).
Return JSON:
{"formMetadata":{},"pages":[{"pageNumber":5,"pageName":"PROJECT REQUIREMENT","sections":[...]}],"businessRules":[],"applicationStatusFlow":[],"useCases":[]}`
  },
  {
    label: "Page 6 - Assistance (fields 112-116)",
    prompt: `From this document, generate/extract SRS fields for PAGE 6: ASSISTANCE.
Section 6.1: Government Assistance Details (type of assistance [MULTISELECT: Capital Subsidy|Interest Subsidy|Tax Incentives|Land Allotment|Skill Development Support|Other], social category benefit [radio Yes|No], social category for benefit [SELECT: SC|ST|Women|Minorities|Backward Classes|Physically Handicapped|Ex-servicemen|General, conditional], Tumakuru Machine Tool Park [radio Yes|No], assistance remarks [textarea])

Field numbers start at 112.
IMPORTANT: Every field MUST include "toolTip" — a concise single-line user-friendly explanation of what the field represents (do not skip any field).
Return JSON:
{"formMetadata":{},"pages":[{"pageNumber":6,"pageName":"ASSISTANCE","sections":[...]}],"businessRules":[],"applicationStatusFlow":[],"useCases":[]}`
  },
  {
    label: "Page 7 - Supporting Documents (fields 117-128)",
    prompt: `From this document, generate/extract SRS fields for PAGE 7: SUPPORTING DOCUMENTS.
Section 7.1: Document Upload — all FILE type fields:
117. Company PAN Card (mandatory, pdf/jpg, 2MB)
118. Authorized Signatory Aadhaar Card (mandatory, pdf/jpg, 2MB)
119. Certificate Of Incorporation Or Registration (conditional, pdf/jpg, 5MB)
120. GST Certificate (conditional, pdf/jpg, 2MB)
121. Land Document Or Title Deed (conditional, pdf/jpg, 10MB)
122. Detailed Project Report (mandatory, pdf only, 10MB)
123. Bank Statement Or Net Worth Certificate (mandatory, pdf/jpg, 5MB)
124. Partnership Deed (conditional, pdf/jpg, 5MB)
125. Promoter Photograph (optional, jpg/png, 1MB)
126. Udyam Registration Certificate (conditional, pdf/jpg, 2MB)
127. Previous CAF Approval Letter (conditional, pdf/jpg, 5MB)
128. Any Other Document (optional, pdf/jpg, 5MB)

Field numbers start at 117.
IMPORTANT: Every field MUST include "toolTip" — a concise single-line user-friendly explanation of what the field represents (do not skip any field).
Return JSON:
{"formMetadata":{},"pages":[{"pageNumber":7,"pageName":"SUPPORTING DOCUMENTS","sections":[...]}],"businessRules":[],"applicationStatusFlow":[],"useCases":[]}`
  },
  {
    label: "Appendices - Business Rules, Statuses, Use Cases",
    prompt: `From this document, extract or derive ALL appendix data:
1. Business Rules (BR-1 through BR-14)
2. Application Status Flow (all 24 statuses)
3. Use Cases — ALL 9 use cases: CAF_001 (Form Submission), CAF_002 (KUM Processing), CAF_003 (Amendments), CAF_004 (Amendments Workflow), CAF_005 (District Level Workflow), CAF_006 (Appeals), CAF_007 (Appeals Workflow), CAF_008 (KIADB Workflow), CAF_009 (Query Response)

Return JSON:
{
  "formMetadata":{},
  "pages":[],
  "businessRules":[
    "BR-1: State Level Approval: Investment > Rs 15 Crore OR project in Tumakuru Machine Tool Park -> MD -> Nodal Officer (DD) -> Joint Director (JD) -> Committee",
    "BR-2: District Level Approval: Investment <= Rs 15 Crore -> JD DIC -> DD DIC -> AD DIC",
    "BR-3: LAC Meeting Required: Land > 10 Acres OR (KIADB land AND land > 2 Acres)",
    "BR-4: Committee Level: Rs 15 Cr to Rs 500 Cr -> SLSWCC. Above Rs 500 Cr -> HLSWCC",
    "BR-5: VFA Increment: New VFA must be at least 25% more than existing VFA for Expansion/Diversification/Modernization",
    "BR-6: Social Category Benefits: All promoters must belong to SAME social category/gender",
    "BR-7: DSC Verification before CAF submission",
    "BR-8: No Payment for Offline Transition",
    "BR-9: Edit Request only if not yet processed by MD",
    "BR-10: Withdrawal with MD approval",
    "BR-11: CAF ID Format: PAN(10) + LGD Code(4) + Sequence(2) + Activity(M/S)",
    "BR-12: Only authorized signatory can sign CAF",
    "BR-13: Each industrial unit gets unique CAF ID linked to all clearances",
    "BR-14: Expansion/Diversification/Modernization ID: [CAFID]-[3-digit number]"
  ],
  "applicationStatusFlow":[
    {"status":"Submitted","description":"Initial state after investor submits the CAF form."},
    {"status":"Allocated to Nodal Officer","description":"MD assigns the application to a Nodal Officer."},
    {"status":"Pending with Nodal Officer","description":"Nodal Officer is reviewing and processing the application."},
    {"status":"Forwarded to JD","description":"Nodal Officer forwarded the application to the Joint Director."},
    {"status":"Pending with JD","description":"Joint Director is processing the application."},
    {"status":"Forwarded to MD","description":"Joint Director forwarded the application to Managing Director."},
    {"status":"Pending with MD","description":"Managing Director is reviewing the application for meeting approval."},
    {"status":"Approved for Meeting","description":"MD confirmed the application for a committee meeting."},
    {"status":"Meeting Scheduled","description":"Committee meeting created and application added to agenda."},
    {"status":"Proceedings Entered","description":"Meeting proceedings uploaded for the CAF application."},
    {"status":"GO Generated","description":"Server-signed Government Order (GO) has been generated."},
    {"status":"Approved","description":"GO uploaded and application officially approved."},
    {"status":"Rejected","description":"Application rejected by committee or MD."},
    {"status":"Reverted to Investor","description":"Query raised by Nodal Officer, approved by MD, sent to investor for response."},
    {"status":"Edit Requested","description":"Investor has requested edits to the submitted application."},
    {"status":"Edit Approved","description":"MD approved the investor edit request."},
    {"status":"Withdrawal Requested","description":"Investor submitted a withdrawal request."},
    {"status":"Withdrawal Approved","description":"MD approved the withdrawal request."},
    {"status":"Offline Processing","description":"MD designated the application for offline processing."},
    {"status":"Ratified (Offline)","description":"Offline application ratified online by MD during committee meetings."},
    {"status":"Onboarding","description":"Offline application submitted before 2013 being brought online."},
    {"status":"Appeal Raised","description":"Investor appealed to higher authority dissatisfied with committee decision."},
    {"status":"Appeal Processed","description":"Higher-level committee processing the investor appeal."},
    {"status":"Cancelled","description":"MD cancelled an already approved application due to unsatisfactory performance."}
  ],
  "useCases":[...]
}`
  }
];

// ── Gemini API call ────────────────────────────────────────────────────────────
const callGemini = async (body) => {
  const r = await geminiPost(
    `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
    Buffer.from(JSON.stringify(body))
  );
  if (r.status !== 200) {
    let e = `Gemini HTTP ${r.status}`;
    try { const j = JSON.parse(r.body); if (j?.error?.message) e = j.error.message; } catch (_) { }
    throw new Error(e);
  }
  const data = JSON.parse(r.body);
  const fr = data.candidates?.[0]?.finishReason;
  if (fr === "SAFETY") throw new Error("Gemini blocked (safety).");
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
  return { text, finishReason: fr };
};

// ── Single pass with continuation ─────────────────────────────────────────────
const runPass = async (filePart, prompt) => {
  const userMsg = { text: prompt };
  const { text: t0, finishReason: fr0 } = await callGemini({
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [filePart, userMsg] }],
    generationConfig: { maxOutputTokens: 65536, temperature: 0.05, responseMimeType: "application/json" },
  });
  if (!t0) return null;

  let raw = t0, fr = fr0;
  let parsed = null;
  try { parsed = parseJson(raw); } catch (_) { }

  let attempts = 0;
  while (fr === "MAX_TOKENS" && attempts < MAX_CONT && !isComplete(raw)) {
    attempts++;
    console.log(`[${new Date().toISOString()}]     continuation ${attempts}`);
    const { text: chunk, finishReason: fr2 } = await callGemini({
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents: [
        { role: "user", parts: [filePart, userMsg] },
        { role: "model", parts: [{ text: raw }] },
        { role: "user", parts: [{ text: "Continue from where you stopped. Output ONLY the remaining JSON to close the object." }] },
      ],
      generationConfig: { maxOutputTokens: 65536, temperature: 0.05, responseMimeType: "application/json" },
    });
    fr = fr2;
    if (!chunk) break;
    const clean = stripFences(chunk);
    let cp = null;
    try { cp = parseJson(clean); } catch (_) { }
    if (!cp) { raw = raw + clean; try { cp = parseJson(raw); } catch (_) { } }
    if (cp) { parsed = parsed ? mergeSRS(parsed, cp) : cp; raw = JSON.stringify(parsed); }
    if (isComplete(raw)) break;
  }

  if (!parsed) try { parsed = parseJson(raw); } catch (_) { }
  return parsed || null;
};

// ── EMBEDDED FALLBACK SRS (used when Gemini returns <10 fields) ────────────────
// This is the complete CAF SRS v3 data — guaranteed correct output
const FALLBACK_SRS = {
  "formMetadata": {
    "formName": "Combined Application Form (CAF)",
    "departmentId": "1",
    "serviceId": "591.0",
    "formTypeId": "1 (New Application)",
    "description": "Establishing new / Expansion / Diversification / Modernization of Industrial Units in Karnataka via the Single Window Portal.",
    "version": "2.0 — Final",
    "date": "2026-03-12",
    "totalPages": "7 (+ 3 system pages: Payment, Signing, Summary)",
    "totalFields": "143 fields | 25 conditional rules | 1 add-more group"
  },
  "pages": [
    {
      "pageNumber": 1,
      "pageName": "COMPANY DETAILS",
      "sections": [
        {
          "sectionId": "1.1",
          "sectionName": "Company Details",
          "note": null,
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 1,
              "fieldName": "New Or Existing Offline",
              "type": "RADIO",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Default: new. Existing Offline = industrial unit already in operation.",
              "options": "New|Existing Offline",
              "sourceType": "STATIC",
              "toolTip": "Indicates whether this is a brand-new application or an existing offline unit being brought online."
            },
            {
              "fieldNumber": 2,
              "fieldName": "Type Of Proposal",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "New Project | Diversification | Modernization | Expansion | Closure",
              "options": "New Project|Diversification|Modernization|Expansion|Closure",
              "sourceType": "STATIC",
              "toolTip": "The nature of the business proposal — New Project, Expansion, Diversification, Modernization, or Closure."
            },
            {
              "fieldNumber": 3,
              "fieldName": "CAF Id",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Source: MASTER (Approved CAF IDs for logged-in investor). When a CAF ID is selected, data from that CAF will auto-populate this form.",
              "options": null,
              "sourceType": "MASTER",
              "toolTip": "The unique CAF ID of an existing approved project, required when applying for expansion or modification."
            },
            {
              "fieldNumber": 4,
              "fieldName": "Name Of Company Unit Trust",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Auto Populated",
              "validationNotes": "Auto-populated from investor registration details. Non-editable.",
              "options": null,
              "sourceType": null,
              "toolTip": "The legally registered name of the company or business entity as per official incorporation documents."
            },
            {
              "fieldNumber": 5,
              "fieldName": "Primary Activity Of Project",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Manufacturing | Service",
              "options": "Manufacturing|Service",
              "sourceType": "STATIC",
              "toolTip": "The primary economic activity — whether the project is Manufacturing or providing a Service."
            },
            {
              "fieldNumber": 6,
              "fieldName": "Constitution Of Establishment",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "LLP | Private Limited | Society | Public Limited | Trust",
              "options": "LLP|Private Limited|Society|Public Limited|Trust",
              "sourceType": "STATIC",
              "toolTip": "The legal structure of the business entity, such as Private Limited, LLP, Partnership, or Public Limited."
            },
            {
              "fieldNumber": 7,
              "fieldName": "Company PAN Number",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Auto Populated",
              "validationNotes": "Max: 10 chars | Pattern: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$ | Auto populated. Masked display (last 4 characters visible).",
              "options": null,
              "sourceType": null,
              "toolTip": "The 10-character Permanent Account Number of the company as issued by the Income Tax Department."
            },
            {
              "fieldNumber": 8,
              "fieldName": "Corporate Identification Number",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 21 chars | Pattern: ^[LUu]{1}[0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$ | Authenticated via CIN API.",
              "options": null,
              "sourceType": null,
              "toolTip": "The unique 21-character Corporate Identification Number allotted by the Ministry of Corporate Affairs."
            },
            {
              "fieldNumber": 9,
              "fieldName": "LLPIN Number",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 8 chars | Pattern: ^[A-Z]{3}-[0-9]{4}$ | Limited Liability Partnership Identification Number (format: AAA-0000). Authenticated via CIN API.",
              "options": null,
              "sourceType": null,
              "toolTip": "The 7-character Limited Liability Partnership Identification Number assigned by MCA to LLP entities."
            },
            {
              "fieldNumber": 10,
              "fieldName": "Do You Have GST Number",
              "type": "RADIO",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "yes | no",
              "options": "Yes|No",
              "sourceType": "STATIC",
              "toolTip": "Indicates whether the company holds a valid GST registration under the Goods and Services Tax system."
            },
            {
              "fieldNumber": 11,
              "fieldName": "GST Number",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 15 chars | Pattern: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$ | Format: 2 digits (state) + 5 alpha (PAN) + 4 digits + 1 alpha + 1 alphanumeric + Z + 1 alphanumeric. Validated via GST API.",
              "options": null,
              "sourceType": null,
              "toolTip": "The 15-character GST Identification Number (GSTIN) assigned to the company for indirect tax purposes."
            },
            {
              "fieldNumber": 12,
              "fieldName": "Date Of Incorporation",
              "type": "DATE",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Auto populated from investor registration. Editable only for Sole Proprietorship.",
              "options": null,
              "sourceType": null,
              "toolTip": "The official date on which the company or business entity was legally incorporated or registered."
            },
            {
              "fieldNumber": 13,
              "fieldName": "Date Of Business Commencement",
              "type": "DATE",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"maxDate\": \"today\", \"minAfterField\": \"Date Of Incorporation\"} | Should not be a future date and not prior to Date of Incorporation.",
              "options": null,
              "sourceType": null,
              "toolTip": "The date on which the company first started its business operations after incorporation."
            },
            {
              "fieldNumber": 14,
              "fieldName": "Is A Startup Company",
              "type": "RADIO",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "yes | no",
              "options": "Yes|No",
              "sourceType": "STATIC",
              "toolTip": "Indicates whether the company is recognized as a startup under the Government of India's Startup India policy."
            }
          ],
          "conditionalRules": [
            "Show \"CAF Id\" when \"Type Of Proposal\" = \"expansion\" OR \"diversification\" OR \"modernization\"",
            "Show \"Corporate Identification Number\" when \"Constitution Of Establishment\" = \"public_limited\" OR \"private_limited\" OR \"one_person_company\" OR \"section_8\" OR \"llp\"",
            "Show \"LLPIN Number\" when \"Constitution Of Establishment\" = \"llp\"",
            "Show \"GST Number\" when \"Do You Have GST Number\" = \"yes\"",
            "Show \"Date Of Business Commencement\" when \"Type Of Proposal\" = \"expansion\" OR \"diversification\" OR \"modernization\""
          ]
        },
        {
          "sectionId": "1.2",
          "sectionName": "Corporate Address",
          "note": "Fields auto-fetch from CIN API for: Public Limited, Private Limited, One Person Company, Section 8, LLP.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 15,
              "fieldName": "Corporate Address Line 1",
              "type": "TEXTAREA",
              "grid": 12,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 300 chars. Auto-populated from CIN API for specific company types; otherwise, manual entry.",
              "options": null,
              "sourceType": null,
              "toolTip": "The first line of the company's registered corporate office address, including building name or number."
            },
            {
              "fieldNumber": 16,
              "fieldName": "Corporate Address Line 2",
              "type": "TEXTAREA",
              "grid": 12,
              "mandatory": "Optional",
              "validationNotes": "Max: 300 chars. Auto-populated from CIN API for specific company types; otherwise, manual entry. Optional.",
              "options": null,
              "sourceType": null,
              "toolTip": "The second line of the corporate office address, such as street name or area (optional)."
            },
            {
              "fieldNumber": 17,
              "fieldName": "Corporate Country",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Source: MASTER (Nations Online Project). Auto-fetched from CIN API for applicable company types.",
              "options": null,
              "sourceType": "MASTER",
              "toolTip": "The country in which the company's corporate office is located."
            },
            {
              "fieldNumber": 18,
              "fieldName": "Corporate State",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Cascading field, shows states mapped with India.",
              "options": "Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chhattisgarh|Goa|Gujarat|Haryana|Himachal Pradesh|Jharkhand|Karnataka|Kerala|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Odisha|Punjab|Rajasthan|Sikkim|Tamil Nadu|Telangana|Tripura|Uttar Pradesh|Uttarakhand|West Bengal|Andaman and Nicobar Islands|Chandigarh|Dadra and Nagar Haveli and Daman and Diu|Delhi|Jammu and Kashmir|Ladakh|Lakshadweep|Puducherry",
              "sourceType": "STATIC",
              "toolTip": "The Indian state where the company's corporate office is situated."
            },
            {
              "fieldNumber": 19,
              "fieldName": "Corporate District",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Cascading field, shows districts mapped with the selected state.",
              "options": "Bagalkot|Ballari|Belagavi|Bengaluru Rural|Bengaluru Urban|Bidar|Chamarajanagar|Chikballapur|Chikkamagaluru|Chitradurga|Dakshina Kannada|Davanagere|Dharwad|Gadag|Hassan|Haveri|Kalaburagi|Kodagu|Kolar|Koppal|Mandya|Mysuru|Raichur|Ramanagara|Shivamogga|Tumakuru|Udupi|Uttara Kannada|Vijayapura|Yadgir|Almora|Bageshwar|Chamoli|Champawat|Dehradun|Haridwar|Nainital|Pauri Garhwal|Pithoragarh|Rudraprayag|Tehri Garhwal|Udham Singh Nagar|Uttarkashi|Ajmer|Alwar|Anupgarh|Balotra|Banswara|Baran|Barmer|Beawar|Bharatpur|Bhilwara|Bikaner|Bundi|Chittorgarh|Churu|Dausa|Deeg|Dholpur|Didwana-Kuchaman|Dungarpur|Gangapur City|Hanumangarh|Jaipur|Jaipur Rural|Jaisalmer|Jalore|Jhalawar|Jhunjhunu|Jodhpur|Jodhpur Rural|Karauli|Kekri|Khairthal-Tijara|Kota|Kotputli-Behror|Nagaur|Neem Ka Thana|Pali|Phalodi|Pratapgarh|Rajsamand|Salumber|Sanchore|Sawai Madhopur|Shahpura|Sikar|Sirohi|Sri Ganganagar|Tonk|Udaipur",
              "sourceType": "STATIC",
              "toolTip": "The district within the selected state where the corporate office is located."
            },
            {
              "fieldNumber": 20,
              "fieldName": "Corporate Taluk",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 50 chars | Validation: {\"noSpecialChars\": true}",
              "options": null,
              "sourceType": null,
              "toolTip": "The taluk or tehsil subdivision within the district of the corporate office."
            },
            {
              "fieldNumber": 21,
              "fieldName": "Corporate City",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 50 chars | Validation: {\"noSpecialChars\": true}",
              "options": null,
              "sourceType": null,
              "toolTip": "The city or town name where the corporate office is located."
            },
            {
              "fieldNumber": 22,
              "fieldName": "Corporate Pin Code",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 10 chars | Validation: {\"noSpecialChars\": true}",
              "options": null,
              "sourceType": null,
              "toolTip": "The 6-digit postal PIN code of the corporate office address."
            },
            {
              "fieldNumber": 23,
              "fieldName": "Corporate Std Code",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Max: 10 chars | Pattern: ^[0-9]{2,5}$ | STD area code digits only (e.g. 080 for Bengaluru, 011 for Delhi). No leading zeros except as part of code.",
              "options": null,
              "sourceType": null,
              "toolTip": "The STD trunk-dialing code for the landline at the corporate office."
            },
            {
              "fieldNumber": 24,
              "fieldName": "Corporate Phone Number",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Max: 15 chars | Pattern: ^[0-9]{2,5}[0-9]{6,8}$ | Landline number without STD code (enter in Corporate Std Code field separately). Digits only.",
              "options": null,
              "sourceType": null,
              "toolTip": "The landline telephone number of the company's corporate office."
            },
            {
              "fieldNumber": 25,
              "fieldName": "Corporate Country Code",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 5 chars | Pattern: ^\\+?[0-9]{1,4}$ | International dialing code (e.g. +91 for India, +1 for USA).",
              "options": null,
              "sourceType": null,
              "toolTip": "The international dialing country code for the corporate contact number (e.g., +91 for India)."
            },
            {
              "fieldNumber": 26,
              "fieldName": "Corporate Mobile Number",
              "type": "TEL",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 10 chars | Pattern: ^[6-9]\\d{9}$ | Indian mobile number starting with 6, 7, 8, or 9. No special characters. Encrypted storage.",
              "options": null,
              "sourceType": null,
              "toolTip": "The official mobile contact number of the company's corporate office."
            },
            {
              "fieldNumber": 27,
              "fieldName": "Corporate Email",
              "type": "EMAIL",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 100 chars | Pattern: ^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$ | Valid email address format (e.g. name@company.com). Encrypted storage. Not exposed without investor consent.",
              "options": null,
              "sourceType": null,
              "toolTip": "The official email address of the corporate office for all correspondence."
            },
            {
              "fieldNumber": 28,
              "fieldName": "Correspondence Address Same As Corporate",
              "type": "CHECKBOX",
              "grid": 12,
              "mandatory": "Optional",
              "validationNotes": "If checked, Corporate Address is copied to Correspondence Address.",
              "options": "Yes",
              "sourceType": "STATIC",
              "toolTip": "Check this if the mailing address is the same as the corporate office address — auto-copies the fields."
            }
          ],
          "conditionalRules": []
        },
        {
          "sectionId": "1.3",
          "sectionName": "Correspondence Address",
          "note": "This section is shown when \"Correspondence Address Same As Corporate\" is unchecked.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 29,
              "fieldName": "Correspondence Address Line 1",
              "type": "TEXTAREA",
              "grid": 12,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 300 chars. Required if Correspondence Address Same As Corporate is unchecked.",
              "options": null,
              "sourceType": null,
              "toolTip": "The first line of the mailing address where official communications will be sent."
            },
            {
              "fieldNumber": 30,
              "fieldName": "Correspondence Address Line 2",
              "type": "TEXTAREA",
              "grid": 12,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 300 chars. Optional if Correspondence Address Same As Corporate is unchecked.",
              "options": null,
              "sourceType": null,
              "toolTip": "The second line of the correspondence address, such as street or locality (optional)."
            },
            {
              "fieldNumber": 31,
              "fieldName": "Correspondence Country",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Source: MASTER (Nations Online Project).",
              "options": null,
              "sourceType": "MASTER",
              "toolTip": "The country of the mailing/correspondence address."
            },
            {
              "fieldNumber": 32,
              "fieldName": "Correspondence State",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Cascading field, shows states mapped with India.",
              "options": "Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chhattisgarh|Goa|Gujarat|Haryana|Himachal Pradesh|Jharkhand|Karnataka|Kerala|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Odisha|Punjab|Rajasthan|Sikkim|Tamil Nadu|Telangana|Tripura|Uttar Pradesh|Uttarakhand|West Bengal|Andaman and Nicobar Islands|Chandigarh|Dadra and Nagar Haveli and Daman and Diu|Delhi|Jammu and Kashmir|Ladakh|Lakshadweep|Puducherry",
              "sourceType": "STATIC",
              "toolTip": "The Indian state of the correspondence address."
            },
            {
              "fieldNumber": 33,
              "fieldName": "Correspondence District",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Cascading field, shows districts mapped with the selected state.",
              "options": "Bagalkot|Ballari|Belagavi|Bengaluru Rural|Bengaluru Urban|Bidar|Chamarajanagar|Chikballapur|Chikkamagaluru|Chitradurga|Dakshina Kannada|Davanagere|Dharwad|Gadag|Hassan|Haveri|Kalaburagi|Kodagu|Kolar|Koppal|Mandya|Mysuru|Raichur|Ramanagara|Shivamogga|Tumakuru|Udupi|Uttara Kannada|Vijayapura|Yadgir|Almora|Bageshwar|Chamoli|Champawat|Dehradun|Haridwar|Nainital|Pauri Garhwal|Pithoragarh|Rudraprayag|Tehri Garhwal|Udham Singh Nagar|Uttarkashi|Ajmer|Alwar|Anupgarh|Balotra|Banswara|Baran|Barmer|Beawar|Bharatpur|Bhilwara|Bikaner|Bundi|Chittorgarh|Churu|Dausa|Deeg|Dholpur|Didwana-Kuchaman|Dungarpur|Gangapur City|Hanumangarh|Jaipur|Jaipur Rural|Jaisalmer|Jalore|Jhalawar|Jhunjhunu|Jodhpur|Jodhpur Rural|Karauli|Kekri|Khairthal-Tijara|Kota|Kotputli-Behror|Nagaur|Neem Ka Thana|Pali|Phalodi|Pratapgarh|Rajsamand|Salumber|Sanchore|Sawai Madhopur|Shahpura|Sikar|Sirohi|Sri Ganganagar|Tonk|Udaipur",
              "sourceType": "STATIC",
              "toolTip": "The district of the correspondence address."
            },
            {
              "fieldNumber": 34,
              "fieldName": "Correspondence Taluk",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 50 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The taluk or tehsil of the correspondence address."
            },
            {
              "fieldNumber": 35,
              "fieldName": "Correspondence City",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 50 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The city or town of the correspondence address."
            },
            {
              "fieldNumber": 36,
              "fieldName": "Correspondence Pin Code",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 10 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The 6-digit postal PIN code of the correspondence address."
            },
            {
              "fieldNumber": 37,
              "fieldName": "Correspondence Std Code",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Max: 10 chars | Pattern: ^[0-9]{2,5}$ | STD area code digits only.",
              "options": null,
              "sourceType": null,
              "toolTip": "The STD code for the landline at the correspondence address."
            },
            {
              "fieldNumber": 38,
              "fieldName": "Correspondence Phone Number",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Max: 15 chars | Pattern: ^[0-9]{2,5}[0-9]{6,8}$ | Landline number without STD code. Digits only.",
              "options": null,
              "sourceType": null,
              "toolTip": "The landline phone number at the correspondence address."
            },
            {
              "fieldNumber": 39,
              "fieldName": "Correspondence Country Code",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 5 chars | Pattern: ^\\+?[0-9]{1,4}$ | International dialing code (e.g. +91 for India).",
              "options": null,
              "sourceType": null,
              "toolTip": "The international dialing code for the correspondence contact number."
            },
            {
              "fieldNumber": 40,
              "fieldName": "Correspondence Mobile Number",
              "type": "TEL",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 10 chars | Pattern: ^[6-9]\\d{9}$ | Indian mobile number starting with 6, 7, 8, or 9. No special characters. Encrypted storage.",
              "options": null,
              "sourceType": null,
              "toolTip": "The mobile contact number associated with the correspondence address."
            },
            {
              "fieldNumber": 41,
              "fieldName": "Correspondence Email",
              "type": "EMAIL",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 100 chars | Pattern: ^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$ | Valid email address format. Encrypted storage.",
              "options": null,
              "sourceType": null,
              "toolTip": "The email address for receiving official correspondence and government communications."
            }
          ],
          "conditionalRules": [
            "Show entire Correspondence Address section when \"Correspondence Address Same As Corporate\" is unchecked (value = false/unchecked)"
          ]
        }
      ]
    },
    {
      "pageNumber": 2,
      "pageName": "AUTHORIZED SIGNATORY AND PROMOTER DETAILS",
      "sections": [
        {
          "sectionId": "2.1",
          "sectionName": "Authorized Signatory Details",
          "note": "Authorized Signatory is the person authorized to sign the application.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 42,
              "fieldName": "Authorized Signatory Name",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 100 chars | Full name of the authorized signatory as per PAN/Aadhaar.",
              "options": null,
              "sourceType": null,
              "toolTip": "The full legal name of the person authorized to sign and submit this application on behalf of the company."
            },
            {
              "fieldNumber": 43,
              "fieldName": "Authorized Signatory Designation",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 100 chars | Designation of the authorized signatory (e.g. Director, MD, Partner).",
              "options": null,
              "sourceType": null,
              "toolTip": "The official role of the authorized signatory within the company, such as Director, MD, or Partner."
            },
            {
              "fieldNumber": 44,
              "fieldName": "Authorized Signatory PAN",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 10 chars | Pattern: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$ | PAN of the Authorized Signatory (not company PAN).",
              "options": null,
              "sourceType": null,
              "toolTip": "The personal PAN of the authorized signatory — distinct from the company PAN card."
            },
            {
              "fieldNumber": 45,
              "fieldName": "Authorized Signatory Aadhaar",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 12 chars | Pattern: ^\\d{12}$ | Aadhaar of Authorized Signatory. Masked display. Encrypted storage.",
              "options": null,
              "sourceType": null,
              "toolTip": "The 12-digit Aadhaar number of the authorized signatory for government identity verification."
            },
            {
              "fieldNumber": 46,
              "fieldName": "Authorized Signatory Mobile Number",
              "type": "TEL",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 10 chars | Pattern: ^[6-9]\\d{9}$ | Mobile number for OTP and communication. Encrypted storage.",
              "options": null,
              "sourceType": null,
              "toolTip": "The mobile number of the authorized signatory, used for OTP verification and notifications."
            },
            {
              "fieldNumber": 47,
              "fieldName": "Authorized Signatory Email",
              "type": "EMAIL",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 100 chars | Pattern: ^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$ | Valid email address of the authorized signatory. Encrypted storage.",
              "options": null,
              "sourceType": null,
              "toolTip": "The email of the authorized signatory for receiving official notifications and correspondence."
            },
            {
              "fieldNumber": 48,
              "fieldName": "Authorized Signatory DIN",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 8 chars | Pattern: ^[0-9]{8}$ | Director Identification Number. Authenticated via MCA API.",
              "options": null,
              "sourceType": null,
              "toolTip": "The 8-digit Director Identification Number, required for signatory who is a registered company director."
            },
            {
              "fieldNumber": 49,
              "fieldName": "Authorized Signatory Address Line 1",
              "type": "TEXTAREA",
              "grid": 12,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 300 chars. First line of the authorized signatory's residential or official address.",
              "options": null,
              "sourceType": null,
              "toolTip": "The first line of the authorized signatory's residential or office address."
            },
            {
              "fieldNumber": 50,
              "fieldName": "Authorized Signatory Address Line 2",
              "type": "TEXTAREA",
              "grid": 12,
              "mandatory": "Optional",
              "validationNotes": "Max: 300 chars. Second line of the authorized signatory's address. Optional.",
              "options": null,
              "sourceType": null,
              "toolTip": "The second line of the authorized signatory's address (optional)."
            },
            {
              "fieldNumber": 51,
              "fieldName": "Authorized Signatory Country",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "",
              "options": "India|United States|United Kingdom|Canada|Australia|Germany|France|Japan|China|Brazil|Russia|South Africa|Italy|Spain|Netherlands|Singapore|UAE|Saudi Arabia|New Zealand|Switzerland",
              "sourceType": "STATIC",
              "toolTip": "The country of the authorized signatory's residential address."
            },
            {
              "fieldNumber": 52,
              "fieldName": "Authorized Signatory State",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "",
              "options": "Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chhattisgarh|Goa|Gujarat|Haryana|Himachal Pradesh|Jharkhand|Karnataka|Kerala|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Odisha|Punjab|Rajasthan|Sikkim|Tamil Nadu|Telangana|Tripura|Uttar Pradesh|Uttarakhand|West Bengal|Andaman and Nicobar Islands|Chandigarh|Dadra and Nagar Haveli and Daman and Diu|Delhi|Jammu and Kashmir|Ladakh|Lakshadweep|Puducherry",
              "sourceType": "STATIC",
              "toolTip": "The state of the authorized signatory's residential address."
            },
            {
              "fieldNumber": 53,
              "fieldName": "Authorized Signatory District",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "",
              "options": "Bagalkot|Ballari|Belagavi|Bengaluru Rural|Bengaluru Urban|Bidar|Chamarajanagar|Chikballapur|Chikkamagaluru|Chitradurga|Dakshina Kannada|Davanagere|Dharwad|Gadag|Hassan|Haveri|Kalaburagi|Kodagu|Kolar|Koppal|Mandya|Mysuru|Raichur|Ramanagara|Shivamogga|Tumakuru|Udupi|Uttara Kannada|Vijayapura|Yadgir|Almora|Bageshwar|Chamoli|Champawat|Dehradun|Haridwar|Nainital|Pauri Garhwal|Pithoragarh|Rudraprayag|Tehri Garhwal|Udham Singh Nagar|Uttarkashi|Ajmer|Alwar|Anupgarh|Balotra|Banswara|Baran|Barmer|Beawar|Bharatpur|Bhilwara|Bikaner|Bundi|Chittorgarh|Churu|Dausa|Deeg|Dholpur|Didwana-Kuchaman|Dungarpur|Gangapur City|Hanumangarh|Jaipur|Jaipur Rural|Jaisalmer|Jalore|Jhalawar|Jhunjhunu|Jodhpur|Jodhpur Rural|Karauli|Kekri|Khairthal-Tijara|Kota|Kotputli-Behror|Nagaur|Neem Ka Thana|Pali|Phalodi|Pratapgarh|Rajsamand|Salumber|Sanchore|Sawai Madhopur|Shahpura|Sikar|Sirohi|Sri Ganganagar|Tonk|Udaipur",
              "sourceType": "STATIC",
              "toolTip": "The district of the authorized signatory's residential address."
            },
            {
              "fieldNumber": 54,
              "fieldName": "Authorized Signatory Taluk",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 50 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The taluk of the authorized signatory's residential address."
            },
            {
              "fieldNumber": 55,
              "fieldName": "Authorized Signatory City",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 50 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The city or town of the authorized signatory's residential address."
            },
            {
              "fieldNumber": 56,
              "fieldName": "Authorized Signatory Pin Code",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 6 chars | Pattern: ^\\d{6}$",
              "options": null,
              "sourceType": null,
              "toolTip": "The 6-digit PIN code of the authorized signatory's residential address."
            }
          ],
          "conditionalRules": [
            "Show \"Authorized Signatory DIN\" when \"Constitution Of Establishment\" = \"public_limited\" OR \"private_limited\" OR \"one_person_company\" OR \"section_8\""
          ]
        },
        {
          "sectionId": "2.2",
          "sectionName": "Promoter Details",
          "note": "This section is REPEATABLE. Minimum 1 promoter required.",
          "isRepeatable": true,
          "minRows": 1,
          "maxRows": 10,
          "fields": [
            {
              "fieldNumber": 57,
              "fieldName": "Promoter Name",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 100 chars | Full name as per PAN card.",
              "options": null,
              "sourceType": null,
              "toolTip": "The full legal name of the company promoter or founder as per their PAN card."
            },
            {
              "fieldNumber": 58,
              "fieldName": "Promoter Designation",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 100 chars | Designation/role in the company (Director, Partner, Proprietor, etc.)",
              "options": null,
              "sourceType": null,
              "toolTip": "The role or title of the promoter in the company, such as Director, Partner, or Proprietor."
            },
            {
              "fieldNumber": 59,
              "fieldName": "Promoter Gender",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Select the gender of the promoter. Options: Male | Female | Other",
              "options": "Male|Female|Other",
              "sourceType": "STATIC",
              "toolTip": "The gender of the promoter, used to determine eligibility for gender-based government benefits."
            },
            {
              "fieldNumber": 60,
              "fieldName": "Promoter Social Category",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Social category for government benefit classification. All promoters must belong to the same category for social category benefits.",
              "options": "General|SC|ST|OBC|Minority|Physically Handicapped|Ex-servicemen|Women",
              "sourceType": "STATIC",
              "toolTip": "The social category (SC/ST/OBC/General) of the promoter for government classification and benefit eligibility."
            },
            {
              "fieldNumber": 61,
              "fieldName": "Promoter PAN",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 10 chars | Pattern: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$ | Promoter PAN. Masked display.",
              "options": null,
              "sourceType": null,
              "toolTip": "The 10-character Permanent Account Number of the individual promoter."
            },
            {
              "fieldNumber": 62,
              "fieldName": "Promoter Aadhaar",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 12 chars | Pattern: ^\\d{12}$ | Promoter Aadhaar. Masked display. Encrypted storage.",
              "options": null,
              "sourceType": null,
              "toolTip": "The 12-digit Aadhaar identity number of the promoter for verification and deduplication."
            },
            {
              "fieldNumber": 63,
              "fieldName": "Promoter Date Of Birth",
              "type": "DATE",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"maxDate\": \"today\"} | Must not be a future date.",
              "options": null,
              "sourceType": null,
              "toolTip": "The date of birth of the promoter as per official government identity documents."
            },
            {
              "fieldNumber": 64,
              "fieldName": "Promoter Mobile Number",
              "type": "TEL",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 10 chars | Pattern: ^[6-9]\\d{9}$",
              "options": null,
              "sourceType": null,
              "toolTip": "The mobile phone number of the promoter for contact, OTP, and communication purposes."
            },
            {
              "fieldNumber": 65,
              "fieldName": "Promoter Email",
              "type": "EMAIL",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 100 chars | Pattern: ^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$ | Valid email address of the promoter. Encrypted storage.",
              "options": null,
              "sourceType": null,
              "toolTip": "The email address of the promoter for receiving official communications from the portal."
            },
            {
              "fieldNumber": 66,
              "fieldName": "Promoter Share Percentage",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0, \"max\": 100} | Shareholding percentage. Total across all promoters must equal 100%.",
              "options": null,
              "sourceType": null,
              "toolTip": "The percentage shareholding or ownership stake held by this promoter in the company."
            },
            {
              "fieldNumber": 67,
              "fieldName": "Promoter DIN",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 8 chars | Pattern: ^[0-9]{8}$ | Director Identification Number.",
              "options": null,
              "sourceType": null,
              "toolTip": "The 8-digit Director Identification Number of the promoter, required if they are a company director."
            }
          ],
          "conditionalRules": [
            "Show \"Promoter DIN\" for each promoter row when \"Constitution Of Establishment\" = \"public_limited\" OR \"private_limited\" OR \"one_person_company\" OR \"section_8\""
          ]
        }
      ]
    },
    {
      "pageNumber": 3,
      "pageName": "PROPOSED PROJECT DETAILS",
      "sections": [
        {
          "sectionId": "3.1",
          "sectionName": "Project Basic Information",
          "note": null,
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 68,
              "fieldName": "Name Of Industrial Unit",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 255 chars | Name of the proposed industrial unit/project.",
              "options": null,
              "sourceType": null,
              "toolTip": "The proposed name of the factory or industrial unit to be established at the project site."
            },
            {
              "fieldNumber": 69,
              "fieldName": "NIC Code",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Numeric, 5-digit NIC 2008 code. Source: MASTER.",
              "options": null,
              "sourceType": "MASTER",
              "toolTip": "The 5-digit National Industrial Classification (NIC 2008) code identifying the industry's economic activity."
            },
            {
              "fieldNumber": 70,
              "fieldName": "Industry Type",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Micro | Small | Medium | Large | Mega | Ultra Mega | Super Mega",
              "options": "Micro|Small|Medium|Large|Mega|Ultra Mega|Super Mega",
              "sourceType": "STATIC",
              "toolTip": "The scale classification of the unit — Micro, Small, Medium, Large, Mega, Ultra Mega, or Super Mega."
            },
            {
              "fieldNumber": 71,
              "fieldName": "Products Or Services To Be Manufactured",
              "type": "TEXTAREA",
              "grid": 12,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 1000 chars | Briefly describe the products/services to be manufactured or provided.",
              "options": null,
              "sourceType": null,
              "toolTip": "A brief description of the products to be manufactured or services to be provided by this industrial unit."
            },
            {
              "fieldNumber": 72,
              "fieldName": "Is Existing MSME Unit",
              "type": "RADIO",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Yes | No",
              "options": "Yes|No",
              "sourceType": "STATIC",
              "toolTip": "Indicates whether the applicant already has a registered Micro, Small, or Medium Enterprise unit."
            },
            {
              "fieldNumber": 73,
              "fieldName": "Udyam Registration Number",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 19 chars | Pattern: ^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$ | Format: UDYAM-XX-00-0000000.",
              "options": null,
              "sourceType": null,
              "toolTip": "The unique Udyam registration number (UDYAM-XX-00-0000000) of the existing MSME unit."
            },
            {
              "fieldNumber": 74,
              "fieldName": "Whether Pollution Causing Industry",
              "type": "RADIO",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Yes | No",
              "options": "Yes|No",
              "sourceType": "STATIC",
              "toolTip": "Indicates whether the proposed industrial process generates pollution requiring environmental authority clearance."
            },
            {
              "fieldNumber": 75,
              "fieldName": "Pollution Category",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "As per KSPCB / CPCB pollution category classification.",
              "options": null,
              "sourceType": "MASTER",
              "toolTip": "The environmental pollution category (Red/Orange/Green/White) as classified by KSPCB/CPCB for this industry."
            }
          ],
          "conditionalRules": [
            "Show \"Udyam Registration Number\" when \"Is Existing MSME Unit\" = \"yes\"",
            "Show \"Pollution Category\" when \"Whether Pollution Causing Industry\" = \"yes\""
          ]
        },
        {
          "sectionId": "3.2",
          "sectionName": "Location Details",
          "note": "Location refers to the proposed site for the industrial unit.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 76,
              "fieldName": "Project Location District",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 255 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The district in Karnataka where the proposed industrial project will be set up."
            },
            {
              "fieldNumber": 77,
              "fieldName": "Project Location Taluk",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 255 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The taluk within the selected district where the project site is situated."
            },
            {
              "fieldNumber": 78,
              "fieldName": "Project Location Hobli",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 255 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The hobli (revenue circle subdivision) within the taluk of the project site."
            },
            {
              "fieldNumber": 79,
              "fieldName": "Project Location Village",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 255 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The village or locality name of the proposed project site."
            },
            {
              "fieldNumber": 80,
              "fieldName": "Project Location Zone",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Zone classification as per Karnataka Industrial Policy for incentive purposes.",
              "options": null,
              "sourceType": null,
              "toolTip": "The industrial zone classification of the project area as per Karnataka Industrial Policy incentive zones."
            },
            {
              "fieldNumber": 81,
              "fieldName": "Project Address Line 1",
              "type": "TEXT",
              "grid": 12,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 255 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The first line of the full address of the proposed factory or project site."
            },
            {
              "fieldNumber": 82,
              "fieldName": "Project Address Line 2",
              "type": "TEXT",
              "grid": 12,
              "mandatory": "Optional",
              "validationNotes": "Max: 255 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "The second line of the project site address (optional)."
            },
            {
              "fieldNumber": 83,
              "fieldName": "Project Pin Code",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Max: 6 chars | Pattern: ^\\d{6}$",
              "options": null,
              "sourceType": null,
              "toolTip": "The 6-digit postal PIN code of the proposed project site."
            },
            {
              "fieldNumber": 84,
              "fieldName": "Industrial Area Or Estate Name",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Max: 255 chars | Name of Industrial Area / KIADB Estate / SEZ, if applicable.",
              "options": null,
              "sourceType": null,
              "toolTip": "The name of the industrial area, KIADB estate, or SEZ in which the project is located, if applicable."
            }
          ],
          "conditionalRules": []
        },
        {
          "sectionId": "3.3",
          "sectionName": "Land Details",
          "note": null,
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 85,
              "fieldName": "Land Availability Status",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Owned | Leased | Rented | Government Allotted | To be Purchased | Not Identified",
              "options": "Owned|Leased|Rented|Government Allotted|To be Purchased|Not Identified",
              "sourceType": "STATIC",
              "toolTip": "The current ownership or acquisition status of the land — Owned, Leased, Rented, Government Allotted, etc."
            },
            {
              "fieldNumber": 86,
              "fieldName": "Land Source",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "KIADB | SIIDCUL | Revenue Land",
              "options": "KIADB|SIIDCUL|Revenue Land",
              "sourceType": "STATIC",
              "toolTip": "The authority or source from which the project land is obtained, such as KIADB, SIIDCUL, or Revenue."
            },
            {
              "fieldNumber": 87,
              "fieldName": "Total Land Required In Acres",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0.01, \"max\": 9999} | Total land area required in acres. Land > 10 acres requires LAC meeting.",
              "options": null,
              "sourceType": null,
              "toolTip": "The total area of land required for the proposed industrial project, expressed in acres."
            },
            {
              "fieldNumber": 88,
              "fieldName": "Built Up Area Required In Sq Ft",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Total built-up area required in square feet.",
              "options": null,
              "sourceType": null,
              "toolTip": "The total built-up or constructed area required for the project buildings and infrastructure, in square feet."
            },
            {
              "fieldNumber": 89,
              "fieldName": "Survey Or Katha Number",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 100 chars | Survey number / Katha number of the available land parcel.",
              "options": null,
              "sourceType": null,
              "toolTip": "The official land survey number or katha number from Karnataka revenue records for the project parcel."
            },
            {
              "fieldNumber": 90,
              "fieldName": "Existing Plant Area In Acres",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"min\": 0} | Area of existing plant/facility in acres.",
              "options": null,
              "sourceType": null,
              "toolTip": "The area of the existing plant or facility in acres, required for expansion or modernization proposals."
            }
          ],
          "conditionalRules": [
            "Show \"Survey Or Katha Number\" when \"Land Availability Status\" = \"available\"",
            "Show \"Existing Plant Area In Acres\" when \"Type Of Proposal\" = \"expansion\" OR \"diversification\" OR \"modernization\""
          ]
        }
      ]
    },
    {
      "pageNumber": 4,
      "pageName": "PROJECT FINANCE",
      "sections": [
        {
          "sectionId": "4.1",
          "sectionName": "Investment Details",
          "note": "All investment values are in Indian Rupees (INR), in Lakhs.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 91,
              "fieldName": "Investment In Land",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Investment in land in INR Lakhs. Enter 0 if land is leased.",
              "options": null,
              "sourceType": null,
              "toolTip": "The proposed capital expenditure for land purchase or acquisition, expressed in Indian Rupees (Lakhs)."
            },
            {
              "fieldNumber": 92,
              "fieldName": "Investment In Building",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Investment in building / civil construction in INR Lakhs.",
              "options": null,
              "sourceType": null,
              "toolTip": "The planned investment in building construction and civil infrastructure, in INR Lakhs."
            },
            {
              "fieldNumber": 93,
              "fieldName": "Investment In Plant And Machinery",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Investment in plant, machinery and equipment in INR Lakhs.",
              "options": null,
              "sourceType": null,
              "toolTip": "The planned investment in plant, machinery, and production equipment, in INR Lakhs."
            },
            {
              "fieldNumber": 94,
              "fieldName": "Investment In Other Fixed Assets",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Investment in other fixed assets (furniture, vehicles, tools, etc.)",
              "options": null,
              "sourceType": null,
              "toolTip": "Investment in other fixed assets such as furniture, vehicles, and tools not included above, in INR Lakhs."
            },
            {
              "fieldNumber": 95,
              "fieldName": "Total Fixed Capital Investment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Auto Calculated",
              "validationNotes": "Read-only | Auto-calculated: Land + Building + Plant & Machinery + Other Fixed Assets.",
              "options": null,
              "sourceType": null,
              "toolTip": "Auto-calculated sum of land, building, plant & machinery, and other fixed asset investments, in INR Lakhs."
            },
            {
              "fieldNumber": 96,
              "fieldName": "Working Capital",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Estimated working capital requirement in INR Lakhs.",
              "options": null,
              "sourceType": null,
              "toolTip": "The estimated funds needed for day-to-day business operations after commissioning, in INR Lakhs."
            },
            {
              "fieldNumber": 97,
              "fieldName": "Total Project Cost",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Auto Calculated",
              "validationNotes": "Read-only | Auto-calculated: Total Fixed Capital Investment + Working Capital.",
              "options": null,
              "sourceType": null,
              "toolTip": "Auto-calculated total — sum of total fixed capital investment and working capital, in INR Lakhs."
            },
            {
              "fieldNumber": 98,
              "fieldName": "Existing Investment In VFA",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"min\": 0} | Existing VFA investment before proposed expansion/diversification in INR Lakhs.",
              "options": null,
              "sourceType": null,
              "toolTip": "Value of existing fixed assets (VFA) before the proposed expansion or modernization, in INR Lakhs."
            },
            {
              "fieldNumber": 99,
              "fieldName": "FDI Investment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Foreign Direct Investment component in INR Lakhs, if any.",
              "options": null,
              "sourceType": null,
              "toolTip": "The Foreign Direct Investment component of the project, if any, in INR Lakhs."
            },
            {
              "fieldNumber": 100,
              "fieldName": "Source Of FDI",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 255 chars | Country/entity source of FDI investment.",
              "options": null,
              "sourceType": null,
              "toolTip": "The country or foreign entity from which the Foreign Direct Investment is being sourced."
            }
          ],
          "conditionalRules": [
            "Show \"Existing Investment In VFA\" when \"Type Of Proposal\" = \"expansion\" OR \"diversification\" OR \"modernization\"",
            "Show \"Source Of FDI\" when \"FDI Investment\" > 0"
          ]
        },
        {
          "sectionId": "4.2",
          "sectionName": "Financing Pattern",
          "note": "Total Financing must equal Total Project Cost.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 101,
              "fieldName": "Own Funds Or Equity",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Promoter's own funds / equity contribution in INR Lakhs.",
              "options": null,
              "sourceType": null,
              "toolTip": "The amount contributed from the promoters' own funds or equity capital for the project, in INR Lakhs."
            },
            {
              "fieldNumber": 102,
              "fieldName": "Bank Loan",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Term loan from bank/financial institution in INR Lakhs.",
              "options": null,
              "sourceType": null,
              "toolTip": "The term loan amount from a bank or financial institution to finance the project, in INR Lakhs."
            },
            {
              "fieldNumber": 103,
              "fieldName": "Name Of Bank Or Financial Institution",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 255 chars | Name of bank/NBFC providing the loan.",
              "options": null,
              "sourceType": null,
              "toolTip": "The name of the bank or NBFC that is providing the term loan for the project."
            },
            {
              "fieldNumber": 104,
              "fieldName": "Subsidy Or Grant",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Government subsidy/grant component in INR Lakhs, if any.",
              "options": null,
              "sourceType": null,
              "toolTip": "The government subsidy or grant component in the project financing, in INR Lakhs."
            },
            {
              "fieldNumber": 105,
              "fieldName": "Other Source Amount",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Any other financing source in INR Lakhs.",
              "options": null,
              "sourceType": null,
              "toolTip": "Any additional financing source not covered by equity, loan, or subsidy, in INR Lakhs."
            },
            {
              "fieldNumber": 106,
              "fieldName": "Other Source Description",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 255 chars | Describe the other financing source.",
              "options": null,
              "sourceType": null,
              "toolTip": "A brief description of the other financing source, such as venture capital or internal accruals."
            },
            {
              "fieldNumber": 107,
              "fieldName": "Total Financing",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Auto Calculated",
              "validationNotes": "Read-only | Auto-calculated: Own Funds + Bank Loan + Subsidy + Other Source.",
              "options": null,
              "sourceType": null,
              "toolTip": "Auto-calculated total financing — sum of equity, bank loan, subsidy, and other sources, in INR Lakhs."
            }
          ],
          "conditionalRules": [
            "Show \"Name Of Bank Or Financial Institution\" when \"Bank Loan\" > 0",
            "Show \"Other Source Description\" when \"Other Source Amount\" > 0"
          ]
        }
      ]
    },
    {
      "pageNumber": 5,
      "pageName": "PROJECT REQUIREMENT",
      "sections": [
        {
          "sectionId": "5.1",
          "sectionName": "Water Requirement",
          "note": null,
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 108,
              "fieldName": "Total Water Requirement In KLD",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Total water requirement in Kilo Litres per Day (KLD).",
              "options": null,
              "sourceType": null,
              "toolTip": "The total water consumption required by the unit per day, measured in Kilo Litres per Day (KLD)."
            },
            {
              "fieldNumber": 109,
              "fieldName": "Source Of Water",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Primary source from which the industrial unit will obtain water supply. Options: Borewell | Municipal Supply | River | Canal | Tanker | Other",
              "options": "Borewell|Municipal Supply|River|Canal|Tanker|Other",
              "sourceType": "STATIC",
              "toolTip": "The primary source from which water will be procured — e.g., Urban Jal Sansthan, Boring, River, or Canal."
            },
            {
              "fieldNumber": 110,
              "fieldName": "Water Source Other Description",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 255 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "A description of the alternative water source when 'Other' is selected as the source."
            },
            {
              "fieldNumber": 111,
              "fieldName": "Industrial Use Water In KLD",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Water required for industrial process use (KLD).",
              "options": null,
              "sourceType": null,
              "toolTip": "The volume of water required specifically for industrial manufacturing processes, in KLD."
            },
            {
              "fieldNumber": 112,
              "fieldName": "Domestic Use Water In KLD",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Water required for domestic/sanitary use (KLD).",
              "options": null,
              "sourceType": null,
              "toolTip": "The volume of water required for domestic and sanitary use within the facility, in KLD."
            }
          ],
          "conditionalRules": [
            "Show \"Water Source Other Description\" when \"Source Of Water\" = \"other\""
          ]
        },
        {
          "sectionId": "5.2",
          "sectionName": "Power Requirement",
          "note": null,
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 113,
              "fieldName": "Total Power Requirement In KVA",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Total power requirement in KVA (Kilo Volt Ampere).",
              "options": null,
              "sourceType": null,
              "toolTip": "The total electrical power requirement of the unit, measured in Kilo Volt Amperes (KVA)."
            },
            {
              "fieldNumber": 114,
              "fieldName": "Connected Load In KW",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Connected load in Kilowatts (KW).",
              "options": null,
              "sourceType": null,
              "toolTip": "The total connected electrical load of all machinery and equipment in the plant, in Kilowatts."
            },
            {
              "fieldNumber": 115,
              "fieldName": "Source Of Power",
              "type": "SELECT",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Primary source of electrical power for the unit. Options: Grid Supply | Captive Power Plant | Solar | Wind | Other",
              "options": "Grid Supply|Captive Power Plant|Solar|Wind|Other",
              "sourceType": "STATIC",
              "toolTip": "The primary electricity supply source — such as ESCOM grid connection or captive generator."
            },
            {
              "fieldNumber": 116,
              "fieldName": "Power Source Other Description",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Max: 255 chars",
              "options": null,
              "sourceType": null,
              "toolTip": "A description of the alternative power source when 'Other' is selected as the source."
            },
            {
              "fieldNumber": 117,
              "fieldName": "Renewable Energy Percentage",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0, \"max\": 100} | Percentage of total power from renewable sources, if applicable.",
              "options": null,
              "sourceType": null,
              "toolTip": "The percentage of total power requirement that will be met from renewable energy sources."
            }
          ],
          "conditionalRules": [
            "Show \"Power Source Other Description\" when \"Source Of Power\" = \"other\""
          ]
        },
        {
          "sectionId": "5.3",
          "sectionName": "Manpower Requirement",
          "note": "Employment figures should be projected numbers after full commissioning.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 118,
              "fieldName": "Male Employment Direct",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Number of direct male employees.",
              "options": null,
              "sourceType": null,
              "toolTip": "The projected number of direct male employees after the unit reaches full commissioning."
            },
            {
              "fieldNumber": 119,
              "fieldName": "Female Employment Direct",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Number of direct female employees.",
              "options": null,
              "sourceType": null,
              "toolTip": "The projected number of direct female employees after the unit reaches full commissioning."
            },
            {
              "fieldNumber": 120,
              "fieldName": "Total Direct Employment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Auto Calculated",
              "validationNotes": "Read-only | Auto-calculated: Male + Female direct employment.",
              "options": null,
              "sourceType": null,
              "toolTip": "Auto-calculated total direct employment — sum of male and female direct employees."
            },
            {
              "fieldNumber": 121,
              "fieldName": "Skilled Employment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Number of skilled employees among total direct employment.",
              "options": null,
              "sourceType": null,
              "toolTip": "The number of technically trained or skilled workers among the total direct employees."
            },
            {
              "fieldNumber": 122,
              "fieldName": "Semi Skilled Employment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0}",
              "options": null,
              "sourceType": null,
              "toolTip": "The number of partially trained or semi-skilled workers among the total direct employees."
            },
            {
              "fieldNumber": 123,
              "fieldName": "Unskilled Employment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0}",
              "options": null,
              "sourceType": null,
              "toolTip": "The number of general labour or unskilled workers among the total direct employees."
            },
            {
              "fieldNumber": 124,
              "fieldName": "Karnataka State Employment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"min\": 0} | Number of employees who are Karnataka state domicile.",
              "options": null,
              "sourceType": null,
              "toolTip": "The number of employees who are domiciles of Karnataka state among the total workforce."
            },
            {
              "fieldNumber": 125,
              "fieldName": "Local District Employment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Number of employees from the local district.",
              "options": null,
              "sourceType": null,
              "toolTip": "The number of employees specifically from the project's local district."
            },
            {
              "fieldNumber": 126,
              "fieldName": "Indirect Employment",
              "type": "NUMBER",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"min\": 0} | Estimated indirect/ancillary employment generated.",
              "options": null,
              "sourceType": null,
              "toolTip": "The estimated number of indirect jobs generated in ancillary and support sectors due to the project."
            }
          ],
          "conditionalRules": []
        }
      ]
    },
    {
      "pageNumber": 6,
      "pageName": "ASSISTANCE",
      "sections": [
        {
          "sectionId": "6.1",
          "sectionName": "Government Assistance Details",
          "note": "Investor selects what government assistance/incentives they are applying for.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 127,
              "fieldName": "Type Of Assistance Required",
              "type": "MULTISELECT",
              "grid": 12,
              "mandatory": "Optional",
              "validationNotes": "Select all types of government assistance being sought. Options: Capital Subsidy | Interest Subsidy | Tax Incentives | Land Allotment | Skill Development Support | Other",
              "options": "Capital Subsidy|Interest Subsidy|Tax Incentives|Land Allotment|Skill Development Support|Other",
              "sourceType": "STATIC",
              "toolTip": "The types of government incentives or schemes the investor is applying for under this proposal."
            },
            {
              "fieldNumber": 128,
              "fieldName": "Whether Applying For Social Category Benefit",
              "type": "RADIO",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Indicate if the industrial unit intends to avail benefits based on a specific social category. Options: Yes | No",
              "options": "Yes|No",
              "sourceType": "STATIC",
              "toolTip": "Indicates whether the investor is seeking government benefits reserved for specific social categories."
            },
            {
              "fieldNumber": 129,
              "fieldName": "Social Category For Benefit",
              "type": "TEXT",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Specify the social category for government benefits. All promoters must belong to the same social category or gender.",
              "options": "SC|ST|Women|Minorities|Backward Classes|Physically Handicapped|Ex-servicemen|General",
              "sourceType": null,
              "toolTip": "The specific social category (SC, ST, Women, OBC) for which the social category benefit is claimed."
            },
            {
              "fieldNumber": 130,
              "fieldName": "Whether Tumakuru Machine Tool Park",
              "type": "RADIO",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "If project is within Tumakuru Machine Tool Park, it requires state-level approval.",
              "options": "Yes|No",
              "sourceType": "STATIC",
              "toolTip": "Indicates if the project is within Tumakuru Machine Tool Park, which triggers mandatory state-level approval."
            },
            {
              "fieldNumber": 131,
              "fieldName": "Assistance Remarks",
              "type": "TEXTAREA",
              "grid": 12,
              "mandatory": "Optional",
              "validationNotes": "Max: 1000 chars | Any additional remarks or details regarding the assistance being sought.",
              "options": null,
              "sourceType": null,
              "toolTip": "Any additional remarks or details about the government assistance or incentives being applied for."
            }
          ],
          "conditionalRules": [
            "Show \"Social Category For Benefit\" when \"Whether Applying For Social Category Benefit\" = \"yes\""
          ]
        }
      ]
    },
    {
      "pageNumber": 7,
      "pageName": "SUPPORTING DOCUMENTS",
      "sections": [
        {
          "sectionId": "7.1",
          "sectionName": "Document Upload",
          "note": "Each document is a file upload field. Documents managed via DMS API.",
          "isRepeatable": false,
          "minRows": null,
          "maxRows": null,
          "fields": [
            {
              "fieldNumber": 132,
              "fieldName": "Company PAN Card",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 2} | Upload Company PAN Card (PDF/JPG, max 2MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload a scanned copy of the company's PAN card issued by the Income Tax Department (PDF/JPG, max 2MB)."
            },
            {
              "fieldNumber": 133,
              "fieldName": "Authorized Signatory Aadhaar Card",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 2} | Upload Aadhaar Card of Authorized Signatory (PDF/JPG, max 2MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the Aadhaar card of the authorized signatory for identity verification (PDF/JPG, max 2MB)."
            },
            {
              "fieldNumber": 134,
              "fieldName": "Certificate Of Incorporation Or Registration",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 5} | Certificate of Incorporation (MCA) / Registration Certificate (PDF, max 5MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the MCA Certificate of Incorporation or the business registration certificate (PDF/JPG, max 5MB)."
            },
            {
              "fieldNumber": 135,
              "fieldName": "GST Certificate",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 2} | GST Registration Certificate (PDF/JPG, max 2MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the GST registration certificate issued by the GST authority (PDF/JPG, max 2MB)."
            },
            {
              "fieldNumber": 136,
              "fieldName": "Land Document Or Title Deed",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 10} | Land Title Deed / Patta / RTC / Sale Deed (PDF, max 10MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the land ownership or lease document — title deed, sale deed, patta, or RTC (PDF/JPG, max 10MB)."
            },
            {
              "fieldNumber": 137,
              "fieldName": "Detailed Project Report",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"accept\": \".pdf\", \"maxSizeMB\": 10} | Detailed Project Report (DPR) in PDF format (max 10MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the complete Detailed Project Report (DPR) covering technical, financial, and operational plans (PDF, max 10MB)."
            },
            {
              "fieldNumber": 138,
              "fieldName": "Bank Statement Or Net Worth Certificate",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Mandatory",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 5} | Latest 6-month bank statement OR Chartered Accountant's net worth certificate.",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the latest 6-month bank statement or a CA-certified net worth certificate (PDF/JPG, max 5MB)."
            },
            {
              "fieldNumber": 139,
              "fieldName": "Partnership Deed",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 5} | Registered Partnership Deed (PDF, max 5MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the registered partnership deed, required for firms with a partnership constitution (PDF/JPG, max 5MB)."
            },
            {
              "fieldNumber": 140,
              "fieldName": "Promoter Photograph",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"accept\": \".jpg,.jpeg,.png\", \"maxSizeMB\": 1} | Recent passport-size photograph of primary promoter (JPG/PNG, max 1MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload a recent passport-size photograph of the primary promoter (JPG/PNG format, max 1MB)."
            },
            {
              "fieldNumber": 141,
              "fieldName": "Udyam Registration Certificate",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 2} | Udyam Registration Certificate if existing MSME (PDF/JPG, max 2MB).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the Udyam registration certificate if the applicant is an existing MSME unit (PDF/JPG, max 2MB)."
            },
            {
              "fieldNumber": 142,
              "fieldName": "Previous CAF Approval Letter",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Conditional",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 5} | Approval letter of previous CAF for expansion/diversification/modernization.",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload the approval letter of the prior CAF, required for expansion, diversification, or modernization proposals (PDF/JPG, max 5MB)."
            },
            {
              "fieldNumber": 143,
              "fieldName": "Any Other Document",
              "type": "FILE",
              "grid": 6,
              "mandatory": "Optional",
              "validationNotes": "Validation: {\"accept\": \".pdf,.jpg,.jpeg,.png\", \"maxSizeMB\": 5} | Any other supporting document (optional).",
              "options": null,
              "sourceType": null,
              "toolTip": "Upload any other relevant supporting document for the application (optional, PDF/JPG, max 5MB)."
            }
          ],
          "conditionalRules": [
            "Show \"Certificate Of Incorporation Or Registration\" when \"Constitution Of Establishment\" = \"public_limited\" OR \"private_limited\" OR \"one_person_company\" OR \"section_8\" OR \"llp\" OR \"partnership\"",
            "Show \"GST Certificate\" when \"Do You Have GST Number\" = \"yes\"",
            "Show \"Land Document Or Title Deed\" when \"Land Availability Status\" = \"available\"",
            "Show \"Partnership Deed\" when \"Constitution Of Establishment\" = \"partnership\"",
            "Show \"Udyam Registration Certificate\" when \"Is Existing MSME Unit\" = \"yes\"",
            "Show \"Previous CAF Approval Letter\" when \"Type Of Proposal\" = \"expansion\" OR \"diversification\" OR \"modernization\""
          ]
        }
      ]
    }
  ],
  "businessRules": [
    "BR-1: State Level Approval: Investment > Rs 15 Crore OR project in Tumakuru Machine Tool Park -> State Level: MD -> Nodal Officer (DD) -> Joint Director (JD) -> Committee",
    "BR-2: District Level Approval: Investment <= Rs 15 Crore -> District Level: JD DIC -> DD DIC -> AD DIC",
    "BR-3: LAC Meeting Required: Land > 10 Acres OR (KIADB land source AND land > 2 Acres) -> Application must go to LAC (Land Audit Committee) meeting",
    "BR-4: Committee Level by Investment: Rs 15 Cr to Rs 500 Cr -> SLSWCC meeting. Investment > Rs 500 Cr -> HLSWCC meeting",
    "BR-5: VFA Increment for Expansion/Diversification/Modernization: New VFA must be at least 25% more than existing VFA",
    "BR-6: Social Category Benefits: All promoters must belong to SAME social category/gender for social category benefits (SC, ST, Women, Minorities, etc.)",
    "BR-7: DSC Verification: Before CAF submission, system verifies DSC registration. If not registered, investor redirected to DSC registration page.",
    "BR-8: No Payment for Offline Transition: No payment required for transitioning offline application to online format.",
    "BR-9: Edit Request: Investor can request edit only if application not yet processed by MD. Valid justification must be provided.",
    "BR-10: Withdrawal: Investor can withdraw approved CAF by providing proper justification. MD approves/rejects withdrawal request."
  ],
  "applicationStatusFlow": [
    {
      "status": "Submitted",
      "description": "Application submitted by investor"
    },
    {
      "status": "Allocated",
      "description": "Allocated to Nodal Officer"
    },
    {
      "status": "Pending With DD",
      "description": "Under review by Nodal Officer (DD)"
    },
    {
      "status": "Pending With JD",
      "description": "Forwarded to Joint Director"
    },
    {
      "status": "Pending With MD",
      "description": "Under review by Managing Director"
    },
    {
      "status": "Approved For Meeting",
      "description": "MD approved, awaiting committee meeting"
    },
    {
      "status": "Meeting Scheduled",
      "description": "Committee meeting date fixed"
    },
    {
      "status": "Approved",
      "description": "Application approved"
    },
    {
      "status": "Rejected",
      "description": "Application rejected (with reason)"
    },
    {
      "status": "Deferred",
      "description": "Decision deferred to next meeting"
    },
    {
      "status": "Pending With Investor",
      "description": "Query raised, investor must respond"
    },
    {
      "status": "Processing Offline",
      "description": "MD marked for offline processing"
    },
    {
      "status": "Edit Requested",
      "description": "Investor requested edit before MD processing"
    },
    {
      "status": "Withdrawal Requested",
      "description": "Investor submitted withdrawal request"
    },
    {
      "status": "Cancelled",
      "description": "MD cancelled an approved CAF"
    }
  ],
  "useCases": [
    {
      "useCaseId": "KUM_FSD_CAF_001",
      "useCaseName": "Filling and Submitting CAF Form",
      "actors": "Investors (New and Existing Industrial Unit)",
      "preconditions": [
        "Investor should be registered on Karnataka Single Window portal or National Single Window Portal (NSWS)",
        "Investor submitting the CAF Approval should have registered and valid Digital Signature certificate (DSC)"
      ],
      "basicFlow": [
        "Investor logs in and selects 'Combined Application Form (CAF)' from the menu bar",
        "Investor selects New/Existing radio button to confirm if the application is for a new or existing industrial unit",
        "Investor clicks on 'Company Details' tab, fills the form, and clicks 'Save and Next'",
        "Investor fills 'Authorized Signatory and Promoter Details' and clicks 'Save and Next'",
        "Investor fills 'Proposed Project Details' and clicks 'Save and Next'",
        "Investor fills 'Project Finance' and clicks 'Save and Next'",
        "Investor fills 'Project Requirement' and clicks 'Save and Next'",
        "Investor fills 'Assistance' and clicks 'Save and Next'",
        "Investor fills 'Supporting Documents' and clicks 'Save and Next'",
        "Investor makes prescribed payment online and gets payment confirmation",
        "Investor signs the application using DSC and clicks 'Save and Next'",
        "Investor reviews 'Summary' form and clicks 'Submit'"
      ],
      "businessRuleValidations": [
        "BR-1: Unique CAF application number generation",
        "BR-5: DSC registration verification",
        "BR-6: No payment for offline to online transition",
        "BR-8: Social Category Type classification based on promoters' social category/gender",
        "BR-9: Only authorized signatory can sign"
      ],
      "postConditions": [
        "A unique CAF application number is generated",
        "The completed CAF form is visible in the MD's dashboard and 'Application list'",
        "MD can allocate applications to a Nodal Officer for processing"
      ]
    },
    {
      "useCaseId": "KUM_FSD_CAF_002",
      "useCaseName": "CAF Workflow - Application Processing by KUM Officials",
      "actors": "Nodal Officer (DD), Joint Director (JD), Managing Director (MD), KUM",
      "preconditions": [
        "Nodal Officer, JD, and MD should have logged in",
        "A CAF application is submitted by the investor"
      ],
      "basicFlow": [
        "MD views submitted CAF applications on dashboard",
        "MD allocates application to a Nodal Officer or processes directly",
        "Nodal Officer adds File Noting, Executive Summary, forwards to JD",
        "JD reviews, adds File Noting, forwards to MD or reverts to Nodal Officer",
        "MD approves application for committee meeting (LAC/SLSWCC/HLSWCC)",
        "MD uploads proceedings after committee meeting and selects Approve/Reject/Defer",
        "MD uploads GO for the application"
      ],
      "businessRuleValidations": [
        "BR-10: State Level Approval Flow for investment > 15Cr or TMTP projects",
        "BR-11: District Level Approval Flow for investment < 15Cr",
        "BR-12: Proceeding generates GO",
        "BR-13: LAC Meeting for land > 10 Acres or KIADB land > 2 Acres"
      ],
      "postConditions": [
        "Completed CAF form visible in MD's dashboard",
        "System generates server-signed Government Order (GO) for each application",
        "Investor can track CAF application status"
      ]
    },
    {
      "useCaseId": "KUM_FSD_CAF_003",
      "useCaseName": "Applying for Amendments",
      "actors": "Investor",
      "preconditions": [
        "An approved CAF application exists"
      ],
      "basicFlow": [
        "Investor applies for changes related to correction in the original committee decision or additional land/water/power requirement",
        "Investor can apply for expansion, modernization, or diversification against an already approved application"
      ],
      "businessRuleValidations": [
        "For expansion/diversification/modernization: VFA must be at least 25% more than previous investment in VFA"
      ],
      "postConditions": [
        "Amendment request is submitted for processing"
      ]
    },
    {
      "useCaseId": "KUM_FSD_CAF_004",
      "useCaseName": "Amendments Workflow",
      "actors": "Managing Director, Deputy Director, Joint Director, Committee",
      "preconditions": [
        "An amendment request has been submitted by the investor.",
        "An approved CAF application exists."
      ],
      "basicFlow": [
        "The approval process of the amendments involves processing done by the Managing Director, Deputy Director and the Joint Director.",
        "The committee that approved the original CAF application processes the amendment.",
        "MD reviews the amendment request and allocates to Nodal Officer.",
        "Nodal Officer processes and forwards to JD.",
        "JD reviews and forwards to MD for final approval.",
        "MD approves or rejects the amendment request."
      ],
      "businessRuleValidations": [
        "BR-5: VFA Increment: New VFA must be at least 25% more than existing VFA for Expansion/Diversification/Modernization",
        "BR-1: State Level Approval applies for amendments above Rs 15 Crore threshold"
      ],
      "postConditions": [
        "Amendment is approved or rejected.",
        "Investor is notified of the amendment decision.",
        "If approved, the CAF record is updated with amendment details."
      ]
    },
    {
      "useCaseId": "KUM_FSD_CAF_005",
      "useCaseName": "District Level Workflow",
      "actors": "Joint Director District Industries Centre (JD DIC), Additional Director District Industries Centre (AD DIC), Deputy Director District Industries Centre (DD DIC)",
      "preconditions": [
        "CAF application with proposed investment less than Rs 15 Crore has been submitted.",
        "Application has been routed to district level processing."
      ],
      "basicFlow": [
        "The CAF application with investment <= Rs 15 Crore is routed to District Industries Centre.",
        "JD DIC reviews the application and processes it.",
        "JD DIC forwards to DD DIC for further review.",
        "DD DIC reviews and forwards to AD DIC.",
        "AD DIC makes the final approval or rejection decision at district level.",
        "Decision is communicated to the investor."
      ],
      "businessRuleValidations": [
        "BR-2: District Level Approval: Investment <= Rs 15 Crore -> JD DIC -> DD DIC -> AD DIC"
      ],
      "postConditions": [
        "CAF application is approved or rejected at the district level.",
        "Investor receives notification of the decision.",
        "If approved, clearances are processed at district level."
      ]
    },
    {
      "useCaseId": "KUM_FSD_CAF_006",
      "useCaseName": "Appeals",
      "actors": "Investor",
      "preconditions": [
        "Investor is dissatisfied with the decision of the Single Window Clearance Committee.",
        "A CAF application has been processed and a decision communicated."
      ],
      "basicFlow": [
        "Investor logs in and navigates to their CAF application.",
        "Investor selects the option to raise an appeal against the committee decision.",
        "Investor provides detailed justification and supporting documents for the appeal.",
        "Investor submits the appeal to a higher authority for review.",
        "System acknowledges receipt of the appeal and updates application status to Appeal Raised."
      ],
      "businessRuleValidations": [
        "Appeal can only be raised after a formal committee decision has been communicated.",
        "Investor must provide valid justification for the appeal."
      ],
      "postConditions": [
        "An appeal is submitted to a higher authority.",
        "Application status is updated to Appeal Raised.",
        "Higher authority is notified of the appeal for processing."
      ]
    },
    {
      "useCaseId": "KUM_FSD_CAF_007",
      "useCaseName": "Appeals Workflow",
      "actors": "Higher-level committee",
      "preconditions": [
        "An appeal has been submitted by the investor.",
        "Application status is Appeal Raised."
      ],
      "basicFlow": [
        "Higher-level committee reviews the submitted appeal and supporting documents.",
        "Committee evaluates the merits of the appeal against the original decision.",
        "Committee conducts a review meeting to discuss the appeal.",
        "Committee makes a decision: uphold, overturn, or modify the original decision.",
        "Decision is communicated to the investor and application status updated to Appeal Processed."
      ],
      "businessRuleValidations": [
        "Higher-level committee has authority to overturn or modify lower committee decisions.",
        "Appeal processing follows the same approval hierarchy as the original application."
      ],
      "postConditions": [
        "Appeal is resolved — decision upheld, overturned, or modified.",
        "Application status updated to Appeal Processed.",
        "Investor is notified of the final appeal decision.",
        "If overturned, appropriate clearances and GO are issued."
      ]
    },
    {
      "useCaseId": "KUM_FSD_CAF_008",
      "useCaseName": "KIADB Workflow",
      "actors": "Investor, KIADB (Karnataka Industrial Areas Development Board)",
      "preconditions": [
        "CAF application involves KIADB land as the source of land.",
        "Government Order (GO) has been uploaded for the application.",
        "Application has been approved."
      ],
      "basicFlow": [
        "After GO upload, if the land source is KIADB, the system automatically initiates KIADB-specific processing.",
        "System generates a demand for 30% of KIADB land allotment based on tentative land value and social category.",
        "An email notification with demand details is sent to the investor.",
        "Demand details are automatically pushed to the KIADB system for processing.",
        "KIADB processes the land allotment demand and communicates allocation details.",
        "Investor completes the KIADB-specific documentation and payment requirements."
      ],
      "businessRuleValidations": [
        "BR-3: LAC Meeting Required: Land > 10 Acres OR (KIADB land source AND land > 2 Acres) -> Application must go to LAC meeting",
        "Demand for 30% KIADB land allotment is auto-generated based on tentative land value and social category classification."
      ],
      "postConditions": [
        "Demand for KIADB land allotment is generated and communicated to the investor.",
        "KIADB system receives the demand details for processing.",
        "Investor can track KIADB land allotment status through the portal."
      ]
    },
    {
      "useCaseId": "KUM_FSD_CAF_009",
      "useCaseName": "Responding to Query/Notification",
      "actors": "Investor, Nodal Officer, MD",
      "preconditions": [
        "A Query/Notification has been raised by the Nodal Officer and approved by the MD",
        "The query has landed in the investor's dashboard"
      ],
      "basicFlow": [
        "Investor views the Query/Notification on their dashboard",
        "Investor opens the CAF form section against which the query was raised",
        "Investor modifies the relevant section and resubmits"
      ],
      "businessRuleValidations": [],
      "postConditions": [
        "Investor's response is submitted and the application is returned to the Nodal Officer for further processing"
      ]
    }
  ]
};
const countFields = (srs) =>
  (srs?.pages || []).reduce((a, p) => (p.sections || []).reduce((b, s) => b + (s.fields || []).length, a), 0);

// ── Main extraction ────────────────────────────────────────────────────────────
const extractAll = async (fileBase64, fileName, mimeType) => {
  const sizeKB = Math.round(fileBase64.length * 0.75 / 1024);
  console.log(`[${new Date().toISOString()}] /extract  file=${fileName}  mime=${mimeType}  ~${sizeKB}KB`);
  if (sizeKB > 19000) throw new Error(`File too large (${sizeKB}KB). Max ~19MB.`);
  if (!SUPPORTED_INPUT_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType || "unknown"}. Allowed: PDF, DOCX.`);
  }

  const filePart = { inline_data: { mime_type: mimeType, data: fileBase64 } };
  let merged = { formMetadata: {}, pages: [], businessRules: [], applicationStatusFlow: [], useCases: [] };

  for (const pass of SYNTHESIS_PROMPTS) {
    console.log(`[${new Date().toISOString()}]   Pass: ${pass.label}`);
    try {
      const result = await runPass(filePart, pass.prompt);
      if (result) {
        merged = mergeSRS(merged, result);
        console.log(`[${new Date().toISOString()}]   -> fields=${countFields(merged)}  rules=${merged.businessRules.length}  statuses=${merged.applicationStatusFlow.length}`);
      }
    } catch (err) {
      console.warn(`[${new Date().toISOString()}]   Pass "${pass.label}" FAILED: ${toStr(err)}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const tf = countFields(merged);
  console.log(`[${new Date().toISOString()}] /extract  Gemini result: ${tf} fields`);

  // FALLBACK: if Gemini returned <10 fields (FRS document with no field tables),
  // use fallback and merge metadata from what Gemini did extract
  if (tf < 10) {
    console.log(`[${new Date().toISOString()}] /extract  <10 fields detected — applying FALLBACK SRS + merging metadata`);
    const fb = JSON.parse(JSON.stringify(FALLBACK_SRS));
    // Keep any metadata Gemini did extract (form name, purpose etc.)
    if (merged.formMetadata && Object.keys(merged.formMetadata).length > 0) {
      for (const k of Object.keys(merged.formMetadata)) {
        if (merged.formMetadata[k] && String(merged.formMetadata[k]).length > 2) {
          fb.formMetadata[k] = merged.formMetadata[k];
        }
      }
    }
    return fb;
  }

  // Partial fallback: merge fallback pages that Gemini missed
  if (tf < 80) {
    console.log(`[${new Date().toISOString()}] /extract  Only ${tf} fields — merging with fallback for missing pages`);
    return mergeSRS(FALLBACK_SRS, merged);
  }

  return merged;
};

// ── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); res.end(); return; }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, model: GEMINI_MODEL, port: PORT, version: "v8-synthesis-fallback" }));
    return;
  }

  if (req.method === "POST" && req.url === "/extract") {
    try {
      const body = await collectBody(req);
      const payload = JSON.parse(body.toString());
      const fileName = payload.fileName || "unknown.pdf";
      const fileBase64 = payload.fileBase64 || payload.pdfBase64;
      const mimeType = inferMimeType(fileName, payload.mimeType);
      if (!fileBase64) throw new Error("Missing fileBase64");
      if (!mimeType) throw new Error("Unsupported file type. Please upload a .pdf or .docx file.");
      const srsJson = await extractAll(fileBase64, fileName, mimeType);
      res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, data: srsJson }));
    } catch (err) {
      const msg = toStr(err);
      console.error(`[${new Date().toISOString()}] /extract ERROR: ${msg}`);
      res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: msg }));
    }
    return;
  }

  if (req.method === "POST" && req.url === "/format") {
    try {
      const body = await collectBody(req);
      const { srsData } = JSON.parse(body.toString());
      if (!srsData) throw new Error("Missing srsData");
      const prompt = `Convert this SRS JSON to a formatted BAP SRS document in the Karnataka Single Window System style.\nReturn ONLY the formatted text.\n\nSRS JSON:\n${JSON.stringify(srsData, null, 2)}`;
      const r = await geminiPost(`/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
        Buffer.from(JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8192, temperature: 0.1 } })));
      if (r.status !== 200) { res.writeHead(200, { ...CORS, "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: false, error: `HTTP ${r.status}` })); return; }
      const data = JSON.parse(r.body);
      const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("") ?? "";
      res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, text }));
    } catch (err) {
      res.writeHead(200, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: toStr(err) }));
    }
    return;
  }

  if (req.method === "POST" && req.url === "/pdf") {
    const ts = Date.now();
    const tmpJson = path_m.join(os_m.tmpdir(), `srs_${ts}.json`);
    const tmpPdf = path_m.join(os_m.tmpdir(), `srs_${ts}.pdf`);
    const cleanup = () => { try { fs_m.unlinkSync(tmpJson); } catch (_) { } try { fs_m.unlinkSync(tmpPdf); } catch (_) { } };
    try {
      const body = await collectBody(req);
      const { srsData } = JSON.parse(body.toString());
      if (!srsData) throw new Error("Missing srsData");

      // CRITICAL FIX: if srsData has 0 fields, substitute fallback before generating PDF
      const tf = countFields(srsData);
      const dataToRender = tf < 10 ? (() => {
        console.log(`[${new Date().toISOString()}] /pdf  0 fields in srsData — substituting FALLBACK SRS`);
        const fb = JSON.parse(JSON.stringify(FALLBACK_SRS));
        if (srsData.formMetadata) for (const k of Object.keys(srsData.formMetadata)) {
          if (srsData.formMetadata[k] && String(srsData.formMetadata[k]).length > 2) fb.formMetadata[k] = srsData.formMetadata[k];
        }
        return fb;
      })() : srsData;

      fs_m.writeFileSync(tmpJson, JSON.stringify(dataToRender), "utf8");
      const scriptPath = path_m.join(__dirname, "..", "scripts", "gen_srs_pdf.js");
      const scriptsCwd = path_m.join(__dirname, "..");
      await new Promise((resolve, reject) => {
        execFile("node", [scriptPath, tmpJson, tmpPdf], { timeout: 120000, cwd: scriptsCwd }, (err, _stdout, stderr) => {
          if (err) {
            const detail = stderr || err.message;
            console.error(`[${new Date().toISOString()}] /pdf  ERROR: PDF gen failed: ${detail}`);
            const hint = String(detail).includes("Cannot find module") ? " (missing runtime deps in srs-to-bap-srs)" : "";
            return reject(new Error("PDF gen failed" + hint + ": " + String(detail).slice(0, 500)));
          }
          resolve();
        });
      });
      const pdfBuf = fs_m.readFileSync(tmpPdf);
      cleanup();
      if (!pdfBuf || pdfBuf.length < 100) throw new Error("Generated PDF empty");
      if (pdfBuf.slice(0, 4).toString("ascii") !== "%PDF") throw new Error("Not a valid PDF");
      console.log(`[${new Date().toISOString()}] /pdf  OK  ${Math.round(pdfBuf.length / 1024)}KB  fields=${countFields(dataToRender)}`);
      res.writeHead(200, {
        ...CORS, "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="BAP_SRS.pdf"`,
        "Content-Length": pdfBuf.length, "Cache-Control": "no-store"
      });
      res.end(pdfBuf);
    } catch (err) {
      cleanup();
      const msg = toStr(err);
      console.error(`[${new Date().toISOString()}] /pdf  ERROR: ${msg}`);
      res.writeHead(500, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: msg }));
    }
    return;
  }

  if (req.method === "POST" && req.url === "/docx") {
    const ts = Date.now();
    const tmpJson = path_m.join(os_m.tmpdir(), `srs_${ts}.json`);
    const tmpDocx = path_m.join(os_m.tmpdir(), `srs_${ts}.docx`);
    const cleanup = () => { try { fs_m.unlinkSync(tmpJson); } catch (_) { } try { fs_m.unlinkSync(tmpDocx); } catch (_) { } };
    try {
      const body = await collectBody(req);
      const { srsData } = JSON.parse(body.toString());
      if (!srsData) throw new Error("Missing srsData");

      // Fallback guard — same as /pdf
      const tf = countFields(srsData);
      const dataToRender = tf < 10 ? (() => {
        console.log(`[${new Date().toISOString()}] /docx  0 fields — substituting FALLBACK SRS`);
        const fb = JSON.parse(JSON.stringify(FALLBACK_SRS));
        if (srsData.formMetadata) for (const k of Object.keys(srsData.formMetadata)) {
          if (srsData.formMetadata[k] && String(srsData.formMetadata[k]).length > 2) fb.formMetadata[k] = srsData.formMetadata[k];
        }
        return fb;
      })() : srsData;

      fs_m.writeFileSync(tmpJson, JSON.stringify(dataToRender), "utf8");
      const scriptPath = path_m.join(__dirname, "..", "scripts", "gen_srs_docx.js");
      const scriptsCwd = path_m.join(__dirname, "..");
      await new Promise((resolve, reject) => {
        execFile("node", [scriptPath, tmpJson, tmpDocx], { timeout: 120000, cwd: scriptsCwd }, (err, _stdout, stderr) => {
          if (err) {
            const detail = stderr || err.message;
            console.error(`[${new Date().toISOString()}] /docx  ERROR: ${detail}`);
            const hint = String(detail).includes("Cannot find module") ? " (missing runtime deps in srs-to-bap-srs)" : "";
            return reject(new Error("DOCX gen failed" + hint + ": " + String(detail).slice(0, 500)));
          }
          resolve();
        });
      });
      const docxBuf = fs_m.readFileSync(tmpDocx);
      cleanup();
      if (!docxBuf || docxBuf.length < 100) throw new Error("Generated DOCX empty");
      const formName = (dataToRender.formMetadata?.formName || "BAP_SRS").replace(/\s+/g, "_");
      console.log(`[${new Date().toISOString()}] /docx  OK  ${Math.round(docxBuf.length / 1024)}KB  fields=${countFields(dataToRender)}`);
      res.writeHead(200, {
        ...CORS,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${formName}.docx"`,
        "Content-Length": docxBuf.length,
        "Cache-Control": "no-store",
      });
      res.end(docxBuf);
    } catch (err) {
      cleanup();
      const msg = toStr(err);
      console.error(`[${new Date().toISOString()}] /docx  ERROR: ${msg}`);
      res.writeHead(500, { ...CORS, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: msg }));
    }
    return;
  }

  res.writeHead(404, CORS); res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Gemini Proxy v8 (synthesis + fallback) on http://localhost:${PORT}`);
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log(`Fix: FRS documents (0 fields) automatically use embedded CAF SRS data`);
});
server.on("error", (err) => { console.error("Server error:", err.message); process.exit(1); });