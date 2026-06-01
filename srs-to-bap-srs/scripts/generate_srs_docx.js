/**
 * BAP SRS DOCX Generator
 * Usage: node generate_srs_docx.js <srs_json_file> [output_docx_file]
 * Requires: npm install docx
 */

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, PageBreak,
} = require("docx");

// ─── CLI args ────────────────────────────────────────────────────────────────
const inputFile = process.argv[2];
const outputFile = process.argv[3] || "BAP_SRS_Output.docx";

if (!inputFile) {
  console.error("Usage: node generate_srs_docx.js <srs_json_file> [output.docx]");
  process.exit(1);
}

const srs = JSON.parse(fs.readFileSync(inputFile, "utf8"));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BLUE_DARK = "1E3A5F";
const BLUE_MID  = "2D6A9F";
const BLUE_LITE = "D5E8F0";
const GRAY_LITE = "F7FAFC";
const YELLOW    = "FFFFF0";
const RED_LITE  = "FFF5F5";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const PAGE_W  = 9360; // US Letter 1-inch margins

function cell(text, opts = {}) {
  const { fill = "FFFFFF", bold = false, color = "000000", width, colSpan } = opts;
  return new TableCell({
    borders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    columnSpan: colSpan,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text ?? ""), bold, color, size: 20, font: "Arial" })],
      }),
    ],
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: BLUE_DARK })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: BLUE_MID })],
  });
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: BLUE_DARK })],
  });
}

function para(text, opts = {}) {
  const { size = 20, color = "000000", bold = false, italic = false, before = 60, after = 60 } = opts;
  return new Paragraph({
    spacing: { before, after },
    children: [new TextRun({ text: String(text ?? ""), size, color, bold, italic, font: "Arial" })],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE_MID, space: 1 } },
    children: [],
  });
}

function fieldTableHeader() {
  return new TableRow({
    children: [
      cell("#",           { fill: BLUE_LITE, bold: true, width: 400 }),
      cell("Field Name",  { fill: BLUE_LITE, bold: true, width: 1800 }),
      cell("Type",        { fill: BLUE_LITE, bold: true, width: 900 }),
      cell("Grid",        { fill: BLUE_LITE, bold: true, width: 400 }),
      cell("Mandatory",   { fill: BLUE_LITE, bold: true, width: 1100 }),
      cell("Validation / Notes", { fill: BLUE_LITE, bold: true, width: 4760 }),
    ],
  });
}

function fieldTableRow(f, even) {
  const fill = even ? GRAY_LITE : "FFFFFF";
  return new TableRow({
    children: [
      cell(f.fieldNumber,   { fill, width: 400 }),
      cell(f.fieldName,     { fill, bold: true, width: 1800 }),
      cell(f.type,          { fill, color: BLUE_MID, width: 900 }),
      cell(f.grid,          { fill, width: 400 }),
      cell(f.mandatory,     { fill, color: f.mandatory === "Mandatory" ? "C53030" : f.mandatory === "Conditional" ? "B7791F" : "276749", width: 1100 }),
      cell(f.validationNotes || "—", { fill, width: 4760 }),
    ],
  });
}

// ─── Build document content ────────────────────────────────────────────────
const children = [];

// Cover / Title
const meta = srs.formMetadata || {};
children.push(
  new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "GOVERNMENT OF KARNATAKA — DEPARTMENT OF INDUSTRIES & COMMERCE", bold: true, size: 22, font: "Arial", color: BLUE_DARK })] }),
  new Paragraph({ spacing: { before: 0, after: 240 }, children: [new TextRun({ text: meta.formName || "Combined Application Form (CAF)", bold: true, size: 36, font: "Arial", color: BLUE_DARK })] }),
  new Paragraph({ spacing: { before: 0, after: 80 },  children: [new TextRun({ text: "Service Requirement Specification (SRS)", bold: true, size: 26, font: "Arial", color: BLUE_MID })] }),
  new Paragraph({ spacing: { before: 0, after: 80 },  children: [new TextRun({ text: "Techno-Functional Document — FormBuilder System", italic: true, size: 20, font: "Arial", color: "555555" })] }),
  divider(),
);

// Metadata table
children.push(heading1("FORM METADATA"));
children.push(new Table({
  width: { size: PAGE_W, type: WidthType.DXA },
  columnWidths: [2500, 6860],
  rows: [
    ...Object.entries({
      "Form Name":     meta.formName,
      "Service ID":    meta.serviceId,
      "Department ID": meta.departmentId,
      "Form Type ID":  meta.formTypeId,
      "Description":   meta.description,
      "Version":       meta.version,
      "Date":          meta.date,
    }).map(([k, v], i) => new TableRow({
      children: [
        cell(k,        { fill: i % 2 === 0 ? BLUE_LITE : "EAF2F8", bold: true, width: 2500 }),
        cell(v || "—", { fill: i % 2 === 0 ? GRAY_LITE : "FFFFFF", width: 6860 }),
      ],
    })),
  ],
}));
children.push(divider());

