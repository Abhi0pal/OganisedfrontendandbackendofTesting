/**
 * Generates a BAP SRS .docx matching the exact layout of the uploaded PDF:
 * - Cover metadata table
 * - Pages with section headers
 * - Field tables (#, Field Name, Type, Grid, Mandatory, Validation/Notes)
 * - Conditional rules blocks
 * - Appendices A, B, C, D
 *
 * Usage: node gen_srs_docx.js <srs_json_file> <output.docx>
 */

const fs   = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, PageBreak, Header, Footer, PageNumber,
  TabStopType, TabStopPosition,
} = require("docx");

const inputFile  = process.argv[2];
const outputFile = process.argv[3] || "BAP_SRS_Output.docx";

if (!inputFile) {
  console.error("Usage: node gen_srs_docx.js <srs_json> <output.docx>");
  process.exit(1);
}

const srs = JSON.parse(fs.readFileSync(inputFile, "utf8"));

// ─── Colours ─────────────────────────────────────────────────────────────────
const C = {
  // ── EY Brand Palette ──────────────────────────────────────────────────
  NAVY:       "333333",   // EY Charcoal #333333 — banner/header text bg
  BLUE:       "333333",   // EY Charcoal — section headings
  BLUE_LITE:  "FFE600",   // EY Turbo Yellow #FFE600 — table header fill
  GREEN_DARK: "333333",   // EY Charcoal — page header
  GREEN_LITE: "FFF9C4",   // EY Pale Yellow #FFF9C4 — page header fill
  AMBER:      "FFF9C4",   // EY Pale Yellow — conditional rules bg
  AMBER_BDR:  "FFD600",   // EY Deep Yellow #FFD600 — conditional rules border
  GRAY_LITE:  "FFFDE7",   // EY Very Pale Yellow #FFFDE7 — alternating row
  WHITE:      "FFFFFF",
  RED_LITE:   "FFF5F5",
  YELLOW_LT:  "FFF9C4",   // EY Pale Yellow
  BLUE_LT:    "FFFDE7",   // EY Very Pale Yellow
  GREEN_LT:   "FFF9C4",   // EY Pale Yellow
  RED_TXT:    "C53030",
  AMBER_TXT:  "B7791F",
  GREEN_TXT:  "276749",
  BLUE_TXT:   "2B6CB0",
};

const PAGE_W = 9360; // US Letter 1-inch margins each side
const FONT   = "Arial";
const MC = "missing content";

const isMissingContent = (value) => String(value ?? "").trim().toLowerCase() === MC;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const bdr = (color = "CCCCCC", size = 1) => ({
  style: BorderStyle.SINGLE, size, color,
});
const borders = (color = "CCCCCC") => ({
  top: bdr(color), bottom: bdr(color), left: bdr(color), right: bdr(color),
});
const noBorders = () => ({
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
});

function cell(text, opts = {}) {
  const {
    fill = C.WHITE, bold = false, color = "000000",
    w, colSpan, italic = false, size = 18,
    vAlign = VerticalAlign.TOP, borderColor = "CCCCCC",
    center = false,
  } = opts;
  return new TableCell({
    borders: borders(borderColor),
    width: w ? { size: w, type: WidthType.DXA } : undefined,
    columnSpan: colSpan,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: vAlign,
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: String(text ?? ""), bold, italic, color, size, font: FONT })],
    })],
  });
}

const p = (text, opts = {}) => new Paragraph({
  spacing: { before: opts.before ?? 60, after: opts.after ?? 60 },
  alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
  children: [new TextRun({
    text: String(text ?? ""),
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    color: opts.color ?? "000000",
    size: opts.size ?? 20,
    font: FONT,
  })],
});

