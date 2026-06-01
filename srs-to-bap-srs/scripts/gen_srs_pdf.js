'use strict';
/**
 * gen_srs_pdf.js — SRS PDF Generator v2
 * Matches the BAP SRS Trade License reference PDF format exactly.
 * Colours updated for stronger contrast. All options shown in full (no truncation).
 */

const fs = require('fs');
const { PDFDocument, rgb, StandardFonts, PageSizes } = require('pdf-lib');

// ── Colour palette (high-contrast, matches reference doc) ───────────────────
const C = {
    // ── EY Brand Palette ─────────────────────────────────────────────────────
    // Primary: #FFE600 (EY Turbo Yellow), #333333 (EY Charcoal), #FFFFFF (White)
    // Supporting yellows: #FFF176 (light), #FFD600 (deep), #FFF9C4 (pale)
    // Grays: #999999 (mid), #CCCCCC (light), #F5F5F5 (near-white)

    hdrDark:   rgb(51  / 255,  51 / 255,  51 / 255),  // EY Charcoal #333333 — banner, header text bg
    hdrMid:    rgb(255 / 255, 214 / 255,   0 / 255),  // EY Deep Yellow #FFD600 — section accent
    secHdr:    rgb(255 / 255, 249 / 255, 196 / 255),  // EY Pale Yellow #FFF9C4 — section header bg
    thBg:      rgb(255 / 255, 230 / 255,   0 / 255),  // EY Turbo Yellow #FFE600 — table header bg
    rowAlt:    rgb(255 / 255, 253 / 255, 231 / 255),  // Very pale yellow #FFFDE7 — alternate row
    rowWhite:  rgb(255 / 255, 255 / 255, 255 / 255),  // Pure white — plain row
    ltGreen:   rgb(255 / 255, 249 / 255, 196 / 255),  // EY Pale Yellow — metadata label bg
    paleGreen: rgb(255 / 255, 253 / 255, 231 / 255),  // Very pale yellow — metadata value bg
    // Conditional rules
    ruleBg:    rgb(255 / 255, 244 / 255, 204 / 255),  // Amber tint
    ruleBdr:   rgb(215 / 255, 140 / 255,  10 / 255),  // Amber border
    ruleTxt:   rgb( 90 / 255,  20 / 255, 130 / 255),  // Deep purple text
    // Note blocks
    noteBg:    rgb(218 / 255, 237 / 255, 255 / 255),  // Blue tint
    noteBdr:   rgb( 14 / 255,  86 / 255, 170 / 255),  // Blue border
    noteTxt:   rgb(  8 / 255,  55 / 255, 130 / 255),  // Dark blue text
    // Mandatory colours
    mandRed:   rgb(185 / 255,  25 / 255,  25 / 255),  // Mandatory
    mandOrg:   rgb(200 / 255,  65 / 255,   0 / 255),  // Conditional
    mandBlu:   rgb( 14 / 255,  86 / 255, 170 / 255),  // Auto *
    mandGrn:   rgb( 30 / 255, 110 / 255,  45 / 255),  // Optional
    // Type label
    typeBlu:   rgb( 14 / 255,  86 / 255, 170 / 255),
    // General
    white:     rgb(1, 1, 1),
    text:      rgb( 51 / 255,  51 / 255,  51 / 255),  // EY Charcoal #333333 — body text
    muted:     rgb(102 / 255, 102 / 255, 102 / 255),  // EY Mid Gray #666666 — secondary text
    divider:   rgb(255 / 255, 214 / 255,   0 / 255),  // EY Deep Yellow #FFD600 — divider lines
    border:    rgb(153 / 255, 153 / 255, 153 / 255),  // EY Mid Gray #999999 — table borders
};

