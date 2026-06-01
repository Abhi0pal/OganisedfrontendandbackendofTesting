"use client";

/**
 * WorkflowDiagram.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in React Flow diagram for workflow_json API responses.
 *
 * Usage:
 *   import WorkflowDiagram from './WorkflowDiagram';
 *   <WorkflowDiagram workflowJson={workflowJson} />
 *
 * Install once:  npm install reactflow
 *
 * Action codes:
 *   P   → Submit
 *   I   → Draft
 *   RBI → Revert to Investor
 *   F   → Forward
 *   A   → Approve
 *   R   → Reject
 *   RB  → Revert Back
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  EdgeLabelRenderer,
  getBezierPath,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface TransitionTarget {
  next_step:    number;
  next_role_id: number;
}

export interface WorkflowStep {
  step:                       number;
  step_name:                  string;
  role_name:                  string;
  role_id?:                   number;
  sla_hours:                  number;
  sla_breach_requires_reason?: boolean;
  action_allowed_json:        string[];
  transition_map_json:        Record<string, TransitionTarget>;
  can_revert_to_investor?:    string;
  can_verify_document?:       string;
  is_delay_reason_required?:  string;
  status?:                    string;
  [key: string]: unknown;
}

export interface WorkflowJson {
  workflow_steps: WorkflowStep[];
  officer_forms?: unknown[];
  meta?: Record<string, unknown>;
}

export interface WorkflowDiagramProps {
  workflowJson: WorkflowJson | null;
  height?: number;
}

// ─── Action code → human label mapping ────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  P:   "Submit",
  I:   "Draft",
  RBI: "Revert to Investor",
  F:   "Forward",
  A:   "Approve",
  R:   "Reject",
  RB:  "Revert Back",
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action.toUpperCase()] ?? action.replaceAll("_", " ");
}

// ─── Colour helpers ────────────────────────────────────────────────────────────
const COLORS: Record<string, string> = {
  SUBMIT:     "#2563eb",  // P  → blue
  DRAFT:      "#6b7280",  // I  → gray
  FORWARD:    "#16a34a",  // F  → green
  REVERT:     "#dc2626",  // RBI / RB → red
  APPROVE:    "#0d9488",  // A  → teal
  REJECT:     "#ea580c",  // R  → orange
};

function edgeColor(action: string): string {
  const a = action.toUpperCase();
  if (a === "P")                  return COLORS.SUBMIT;
  if (a === "I")                  return COLORS.DRAFT;
  if (a === "A")                  return COLORS.APPROVE;
  if (a === "R")                  return COLORS.REJECT;
  if (a === "RBI" || a === "RB")  return COLORS.REVERT;
  if (a === "F")                  return COLORS.FORWARD;
  // Fallback fuzzy matches
  if (a.includes("REVERT") || a.includes("BACK")) return COLORS.REVERT;
  if (a.includes("SUBMIT"))                        return COLORS.SUBMIT;
  if (a.includes("DRAFT"))                         return COLORS.DRAFT;
  if (a.includes("APPROVE"))                       return COLORS.APPROVE;
  if (a.includes("REJECT"))                        return COLORS.REJECT;
  if (a.includes("FORWARD"))                       return COLORS.FORWARD;
  return COLORS.FORWARD;
}

function roleTheme(roleName: string) {
  const n = (roleName ?? "").toLowerCase();
  if (n.includes("investor"))  return { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" };
  if (n.includes("joint"))     return { bg: "#fefce8", border: "#eab308", text: "#854d0e" };
  if (n.includes("assistant")) return { bg: "#f0fdf4", border: "#22c55e", text: "#15803d" };
  if (n.includes("deputy"))    return { bg: "#fff7ed", border: "#f97316", text: "#7c2d12" };
  if (n.includes("director"))  return { bg: "#fdf4ff", border: "#a855f7", text: "#6b21a8" };
  return                              { bg: "#f8fafc", border: "#94a3b8", text: "#334155" };
}

function roleIcon(roleName: string): string {
  const n = (roleName ?? "").toLowerCase();
  if (n.includes("investor"))  return "👤";
  if (n.includes("joint"))     return "🏛️";
  if (n.includes("assistant")) return "📋";
  if (n.includes("deputy"))    return "🔍";
  if (n.includes("director"))  return "⭐";
  return "⚙️";
}

// ─── Edge: Self-loop ──────────────────────────────────────────────────────────
function SelfLoopEdge({ id, sourceX, sourceY, data }: any) {
  const color = edgeColor(data?.action ?? "");
  const r = 38;
  const d = `M ${sourceX} ${sourceY - 12}
             C ${sourceX - r * 2} ${sourceY - 90},
               ${sourceX + r * 2} ${sourceY - 90},
               ${sourceX} ${sourceY - 12}`;
  return (
    <>
      <defs>
        <marker id={`sl-${id}`} markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth={2}
        strokeDasharray="5,3" markerEnd={`url(#sl-${id})`} />
      <EdgeLabelRenderer>
        <div style={{
          position: "absolute",
          transform: `translate(-50%,-50%) translate(${sourceX}px,${sourceY - 95}px)`,
          background: "#fff", border: `1px solid ${color}`,
          borderRadius: 4, padding: "2px 8px",
          fontSize: 11, fontWeight: 600, color,
          pointerEvents: "all", whiteSpace: "nowrap",
        }} className="nodrag nopan">{data?.label}</div>
      </EdgeLabelRenderer>
    </>
  );
}

// ─── Edge: Backward revert arc (above nodes) ──────────────────────────────────
function ArcEdge({ id, sourceX, sourceY, targetX, targetY, data, style }: any) {
  const color     = edgeColor(data?.action ?? "") || (style?.stroke ?? "#dc2626");
  const arcHeight = data?.arcHeight ?? -120;
  const midX      = (sourceX + targetX) / 2;
  const d = `M ${sourceX} ${sourceY}
             C ${midX} ${sourceY + arcHeight},
               ${midX} ${targetY + arcHeight},
               ${targetX} ${targetY}`;
  return (
    <>
      <defs>
        <marker id={`arc-${id}`} markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <path d={d} fill="none" stroke={color}
        strokeWidth={style?.strokeWidth ?? 2}
        strokeDasharray={style?.strokeDasharray ?? "6,4"}
        markerEnd={`url(#arc-${id})`} />
      <EdgeLabelRenderer>
        <div style={{
          position: "absolute",
          transform: `translate(-50%,-50%) translate(${midX}px,${Math.min(sourceY, targetY) + arcHeight * 0.75}px)`,
          background: "#fff", border: `1px solid ${color}`,
          borderRadius: 4, padding: "2px 8px",
          fontSize: 11, fontWeight: 600, color,
          pointerEvents: "all", whiteSpace: "nowrap",
        }} className="nodrag nopan">{data?.label}</div>
      </EdgeLabelRenderer>
    </>
  );
}

// ─── Edge: Adjacent forward (straight bezier) ─────────────────────────────────
function ForwardEdge({ id, sourceX, sourceY, targetX, targetY, data, style }: any) {
  const color = edgeColor(data?.action ?? "") || (style?.stroke ?? "#16a34a");
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition: Position.Right,
    targetX, targetY, targetPosition: Position.Left,
  });
  return (
    <>
      <defs>
        <marker id={`fw-${id}`} markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <path d={edgePath} fill="none" stroke={color} strokeWidth={2}
        markerEnd={`url(#fw-${id})`} />
      <EdgeLabelRenderer>
        <div style={{
          position: "absolute",
          transform: `translate(-50%,-50%) translate(${(sourceX + targetX) / 2}px,${(sourceY + targetY) / 2}px)`,
          background: "#fff", border: `1px solid ${color}`,
          borderRadius: 4, padding: "2px 8px",
          fontSize: 11, fontWeight: 600, color,
          pointerEvents: "all", whiteSpace: "nowrap",
        }} className="nodrag nopan">{data?.label}</div>
      </EdgeLabelRenderer>
    </>
  );
}

// ─── Edge: Skip-forward arc (APPROVE/REJECT jumping steps, below nodes) ───────
function SkipEdge({ id, sourceX, sourceY, targetX, targetY, data, style }: any) {
  const color   = edgeColor(data?.action ?? "") || (style?.stroke ?? "#0d9488");
  const arcDrop = data?.arcDrop ?? 110;
  const midX    = (sourceX + targetX) / 2;
  const d = `M ${sourceX} ${sourceY}
             C ${midX} ${sourceY + arcDrop},
               ${midX} ${targetY + arcDrop},
               ${targetX} ${targetY}`;
  return (
    <>
      <defs>
        <marker id={`sk-${id}`} markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <path d={d} fill="none" stroke={color}
        strokeWidth={style?.strokeWidth ?? 2}
        strokeDasharray={style?.strokeDasharray ?? "0"}
        markerEnd={`url(#sk-${id})`} />
      <EdgeLabelRenderer>
        <div style={{
          position: "absolute",
          transform: `translate(-50%,-50%) translate(${midX}px,${Math.max(sourceY, targetY) + arcDrop * 0.6}px)`,
          background: "#fff", border: `1px solid ${color}`,
          borderRadius: 4, padding: "2px 8px",
          fontSize: 11, fontWeight: 600, color,
          pointerEvents: "all", whiteSpace: "nowrap",
        }} className="nodrag nopan">{data?.label}</div>
      </EdgeLabelRenderer>
    </>
  );
}

const EDGE_TYPES = { selfLoop: SelfLoopEdge, arc: ArcEdge, forward: ForwardEdge, skip: SkipEdge };

// ─── Build nodes ───────────────────────────────────────────────────────────────
const NODE_W = 210;
const GAP_X  = 130;
const ROW_Y  = 220;

// Check whether any step has a terminal transition (next_step === 0)
function hasTerminalTransitions(steps: WorkflowStep[]): boolean {
  return steps.some(s =>
    Object.values(s.transition_map_json ?? {}).some(t => t.next_step === 0)
  );
}

function buildNodes(steps: WorkflowStep[]): Node[] {
  const nodes: Node[] = steps.map((step, i) => {
    const theme  = roleTheme(step.role_name);
    // A step is "final" only when ALL its transitions loop back to itself (kept for legacy; End node handles step 0 case)
    const isLast = false;

    return {
      id:       String(step.step),
      position: { x: i * (NODE_W + GAP_X), y: ROW_Y },
      data: {
        label: (
          <div style={{ fontFamily: 'system-ui, sans-serif', userSelect: "none" }}>
            <Handle type="target" position={Position.Left}   id="left"    style={{ background: "#2563eb" }} />
            <Handle type="source" position={Position.Right}  id="right"   style={{ background: "#16a34a" }} />
            <Handle type="source" position={Position.Top}    id="top-src" style={{ background: "#dc2626" }} />
            <Handle type="target" position={Position.Top}    id="top-tgt" style={{ background: "#dc2626", left: "60%" }} />
            <Handle type="source" position={Position.Bottom} id="bot-src" style={{ background: "#0d9488" }} />
            <Handle type="target" position={Position.Bottom} id="bot-tgt" style={{ background: "#0d9488", left: "40%" }} />

            {/* Step number circle */}
            <div style={{
              position: "absolute", top: -10, left: -10,
              background: theme.border, color: "#fff",
              borderRadius: "50%", width: 22, height: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800,
            }}>{step.step}</div>

            {/* Colour accent bar */}
            <div style={{ height: 4, background: theme.border, borderRadius: "10px 10px 0 0", margin: "-12px -16px 10px" }} />

            {/* Step name */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, marginBottom: 5 }}>
              {step.step_name}
            </div>

            {/* Role badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: theme.bg, border: `1px solid ${theme.border}`,
              borderRadius: 6, padding: "2px 8px",
              fontSize: 11, color: theme.text, fontWeight: 600, marginBottom: 6,
            }}>
              {roleIcon(step.role_name)} {step.role_name}
            </div>

            {/* SLA */}
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6 }}>
              ⏱ SLA: {step.sla_hours > 0 ? `${step.sla_hours}h` : "None"}
              {step.sla_breach_requires_reason ? " ⚠️" : ""}
            </div>

            {/* Allowed actions as chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
              {(step.action_allowed_json ?? []).map((code) => {
                const color = edgeColor(code);
                return (
                  <span key={code} style={{
                    background: color + "18",
                    border: `1px solid ${color}60`,
                    borderRadius: 4, padding: "1px 5px",
                    fontSize: 10, color, fontWeight: 700,
                  }}>
                    {getActionLabel(code)}
                  </span>
                );
              })}
            </div>

            {/* Feature chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {step.can_verify_document === "Y" && (
                <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 4, padding: "1px 6px", fontSize: 10, color: "#1d4ed8", fontWeight: 600 }}>📎 Verify</span>
              )}
              {step.can_revert_to_investor === "Y" && (
                <span style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 4, padding: "1px 6px", fontSize: 10, color: "#854d0e", fontWeight: 600 }}>↩ Revert to Inv.</span>
              )}
              {isLast && (
                <span style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 4, padding: "1px 6px", fontSize: 10, color: "#15803d", fontWeight: 600 }}>🏁 Final</span>
              )}
            </div>
          </div>
        ),
      },
      style: {
        padding: "12px 16px", borderRadius: "14px",
        border: `2px solid ${theme.border}`,
        background: "linear-gradient(135deg,#f8faff,#ffffff)",
        minWidth: NODE_W,
        boxShadow: "0 4px 14px rgba(99,102,241,0.10)",
      },
    };
  });

  // Add a terminal "End" node if any transition targets step 0
  if (hasTerminalTransitions(steps)) {
    nodes.push({
      id: "0",
      position: { x: steps.length * (NODE_W + GAP_X), y: ROW_Y + 40 },
      data: {
        label: (
          <div style={{ fontFamily: "system-ui, sans-serif", userSelect: "none", textAlign: "center" }}>
            <Handle type="target" position={Position.Left} id="left"    style={{ background: "#94a3b8" }} />
            <Handle type="target" position={Position.Top}  id="top-tgt" style={{ background: "#94a3b8" }} />
            <div style={{ fontSize: 22, marginBottom: 4 }}>🏁</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Investor View </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Workflow complete</div>
          </div>
        ),
      },
      style: {
        padding: "12px 20px", borderRadius: "14px",
        border: "2px solid #94a3b8",
        background: "linear-gradient(135deg,#f8faff,#ffffff)",
        minWidth: 120, textAlign: "center" as const,
        boxShadow: "0 4px 14px rgba(99,102,241,0.08)",
      },
    });
  }

  return nodes;
}

// ─── Build edges ───────────────────────────────────────────────────────────────
function buildEdges(steps: WorkflowStep[]): Edge[] {
  const edges: Edge[] = [];
  const idxOf: Record<number, number> = {};
  steps.forEach((s, i) => { idxOf[s.step] = i; });

  let topLane = 0;
  let skipLane = 0;
  const ARC_BASE = 100, ARC_STEP = 70, SKIP_BASE = 110, SKIP_STEP = 80;

  steps.forEach((step) => {
    const srcIdx = idxOf[step.step];
    Object.entries(step.transition_map_json ?? {}).forEach(([action, value]) => {
      const tgtStep = value.next_step;
      const tgtIdx  = idxOf[tgtStep];
      const label   = getActionLabel(action);
      const color   = edgeColor(action);

      // Self-loop
      if (tgtStep === step.step) {
        edges.push({ id: `${step.step}-${action}`, source: String(step.step), target: String(tgtStep), type: "selfLoop", data: { label, action } });
        return;
      }

      // Terminal transition: next_step === 0 means workflow ends (Approve / Reject)
      // tgtIdx will be undefined → NaN, so we must handle this before arithmetic
      if (tgtStep === 0 || tgtIdx === undefined) {
        const arcDrop = SKIP_BASE + skipLane++ * SKIP_STEP;
        edges.push({
          id: `${step.step}-${action}`,
          source: String(step.step),
          target: "0",
          type: "skip",
          sourceHandle: "bot-src",
          targetHandle: "left",
          data: { label, action, arcDrop },
          style: { stroke: color, strokeWidth: 2 },
          animated: true,
        });
        return;
      }

      const stepGap = tgtIdx - srcIdx;
      if (stepGap > 0) {
        if (stepGap === 1) {
          edges.push({
            id: `${step.step}-${action}`, source: String(step.step), target: String(tgtStep),
            type: "forward", sourceHandle: "right", targetHandle: "left",
            data: { label, action }, style: { stroke: color }, animated: true,
          });
        } else {
          const arcDrop = SKIP_BASE + skipLane++ * SKIP_STEP;
          edges.push({
            id: `${step.step}-${action}`, source: String(step.step), target: String(tgtStep),
            type: "skip", sourceHandle: "bot-src", targetHandle: "bot-tgt",
            data: { label, action, arcDrop }, style: { stroke: color, strokeWidth: 2 }, animated: true,
          });
        }
      } else {
        const arcHeight = -(ARC_BASE + topLane++ * ARC_STEP);
        edges.push({
          id: `${step.step}-${action}`, source: String(step.step), target: String(tgtStep),
          type: "arc", sourceHandle: "top-src", targetHandle: "top-tgt",
          data: { label, action, arcHeight }, style: { stroke: color, strokeWidth: 2, strokeDasharray: "6,4" }, animated: true,
        });
      }
    });
  });

  return edges;
}

// ─── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { color: COLORS.SUBMIT,  label: "Submit (P)",             dashed: false },
    { color: COLORS.DRAFT,   label: "Draft (I)",              dashed: true  },
    { color: COLORS.FORWARD, label: "Forward (F)",            dashed: false },
    { color: COLORS.APPROVE, label: "Approve (A)",            dashed: false },
    { color: COLORS.REJECT,  label: "Reject (R)",             dashed: false },
    { color: COLORS.REVERT,  label: "Revert (RBI / RB)",      dashed: true  },
  ];
  return (
    <div style={{
      marginTop: 12, padding: "10px 16px",
      background: "#f8fafc", border: "1px solid #e2e8f0",
      borderRadius: 10, display: "flex", flexWrap: "wrap", gap: "10px 22px",
    }}>
      {items.map(item => (
        <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: item.color }}>
          <span style={{ display: "inline-block", width: 28, height: 0, borderTop: `2px ${item.dashed ? "dashed" : "solid"} ${item.color}` }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function WorkflowDiagram({ workflowJson, height = 580 }: WorkflowDiagramProps) {
  const { nodes, edges } = useMemo(() => {
    if (!workflowJson?.workflow_steps?.length) return { nodes: [], edges: [] };
    return { nodes: buildNodes(workflowJson.workflow_steps), edges: buildEdges(workflowJson.workflow_steps) };
  }, [workflowJson]);

  if (!workflowJson?.workflow_steps?.length) return null;

  return (
    <div>
      <div style={{ height, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fafbfc" }}>
        <ReactFlow
          nodes={nodes} edges={edges} edgeTypes={EDGE_TYPES}
          fitView fitViewOptions={{ padding: 0.35 }} minZoom={0.2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e2e8f0" gap={18} />
          <Controls />
        </ReactFlow>
      </div>
      <Legend />
    </div>
  );
}