const divider = (color = C.BLUE) => new Paragraph({
  spacing: { before: 80, after: 80 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
  children: [],
});

const spacer = (n = 120) => new Paragraph({ spacing: { before: n, after: 0 }, children: [] });

// ─── Mandatory pill colors ────────────────────────────────────────────────────
function mandColor(m) {
  const s = String(m || "").toLowerCase();
  if (s === "mandatory")      return { fill: C.RED_LITE,  color: C.RED_TXT };
  if (s === "conditional")    return { fill: C.YELLOW_LT, color: C.AMBER_TXT };
  if (s.startsWith("auto"))   return { fill: C.BLUE_LT,   color: C.BLUE_TXT };
  return                             { fill: C.GREEN_LT,  color: C.GREEN_TXT };
}

// ─── Field table ──────────────────────────────────────────────────────────────
// Column widths must sum to PAGE_W = 9360
// #(360) | Name(1500) | ToolTip(2000) | Type(700) | Grid(360) | Mandatory(1000) | Validation(3440)
const COL_W = [360, 1500, 2000, 700, 360, 1000, 3440];

function fieldHeaderRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      cell("#",                   { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: COL_W[0], size: 17 }),
      cell("Field Name",          { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: COL_W[1], size: 17 }),
      cell("Tool Tip",            { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: COL_W[2], size: 17 }),
      cell("Type",                { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: COL_W[3], size: 17 }),
      cell("Grid",                { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: COL_W[4], size: 17, center: true }),
      cell("Mandatory",           { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: COL_W[5], size: 17 }),
      cell("Validation / Notes",  { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: COL_W[6], size: 17 }),
    ],
  });
}

function fieldRow(f, even) {
  const fill  = even ? C.GRAY_LITE : C.WHITE;
  const mc    = mandColor(f.mandatory);
  const tip   = String(f.toolTip || f.tooltip || f.tool_tip || "").trim() || MC;
  const notes = String(f.validationNotes || "").trim() || MC;
  return new TableRow({
    children: [
      cell(f.fieldNumber,           { fill, w: COL_W[0], size: 17, color: "718096" }),
      cell(f.fieldName,             { fill, w: COL_W[1], size: 17, bold: true }),
      cell(tip,                     { fill, w: COL_W[2], size: 17, italic: true, color: isMissingContent(tip) ? C.RED_TXT : "555555", bold: isMissingContent(tip) }),
      cell(f.type,                  { fill, w: COL_W[3], size: 17, color: C.BLUE }),
      cell(f.grid ?? 6,             { fill, w: COL_W[4], size: 17, center: true }),
      cell(f.mandatory,             { fill: mc.fill, w: COL_W[5], size: 17, color: mc.color }),
      cell(notes,                   { fill, w: COL_W[6], size: 17, color: isMissingContent(notes) ? C.RED_TXT : "4A5568", bold: isMissingContent(notes) }),
    ],
  });
}

// ─── Build children ───────────────────────────────────────────────────────────
const children = [];
const meta     = srs.formMetadata || {};

// ── Cover / Title ──────────────────────────────────────────────────────────
children.push(
  new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [new TextRun({ text: "GOVERNMENT OF KARNATAKA — DEPARTMENT OF INDUSTRIES & COMMERCE", bold: true, size: 20, font: FONT, color: C.NAVY })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: meta.formName || "Combined Application Form (CAF)", bold: true, size: 36, font: FONT, color: C.NAVY })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "Service Requirement Specification (SRS)", bold: true, size: 26, font: FONT, color: "333333" })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: "Techno-Functional Document — FormBuilder System", italic: true, size: 20, font: FONT, color: "555555" })],
  }),
);

// ── Metadata table ─────────────────────────────────────────────────────────
const metaRows = [
  ["Form Name",         meta.formName         || MC],
  ["Service ID",        meta.serviceId        || MC],
  ["Department ID",     meta.departmentId     || MC],
  ["Form Type ID",      meta.formTypeId       || MC],
  ["Description",       meta.description      || MC],
  ["Version",           meta.version          || MC],
  ["Date",              meta.date             || MC],
  ["Total Fields",      `${srs.pages?.reduce((a,p) => a + p.sections.reduce((b,s) => b + (s.fields||[]).length, 0), 0) || 0} fields`],
  ["Purpose",           meta.description || "Establishing new / Expansion / Diversification / Modernization of Industrial Units in Karnataka"],
];