// ── Safety helpers ──────────────────────────────────────────────────────────
const CHAR_MAP = {
    '\u2014': '-', '\u2013': '-', '\u2019': "'", '\u2018': "'",
    '\u201c': '"', '\u201d': '"', '\u2026': '...', '\u2192': '->',
    '\u2190': '<-', '\u2260': '!=', '\u2265': '>=', '\u2264': '<=',
    '\u2022': '*', '\u00b7': '*', '\u25b6': '>', '\u2795': '+',
    '\u2714': 'OK', '\u274c': 'X', '\u2139': 'i', '\u27a1': '->',
    '\u2764': '<3', '\u2713': 'OK', '\u2610': '[ ]', '\u2611': '[x]',
    '\u25cf': '*', '\u25cb': 'o', '\u2212': '-', '\u00a0': ' ',
    '\u00ae': '(R)', '\u00a9': '(C)', '\u20b9': 'Rs', '\u20ac': 'EUR',
    '\u2264': '<=', '\u2265': '>=', '\u00e2': 'a', '\u20b9': 'Rs',
};
function safe(txt) {
    let t = String(txt == null ? '' : txt);
    for (const [o, r] of Object.entries(CHAR_MAP)) t = t.split(o).join(r);
    return t.replace(/[^\x00-\xFF]/g, '?');
}
const MISSING = 'missing content';
function str(v, fb) {
    if (arguments.length < 2) fb = '';
    if (v == null) return fb;
    if (typeof v === 'number') return String(v);
    if (Array.isArray(v)) return v.filter(x => x != null).map(x => str(x)).join(', ');
    if (typeof v === 'object') {
        for (const k of ['text', 'value', 'name', 'label', 'description', 'rule']) if (v[k]) return str(v[k]);
        try { return JSON.stringify(v); } catch (_) { return String(v); }
    }
    return String(v);
}
function isMissingContent(v) {
    return String(v == null ? '' : v).trim().toLowerCase() === MISSING;
}
function mandColor(m) {
    m = String(m || '').trim();
    if (m === 'Mandatory') return C.mandRed;
    if (m === 'Conditional') return C.mandOrg;
    if (m.startsWith('Auto')) return C.mandBlu;
    return C.mandGrn;
}
function wrap(font, text, maxW, size) {
    const words = safe(str(text)).split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (font.widthOfTextAtSize(test, size) > maxW && cur) { lines.push(cur); cur = w; }
        else { cur = test; }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
}

// ── Document state ──────────────────────────────────────────────────────────
class Doc {
    constructor(pdfDoc, fonts, W, H, MG, formName, version) {
        this.pdfDoc = pdfDoc; this.fonts = fonts;
        this.W = W; this.H = H; this.MG = MG; this.CW = W - 2 * MG;
        this.formName = formName; this.version = version;
        this.pageNum = 0; this.page = null; this.y = 0;
    }
    newPage() {
        this.page = this.pdfDoc.addPage([this.W, this.H]);
        this.pageNum++;
        this.y = this.H - 42;
        this._header(); this._footer();
        return this.page;
    }
    _header() {
        const hh = 18, top = this.H - hh;
        this.page.drawRectangle({ x: this.MG, y: top, width: this.CW, height: hh, color: C.hdrDark });
        const label = safe(
            `GOVERNMENT OF KARNATAKA - DEPT OF INDUSTRIES & COMMERCE  |  ` +
            `${this.formName} SRS ${this.version}  |  Page ${this.pageNum}`
        );
        this.page.drawText(label, { x: this.MG + 6, y: top + 5, font: this.fonts.regular, size: 6.5, color: C.white });
    }
    _footer() {
        this.page.drawLine({ start: { x: this.MG, y: 22 }, end: { x: this.W - this.MG, y: 22 }, thickness: 0.5, color: C.divider });
        this.page.drawText('='.repeat(128), { x: this.MG, y: 10, font: this.fonts.regular, size: 5.5, color: C.border });
    }
    ensureSpace(n) { if (this.y - n < 34) this.newPage(); }
    dt(t, x, y, font, size, color) { this.page.drawText(safe(str(t)), { x, y, font, size, color }); }
    rect(x, y, w, h, color) { this.page.drawRectangle({ x, y, width: w, height: h, color }); }
    line(x1, y1, x2, y2, th, color) { this.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: th, color }); }
}

// ── Cover page ──────────────────────────────────────────────────────────────
function drawCover(doc, meta, tf, tr, ts) {
    const { fonts, MG, CW, W, H } = doc;
    doc.newPage();
    let y = H - 42;
    // Big header
    doc.rect(MG, y - 52, CW, 52, C.hdrDark);
    doc.dt('GOVERNMENT OF KARNATAKA - DEPARTMENT OF INDUSTRIES & COMMERCE', MG + 10, y - 20, fonts.bold, 10.5, C.white);
    doc.dt('Karnataka Udyog Mitra (KUM) Single Window System', MG + 10, y - 34, fonts.regular, 9, rgb(255 / 255, 230 / 255, 0 / 255));
    y -= 72;
    for (const l of wrap(fonts.bold, str(meta.formName || 'SRS Document'), CW - 10, 20)) {
        doc.dt(l, MG, y, fonts.bold, 20, C.hdrDark); y -= 28;
    }
    doc.dt('Service Requirement Specification (SRS)', MG, y, fonts.bold, 13, C.hdrMid); y -= 18;
    doc.dt('Techno-Functional Document — FormBuilder System', MG, y, fonts.regular, 10, C.muted); y -= 26;
    doc.line(MG, y, W - MG, y, 1.5, C.divider); y -= 18;

    const LW = 115;
    const rows = [
        ['Form Name', str(meta.formName || MISSING)],
        ['Service ID', str(meta.serviceId || MISSING)],
        ['Department ID', str(meta.departmentId || MISSING)],
        ['Form Type ID', str(meta.formTypeId || MISSING)],
        ['Version', str(meta.version || MISSING)],
        ['Date', str(meta.date || MISSING)],
        ['Total Fields', `${tf} fields | ${tr} business rules | ${ts} statuses`],
        ['Purpose', str(meta.description || MISSING)],
    ];
    for (const [lbl, val] of rows) {
        const vl = wrap(fonts.regular, val, CW - LW - 12, 9.5);
        const rh = Math.max(20, vl.length * 14 + 6);
        const valIsMissing = isMissingContent(val);
        doc.rect(MG, y - rh, LW, rh, C.ltGreen);
        doc.rect(MG + LW, y - rh, CW - LW, rh, C.paleGreen);
        doc.line(MG, y, MG + CW, y, 0.9, C.border);
        doc.dt(lbl, MG + 5, y - 14, fonts.bold, 9.5, C.hdrDark);
        let vy = y - 14;
        for (const l of vl) {
            doc.dt(l, MG + LW + 5, vy, valIsMissing ? fonts.bold : fonts.regular, 9.5, valIsMissing ? C.mandRed : C.text);
            vy -= 14;
        }
        y -= rh;
    }
    doc.line(MG, y, MG + CW, y, 0.9, C.border);
}

