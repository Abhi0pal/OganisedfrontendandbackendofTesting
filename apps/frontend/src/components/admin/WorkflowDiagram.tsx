"use client";

/**
 * WorkflowDiagram.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * React Flow diagram for the workflow_definition JSON schema.
 *
 * Usage:
 *   import WorkflowDiagram from './WorkflowDiagram';
 *   <WorkflowDiagram workflowDefinition={workflowDefinition} />
 *
 * Install once:  npm install reactflow
 *
 * Schema shape:
 *   workflowDefinition.processes[]
 *     .processCode   — unique node ID
 *     .stepOrder     — determines left-to-right layout order
 *     .nodeType      — "START" | "STANDARD" | "END"
 *     .roleName      — badge label
 *     .actions[]
 *       .actionCode  — FORWARD | APPROVE | REJECT | REVERT | DRAFT
 *       .actionLabel — human-readable fallback
 *       .transitions[]
 *         .targetProcessCode — destination node
 *         .label             — edge label
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

export interface Transition {
  targetProcessCode: string;
  label:             string;
  priority:          number;
}

export interface Action {
  actionCode:   string;
  actionLabel:  string;
  displayOrder: number;
  transitions:  Transition[];
}

export interface Process {
  processCode:  string;
  stepOrder:    number;
  name:         string;
  nodeType:     "START" | "STANDARD" | "END";
  assigneeType: string;
  roleName?:    string;
  formTypeId?:  number;
  positionX?:   number;
  positionY?:   number;
  actions:      Action[];
}

export interface WorkflowDefinition {
  tenantId?:     number;
  departmentId?: number;
  serviceId?:    string;
  code?:         string;
  name?:         string;
  description?:  string;
  version?:      number;
  status?:       string;
  processes:     Process[];
}

export type WorkflowJson = WorkflowDefinition;

export interface WorkflowDiagramProps {
  workflowDefinition?: WorkflowDefinition | null;
  workflowJson?: WorkflowJson | null;
  height?: number;
}

// ─── Action labels ─────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  FORWARD: "Forward",
  APPROVE: "Approve",
  REJECT:  "Reject",
  REVERT:  "Revert",
  DRAFT:   "Draft",
};

function getActionLabel(actionCode: string, fallbackLabel?: string): string {
  return ACTION_LABELS[actionCode.toUpperCase()] ?? fallbackLabel ?? actionCode.replaceAll("_", " ");
}

// ─── Colors ────────────────────────────────────────────────────────────────────

const COLORS = {
  FORWARD: "#16a34a",
  APPROVE: "#0d9488",
  REJECT:  "#ea580c",
  REVERT:  "#dc2626",
  DRAFT:   "#6b7280",
} as const;

function edgeColor(actionCode: string): string {
  const a = actionCode.toUpperCase();
  if (a.includes("FORWARD") || a === "F" || a === "P")                          return COLORS.FORWARD;
  if (a.includes("APPROVE") || a === "A")                                        return COLORS.APPROVE;
  if (a.includes("REJECT")  || a === "R")                                        return COLORS.REJECT;
  if (a.includes("REVERT")  || a.includes("BACK") || a === "RB" || a === "RBI") return COLORS.REVERT;
  if (a.includes("DRAFT")   || a === "I")                                        return COLORS.DRAFT;
  return COLORS.FORWARD;
}

// ─── Node themes ───────────────────────────────────────────────────────────────

type Theme = { bg: string; border: string; text: string; accent: string };

function nodeTheme(proc: Process): Theme {
  if (proc.nodeType === "START") return { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af", accent: "#2563eb" };
  if (proc.nodeType === "END")   return { bg: "#f0fdf4", border: "#22c55e", text: "#15803d", accent: "#16a34a" };
  const r = (proc.roleName ?? "").toLowerCase();
  if (r.includes("approv"))   return { bg: "#f0fdfa", border: "#0d9488", text: "#115e59", accent: "#0d9488" };
  if (r.includes("verif"))    return { bg: "#fdf4ff", border: "#a855f7", text: "#6b21a8", accent: "#a855f7" };
  if (r.includes("director")) return { bg: "#fdf4ff", border: "#a855f7", text: "#6b21a8", accent: "#a855f7" };
  if (r.includes("deputy"))   return { bg: "#fff7ed", border: "#f97316", text: "#7c2d12", accent: "#f97316" };
  if (r.includes("citizen"))  return { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af", accent: "#2563eb" };
  return { bg: "#f8fafc", border: "#94a3b8", text: "#334155", accent: "#64748b" };
}

function nodeIcon(proc: Process): string {
  if (proc.nodeType === "START") return "🚀";
  if (proc.nodeType === "END")   return "🏁";
  const r = (proc.roleName ?? "").toLowerCase();
  if (r.includes("approv"))  return "✅";
  if (r.includes("verif"))   return "🔍";
  if (r.includes("citizen")) return "👤";
  if (r.includes("director"))return "⭐";
  return "⚙️";
}

// ─── Edge components ───────────────────────────────────────────────────────────

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
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeDasharray="5,3" markerEnd={`url(#sl-${id})`} />
      <EdgeLabelRenderer>
        <div style={{
          position: "absolute",
          transform: `translate(-50%,-50%) translate(${sourceX}px,${sourceY - 95}px)`,
          background: "#fff", border: `1px solid ${color}`,
          borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, color,
          pointerEvents: "all", whiteSpace: "nowrap",
        }} className="nodrag nopan">{data?.label}</div>
      </EdgeLabelRenderer>
    </>
  );
}

function ArcEdge({ id, sourceX, sourceY, targetX, targetY, data, style }: any) {
  const color     = edgeColor(data?.action ?? "") || (style?.stroke ?? COLORS.REVERT);
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
          borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, color,
          pointerEvents: "all", whiteSpace: "nowrap",
        }} className="nodrag nopan">{data?.label}</div>
      </EdgeLabelRenderer>
    </>
  );
}

function ForwardEdge({ id, sourceX, sourceY, targetX, targetY, data, style }: any) {
  const color = edgeColor(data?.action ?? "") || (style?.stroke ?? COLORS.FORWARD);
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
      <path d={edgePath} fill="none" stroke={color} strokeWidth={2} markerEnd={`url(#fw-${id})`} />
      <EdgeLabelRenderer>
        <div style={{
          position: "absolute",
          transform: `translate(-50%,-50%) translate(${(sourceX + targetX) / 2}px,${(sourceY + targetY) / 2}px)`,
          background: "#fff", border: `1px solid ${color}`,
          borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, color,
          pointerEvents: "all", whiteSpace: "nowrap",
        }} className="nodrag nopan">{data?.label}</div>
      </EdgeLabelRenderer>
    </>
  );
}

function SkipEdge({ id, sourceX, sourceY, targetX, targetY, data, style }: any) {
  const color   = edgeColor(data?.action ?? "") || (style?.stroke ?? COLORS.APPROVE);
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
          borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, color,
          pointerEvents: "all", whiteSpace: "nowrap",
        }} className="nodrag nopan">{data?.label}</div>
      </EdgeLabelRenderer>
    </>
  );
}

const EDGE_TYPES = { selfLoop: SelfLoopEdge, arc: ArcEdge, forward: ForwardEdge, skip: SkipEdge };

// ─── Layout constants ──────────────────────────────────────────────────────────

const NODE_W = 220;
const GAP_X  = 120;
const ROW_Y  = 200;

// ─── Build nodes ───────────────────────────────────────────────────────────────

function buildNodes(processes: Process[]): Node[] {
  const sorted = [...processes].sort((a, b) => a.stepOrder - b.stepOrder);

  return sorted.map((proc, i) => {
    const theme = nodeTheme(proc);
    const isEnd = proc.nodeType === "END";

    return {
      id:       proc.processCode,
      position: { x: i * (NODE_W + GAP_X), y: ROW_Y },
      data: {
        label: (
          <div style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}>
            <Handle type="target" position={Position.Left}   id="left"    style={{ background: theme.accent }} />
            <Handle type="source" position={Position.Right}  id="right"   style={{ background: theme.accent }} />
            <Handle type="source" position={Position.Top}    id="top-src" style={{ background: COLORS.REVERT }} />
            <Handle type="target" position={Position.Top}    id="top-tgt" style={{ background: COLORS.REVERT, left: "60%" }} />
            <Handle type="source" position={Position.Bottom} id="bot-src" style={{ background: COLORS.APPROVE }} />
            <Handle type="target" position={Position.Bottom} id="bot-tgt" style={{ background: COLORS.APPROVE, left: "40%" }} />

            {/* Step order badge */}
            <div style={{
              position: "absolute", top: -10, left: -10,
              background: theme.border, color: "#fff",
              borderRadius: "50%", width: 22, height: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800,
            }}>{proc.stepOrder}</div>

            {/* Colour accent bar */}
            <div style={{ height: 4, background: theme.border, borderRadius: "10px 10px 0 0", margin: "-12px -16px 10px" }} />

            {/* Icon + nodeType pill */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>{nodeIcon(proc)}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                background: theme.bg, border: `1px solid ${theme.border}`,
                borderRadius: 4, padding: "1px 6px", color: theme.text,
              }}>{proc.nodeType}</span>
            </div>

            {/* Process name */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.3, marginBottom: 5 }}>
              {proc.name}
            </div>

            {/* Role badge */}
            {proc.roleName && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: theme.bg, border: `1px solid ${theme.border}`,
                borderRadius: 6, padding: "2px 8px",
                fontSize: 11, color: theme.text, fontWeight: 600, marginBottom: 6,
              }}>
                {proc.roleName}
              </div>
            )}

            {/* Form type */}
            {proc.formTypeId != null && (
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6 }}>
                📄 Form type: {proc.formTypeId}
              </div>
            )}

            {/* Action chips */}
            {!isEnd && proc.actions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {proc.actions.map((action) => {
                  const c = edgeColor(action.actionCode);
                  return (
                    <span key={action.actionCode} style={{
                      background: c + "18", border: `1px solid ${c}60`,
                      borderRadius: 4, padding: "1px 5px",
                      fontSize: 10, color: c, fontWeight: 700,
                    }}>
                      {getActionLabel(action.actionCode, action.actionLabel)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ),
      },
      style: {
        padding: "12px 16px", borderRadius: "14px",
        border: `2px solid ${theme.border}`,
        background: "linear-gradient(135deg,#f8faff,#ffffff)",
        minWidth: isEnd ? 100 : NODE_W,
        boxShadow: "0 4px 14px rgba(99,102,241,0.10)",
      },
    };
  });
}

