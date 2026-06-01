#!/usr/bin/env node
/**
 * FRS → BAP SRS CLI Tool
 * Usage: node frs_to_srs_cli.js <pdf_file> <gemini_api_key> [output.docx]
 * 
 * Zero dependencies beyond 'docx' (already installed globally)
 * Calls Gemini API server-side — no CORS issues
 */

const https  = require("https");
const fs     = require("fs");
const path   = require("path");

// ── Args ──────────────────────────────────────────────────────────────────────
const [,, pdfPath, apiKey, outFile] = process.argv;

if (!pdfPath || !apiKey) {
  console.error("Usage: node frs_to_srs_cli.js <pdf_file> <gemini_api_key> [output.docx]");
  process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
  console.error(`❌  File not found: ${pdfPath}`);
  process.exit(1);
}

const outputPath = outFile || pdfPath.replace(/\.pdf$/i, "_BAP_SRS.docx");
const GEMINI_MODEL = "gemini-2.5-flash";

// ── HTTPS helper ──────────────────────────────────────────────────────────────
const geminiPost = (body) =>
  new Promise((resolve, reject) => {
    const buf = Buffer.from(JSON.stringify(body));
    const req = https.request({
      hostname: "generativelanguage.googleapis.com",
      port: 443,
      path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": buf.length },
    }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) });
        } catch (e) { reject(new Error("Invalid JSON from Gemini")); }
      });
    });
    req.on("error", reject);
    req.write(buf);
    req.end();
  });