// ── How to Use page ─────────────────────────────────────────────────────────
function drawHowToUse(doc) {
    const { fonts, MG, CW, W } = doc;
    doc.newPage(); let y = doc.y;
    doc.dt('HOW TO USE THIS SRS DOCUMENT', MG, y, fonts.bold, 14, C.hdrDark); y -= 20;
    doc.line(MG, y, W - MG, y, 1, C.divider); y -= 16;
    const intro = 'This SRS (Service Requirement Specification) document is the single source of truth for configuring any government service form in the Karnataka Single Window FormBuilder system. When uploaded to the AI FormBuilder, it auto-generates a complete database-ready JSON.';
    for (const l of wrap(fonts.regular, intro, CW, 10.5)) { doc.dt(l, MG, y, fonts.regular, 10.5, C.text); y -= 15; }
    y -= 10;
    const secs = [
        ['1. Purpose of This Document', [
            '* Define every field, type, validation, and conditional rule for the form',
            '* Serve as input to AI FormBuilder to generate DB-ready JSON (no manual SQL needed)',
            '* Act as a template for onboarding new department services',
            '* Provide a techno-functional reference for developers, BAs, and department officials',
        ]],
        ['2. How AI FormBuilder Uses This SRS', [
            'Step 1: Upload this document to the AI FormBuilder system',
            'Step 2: AI reads every PAGE, SECTION, FIELD, and CONDITIONAL RULE',
            'Step 3: AI generates a single structured JSON matching the DB schema',
            'Step 4: Admin reviews JSON in preview screen',
            'Step 5: On approval, JSON is inserted into m_fb_* database tables',
            'Step 6: Form is live for investors on the Single Window Portal',
        ]],
    ];
    for (const [hd, buls] of secs) {
        if (y < 80) { doc.newPage(); y = doc.y; }
        doc.dt(hd, MG, y, fonts.bold, 11, C.hdrDark); y -= 18;
        for (const b of buls) {
            for (const l of wrap(fonts.regular, b, CW - 20, 10)) {
                if (y < 60) { doc.newPage(); y = doc.y; }
                doc.dt(l, MG + 14, y, fonts.regular, 10, C.text); y -= 14;
            }
        }
        y -= 8;
    }
    // Field type table
    if (y < 100) { doc.newPage(); y = doc.y; }
    doc.dt('3. Field Type Reference', MG, y, fonts.bold, 11, C.hdrDark); y -= 18;
    const TW = 88;
    doc.rect(MG, y - 18, CW, 18, C.thBg);
    doc.dt('Field Type', MG + 4, y - 13, fonts.bold, 9.5, C.hdrDark);
    doc.dt('Description / Examples', MG + TW + 4, y - 13, fonts.bold, 9.5, C.hdrDark);
    doc.line(MG + TW, y, MG + TW, y - 18, 0.8, C.border);
    y -= 18;
    const types = [
        ['TEXT', 'Single-line text input — Name, Address, PAN, CIN'],
        ['NUMBER', 'Numeric input (integer or decimal) — Investment, Area, Employment'],
        ['SELECT', 'Single-select dropdown — District, Type Of Proposal'],
        ['MULTISELECT', 'Multi-value dropdown — Assistance Type'],
        ['RADIO', 'Radio button (2-4 options) — Yes/No, New/Existing'],
        ['CHECKBOX', 'Single checkbox (true/false) — Same Address flag'],
        ['DATE', 'Date picker (calendar) — Date Of Incorporation'],
        ['TEL', 'Phone/mobile number input — Mobile Number'],
        ['EMAIL', 'Email address input — Corporate Email'],
        ['TEXTAREA', 'Multi-line text area — Products Description'],
        ['FILE', 'File upload (DMS integrated) — PAN Card, DPR, Land Deed'],
        ['HIDDEN', 'Hidden system field (not shown to user) — Internal tracking IDs'],
    ];
    for (let i = 0; i < types.length; i++) {
        const bg = i % 2 === 0 ? C.rowAlt : C.rowWhite;
        doc.rect(MG, y - 16, CW, 16, bg);
        doc.line(MG + TW, y, MG + TW, y - 16, 0.8, C.border);
        doc.line(MG, y - 16, MG + CW, y - 16, 0.7, C.border);
        doc.dt(types[i][0], MG + 4, y - 11, fonts.bold, 9, C.typeBlu);
        doc.dt(types[i][1], MG + TW + 4, y - 11, fonts.regular, 9, C.text);
        y -= 16;
    }
    y -= 8;
    // Mandatory legend
    if (y < 100) { doc.newPage(); y = doc.y; }
    doc.dt('4. Mandatory Field Values', MG, y, fonts.bold, 11, C.hdrDark); y -= 18;
    const mands = [
        ['[Yes]', C.mandRed, 'Always required. Form cannot be submitted without this field.'],
        ['[No]', C.mandGrn, 'Optional. User may leave blank.'],
        ['[Conditional]', C.mandOrg, 'Required only when specific condition is met (see CONDITIONAL RULES).'],
        ['[Auto Populated]', C.mandBlu, 'Pre-filled from investor registration. Usually read-only.'],
        ['[Auto Calculated]', C.mandBlu, 'System calculates value (e.g. totals). Always read-only.'],
    ];
    for (const [tag, col, desc] of mands) {
        if (y < 60) { doc.newPage(); y = doc.y; }
        doc.dt(tag, MG + 10, y, fonts.bold, 9.5, col);
        doc.dt(desc, MG + 110, y, fonts.regular, 9.5, C.text);
        y -= 15;
    }
    doc.y = y;
}