// ─── Build edges ───────────────────────────────────────────────────────────────

function buildEdges(processes: Process[]): Edge[] {
  const edges: Edge[] = [];

  const orderOf: Record<string, number> = {};
  processes.forEach((p) => {
    orderOf[p.processCode] = p.stepOrder;
  });

  let topLane = 0;
  let skipLane = 0;

  const ARC_BASE = 100,
    ARC_STEP = 70;
  const SKIP_BASE = 110,
    SKIP_STEP = 80;

  processes.forEach((proc) => {
    proc.actions.forEach((action) => {
      action.transitions.forEach((transition) => {
        const srcCode = proc.processCode;
        const tgtCode = transition.targetProcessCode;
        const srcOrder = orderOf[srcCode] ?? 0;
        const tgtOrder = orderOf[tgtCode] ?? 0;

        const actionType = action.actionCode.toUpperCase();
        const label = getActionLabel(actionType, action.actionLabel);
        const color = edgeColor(actionType);

        const edgeId = `${srcCode}__${actionType}__${tgtCode}`;

        // ─── Self-loop ─────────────────────────────────────────────
        if (tgtCode === srcCode) {
          edges.push({
            id: edgeId,
            source: srcCode,
            target: tgtCode,
            type: "selfLoop",
            data: { label, action: actionType },
          });
          return;
        }

        const stepGap = tgtOrder - srcOrder;

        // ─── Forward direction ─────────────────────────────────────
        if (stepGap > 0) {
          // Adjacent step (P2 → P3)
          if (stepGap === 1) {
            // ✅ APPROVE → straight
            if (actionType === "APPROVE") {
              edges.push({
                id: edgeId,
                source: srcCode,
                target: tgtCode,
                type: "forward",
                sourceHandle: "right",
                targetHandle: "left",
                data: { label, action: actionType },
                style: { stroke: color },
                animated: true,
              });
            }

            // 🔥 REJECT → curved DOWN (separate path)
            else if (actionType === "REJECT") {
              const arcDrop = SKIP_BASE + skipLane++ * SKIP_STEP;

              edges.push({
                id: edgeId,
                source: srcCode,
                target: tgtCode,
                type: "skip",
                sourceHandle: "bot-src",
                targetHandle: "bot-tgt",
                data: {
                  label,
                  action: actionType,
                  arcDrop,
                },
                style: {
                  stroke: color,
                  strokeWidth: 2,
                },
                animated: true,
              });
            }

            // ✅ FORWARD (and others) → straight
            else {
              edges.push({
                id: edgeId,
                source: srcCode,
                target: tgtCode,
                type: "forward",
                sourceHandle: "right",
                targetHandle: "left",
                data: { label, action: actionType },
                style: { stroke: color },
                animated: true,
              });
            }
          }

          // ─── Skip forward (P1 → P3) ─────────────────────────────
          else {
            const arcDrop = SKIP_BASE + skipLane++ * SKIP_STEP;

            edges.push({
              id: edgeId,
              source: srcCode,
              target: tgtCode,
              type: "skip",
              sourceHandle: "bot-src",
              targetHandle: "bot-tgt",
              data: {
                label,
                action: actionType,
                arcDrop,
              },
              style: { stroke: color, strokeWidth: 2 },
              animated: true,
            });
          }
        }

        // ─── Backward (Revert) ─────────────────────────────────────
        else {
          const arcHeight = -(ARC_BASE + topLane++ * ARC_STEP);

          edges.push({
            id: edgeId,
            source: srcCode,
            target: tgtCode,
            type: "arc",
            sourceHandle: "top-src",
            targetHandle: "top-tgt",
            data: {
              label,
              action: actionType,
              arcHeight,
            },
            style: {
              stroke: color,
              strokeWidth: 2,
              strokeDasharray: "6,4",
            },
            animated: true,
          });
        }
      });
    });
  });

  return edges;
}
// ─── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  const edgeItems = [
    { color: COLORS.FORWARD, label: "Forward", dashed: false },
    { color: COLORS.APPROVE, label: "Approve", dashed: false },
    { color: COLORS.REJECT,  label: "Reject",  dashed: false },
    { color: COLORS.REVERT,  label: "Revert",  dashed: true  },
    { color: COLORS.DRAFT,   label: "Draft",   dashed: true  },
  ];
  const nodeItems = [
    { label: "START",    border: "#3b82f6", bg: "#eff6ff", text: "#1e40af" },
    { label: "STANDARD", border: "#a855f7", bg: "#fdf4ff", text: "#6b21a8" },
    { label: "END",      border: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
  ];
  return (
    <div style={{
      marginTop: 12, padding: "10px 16px",
      background: "#f8fafc", border: "1px solid #e2e8f0",
      borderRadius: 10, display: "flex", flexWrap: "wrap", gap: "10px 22px", alignItems: "center",
    }}>
      {edgeItems.map(item => (
        <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: item.color }}>
          <span style={{ display: "inline-block", width: 28, height: 0, borderTop: `2px ${item.dashed ? "dashed" : "solid"} ${item.color}` }} />
          {item.label}
        </span>
      ))}
      <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
        {nodeItems.map(n => (
          <span key={n.label} style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
            background: n.bg, border: `1px solid ${n.border}`,
            borderRadius: 4, padding: "2px 8px", color: n.text,
          }}>{n.label}</span>
        ))}
      </span>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function WorkflowDiagram({ workflowDefinition: workflowDefinitionProp, workflowJson, height = 580 }: WorkflowDiagramProps) {
  const workflowDefinition = workflowDefinitionProp ?? workflowJson;
  const { nodes, edges } = useMemo(() => {
    const procs = workflowDefinition?.processes;
    if (!procs?.length) return { nodes: [], edges: [] };
    return { nodes: buildNodes(procs), edges: buildEdges(procs) };
  }, [workflowDefinition]);

  if (!workflowDefinition?.processes?.length) return null;

  return (
    <div>
      <div style={{ height, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fafbfc" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          edgeTypes={EDGE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          minZoom={0.2}
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