// Pages & Sections
for (const page of (srs.pages || [])) {
  children.push(new Paragraph({ pageBreakBefore: false, spacing: { before: 360, after: 0 }, children: [] }));
  children.push(heading1(`PAGE ${page.pageNumber} — ${page.pageName}`));

  for (const sec of (page.sections || [])) {
    children.push(heading2(`${sec.sectionId} — ${sec.sectionName}`));

    if (sec.note) {
      children.push(para(`ℹ  ${sec.note}`, { italic: true, color: "555555", size: 19 }));
    }
    if (sec.isRepeatable) {
      children.push(para(`➕ ADD MORE (Repeatable): Min rows: ${sec.minRows ?? 1} | Max rows: ${sec.maxRows ?? 10}`, { bold: true, color: BLUE_MID }));
    }

    // Fields table
    if (sec.fields?.length) {
      children.push(new Table({
        width: { size: PAGE_W, type: WidthType.DXA },
        columnWidths: [400, 1800, 900, 400, 1100, 4760],
        rows: [
          fieldTableHeader(),
          ...sec.fields.map((f, i) => fieldTableRow(f, i % 2 === 0)),
        ],
      }));
    }

    // Conditional rules
    if (sec.conditionalRules?.length) {
      children.push(para("CONDITIONAL RULES", { bold: true, size: 19, color: "744210", before: 160, after: 60 }));
      for (const rule of sec.conditionalRules) {
        children.push(new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text: rule, size: 19, font: "Arial", color: "744210" })],
        }));
      }
    }

    children.push(divider());
  }
}

// Business Rules
if (srs.businessRules?.length) {
  children.push(heading1("APPENDIX A — GLOBAL BUSINESS RULES"));
  for (let i = 0; i < srs.businessRules.length; i++) {
    const row = new TableRow({
      children: [
        cell(`BR-${i + 1}`, { fill: BLUE_DARK, bold: true, color: "FFFFFF", width: 800 }),
        cell(srs.businessRules[i], { fill: i % 2 === 0 ? GRAY_LITE : "FFFFFF", width: 8560 }),
      ],
    });
    if (i === 0) {
      children.push(new Table({
        width: { size: PAGE_W, type: WidthType.DXA },
        columnWidths: [800, 8560],
        rows: srs.businessRules.map((r, j) => new TableRow({
          children: [
            cell(`BR-${j + 1}`, { fill: BLUE_DARK, bold: true, color: "FFFFFF", width: 800 }),
            cell(r, { fill: j % 2 === 0 ? GRAY_LITE : "FFFFFF", width: 8560 }),
          ],
        })),
      }));
      break;
    }
  }
  children.push(divider());
}

// Application Status Flow
if (srs.applicationStatusFlow?.length) {
  children.push(heading1("APPENDIX B — APPLICATION STATUS FLOW"));
  children.push(new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: [
      new TableRow({ children: [cell("Status", { fill: BLUE_DARK, bold: true, color: "FFFFFF", width: 2800 }), cell("Description", { fill: BLUE_DARK, bold: true, color: "FFFFFF", width: 6560 })] }),
      ...srs.applicationStatusFlow.map((s, i) => new TableRow({
        children: [
          cell(s.status, { fill: i % 2 === 0 ? BLUE_LITE : "FFFFFF", bold: true, width: 2800 }),
          cell(s.description, { fill: i % 2 === 0 ? GRAY_LITE : "FFFFFF", width: 6560 }),
        ],
      })),
    ],
  }));
  children.push(divider());
}

// Use Cases
if (srs.useCases?.length) {
  children.push(heading1("APPENDIX C — USE CASES & USAGE SCENARIOS"));

  for (const uc of srs.useCases) {
    children.push(heading2(`${uc.useCaseId} — ${uc.useCaseName}`));
    const ucRows = [
      ["Use Case ID",   uc.useCaseId],
      ["Use Case Name", uc.useCaseName],
      ["Actors",        uc.actors],
      ["Pre-Conditions", (uc.preconditions || []).join("\n")],
      ["Basic Flow",    (uc.basicFlow || []).join("\n")],
      ["Business Rules / Validations", (uc.businessRuleValidations || []).join("\n")],
      ["Post Conditions", (uc.postConditions || []).join("\n")],
    ];
    children.push(new Table({
      width: { size: PAGE_W, type: WidthType.DXA },
      columnWidths: [2200, 7160],
      rows: ucRows.map(([k, v], i) => new TableRow({
        children: [
          cell(k, { fill: BLUE_LITE, bold: true, width: 2200 }),
          cell(v || "—", { fill: i % 2 === 0 ? GRAY_LITE : "FFFFFF", width: 7160 }),
        ],
      })),
    }));
    children.push(para(""));
    children.push(divider());
  }
}

// ─── Create Document ──────────────────────────────────────────────────────────
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
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "▶", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputFile, buffer);
  console.log(`✅ BAP SRS document generated: ${outputFile}`);
  console.log(`   Pages extracted: ${(srs.pages || []).length}`);
  const fields = (srs.pages || []).reduce((a, p) => a + p.sections.reduce((b, s) => b + (s.fields || []).length, 0), 0);
  console.log(`   Fields extracted: ${fields}`);
  console.log(`   Business Rules: ${(srs.businessRules || []).length}`);
  console.log(`   Use Cases: ${(srs.useCases || []).length}`);
}).catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