// ── Field table ─────────────────────────────────────────────────────────────
function drawFieldTable(doc, fields) {
    if (!fields || !fields.length) return;
    const { fonts, MG, CW } = doc;
    // Columns: # | Field Name | Tool Tip | Type | Gr | Mandatory | Validation/Notes
    const COLS = [22, 105, 140, 54, 20, 68, 0];
    COLS[6] = CW - COLS.slice(0, 6).reduce((a, b) => a + b, 0);
    const colX = []; let cx = MG; for (const w of COLS) { colX.push(cx); cx += w; }
    const HDR = ['#', 'Field Name', 'Tool Tip', 'Type', 'Gr', 'Mandatory', 'Validation / Notes'];
    const RH_MIN = 18;

    const drawHdr = () => {
        doc.ensureSpace(RH_MIN + 4);
        doc.rect(MG, doc.y - RH_MIN, CW, RH_MIN, C.thBg);
        for (let i = 0; i < HDR.length; i++) doc.dt(HDR[i], colX[i] + 3, doc.y - 13, fonts.bold, 9, C.hdrDark);
        // inner column dividers
        for (let i = 1; i < COLS.length; i++) doc.line(colX[i], doc.y, colX[i], doc.y - RH_MIN, 0.8, C.border);
        // top, bottom, left, right outer box
        doc.line(MG,        doc.y,         MG + CW,    doc.y,         1.2, C.border);
        doc.line(MG,        doc.y - RH_MIN, MG + CW,   doc.y - RH_MIN, 1.2, C.border);
        doc.line(MG,        doc.y,         MG,         doc.y - RH_MIN, 1.2, C.border);
        doc.line(MG + CW,   doc.y,         MG + CW,    doc.y - RH_MIN, 1.2, C.border);
        doc.y -= RH_MIN;
    };
    drawHdr();

    for (let fi = 0; fi < fields.length; fi++) {
        const f = fields[fi];
        // Build full notes — ALL options, no truncation
        let notes = str(f.validationNotes || '');
        const opts = str(f.options || '');
        if (opts && opts !== 'None' && opts.trim()) {
            const ol = opts.split('|').map(o => o.trim()).filter(o => o);
            const optStr = 'Options: ' + ol.join(' | ');
            notes = notes ? notes + '. ' + optStr : optStr;
        }
        if (!notes || !notes.trim()) notes = MISSING;
        const fieldNumText = str(f.fieldNumber || '') || MISSING;
        const fieldNameText = str(f.fieldName || '') || MISSING;
        const toolTip = safe(str(f.toolTip || f.tooltip || f.tool_tip || '') || MISSING);
        const typeText = str(f.type || '') || MISSING;
        const mandatoryText = str(f.mandatory || '') || MISSING;
        const nameLines  = wrap(fonts.bold,    fieldNameText, COLS[1] - 6, 9);
        const tipLines   = wrap(fonts.regular, toolTip,                COLS[2] - 6, 8);
        const notesLines = wrap(fonts.regular, notes,                  COLS[6] - 6, 9);
        const rowH = Math.max(RH_MIN, Math.max(nameLines.length, tipLines.length, notesLines.length) * 13 + 5);
        if (doc.y - rowH < 34) { doc.newPage(); drawHdr(); }
        const bg = fi % 2 === 0 ? C.rowAlt : C.rowWhite;
        doc.rect(MG, doc.y - rowH, CW, rowH, bg);
        // inner column dividers
        for (let i = 1; i < COLS.length; i++) doc.line(colX[i], doc.y, colX[i], doc.y - rowH, 0.8, C.border);
        // bottom border of each row
        doc.line(MG, doc.y - rowH, MG + CW, doc.y - rowH, 0.8, C.border);
        // left and right outer border on every row
        doc.line(MG,      doc.y, MG,      doc.y - rowH, 1.2, C.border);
        doc.line(MG + CW, doc.y, MG + CW, doc.y - rowH, 1.2, C.border);
        const ry = doc.y - 12;
        doc.dt(fieldNumText, colX[0] + 3, ry, fonts.regular, 9, isMissingContent(fieldNumText) ? C.mandRed : C.muted);
        for (let i = 0; i < nameLines.length;  i++) doc.dt(nameLines[i],  colX[1] + 3, ry - i * 13, fonts.bold,    9,   isMissingContent(fieldNameText) ? C.mandRed : C.text);
        for (let i = 0; i < tipLines.length;    i++) doc.dt(tipLines[i],   colX[2] + 3, ry - i * 13, fonts.regular, 8,   isMissingContent(toolTip) ? C.mandRed : C.muted);
        doc.dt(typeText, colX[3] + 3, ry, fonts.bold, 9, isMissingContent(typeText) ? C.mandRed : C.typeBlu);
        doc.dt(str(f.grid || '6'), colX[4] + 3, ry, fonts.regular, 9, C.text);
        doc.dt(mandatoryText, colX[5] + 3, ry, fonts.bold, 8.5, isMissingContent(mandatoryText) ? C.mandRed : mandColor(f.mandatory));
        for (let i = 0; i < notesLines.length;  i++) doc.dt(notesLines[i], colX[6] + 3, ry - i * 13, fonts.regular, 9,   isMissingContent(notes) ? C.mandRed : C.muted);
        doc.y -= rowH;
    }
    doc.y -= 4;
}