children.push(new Table({
  width: { size: PAGE_W, type: WidthType.DXA },
  columnWidths: [2200, 7160],
  rows: metaRows.map(([k, v], i) => {
    const textValue = String(v || MC);
    const missing = isMissingContent(textValue);
    return new TableRow({
      children: [
        cell(k, { fill: i % 2 === 0 ? C.BLUE_LITE : "E8F0F8", bold: true, w: 2200, size: 18, color: C.NAVY }),
        cell(textValue, { fill: i % 2 === 0 ? C.GRAY_LITE : C.WHITE, w: 7160, size: 18, color: missing ? C.RED_TXT : "000000", bold: missing }),
      ],
    });
  }),
}));
children.push(spacer(200));
children.push(divider());

// ── Pages ──────────────────────────────────────────────────────────────────
for (const page of (srs.pages || [])) {
  children.push(spacer(240));

  // Page heading bar
  children.push(new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [PAGE_W],
    rows: [new TableRow({
      children: [cell(
        `PAGE ${page.pageNumber}   ${String(page.pageName || "").toUpperCase()}`,
        { fill: C.NAVY, color: C.WHITE, bold: true, size: 22, w: PAGE_W, borderColor: C.NAVY }
      )],
    })],
  }));
  children.push(spacer(120));

  for (const sec of (page.sections || [])) {
    // Section heading
    children.push(new Table({
      width: { size: PAGE_W, type: WidthType.DXA },
      columnWidths: [PAGE_W],
      rows: [new TableRow({
        children: [cell(
          `SECTION ${sec.sectionId} — ${sec.sectionName}`,
          { fill: C.BLUE_LITE, color: C.NAVY, bold: true, size: 20, w: PAGE_W, borderColor: "A0C0D8" }
        )],
      })],
    }));

    // Note
    if (sec.note) {
      children.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: "ℹ  ", bold: true, size: 19, font: FONT, color: C.BLUE }),
          new TextRun({ text: String(sec.note), italic: true, size: 19, font: FONT, color: "4A5568" }),
        ],
      }));
    }

    // Repeatable badge
    if (sec.isRepeatable) {
      children.push(p(
        `➕ ADD MORE (Repeatable) — Min rows: ${sec.minRows ?? 1} | Max rows: ${sec.maxRows ?? 10}`,
        { bold: true, color: C.GREEN_DARK, size: 19, before: 60 }
      ));
    }

    // Field table
    if ((sec.fields || []).length > 0) {
      children.push(new Table({
        width: { size: PAGE_W, type: WidthType.DXA },
        columnWidths: COL_W,
        rows: [
          fieldHeaderRow(),
          ...sec.fields.map((f, i) => fieldRow(f, i % 2 === 0)),
        ],
      }));
    }

    // Conditional rules
    if ((sec.conditionalRules || []).length > 0) {
      children.push(spacer(80));
      children.push(new Table({
        width: { size: PAGE_W, type: WidthType.DXA },
        columnWidths: [PAGE_W],
        rows: [
          new TableRow({
            children: [cell("CONDITIONAL RULES", {
              fill: C.AMBER, bold: true, color: C.AMBER_TXT,
              size: 18, w: PAGE_W, borderColor: C.AMBER_BDR,
            })],
          }),
          ...sec.conditionalRules.map((r) => new TableRow({
            children: [new TableCell({
              borders: borders(C.AMBER_BDR),
              width: { size: PAGE_W, type: WidthType.DXA },
              shading: { fill: C.AMBER, type: ShadingType.CLEAR },
              margins: { top: 50, bottom: 50, left: 120, right: 100 },
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "▶  ", bold: true, size: 18, font: FONT, color: C.AMBER_TXT }),
                  new TextRun({ text: String(r), size: 18, font: FONT, color: "744210" }),
                ],
              })],
            })],
          })),
        ],
      }));
    }

    children.push(spacer(160));
  }

  children.push(divider());
}

