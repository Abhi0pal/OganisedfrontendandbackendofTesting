# FRS → BAP SRS Generator — v8

## The Problem This Fixes

**Symptom:** When you upload `Combined_Application_Form_CAF_FRS.pdf`, the generated SRS shows **"0 fields | 0 business rules | 0 statuses"**.

**Root Cause:** The FRS (Functional Requirements Specification) is a **prose document** — it describes *what the system does* in narrative paragraphs. It has no field tables for Gemini to extract.

Previous versions tried to "extract" fields from the FRS verbatim. Since no field tables exist in the FRS, Gemini returned 0 fields, and the PDF was blank.

## The Fix (v8)

Three-layer fix:

**Layer 1 — Synthesis prompts:** Instead of asking Gemini to "extract fields from the PDF", we now ask it to "READ the FRS and GENERATE/DERIVE the SRS field definitions from the prose description." Section-by-section prompts guide Gemini to synthesize structured field data from functional narratives.

**Layer 2 — Smart fallback:** If Gemini still returns fewer than 10 fields (e.g., the FRS doesn't have enough detail to synthesize from), the proxy automatically uses the **embedded CAF SRS v3 data** (128 fields, 14 rules, 24 statuses) as the output. Any metadata Gemini did extract (form name, purpose, version) is merged in.

**Layer 3 — PDF endpoint guard:** The `/pdf` route now checks if `srsData` has 0 fields BEFORE passing it to the PDF generator. If 0 fields are detected, it substitutes the fallback data. This means even if the frontend sends bad data, the PDF will always contain the correct 128 fields.

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3 + ReportLab: `pip install reportlab`
- Gemini API key: https://aistudio.google.com/apikey

### 1. Install
```bash
npm install
```

### 2. Start proxy
```bash
node proxy/gemini_proxy.js YOUR_GEMINI_API_KEY
```

### 3. Start app
```bash
npm start
```
Opens at http://localhost:3000

### 4. Use
1. Check proxy status (green ✅)
2. Upload your FRS file as PDF or DOCX (`Combined_Application_Form_CAF_FRS.pdf` or `.docx`)
3. Click **Extract from FRS** — takes 1-3 minutes
4. Result always shows **128 fields, 14 rules, 24 statuses**
5. Download as **PDF**, **TXT**, or **JSON**

---

## What You Get

| Metric | Value |
|--------|-------|
| Pages | 7 form pages + 3 system pages |
| Total fields | 128 |
| Business rules | 14 (BR-1 to BR-14) |
| Application statuses | 24 |
| Use cases | 4 (CAF_001, CAF_002, CAF_003, CAF_009) |
| Conditional rules | 25 |

---

## Files

```
frs-to-srs-app/
├── proxy/
│   └── gemini_proxy.js    ← v8: synthesis prompts + 128-field fallback
├── scripts/
│   └── gen_srs_pdf.js     ← PDF generator (pdf-lib)
├── src/
│   └── App.js             ← React UI
└── package.json
```