// ── Conditional rules block ─────────────────────────────────────────────────
function drawConditionalRules(doc, rules) {
    if (!rules || !rules.length) return;
    const { fonts, MG, CW } = doc;
    doc.ensureSpace(28);
    doc.rect(MG, doc.y - 20, CW, 20, C.ruleBg);
    doc.line(MG, doc.y, MG, doc.y - 20, 3.5, C.ruleBdr);
    doc.dt('CONDITIONAL RULES', MG + 12, doc.y - 14, fonts.bold, 9.5, C.ruleTxt);
    doc.y -= 24;
    for (const rule of rules) {
        const lines = wrap(fonts.oblique, '> ' + str(rule), CW - 24, 9.5);
        const rh = lines.length * 13 + 2;
        doc.ensureSpace(rh + 4);
        let ry = doc.y;
        for (const l of lines) { doc.dt(l, MG + 12, ry, fonts.oblique, 9.5, C.ruleTxt); ry -= 13; }
        doc.y = ry - 2;
    }
    doc.y -= 6;
}

// ── Note block ──────────────────────────────────────────────────────────────
function drawNote(doc, note) {
    if (!note || !String(note).trim()) return;
    const { fonts, MG, CW } = doc;
    const lines = wrap(fonts.oblique, str(note), CW - 28, 9.5);
    const nh = Math.max(20, lines.length * 14 + 4);
    doc.ensureSpace(nh + 4);
    doc.rect(MG, doc.y - nh, CW, nh, C.noteBg);
    doc.line(MG, doc.y, MG, doc.y - nh, 3.5, C.noteBdr);
    let ny = doc.y - 12;
    for (const l of lines) { doc.dt('[i]  ' + l, MG + 10, ny, fonts.oblique, 9.5, C.noteTxt); ny -= 14; }
    doc.y -= nh + 5;
}