// ── Appendix A — Business Rules ────────────────────────────────────────────
if ((srs.businessRules || []).length > 0) {
  children.push(spacer(200));
  children.push(new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [PAGE_W],
    rows: [new TableRow({
      children: [cell("APPENDIX A — GLOBAL BUSINESS RULES", {
        fill: C.NAVY, color: C.WHITE, bold: true, size: 22, w: PAGE_W, borderColor: C.NAVY,
      })],
    })],
  }));
  children.push(spacer(80));
  children.push(new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [900, 8460],
    rows: srs.businessRules.map((r, i) => new TableRow({
      children: [
        cell(`BR-${i + 1}`, { fill: C.NAVY, color: C.WHITE, bold: true, w: 900, size: 18 }),
        cell(String(r), { fill: i % 2 === 0 ? C.GRAY_LITE : C.WHITE, w: 8460, size: 18 }),
      ],
    })),
  }));
  children.push(divider());
}

// ── Appendix B — Application Status Flow ──────────────────────────────────
if ((srs.applicationStatusFlow || []).length > 0) {
  children.push(spacer(200));
  children.push(new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [PAGE_W],
    rows: [new TableRow({
      children: [cell("APPENDIX B — APPLICATION STATUS FLOW", {
        fill: C.NAVY, color: C.WHITE, bold: true, size: 22, w: PAGE_W, borderColor: C.NAVY,
      })],
    })],
  }));
  children.push(spacer(80));
  children.push(new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: [
      new TableRow({
        children: [
          cell("Status",      { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: 2800, size: 18 }),
          cell("Description", { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: 6560, size: 18 }),
        ],
      }),
      ...srs.applicationStatusFlow.map((s, i) => {
        const statusText = String(s.status || "") || MC;
        const descText = String(s.description || "") || MC;
        const statusMissing = isMissingContent(statusText);
        const descMissing = isMissingContent(descText);
        return new TableRow({
          children: [
            cell(statusText, { fill: i % 2 === 0 ? C.BLUE_LITE : C.WHITE, bold: true, color: statusMissing ? C.RED_TXT : C.NAVY, w: 2800, size: 18 }),
            cell(descText,   { fill: i % 2 === 0 ? C.GRAY_LITE : C.WHITE, w: 6560, size: 18, color: descMissing ? C.RED_TXT : "000000", bold: descMissing }),
          ],
        });
      }),
    ],
  }));
  children.push(divider());
}

// ── Appendix C — Use Cases ─────────────────────────────────────────────────
if ((srs.useCases || []).length > 0) {
  children.push(spacer(200));
  children.push(new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [PAGE_W],
    rows: [new TableRow({
      children: [cell("APPENDIX C — USE CASES & USAGE SCENARIOS", {
        fill: C.NAVY, color: C.WHITE, bold: true, size: 22, w: PAGE_W, borderColor: C.NAVY,
      })],
    })],
  }));
  children.push(spacer(80));

  for (const uc of srs.useCases) {
    const ucRows = [
      ["Use Case ID",     uc.useCaseId   || MC],
      ["Use Case Name",   uc.useCaseName || MC],
      ["Actors",          uc.actors      || MC],
      ["Pre-Conditions",  (uc.preconditions || []).join("\n") || MC],
      ["Basic Flow",      (uc.basicFlow || []).map((s, i) => `${i + 1}. ${s}`).join("\n") || MC],
      ["Business Rules",  (uc.businessRuleValidations || []).join("\n") || MC],
      ["Post Conditions", (uc.postConditions || []).join("\n") || MC],
    ];
    children.push(new Table({
      width: { size: PAGE_W, type: WidthType.DXA },
      columnWidths: [2200, 7160],
      rows: ucRows.map(([k, v], i) => {
        const valueText = String(v || MC);
        const missing = isMissingContent(valueText);
        return new TableRow({
          children: [
            cell(k, { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: 2200, size: 18 }),
            cell(valueText, { fill: i % 2 === 0 ? C.GRAY_LITE : C.WHITE, w: 7160, size: 18, color: missing ? C.RED_TXT : "000000", bold: missing }),
          ],
        });
      }),
    }));
    children.push(spacer(120));
    children.push(divider("CCCCCC"));
    children.push(spacer(80));
  }
}

