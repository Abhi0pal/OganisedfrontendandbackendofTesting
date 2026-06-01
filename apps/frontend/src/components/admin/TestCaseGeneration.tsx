import React, { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
type ResultData = {
  count: number;
  message: string;
  txtDownload: string;
  excelDownload: string;
  testCases?: TestCase[];
  preview?: string;
  isPartial?: boolean;
};

type TestCase = {
  "Test case No.": string;
  "Function List/Test case description": string;
  "Condition/Feature to be tested": string;
  steps: string;
  "data set / values": string;
  expected_result: string;
};

type AppStatus = "idle" | "processing" | "done" | "error";

const PY_API_BASE = (process.env.NEXT_PUBLIC_PY_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function withPyApiBase(urlOrPath: string): string {
  if (!urlOrPath) {
    return "";
  }
  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }
  return `${PY_API_BASE}${urlOrPath.startsWith("/") ? "" : "/"}${urlOrPath}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES (injected once via a <style> tag)
───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
.tcgPage {
  --black:          #1f2233;
  --deep:           #fafafa;
  --dark-blue:      #ffffff;
  --dark-blue-mid:  #f7f7f8;
  --dark-blue-hi:   #f3f4f6;
  --border:         #e8e8ec;
  --border-hi:      #dedee5;
  --text:           #2e3143;
  --muted:          #8b8fa1;
  --yellow:         #ffea00;
  --yellow-dim:     #f0d900;
  --yellow-glow:    rgba(255,234,0,0.16);
  --yellow-glow-hi: rgba(255,234,0,0.26);
  --success:        #15803d;
  --error:          #b91c1c;
  --mono:           'Segoe UI', sans-serif;
  --sans:           'Segoe UI', sans-serif;
}

.tcgPage *, .tcgPage *::before, .tcgPage *::after { box-sizing: border-box; margin: 0; padding: 0; }
.tcgPage { scroll-behavior: smooth; }

.tcgPage {
  min-height: 100vh;
  padding: 0 0 40px;
  background-color: var(--deep);
  background-image: none;
  color: var(--text);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}

.tcgPage a { color: inherit; text-decoration: none; }

.tcgPage ::-webkit-scrollbar { width: 6px; height: 6px; }
.tcgPage ::-webkit-scrollbar-track { background: var(--deep); }
.tcgPage ::-webkit-scrollbar-thumb { background: var(--dark-blue-hi); border-radius: 3px; }
.tcgPage ::-webkit-scrollbar-thumb:hover { background: var(--yellow-dim); }

/* ── Page shell ── */
.tcgPage .shell { max-width: 1180px; margin: 0 auto; padding: 40px 24px 88px; }

/* ── Hero ── */
.tcgPage .hero {
  margin-bottom: 34px;
  animation: fadeUp 0.6s ease both;
  text-align: center;
}
.tcgPage .eyebrow {
  display: inline-block; margin-bottom: 14px; color: var(--muted);
  font-family: var(--mono); font-size: 0.9rem; font-weight: 700; letter-spacing: 0;
  text-transform: none; padding: 0;
  border: 0; border-radius: 0; background: transparent;
}
.tcgPage .title {
  font-family: var(--sans); font-size: clamp(2.7rem,5vw,2rem);
  font-weight: 800; line-height: 1.08; color: var(--text); letter-spacing: -0.04em;
}
.tcgPage .arrow { color: var(--yellow); display: inline-block; animation: pulse 2s ease-in-out infinite; }
.tcgPage .subcopy { max-width: 760px; margin: 16px auto 0; color: var(--muted); font-size: 1rem; line-height: 1.7; }

/* ── Grid ── */
.tcgPage .grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 20px; margin-top: 24px; }
@media(max-width:860px){ .tcgPage .grid { grid-template-columns: 1fr; } }

/* ── Error card ── */
.tcgPage .errorCard {
  display: flex; align-items: flex-start; gap: 12px; margin-top: 24px;
  padding: 18px 20px; background: rgba(248,113,113,0.07);
  border: 1px solid rgba(248,113,113,0.3); border-radius: 14px;
  color: var(--error); font-size: 0.92rem; animation: fadeUp 0.3s ease both;
}
.tcgPage .errorIcon { font-size: 1.1rem; margin-top: 1px; flex-shrink: 0; }

/* ── Upload zone ── */
.tcgPage .zone {
  position: relative; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  padding: 44px 24px; border: 1px dashed var(--border-hi);
  border-radius: 24px; background: var(--dark-blue); cursor: pointer;
  transition: all 0.25s ease; text-align: center;
  animation: fadeUp 0.5s 0.1s ease both; overflow: hidden;
  box-shadow: 0 8px 24px rgba(24, 28, 39, 0.04);
}
.tcgPage .zone::before {
  content: ''; position: absolute; inset: 0; background: var(--yellow-glow);
  opacity: 0; transition: opacity 0.25s ease; border-radius: 16px;
}
.tcgPage .zone:hover::before { opacity: 1; }
.tcgPage .zone:hover { border-color: #d7d9e2; transform: translateY(-2px); box-shadow: 0 14px 30px rgba(24, 28, 39, 0.08); }
.tcgPage .zone:focus-visible { outline: 2px solid var(--yellow); outline-offset: 4px; }
.tcgPage .zoneBusy { cursor: not-allowed; opacity: 0.75; border-style: solid; border-color: var(--border-hi); }
.tcgPage .zoneBusy:hover { transform: none; box-shadow: none; }
.tcgPage .zoneIconWrap {
  display: flex; align-items: center; justify-content: center;
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--dark-blue-hi); border: 1px solid var(--border); color: var(--muted);
}
.tcgPage .spinner {
  width: 24px; height: 24px; border: 2px solid var(--border-hi);
  border-top-color: var(--yellow); border-radius: 50%;
  animation: spin 0.8s linear infinite; display: block;
}
.tcgPage .zoneHeading { font-family: var(--sans); font-size: 1.15rem; font-weight: 700; color: var(--text); position: relative; }
.tcgPage .zoneHint { color: var(--muted); font-size: 0.88rem; line-height: 1.5; position: relative; }
.tcgPage .zoneBadge {
  display: inline-block; padding: 9px 16px; border-radius: 12px;
  border: 0; background: var(--yellow);
  color: var(--black); font-family: var(--sans); font-size: 0.88rem;
  font-weight: 700; letter-spacing: 0; position: relative;
}

/* ── Shared card ── */
.tcgPage .card { background: var(--dark-blue); border: 1px solid var(--border); border-radius: 24px; padding: 26px 24px; box-shadow: 0 8px 24px rgba(24, 28, 39, 0.04); }
.tcgPage .cardHeading {
  font-family: var(--sans); font-size: 1rem; font-weight: 700;
  letter-spacing: 0; text-transform: none; color: var(--text);
  margin-bottom: 18px; display: flex; align-items: center; gap: 10px;
}
.tcgPage .dot { width: 10px; height: 10px; border-radius: 999px; background: var(--yellow); display: inline-block; box-shadow: 0 0 0 6px rgba(255,234,0,0.14); }

/* ── Pipeline ── */
.tcgPage .pipelineCard { animation: fadeUp 0.5s 0.2s ease both; }
.tcgPage .pipelineList { display: flex; flex-direction: column; gap: 6px; }
.tcgPage .step {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: 14px; border: 1px solid transparent;
  transition: all 0.3s ease; background: #ffffff;
}
.tcgPage .stepDone { background: #fffef1; border-color: #f4edb0; }
.tcgPage .stepActive { background: #fffef1; border-color: #f4edb0; box-shadow: 0 10px 22px rgba(255,234,0,0.14); }
.tcgPage .stepLive {
  border-color: #f0e680;
  box-shadow: 0 12px 24px rgba(255,234,0,0.16), inset 0 0 0 1px rgba(255,234,0,0.2);
  animation: pipelinePulse 1.25s ease-in-out infinite;
}
.tcgPage .stepIcon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 8px; font-family: var(--mono);
  font-size: 11px; font-weight: 700; flex-shrink: 0;
  background: var(--dark-blue-hi); color: var(--muted);
  border: 1px solid var(--border); transition: all 0.3s ease;
}
.tcgPage .stepIconDone   { background: var(--yellow); color: var(--black); border-color: var(--yellow); }
.tcgPage .stepIconActive { background: var(--yellow); color: var(--black); border-color: var(--yellow); }
.tcgPage .stepIconLive {
  animation: blink 1s ease-in-out infinite;
  box-shadow: 0 0 16px var(--yellow-glow-hi);
}
.tcgPage .stepLabel { font-size: 0.87rem; color: var(--muted); flex: 1; transition: color 0.3s ease; }
.tcgPage .stepLabelActive { color: var(--text); }
.tcgPage .activePill {
  font-family: var(--sans); font-size: 0.72rem; font-weight: 700;
  letter-spacing: 0; text-transform: none; color: var(--black);
  background: var(--yellow); padding: 6px 12px; border-radius: 12px;
  animation: blink 1.2s ease-in-out infinite;
}

/* ── Agent status ── */
.tcgPage .agentCard { animation: fadeUp 0.5s 0.3s ease both; }
.tcgPage .agentList { display: flex; flex-direction: column; gap: 10px; }
.tcgPage .agent {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  border-radius: 16px; border: 1px solid transparent;
  background: #ffffff; transition: all 0.4s ease;
}
.tcgPage .agentRunning {
  background: #fffef1; border-color: #f0e680;
  box-shadow: 0 12px 24px rgba(255,234,0,0.14), inset 0 0 0 1px rgba(255,234,0,0.18);
  animation: agentPulse 2s ease-in-out infinite;
}
.tcgPage .agentDone { background: #fffef7; border-color: #f5f0bf; }
.tcgPage .agentLiveFocus {
  border-color: #f0e680;
  box-shadow: 0 14px 26px rgba(255,234,0,0.16), inset 0 0 0 1px rgba(255,234,0,0.18);
}
.tcgPage .agentIconWrap {
  position: relative; width: 38px; height: 38px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  border-radius: 10px; background: var(--dark-blue-hi);
  border: 1px solid var(--border); transition: all 0.4s ease;
}
.tcgPage .agentIconWrapRunning { background: #fff9cc; border-color: #f0e680; }
.tcgPage .agentIconWrapDone    { background: #fffceb; border-color: #f5f0bf; }
.tcgPage .agentIcon { font-family: var(--mono); font-size: 0.7rem; font-weight: 700; color: var(--muted); transition: color 0.3s ease; z-index: 1; }
.tcgPage .agentIconActive { color: #7f6b00; }
.tcgPage .ring { position: absolute; inset: -4px; border-radius: 13px; border: 2px solid var(--yellow); animation: ringPulse 1.4s ease-out infinite; }
.tcgPage .agentInfo { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.tcgPage .agentName { font-size: 0.88rem; font-weight: 600; color: var(--muted); transition: color 0.3s ease; }
.tcgPage .agentNameActive { color: var(--text); }
.tcgPage .agentRole { font-family: var(--mono); font-size: 0.68rem; color: var(--muted); letter-spacing: 0.04em; transition: color 0.3s ease; }
.tcgPage .agentRoleRunning { color: #948200; }
.tcgPage .agentRoleDone    { color: var(--muted); }
.tcgPage .pill {
  font-family: var(--sans); font-size: 0.72rem; font-weight: 700;
  letter-spacing: 0; text-transform: none; padding: 6px 12px;
  border-radius: 12px; border: 1px solid var(--border);
  color: var(--muted); background: var(--dark-blue-hi); flex-shrink: 0;
}
.tcgPage .pillRunning { color: var(--black); background: var(--yellow); border-color: var(--yellow); animation: blink 1.2s ease-in-out infinite; }
.tcgPage .pillDone    { color: #7f6b00; background: #fff9cc; border-color: #f0e680; }

/* ── Console log ── */
.tcgPage .consoleCard {
  background: var(--dark-blue); border: 1px solid var(--border);
  border-radius: 24px; padding: 22px 20px; min-height: 320px;
  max-height: 380px; overflow-y: auto; font-family: var(--mono);
  animation: fadeUp 0.5s 0.4s ease both;
  box-shadow: 0 8px 24px rgba(24, 28, 39, 0.04);
}
.tcgPage .consoleHeading {
  font-family: var(--mono); font-size: 0.78rem; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted);
  margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  position: sticky; top: 0; background: var(--dark-blue);
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.tcgPage .consoleDot { width: 10px; height: 10px; border-radius: 999px; background: var(--yellow); display: inline-block; animation: blink 2s ease-in-out infinite; box-shadow: 0 0 0 6px rgba(255,234,0,0.14); }
.tcgPage .consoleEmpty { color: var(--dark-blue-hi); font-size: 0.82rem; padding: 8px 0; animation: blink 1.8s ease-in-out infinite; }
.tcgPage .consoleLine {
  display: flex; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.78rem; color: var(--muted); line-height: 1.5;
  animation: slideIn 0.25s ease both;
}
.tcgPage .consoleLine:last-child { border-bottom: none; }
.tcgPage .consolePrompt { color: var(--yellow); flex-shrink: 0; user-select: none; }

/* ── Result card ── */
.tcgPage .resultCard {
  margin-top: 28px; background: var(--dark-blue);
  border: 1px solid var(--border); border-radius: 24px;
  overflow: hidden; box-shadow: 0 10px 28px rgba(24, 28, 39, 0.05);
  animation: fadeUp 0.5s ease both;
}
.tcgPage .resultHeader { padding: 24px 24px 0; }
.tcgPage .successBadge {
  display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px;
  border-radius: 12px; background: #fff9cc;
  border: 1px solid #f0e680; color: #7f6b00;
  font-family: var(--sans); font-size: 0.82rem; font-weight: 700;
  letter-spacing: 0.06em; margin-bottom: 12px;
}
.tcgPage .warningBadge {
  display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px;
  border-radius: 12px; background: #fff9cc;
  border: 1px solid #f0e680; color: #7f6b00;
  font-family: var(--sans); font-size: 0.82rem; font-weight: 700;
  letter-spacing: 0.06em; margin-bottom: 12px;
}
.tcgPage .resultMeta { font-size: 0.88rem; color: var(--muted); margin-bottom: 6px; }
.tcgPage .resultCount { font-size: 0.9rem; color: var(--text); }
.tcgPage .resultCountNum { font-family: var(--mono); font-size: 1.6rem; font-weight: 700; color: var(--yellow); margin-right: 6px; }
.tcgPage .resultActions { display: flex; flex-wrap: wrap; gap: 10px; padding: 16px 24px 20px; border-bottom: 1px solid var(--border); }
.tcgPage .btn {
  display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px;
  border-radius: 14px; font-family: var(--sans); font-size: 0.88rem;
  font-weight: 700; letter-spacing: 0.05em; cursor: pointer;
  border: 1px solid transparent; transition: all 0.2s ease; text-decoration: none;
  background: none;
}
.tcgPage .btnPrimary   { background: var(--yellow); color: var(--black); border-color: var(--yellow); }
.tcgPage .btnPrimary:hover { background: var(--yellow-dim); border-color: var(--yellow-dim); box-shadow: 0 10px 24px rgba(255,234,0,0.22); }
.tcgPage .btnSecondary { background: #ffffff; color: var(--text); border-color: var(--border); }
.tcgPage .btnSecondary:hover { background: var(--dark-blue-hi); border-color: var(--border-hi); }
.tcgPage .btnGhost     { background: var(--dark-blue-hi); color: var(--text); border-color: var(--border); }
.tcgPage .btnGhost:hover { border-color: var(--border-hi); color: var(--text); background: #ededf2; }
.tcgPage .tableSection { border-top: 1px solid var(--border); animation: fadeDown 0.3s ease both; }
.tcgPage .previewBlock { border-top: 1px solid var(--border); padding: 20px 24px 24px; }
.tcgPage .previewTitle { margin-bottom: 10px; color: var(--text); font-family: var(--sans); font-size: 0.86rem; font-weight: 700; letter-spacing: 0; }
.tcgPage .previewText {
  margin: 0; max-height: 340px; overflow: auto; padding: 16px;
  border-radius: 12px; background: var(--dark-blue-hi); border: 1px solid var(--border);
  color: var(--text); font-family: var(--mono); font-size: 0.8rem;
  line-height: 1.55; white-space: pre-wrap; word-break: break-word;
}

/* ── Test case table ── */
.tcgPage .tcWrap { display: flex; flex-direction: column; }
.tcgPage .tcToolbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 10px; }
.tcgPage .tcMeta { display: flex; align-items: baseline; gap: 6px; }
.tcgPage .tcCount      { font-family: var(--sans); font-size: 1.4rem; font-weight: 800; color: var(--text); }
.tcgPage .tcCountLabel { font-size: 0.82rem; color: var(--muted); }
.tcgPage .tcFiltered   { font-size: 0.75rem; color: var(--muted); font-style: italic; }
.tcgPage .tcSearchWrap { position: relative; display: flex; align-items: center; }
.tcgPage .tcSearchIcon { position: absolute; left: 10px; color: var(--muted); pointer-events: none; }
.tcgPage .tcSearch {
  background: var(--dark-blue-hi); border: 1px solid var(--border); border-radius: 8px;
  padding: 7px 12px 7px 30px; color: var(--text); font-family: var(--mono);
  font-size: 0.78rem; width: 220px; transition: border-color 0.2s;
}
.tcgPage .tcSearch:focus { outline: none; border-color: var(--yellow); }
.tcgPage .tcSearch::placeholder { color: var(--muted); }
.tcgPage .tcTableWrap { overflow-x: auto; }
.tcgPage .tcTable { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.tcgPage .tcTable thead tr { border-bottom: 1px solid var(--border-hi); }
.tcgPage .tcTable th { padding: 10px 14px; text-align: left; font-family: var(--sans); font-size: 0.75rem; font-weight: 700; letter-spacing: 0; text-transform: none; color: var(--text); white-space: nowrap; background: var(--dark-blue-hi); }
.tcgPage .tcTable tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s ease; }
.tcgPage .tcTable tbody tr:hover { background: #fbfbfd; }
.tcgPage .tcTable tbody tr:last-child { border-bottom: none; }
.tcgPage .tcTable td { padding: 11px 14px; color: var(--text); vertical-align: top; line-height: 1.5; max-width: 220px; }
.tcgPage .tcEmpty { text-align: center; color: var(--muted); padding: 32px !important; font-family: var(--mono); font-size: 0.8rem; }
.tcgPage .tcPagination { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--border); }
.tcgPage .pgBtn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: var(--dark-blue-hi); color: var(--text); font-family: var(--mono); font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; }
.tcgPage .pgBtn:hover:not(:disabled) { border-color: var(--yellow); color: var(--yellow); }
.tcgPage .pgBtn:disabled { opacity: 0.3; cursor: not-allowed; }
.tcgPage .pgInfo { font-family: var(--mono); font-size: 0.78rem; color: var(--muted); padding: 0 6px; }
.tcgPage .pgInfo strong { color: var(--yellow); }

/* ── Keyframes ── */
@keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes spin     { to{transform:rotate(360deg)} }
@keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes slideIn  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
@keyframes agentPulse {
  0%,100%{box-shadow:0 10px 20px rgba(255,234,0,0.12),inset 0 0 0 1px rgba(255,234,0,0.14)}
  50%    {box-shadow:0 14px 28px rgba(255,234,0,0.18),inset 0 0 0 1px rgba(255,234,0,0.2)}
}
@keyframes pipelinePulse {
  0%,100%{transform:translateY(0);box-shadow:0 10px 18px rgba(255,234,0,0.12),inset 0 0 0 1px rgba(255,234,0,0.14)}
  50%{transform:translateY(-1px);box-shadow:0 14px 24px rgba(255,234,0,0.18),inset 0 0 0 1px rgba(255,234,0,0.2)}
}
@keyframes ringPulse { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(1.5);opacity:0} }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const STAGES = [
  "SRS file received. Preparing upload payload.",
  "Extracting text from the uploaded document.",
  "Business Analyst and QA Engineer are generating scenarios.",
  "QA Reviewer and Finalizer are shaping the final output.",
];

const PIPELINE_STEPS = [
  "Uploading SRS",
  "Extracting Requirements",
  "Generating Test Cases",
  "Reviewing",
  "Finalizing Output",
];

const AGENTS = [
  { label: "Business Analyst", role: "Requirements Extraction", icon: "BA", startStep: 1, doneStep: 2 },
  { label: "QA Engineer", role: "Test Case Generation", icon: "QA", startStep: 2, doneStep: 3 },
  { label: "QA Reviewer", role: "Coverage & Gap Analysis", icon: "QR", startStep: 3, doneStep: 4 },
  { label: "Finalizer", role: "Output Structuring", icon: "FN", startStep: 3, doneStep: 4 },
] as const;

const COLS: { key: keyof TestCase; label: string; width: string }[] = [
  { key: "Test case No.", label: "#", width: "60px" },
  { key: "Function List/Test case description", label: "Description", width: "200px" },
  { key: "Condition/Feature to be tested", label: "Condition", width: "200px" },
  { key: "steps", label: "Steps", width: "180px" },
  { key: "data set / values", label: "Data", width: "140px" },
  { key: "expected_result", label: "Expected", width: "180px" },
];

const PAGE_SIZE = 8;

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: StyleInjector
───────────────────────────────────────────────────────────────────────────── */
function StyleInjector() {
  useEffect(() => {
    const id = "srs-generator-styles";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: FileUpload
───────────────────────────────────────────────────────────────────────────── */
function FileUpload({
  onUpload,
  isProcessing,
}: {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}) {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isProcessing) return;
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  const handleClick = () => {
    if (!isProcessing) {
      document.getElementById("file-input")?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`zone${isProcessing ? " zoneBusy" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Upload SRS document"
    >
      <input
        id="file-input"
        type="file"
        accept=".pdf,.txt"
        hidden
        disabled={isProcessing}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.currentTarget.value = "";
        }}
      />
      <div className="zoneIconWrap">
        {isProcessing ? (
          <span className="spinner" />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <h2 className="zoneHeading">
        {isProcessing ? "Processing your document..." : "Upload SRS Document"}
      </h2>
      <p className="zoneHint">
        {isProcessing
          ? "Agents are working. This may take a minute."
          : "Drag & drop a PDF or TXT, or click to browse"}
      </p>
      {!isProcessing && <span className="zoneBadge">PDF / TXT</span>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: Pipeline
───────────────────────────────────────────────────────────────────────────── */
function Pipeline({
  activeStep,
  status,
}: {
  activeStep: number;
  status: AppStatus;
}) {
  return (
    <div className="card pipelineCard">
      <h3 className="cardHeading">
        <span className="dot" /> Processing Pipeline
      </h3>
      <div className="pipelineList">
        {PIPELINE_STEPS.map((label, index) => {
          const hasStarted = status !== "idle";
          const live =
            hasStarted &&
            status === "processing" &&
            label === "Generating Test Cases" &&
            activeStep >= 2;
          const done = hasStarted && index < activeStep && !live;
          const active = hasStarted && index === activeStep && !live;

          return (
            <div
              key={label}
              className={`step${done ? " stepDone" : ""}${active || live ? " stepActive" : ""}${live ? " stepLive" : ""}`}
            >
              <span
                className={`stepIcon${done ? " stepIconDone" : ""}${active || live ? " stepIconActive" : ""}${live ? " stepIconLive" : ""}`}
              >
                {done ? "OK" : active ? ">" : String(index + 1).padStart(2, "0")}
              </span>
              <span className={`stepLabel${active || done || live ? " stepLabelActive" : ""}`}>{label}</span>
              {(active || live) && <span className="activePill">{live ? "Live" : "Running"}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: AgentStatus
───────────────────────────────────────────────────────────────────────────── */
function getAgentState(
  agent: (typeof AGENTS)[number],
  step: number,
  appStatus: AppStatus
): "pending" | "running" | "done" {
  if (agent.label === "QA Engineer" && appStatus === "processing" && step >= agent.startStep) {
    return "running";
  }

  if (appStatus === "done" && step >= agent.doneStep) return "done";

  if (appStatus === "processing" && step >= agent.startStep) {
    return step >= agent.doneStep ? "done" : "running";
  }

  if (appStatus === "error" && step >= agent.startStep) {
    return step >= agent.doneStep ? "done" : "running";
  }

  return "pending";
}

function AgentStatus({
  activeStep,
  status,
}: {
  activeStep: number;
  status: AppStatus;
}) {
  return (
    <div className="card agentCard">
      <h3 className="cardHeading">
        <span className="dot" /> Agent Status
      </h3>
      <div className="agentList">
        {AGENTS.map((agent) => {
          const state = getAgentState(agent, activeStep, status);
          const isActive = state === "running" || state === "done";
          const isLiveFocus = agent.label === "QA Engineer" && state === "running";

          return (
            <div
              key={agent.label}
              className={`agent${state === "running" ? " agentRunning" : ""}${state === "done" ? " agentDone" : ""}${isLiveFocus ? " agentLiveFocus" : ""}`}
            >
              <div className={`agentIconWrap${state === "running" ? " agentIconWrapRunning" : ""}${state === "done" ? " agentIconWrapDone" : ""}`}>
                <span className={`agentIcon${isActive ? " agentIconActive" : ""}`}>{agent.icon}</span>
                {state === "running" && <span className="ring" />}
              </div>
              <div className="agentInfo">
                <span className={`agentName${isActive ? " agentNameActive" : ""}`}>{agent.label}</span>
                <span className={`agentRole${state === "running" ? " agentRoleRunning" : ""}${state === "done" ? " agentRoleDone" : ""}`}>
                  {agent.role}
                </span>
              </div>
              <span className={`pill${state === "running" ? " pillRunning" : ""}${state === "done" ? " pillDone" : ""}`}>
                {state === "done" ? "Done" : state === "running" ? "Live" : "Wait"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: ConsoleLog
───────────────────────────────────────────────────────────────────────────── */
function ConsoleLog({ logs }: { logs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="consoleCard" ref={ref}>
      <h3 className="consoleHeading">
        <span className="consoleDot" /> Processing Log
      </h3>
      {logs.length === 0 ? (
        <div className="consoleEmpty" aria-hidden="true" />
      ) : (
        logs.map((log, i) => (
          <div key={`${log}-${i}`} className="consoleLine">
            <span className="consolePrompt">{">"}</span>
            <span>{log}</span>
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: TestCaseTable
───────────────────────────────────────────────────────────────────────────── */
function TestCaseTable({ cases }: { cases: TestCase[] }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = cases.filter((tc) =>
    Object.values(tc).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <div className="tcWrap">
      <div className="tcToolbar">
        <div className="tcMeta">
          <span className="tcCount">{filtered.length}</span>
          <span className="tcCountLabel">test cases</span>
          {search && <span className="tcFiltered">(filtered)</span>}
        </div>

        <div className="tcSearchWrap">
          <svg
            className="tcSearchIcon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="tcSearch"
            placeholder="Filter test cases..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tcTableWrap">
        <table className="tcTable">
          <thead>
            <tr>
              {COLS.map((col) => (
                <th key={col.key} style={{ minWidth: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="tcEmpty">
                  No matching test cases.
                </td>
              </tr>
            ) : (
              slice.map((tc, i) => (
                <tr key={`${tc["Test case No."]}-${i}`}>
                  {COLS.map((col) => (
                    <td key={col.key}>{tc[col.key] || "-"}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="tcPagination">
          <button className="pgBtn" onClick={() => setPage(0)} disabled={page === 0}>
            {"<<"}
          </button>
          <button className="pgBtn" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            {"<"}
          </button>
          <span className="pgInfo">
            Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            className="pgBtn"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            {">"}
          </button>
          <button
            className="pgBtn"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
          >
            {">>"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: ResultCard
───────────────────────────────────────────────────────────────────────────── */
function ResultCard({ result }: { result: ResultData }) {
  const [showTable, setShowTable] = useState(false);
  const hasPreviewTable = !!result.testCases && result.testCases.length > 0;
  const hasRawPreview = !!result.preview;

  return (
    <div className="resultCard">
      <div className="resultHeader">
        <div className={result.isPartial ? "warningBadge" : "successBadge"}>
          {result.isPartial ? "Partial Output Only" : "Processing Complete"}
        </div>
        <p className="resultMeta">{result.message}</p>
        <p className="resultCount">
          <span className="resultCountNum">{result.count}</span> test cases generated
        </p>
      </div>

      <div className="resultActions">
        {result.txtDownload && (
          <a className="btn btnSecondary" href={result.txtDownload} target="_blank" rel="noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download TXT
          </a>
        )}

        {result.excelDownload && (
          <a className="btn btnPrimary" href={result.excelDownload} target="_blank" rel="noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download Excel
          </a>
        )}

        {hasPreviewTable && (
          <button className="btn btnGhost" onClick={() => setShowTable((v) => !v)}>
            {showTable ? "Hide Preview" : "Preview Table"}
          </button>
        )}
      </div>

      {showTable && hasPreviewTable && (
        <div className="tableSection">
          <TestCaseTable cases={result.testCases ?? []} />
        </div>
      )}

      {!hasPreviewTable && hasRawPreview && (
        <div className="previewBlock">
          <div className="previewTitle">Raw Agent Output Preview</div>
          <pre className="previewText">{result.preview}</pre>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default  function TestCaseGenerator() {
  const [logs, setLogs] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const stopTimeline = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimeline = (fileName: string) => {
    stopTimeline();

    setLogs([`Selected file: ${fileName}`]);
    setStep(0);
    setStatus("processing");
    setError("");
    setResult(null);

    let index = 0;

    timerRef.current = window.setInterval(() => {
      if (index >= STAGES.length) {
        stopTimeline();
        return;
      }

      setStep(index);
      setLogs((cur) => [...cur, STAGES[index]]);
      index++;
    }, 1800);
  };

  const uploadFile = async (file: File) => {
    startTimeline(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${PY_API_BASE}/generate-testcases/`, {
        method: "POST",
        body: formData,
      });

      const raw = await response.text();

      let data: Record<string, unknown> | null = null;
      try {
        data = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const detail =
          typeof data?.detail === "string"
            ? data.detail
            : typeof data?.message === "string"
            ? data.message
            : raw || "Request failed.";
        throw new Error(detail);
      }

      if (!data) {
        throw new Error("Server returned an invalid response.");
      }

      const message = typeof data.message === "string" ? data.message : "Success";
      const txtDownloadRaw = typeof data.txt_download === "string" ? data.txt_download : "";
      const excelDownloadRaw = typeof data.excel_download === "string" ? data.excel_download : "";
      const txtDownload = withPyApiBase(txtDownloadRaw);
      const excelDownload = withPyApiBase(excelDownloadRaw);
      const testCases = Array.isArray(data.test_cases) ? (data.test_cases as TestCase[]) : [];
      const preview = typeof data.preview === "string" ? data.preview : "";
      const count = typeof data.count === "number" ? data.count : testCases.length;
      const isPartial = !excelDownload || testCases.length === 0;

      stopTimeline();

      setResult({
        count,
        message,
        txtDownload,
        excelDownload,
        testCases,
        preview,
        isPartial,
      });

      if (isPartial) {
        setStatus("error");
        setStep(4);
        setError(
          "Agent pipeline did not finish structured output. TXT output is available, but preview table or Excel generation failed."
        );
        setLogs((cur) => [
          ...cur,
          "Generation completed with errors. Structured output is incomplete.",
        ]);
        return;
      }

      setStep(4);
      setStatus("done");
      setLogs((cur) => [...cur, "Processing complete. Output files are ready to download."]);
    } catch (err: unknown) {
      stopTimeline();
      setStatus("error");
      const msg =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? `Failed to fetch. Check that Python API is running at ${PY_API_BASE} and CORS allows your frontend origin.`
          : err instanceof Error
          ? err.message
          : "Something went wrong.";
      setError(msg);
      setLogs((cur) => [...cur, `Generation failed: ${msg}`]);
    }
  };

  return (
    <>
      <StyleInjector />
      <section className="tcgPage">
      <main className="shell">
        <div className="hero">
          <span className="eyebrow">AI QA Automation</span>
          <h1 className="title">
             <span className="arrow"></span>Generate Test Cases / Scenarios
          </h1>
          <p className="subcopy">
            Upload an SRS document, watch the multi-agent pipeline process it in real
            time, then preview and download your structured test cases as TXT or Excel.
          </p>
        </div>

        <FileUpload onUpload={uploadFile} isProcessing={status === "processing"} />

        <div className="grid">
          <Pipeline activeStep={step} status={status} />
          <AgentStatus activeStep={step} status={status} />
          <ConsoleLog logs={logs} />
        </div>

        {error && (
          <div className="errorCard">
            <span className="errorIcon">!</span>
            <span>{error}</span>
          </div>
        )}

        {result && <ResultCard result={result} />}
      </main>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   APP MOUNT
───────────────────────────────────────────────────────────────────────────── */
const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <TestCaseGenerator />
    </StrictMode>
  );
}