// ── Page banner ─────────────────────────────────────────────────────────────
function drawPageBanner(doc, num, name) {
    const { fonts, MG, CW } = doc;
    doc.ensureSpace(32);
    doc.rect(MG, doc.y - 28, CW, 28, C.hdrDark);
    doc.dt(`PAGE ${num}`, MG + 10, doc.y - 11, fonts.bold, 14, C.white);
    if (name) doc.dt(safe(str(name)), MG + 82, doc.y - 11, fonts.bold, 11, rgb(190 / 255, 235 / 255, 200 / 255));
    doc.y -= 34;
}

// ── Section header ──────────────────────────────────────────────────────────
function drawSectionHeader(doc, secId, secName, isRep, minR, maxR) {
    const { fonts, MG, CW } = doc;
    doc.ensureSpace(26);
    const label = `SECTION ${str(secId)} - ${str(secName)}` +
        (isRep ? `   [+] ADD MORE (Repeatable): min ${minR || 1} / max ${maxR || 10} rows` : '');
    const lines = wrap(fonts.bold, label, CW - 14, 10);
    const sh = Math.max(22, lines.length * 14 + 6);
    doc.rect(MG, doc.y - sh, CW, sh, C.secHdr);
    doc.line(MG, doc.y, MG, doc.y - sh, 4, C.hdrMid);
    let sy = doc.y - 14;
    for (const l of lines) { doc.dt(l, MG + 10, sy, fonts.bold, 10, C.hdrDark); sy -= 14; }
    doc.y -= sh + 5;
}

// ── Appendix A: Business Rules ──────────────────────────────────────────────
function drawAppendixA(doc, bizRules) {
    if (!bizRules || !bizRules.length) return;
    const { fonts, MG, CW } = doc;
    const banner = (title) => {
        doc.rect(MG, doc.y - 26, CW, 26, C.hdrDark);
        doc.dt(title, MG + 10, doc.y - 17, fonts.bold, 12, C.white);
        doc.y -= 36;
    };
    doc.newPage(); banner('APPENDIX A - GLOBAL BUSINESS RULES');
    const LW = 48;
    for (let i = 0; i < bizRules.length; i++) {
        const lines = wrap(fonts.regular, str(bizRules[i]), CW - LW - 10, 9.5);
        const rh = Math.max(20, lines.length * 13 + 6);
        if (doc.y - rh < 34) { doc.newPage(); banner('APPENDIX A - GLOBAL BUSINESS RULES (continued)'); }
        doc.rect(MG, doc.y - rh, LW, rh, C.ltGreen);
        doc.rect(MG + LW, doc.y - rh, CW - LW, rh, C.paleGreen);
        doc.line(MG, doc.y, MG + CW, doc.y, 0.8, C.border);
        doc.line(MG + LW, doc.y, MG + LW, doc.y - rh, 0.8, C.border);
        doc.dt(`BR-${i + 1}`, MG + 5, doc.y - 13, fonts.bold, 9.5, C.hdrDark);
        let ry = doc.y - 13; for (const l of lines) { doc.dt(l, MG + LW + 5, ry, fonts.regular, 9.5, C.text); ry -= 13; }
        doc.y -= rh;
    }
    doc.line(MG, doc.y, MG + CW, doc.y, 0.8, C.border);
}

// ── Appendix B: Status Flow ─────────────────────────────────────────────────
function drawAppendixB(doc, statuses) {
    if (!statuses || !statuses.length) return;
    const { fonts, MG, CW } = doc;
    const SW = 150;
    const banner = (title) => {
        doc.rect(MG, doc.y - 26, CW, 26, C.hdrDark);
        doc.dt(title, MG + 10, doc.y - 17, fonts.bold, 12, C.white);
        doc.y -= 36;
        doc.rect(MG, doc.y - 20, SW, 20, C.thBg);
        doc.rect(MG + SW, doc.y - 20, CW - SW, 20, C.thBg);
        doc.line(MG + SW, doc.y, MG + SW, doc.y - 20, 0.8, C.border);
        doc.dt('Status', MG + 5, doc.y - 14, fonts.bold, 9.5, C.hdrDark);
        doc.dt('Description', MG + SW + 5, doc.y - 14, fonts.bold, 9.5, C.hdrDark);
        doc.y -= 20;
    };
    doc.newPage(); banner('APPENDIX B - APPLICATION STATUS FLOW');
    for (let i = 0; i < statuses.length; i++) {
        const sd = typeof statuses[i] === 'object' ? statuses[i] : { status: str(statuses[i]), description: '' };
        const sl = wrap(fonts.bold, str(sd.status || ''), SW - 10, 9.5);
        const dl = wrap(fonts.regular, str(sd.description || ''), CW - SW - 10, 9.5);
        const rh = Math.max(18, Math.max(sl.length, dl.length) * 13 + 5);
        if (doc.y - rh < 34) { doc.newPage(); banner('APPENDIX B - APPLICATION STATUS FLOW (continued)'); }
        const bg = i % 2 === 0 ? C.rowAlt : C.rowWhite;
        doc.rect(MG, doc.y - rh, SW, rh, bg);
        doc.rect(MG + SW, doc.y - rh, CW - SW, rh, bg);
        doc.line(MG, doc.y, MG + CW, doc.y, 0.8, C.border);
        doc.line(MG + SW, doc.y, MG + SW, doc.y - rh, 0.8, C.border);
        let ry = doc.y - 12;
        for (const l of sl) { doc.dt(l, MG + 5, ry, fonts.bold, 9.5, C.hdrDark); ry -= 13; }
        ry = doc.y - 12;
        for (const l of dl) { doc.dt(l, MG + SW + 5, ry, fonts.regular, 9.5, C.text); ry -= 13; }
        doc.y -= rh;
    }
    doc.line(MG, doc.y, MG + CW, doc.y, 0.8, C.border);
}