// ── DOCX builder ──────────────────────────────────────────────────────────────
const buildDocx = async (srs) => {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    VerticalAlign, LevelFormat, PageBreak,
  } = require("docx");

  const BLUE_DARK = "1E3A5F"; const BLUE_MID = "2D6A9F"; const BLUE_LITE = "D5E8F0";
  const GRAY = "F7FAFC"; const PAGE_W = 9360;
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const cell = (text, opts = {}) => {
    const { fill = "FFFFFF", bold = false, color = "000000", width } = opts;
    return new TableCell({ borders, width: width ? { size: width, type: WidthType.DXA } : undefined,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.TOP,
      children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ""), bold, color, size: 20, font: "Arial" })] })],
    });
  };

  const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text: t, bold: true, size: 32, font: "Arial", color: BLUE_DARK })] });
  const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text: t, bold: true, size: 26, font: "Arial", color: BLUE_MID })] });
  const p  = (t, opts = {}) => new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: String(t ?? ""), size: 20, font: "Arial", ...opts })] });
  const div = () => new Paragraph({ spacing: { before: 120, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MID, space: 1 } }, children: [] });

  const fieldHeaderRow = () => new TableRow({ children: [
    cell("#", { fill: BLUE_LITE, bold: true, width: 400 }),
    cell("Field Name", { fill: BLUE_LITE, bold: true, width: 1800 }),
    cell("Type", { fill: BLUE_LITE, bold: true, width: 900 }),
    cell("Grid", { fill: BLUE_LITE, bold: true, width: 400 }),
    cell("Mandatory", { fill: BLUE_LITE, bold: true, width: 1100 }),
    cell("Validation / Notes", { fill: BLUE_LITE, bold: true, width: 4760 }),
  ]});

  const fieldRow = (f, i) => new TableRow({ children: [
    cell(f.fieldNumber, { fill: i % 2 ? GRAY : "FFF", width: 400 }),
    cell(f.fieldName,   { fill: i % 2 ? GRAY : "FFF", bold: true, width: 1800 }),
    cell(f.type,        { fill: i % 2 ? GRAY : "FFF", color: BLUE_MID, width: 900 }),
    cell(f.grid,        { fill: i % 2 ? GRAY : "FFF", width: 400 }),
    cell(f.mandatory,   { fill: i % 2 ? GRAY : "FFF",
      color: f.mandatory === "Mandatory" ? "C53030" : f.mandatory === "Conditional" ? "B7791F" : "276749", width: 1100 }),
    cell(f.validationNotes || "—", { fill: i % 2 ? GRAY : "FFF", width: 4760 }),
  ]});

  const children = [];
  const meta = srs.formMetadata || {};

  // Title
  children.push(
    p("GOVERNMENT OF KARNATAKA — DEPARTMENT OF INDUSTRIES & COMMERCE", { bold: true, size: 22, color: BLUE_DARK }),
    p(meta.formName || "Combined Application Form (CAF)", { bold: true, size: 36, color: BLUE_DARK }),
    p("Service Requirement Specification (SRS)", { bold: true, size: 26, color: BLUE_MID }),
    p("Techno-Functional Document — FormBuilder System", { italic: true, size: 20, color: "555555" }),
    div(),
  );

  // Metadata table
  children.push(h1("FORM METADATA"));
  children.push(new Table({
    width: { size: PAGE_W, type: WidthType.DXA }, columnWidths: [2500, 6860],
    rows: Object.entries({ "Form Name": meta.formName, "Service ID": meta.serviceId, "Department ID": meta.departmentId, "Form Type ID": meta.formTypeId, "Description": meta.description, "Version": meta.version, "Date": meta.date })
      .map(([k, v], i) => new TableRow({ children: [cell(k, { fill: i%2?BLUE_LITE:"EAF2F8", bold:true, width:2500 }), cell(v||"—", { fill: i%2?GRAY:"FFF", width:6860 })] })),
  }));
  children.push(div());

  // Pages
  for (const page of (srs.pages || [])) {
    children.push(h1(`PAGE ${page.pageNumber} — ${page.pageName}`));
    for (const sec of (page.sections || [])) {
      children.push(h2(`${sec.sectionId} — ${sec.sectionName}`));
      if (sec.note) children.push(p(`ℹ  ${sec.note}`, { italic: true, color: "555555", size: 19 }));
      if (sec.isRepeatable) children.push(p(`➕ ADD MORE — Min: ${sec.minRows ?? 1} | Max: ${sec.maxRows ?? 10}`, { bold: true, color: BLUE_MID }));
      if (sec.fields?.length) {
        children.push(new Table({
          width: { size: PAGE_W, type: WidthType.DXA }, columnWidths: [400, 1800, 900, 400, 1100, 4760],
          rows: [fieldHeaderRow(), ...sec.fields.map((f, i) => fieldRow(f, i))],
        }));
      }
      if (sec.conditionalRules?.length) {
        children.push(p("CONDITIONAL RULES", { bold: true, size: 19, color: "744210" }));
        for (const r of sec.conditionalRules) {
          children.push(new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 40, after: 40 }, children: [new TextRun({ text: r, size: 19, font: "Arial", color: "744210" })] }));
        }
      }
      children.push(div());
    }
  }

  // Business rules
  if (srs.businessRules?.length) {
    children.push(h1("APPENDIX A — GLOBAL BUSINESS RULES"));
    children.push(new Table({
      width: { size: PAGE_W, type: WidthType.DXA }, columnWidths: [800, 8560],
      rows: srs.businessRules.map((r, i) => new TableRow({ children: [
        cell(`BR-${i+1}`, { fill: BLUE_DARK, bold: true, color: "FFFFFF", width: 800 }),
        cell(r, { fill: i%2?GRAY:"FFF", width: 8560 }),
      ]})),
    }));
    children.push(div());
  }

  // Status flow
  if (srs.applicationStatusFlow?.length) {
    children.push(h1("APPENDIX B — APPLICATION STATUS FLOW"));
    children.push(new Table({
      width: { size: PAGE_W, type: WidthType.DXA }, columnWidths: [2800, 6560],
      rows: [
        new TableRow({ children: [cell("Status", { fill: BLUE_DARK, bold: true, color: "FFF", width: 2800 }), cell("Description", { fill: BLUE_DARK, bold: true, color: "FFF", width: 6560 })] }),
        ...srs.applicationStatusFlow.map((s, i) => new TableRow({ children: [cell(s.status, { fill: i%2?BLUE_LITE:"FFF", bold:true, width:2800 }), cell(s.description, { fill: i%2?GRAY:"FFF", width:6560 })] })),
      ],
    }));
    children.push(div());
  }

  // Use cases
  if (srs.useCases?.length) {
    children.push(h1("APPENDIX C — USE CASES & USAGE SCENARIOS"));
    for (const uc of srs.useCases) {
      children.push(h2(`${uc.useCaseId} — ${uc.useCaseName}`));
      children.push(new Table({
        width: { size: PAGE_W, type: WidthType.DXA }, columnWidths: [2200, 7160],
        rows: [
          ["Use Case ID",        uc.useCaseId],
          ["Use Case Name",      uc.useCaseName],
          ["Actors",             uc.actors],
          ["Pre-Conditions",     (uc.preconditions||[]).join("\n")],
          ["Basic Flow",         (uc.basicFlow||[]).join("\n")],
          ["Business Rules",     (uc.businessRuleValidations||[]).join("\n")],
          ["Post Conditions",    (uc.postConditions||[]).join("\n")],
        ].map(([k,v],i) => new TableRow({ children: [cell(k,{fill:BLUE_LITE,bold:true,width:2200}), cell(v||"—",{fill:i%2?GRAY:"FFF",width:7160})] })),
      }));
      children.push(p(""));
      children.push(div());
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: BLUE_DARK },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: BLUE_MID },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      ],
    },
    numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "▶", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } }, children }],
  });

  return Packer.toBuffer(doc);
};

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  FRS → BAP SRS CLI Tool  (Gemini 2.5 Flash)         ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`📄 Input : ${pdfPath}`);
  console.log(`📁 Output: ${outputPath}`);
  console.log("");

  // Read PDF
  console.log("⏳ [1/3] Reading PDF...");
  const pdfBase64 = fs.readFileSync(pdfPath).toString("base64");
  console.log(`   Size: ${Math.round(pdfBase64.length * 0.75 / 1024)} KB`);

  // Call Gemini
  console.log("⏳ [2/3] Calling Gemini 2.5 Flash...");
  const SYSTEM = `You are an expert Business Analyst for Karnataka Single Window System.
Extract structured BAP SRS data from the FRS document and return ONLY valid JSON (no markdown, no code fences):
{"formMetadata":{"formName":"","departmentId":"","serviceId":"","formTypeId":"","description":"","version":"","date":""},"pages":[{"pageNumber":1,"pageName":"","sections":[{"sectionId":"","sectionName":"","note":null,"isRepeatable":false,"minRows":null,"maxRows":null,"fields":[{"fieldNumber":1,"fieldName":"","type":"TEXT","grid":6,"mandatory":"Mandatory","validationNotes":"","options":null,"sourceType":null}],"conditionalRules":[]}]}],"businessRules":[],"applicationStatusFlow":[{"status":"","description":""}],"useCases":[{"useCaseId":"","useCaseName":"","actors":"","preconditions":[],"basicFlow":[],"businessRuleValidations":[],"postConditions":[]}]}`;

  const result = await geminiPost({
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents: [{
      role: "user",
      parts: [
        { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
        { text: "Extract ALL fields, business rules, use cases, and conditional rules from this FRS. Return ONLY the JSON." },
      ],
    }],
    generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
  });

  if (result.status !== 200) {
    console.error(`❌ Gemini API error ${result.status}:`, result.data?.error?.message || JSON.stringify(result.data).slice(0, 200));
    process.exit(1);
  }

  const rawText = result.data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") ?? "";
  const clean   = rawText.replace(/```json|```/g, "").trim();
  let srsData;
  try {
    srsData = JSON.parse(clean);
  } catch (e) {
    console.error("❌ Could not parse Gemini response as JSON:", e.message);
    console.error("Raw response:", rawText.slice(0, 500));
    process.exit(1);
  }

  const fields = srsData.pages?.reduce((a, p) => a + p.sections?.reduce((b, s) => b + (s.fields?.length || 0), 0), 0) || 0;
  console.log(`   ✅ Extracted: ${srsData.pages?.length} pages, ${fields} fields, ${srsData.businessRules?.length} rules, ${srsData.useCases?.length} use cases`);

  // Save JSON
  const jsonPath = outputPath.replace(/\.docx$/, ".json");
  fs.writeFileSync(jsonPath, JSON.stringify(srsData, null, 2));
  console.log(`   💾 JSON saved: ${jsonPath}`);

  // Build DOCX
  console.log("⏳ [3/3] Building Word document...");
  const buffer = await buildDocx(srsData);
  fs.writeFileSync(outputPath, buffer);

  console.log("");
  console.log(`✅ Done!`);
  console.log(`   📄 DOCX : ${outputPath}  (${Math.round(buffer.length/1024)} KB)`);
  console.log(`   📋 JSON : ${jsonPath}`);
})();