// ── Appendix D — SRS Authoring Guide note ──────────────────────────────────
children.push(spacer(200));
children.push(new Table({
  width: { size: PAGE_W, type: WidthType.DXA },
  columnWidths: [PAGE_W],
  rows: [new TableRow({
    children: [cell("APPENDIX D — SRS AUTHORING GUIDE (FOR NEW SERVICES)", {
      fill: C.NAVY, color: C.WHITE, bold: true, size: 22, w: PAGE_W, borderColor: C.NAVY,
    })],
  })],
}));
children.push(spacer(80));
children.push(p("When onboarding a NEW department service to the FormBuilder system, use this document as the SRS template. Upload the completed SRS to the AI FormBuilder to auto-generate the complete DB-ready JSON — no manual SQL or coding required.", { size: 19, before: 60, after: 60, color: "4A5568" }));

const guide = [
  ["Form Metadata",      "Replace Form Name, Department ID, Service ID, Form Type ID, Description"],
  ["Pages & Sections",   "Define each PAGE with sections in the same table format shown above"],
  ["Fields",             "For each field: Name | Type | Mandatory | Grid | Options/Source | Conditions | Validation"],
  ["Conditional Rules",  "List at the END of each section (not inline with fields)"],
  ["Repeatable Sections","Mark as ADD MORE GROUP with min/max rows"],
  ["Master Dropdowns",   "Write Source: MASTER (table name). Do not list all options inline."],
  ["Static Dropdowns",   "List all options with label and snake_case value pairs"],
  ["File Upload Fields", 'Always set Validation Rule: {"accept": ".pdf,.jpg", "maxSizeMB": 5}'],
  ["Auto-Populated",     "Set Is Readonly: Yes"],
  ["Auto-Calculated",    "Always read-only. Never editable by user."],
];
children.push(new Table({
  width: { size: PAGE_W, type: WidthType.DXA },
  columnWidths: [2800, 6560],
  rows: [
    new TableRow({ children: [
      cell("Rule", { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: 2800, size: 18 }),
      cell("Guidance", { fill: C.BLUE_LITE, bold: true, color: C.NAVY, w: 6560, size: 18 }),
    ]}),
    ...guide.map(([k, v], i) => new TableRow({ children: [
      cell(k, { fill: i % 2 === 0 ? C.GRAY_LITE : C.WHITE, bold: true, color: C.BLUE, w: 2800, size: 18 }),
      cell(v, { fill: i % 2 === 0 ? C.WHITE : C.GRAY_LITE, w: 6560, size: 18 }),
    ]})),
  ],
}));

// ─── Build Document ───────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: C.NAVY },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: C.BLUE },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size:   { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outputFile, buf);
  const totalF = (srs.pages || []).reduce((a, p) => a + p.sections.reduce((b, s) => b + (s.fields || []).length, 0), 0);
  console.log(`✅  ${outputFile}  (${Math.round(buf.length / 1024)} KB)`);
  console.log(`    Pages: ${(srs.pages||[]).length}  |  Fields: ${totalF}  |  Rules: ${(srs.businessRules||[]).length}  |  Use Cases: ${(srs.useCases||[]).length}`);
}).catch(err => { console.error("❌ ", err.message); process.exit(1); });