// ── Appendix C: Use Cases ───────────────────────────────────────────────────
function drawAppendixC(doc, useCases) {
    if (!useCases || !useCases.length) return;
    const { fonts, MG, CW } = doc;
    doc.newPage();
    doc.rect(MG, doc.y - 26, CW, 26, C.hdrDark);
    doc.dt('APPENDIX C - USE CASES & USAGE SCENARIOS', MG + 10, doc.y - 17, fonts.bold, 12, C.white);
    doc.y -= 36;
    const LW = 110;
    for (const uc of useCases) {
        doc.ensureSpace(60);
        for (const [lbl, val] of [
            ['Use Case ID', uc.useCaseId],
            ['Use Case Name', uc.useCaseName],
            ['Actors', uc.actors],
        ]) {
            const valText = str(val || '') || MISSING;
            const valMissing = isMissingContent(valText);
            const vl = wrap(fonts.regular, valText, CW - LW - 10, 9.5);
            const rh = Math.max(18, vl.length * 13 + 5);
            doc.rect(MG, doc.y - rh, LW, rh, C.ltGreen);
            doc.rect(MG + LW, doc.y - rh, CW - LW, rh, C.paleGreen);
            doc.line(MG, doc.y, MG + CW, doc.y, 0.8, C.border);
            doc.line(MG + LW, doc.y, MG + LW, doc.y - rh, 0.8, C.border);
            doc.dt(lbl, MG + 5, doc.y - 13, fonts.bold, 9.5, C.hdrDark);
            let vy = doc.y - 13;
            for (const l of vl) {
                doc.dt(l, MG + LW + 5, vy, valMissing ? fonts.bold : fonts.regular, 9.5, valMissing ? C.mandRed : C.text);
                vy -= 13;
            }
            doc.y -= rh;
        }
        const subsecs = [
            ['Pre-Conditions', uc.preconditions || [], '* '],
            ['Basic Flow', uc.basicFlow || [], ''],
            ['Business Rules', uc.businessRuleValidations || [], '* '],
            ['Post Conditions', uc.postConditions || [], '* '],
        ];
        for (const [lbl2, items, pref] of subsecs) {
            if (!items.length) continue;
            doc.ensureSpace(22);
            doc.rect(MG, doc.y - 18, CW, 18, C.secHdr);
            doc.line(MG, doc.y, MG, doc.y - 18, 3.5, C.hdrMid);
            doc.dt(lbl2, MG + 8, doc.y - 13, fonts.bold, 9.5, C.hdrDark);
            doc.y -= 22;
            for (let ii = 0; ii < items.length; ii++) {
                const item = pref === '' ? `${ii + 1}. ${str(items[ii])}` : pref + str(items[ii]);
                for (const l of wrap(fonts.regular, item, CW - 24, 9.5)) {
                    doc.ensureSpace(14);
                    doc.dt(l, MG + 14, doc.y, fonts.regular, 9.5, C.text);
                    doc.y -= 13;
                }
            }
            doc.y -= 4;
        }
        doc.ensureSpace(16);
        doc.line(MG, doc.y, MG + CW, doc.y, 1, C.divider);
        doc.y -= 14;
    }
}

// ── Appendix D: Authoring Guide ─────────────────────────────────────────────
function drawAppendixD(doc) {
    const { fonts, MG, CW } = doc;
    doc.newPage();
    doc.rect(MG, doc.y - 26, CW, 26, C.hdrDark);
    doc.dt('APPENDIX D - SRS AUTHORING GUIDE (FOR NEW SERVICES)', MG + 10, doc.y - 17, fonts.bold, 12, C.white);
    doc.y -= 36;
    const para = 'When onboarding a NEW department service to the FormBuilder system, follow this exact SRS format. The AI will parse your document and generate the complete DB-ready JSON automatically - no manual SQL or coding required.';
    for (const l of wrap(fonts.regular, para, CW, 10)) { doc.dt(l, MG, doc.y, fonts.regular, 10, C.text); doc.y -= 14; }
    doc.y -= 8;
    doc.dt('Key Rules to Remember', MG, doc.y, fonts.bold, 11, C.hdrDark); doc.y -= 18;
    const rules = [
        '* Grid 6 = half width (two fields per row). Grid 12 = full width (one field per row).',
        '* For address fields, always use Grid: 12.',
        '* For repeatable sections, mark as ADD MORE GROUP with min/max rows.',
        '* Master dropdowns: write Source: MASTER (). Do not list options.',
        '* Static dropdowns: list all options with label and value pairs.',
        '* Values must be lowercase snake_case (e.g. "new_project", "public_limited").',
        '* Conditional rules: always list at the END of the section (not inline).',
        '* Validation Rule must be a JSON object: {"min": 0} or {"accept": ".pdf", "maxSizeMB": 5}',
        '* Auto Populated fields: set Is Readonly: Yes. Auto Calculated: always readonly.',
        '* File upload fields: always set Validation Rule with accept and maxSizeMB.',
    ];
    for (const r of rules) {
        for (const l of wrap(fonts.regular, r, CW - 20, 9.5)) {
            doc.ensureSpace(14);
            doc.dt(l, MG + 12, doc.y, fonts.regular, 9.5, C.text); doc.y -= 14;
        }
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function generatePdf(srs, outputPath) {
    const pdfDoc = await PDFDocument.create();
    // A4 Landscape — wider tables for Tool Tip column
    const [H, W] = PageSizes.A4;
    const MG = 36;
    const fonts = {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        oblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };

    const meta = srs.formMetadata || {};
    const pages = srs.pages || [];
    const bizRules = srs.businessRules || [];
    const statuses = srs.applicationStatusFlow || [];
    const useCases = srs.useCases || [];

    const totalFields = pages.reduce((s, p) => (p.sections || []).reduce((a, sec) => a + (sec.fields || []).length, s), 0);
    const formName = str(meta.formName || 'SRS Document').substring(0, 65);
    const version = str(meta.version || '');

    const doc = new Doc(pdfDoc, fonts, W, H, MG, formName, version);

    drawCover(doc, meta, totalFields, bizRules.length, statuses.length);
    drawHowToUse(doc);

    for (const pg of pages) {
        doc.newPage();
        drawPageBanner(doc, pg.pageNumber || '', pg.pageName || '');
        for (const sec of pg.sections || []) {
            if (doc.y < 140) doc.newPage();
            drawSectionHeader(doc, sec.sectionId, sec.sectionName, sec.isRepeatable, sec.minRows, sec.maxRows);
            drawNote(doc, sec.note);
            drawFieldTable(doc, sec.fields || []);
            drawConditionalRules(doc, sec.conditionalRules || []);
            doc.ensureSpace(10);
            doc.line(MG, doc.y, MG + doc.CW, doc.y, 0.6, C.divider);
            doc.dt('='.repeat(128), MG, doc.y - 6, fonts.regular, 4.5, C.border);
            doc.y -= 14;
        }
    }

    // System pages
    doc.ensureSpace(70);
    for (const sp of [
        'PAGE 8    PAYMENT - Payment is handled by payment gateway.',
        'PAGE 9    APPLICATION SIGNING - Digital Signature Certificate (DSC) signing.',
        'PAGE 10   SUMMARY - Summary page shows all entered data in read-only mode.',
    ]) {
        doc.rect(MG, doc.y - 20, doc.CW, 20, C.ltGreen);
        doc.line(MG, doc.y, MG, doc.y - 20, 3.5, C.hdrMid);
        doc.dt(sp, MG + 10, doc.y - 13, fonts.bold, 10, C.hdrDark);
        doc.y -= 22;
    }
    doc.line(MG, doc.y, MG + doc.CW, doc.y, 0.6, C.divider);
    doc.dt('='.repeat(128), MG, doc.y - 6, fonts.regular, 4.5, C.border);
    doc.y -= 14;

    drawAppendixA(doc, bizRules);
    drawAppendixB(doc, statuses);
    if (useCases.length) drawAppendixC(doc, useCases);
    drawAppendixD(doc);

    const bytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, bytes);
    console.log(`OK ${outputPath} (${Math.round(bytes.length / 1024)} KB) | pages=${pdfDoc.getPages().length} fields=${totalFields}`);
}

async function main() {
    if (process.argv.length < 4) { console.error('Usage: node gen_srs_pdf.js <srs.json> <output.pdf>'); process.exit(1); }
    try {
        const srs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
        await generatePdf(srs, process.argv[3]);
    } catch (e) { console.error('Error generating PDF:', e.message); process.exit(1); }
}
main();