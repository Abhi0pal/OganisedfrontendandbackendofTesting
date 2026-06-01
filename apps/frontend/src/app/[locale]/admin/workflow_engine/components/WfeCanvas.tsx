'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  MarkerType,
  BackgroundVariant,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import WfeNode from './nodes/WfeNode';
import WfeEdge from './edges/WfeEdge';
import NodeProperties from './NodeProperties';
import apiClient from '@/lib/api-client';

const nodeTypes = {
  startNode:   (props: any) => <WfeNode {...props} />,
  taskNode:    (props: any) => <WfeNode {...props} />,
  gatewayNode: (props: any) => <WfeNode {...props} />,
  endNode:     (props: any) => <WfeNode {...props} />,
};

const edgeTypes = {
  wfeEdge: WfeEdge,
};

const EDGE_COLORS: Record<string, string> = {
  Submit:             '#555555',
  Forward:            '#1565c0',
  Approve:            '#2e7d32',
  Reject:             '#c62828',
  Revert:             '#e65100',
  'Revert to Citizen':'#7b1fa2',
  'Payment Request':  '#f57c00',
  'Document Pending': '#0277bd',
};
const edgeColor = (label: string) => EDGE_COLORS[label] || '#555555';

const makeEdgeProps = (source: string, target: string, label: string, sourceHandle: any, targetHandle: any): Edge => {
  const color = edgeColor(label);
  return {
    id: `e-${source}-${target}-${label}-${Date.now()}`,
    source,
    target,
    sourceHandle: sourceHandle ?? null,
    targetHandle: targetHandle ?? null,
    type: 'wfeEdge',
    label,
    markerEnd: { type: MarkerType.ArrowClosed, color },
    style: { stroke: color, strokeWidth: 2 },
    data: { action_label: label },
  } as Edge;
};

// Re-apply color + wfeEdge type to edges loaded from DB
const restyleEdges = (edges: any[]): Edge[] =>
  edges.map((e: any) => {
    const label = String(e.label || e.data?.action_label || '');
    const color = edgeColor(label);
    return {
      ...e,
      type: 'wfeEdge',
      label,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: 2 },
      data: { ...(e.data || {}), action_label: label },
      // strip old ReactFlow label style props — WfeEdge renders label itself
      labelStyle: undefined,
      labelBgStyle: undefined,
      labelBgPadding: undefined,
      labelBgBorderRadius: undefined,
    } as Edge;
  });

let nodeCounter = 100;
const newId = () => `N${nodeCounter++}`;

// sync counter with existing nodes so no ID clash
const syncCounter = (nodes: any[]) => {
  nodes.forEach((n) => {
    const num = parseInt(n.id?.replace(/\D/g, '') || '0', 10);
    if (num >= nodeCounter) nodeCounter = num + 1;
  });
};

interface PendingConn {
  connection: Connection;
  sourceNode: Node;
}

interface EdgeEdit {
  edge: Edge;
  sourceNode: Node | null;
}

interface Props {
  initialNodes: any[];
  initialEdges: any[];
  onChange: (data: { nodes: any[]; edges: any[] }) => void;
}

export default function WfeCanvas({ initialNodes, initialEdges, onChange }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(restyleEdges(initialEdges));
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [roles, setRoles] = useState<any[]>([]);

  // new connection popup
  const [pendingConn, setPendingConn]     = useState<PendingConn | null>(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [customLabel, setCustomLabel]       = useState('');

  // edge label edit popup
  const [edgeEdit, setEdgeEdit]             = useState<EdgeEdit | null>(null);
  const [editAction, setEditAction]         = useState('');
  const [editCustom, setEditCustom]         = useState('');

  // ref so onConnect can read latest nodes without stale closure
  const nodesRef = useRef<Node[]>(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // sync counter on load so new nodes don't clash with existing IDs
  useEffect(() => { syncCounter(initialNodes); }, []);

  useEffect(() => {
    apiClient.get('/workflow-engine/definitions/roles')
      .then((r) => setRoles(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    onChange({ nodes, edges });
  }, [nodes, edges]);

  // ── New connection: open action popup ──────────────────────────────────
  const onConnect = useCallback((connection: Connection) => {
    const src = nodesRef.current.find((n) => n.id === connection.source) || null;
    setPendingConn(src ? { connection, sourceNode: src } : null);
    setSelectedAction('');
    setCustomLabel(src?.type === 'startNode' ? 'Submit' : '');
  }, []);

  const confirmEdge = () => {
    if (!pendingConn) return;
    const isStartSrc = pendingConn.sourceNode.type === 'startNode';
    const label = selectedAction || customLabel || (isStartSrc ? 'Submit' : 'Action');
    const { source, target, sourceHandle, targetHandle } = pendingConn.connection;
    if (!source || !target) return;

    const edgeProps: Edge = makeEdgeProps(source, target, label, sourceHandle, targetHandle);

    setEdges((eds) => {
      // If same source→target edge exists with same label, update it; else append
      const idx = eds.findIndex(
        (e) => e.source === source && e.target === target && e.label === label,
      );
      if (idx >= 0) {
        const updated = [...eds];
        updated[idx] = { ...updated[idx], ...edgeProps, id: updated[idx].id };
        return updated;
      }
      return [...eds, edgeProps];
    });

    setPendingConn(null);
  };

  // ── Edge click: open label edit popup ─────────────────────────────────
  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    const src = nodesRef.current.find((n) => n.id === edge.source) || null;
    setEdgeEdit({ edge, sourceNode: src });
    setEditAction(String(edge.label || ''));
    setEditCustom(String(edge.label || ''));
  }, []);

  const confirmEdgeEdit = () => {
    if (!edgeEdit) return;
    const srcActions: any[] = edgeEdit.sourceNode?.data?.actions || [];
    const label = editAction || editCustom || String(edgeEdit.edge.label) || 'Action';
    const color = edgeColor(label);
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeEdit.edge.id
          ? {
              ...e,
              type: 'wfeEdge',
              label,
              data: { action_label: label },
              markerEnd: { type: MarkerType.ArrowClosed, color },
              style: { stroke: color, strokeWidth: 2 },
              labelStyle: undefined,
              labelBgStyle: undefined,
            }
          : e,
      ),
    );
    setEdgeEdit(null);
  };

  // ── Add node ──────────────────────────────────────────────────────────
  const addNode = (type: string) => {
    const id = newId();
    const defaults: Record<string, any> = {
      startNode:   { name: 'Start',   actions: [] },
      taskNode:    { name: 'Task',    actions: [], role_id: null, sla_hours: 0, permissions: {} },
      gatewayNode: { name: 'Gateway', actions: [] },
      endNode:     { name: 'End',     actions: [] },
    };
    setNodes((nds) => [
      ...nds,
      { id, type, position: { x: 150 + Math.random() * 300, y: 100 + Math.random() * 200 }, data: { ...defaults[type] } },
    ]);
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
    setEdgeEdit(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setEdgeEdit(null);
  }, []);

  const handleNodeUpdate = (nodeId: string, data: any) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)));
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev));
  };

  const deleteSelected = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  // ── Shared popup renderer ─────────────────────────────────────────────
  const renderActionPicker = (
    sourceNode: Node | null,
    currentLabel: string,
    selectedVal: string,
    onSelect: (v: string) => void,
    customVal: string,
    onCustom: (v: string) => void,
    onConfirm: () => void,
    onCancel: () => void,
    title: string,
    subtitle: string,
  ) => {
    const srcActions: any[] = sourceNode?.data?.actions || [];
    const isStartSrc = sourceNode?.type === 'startNode';

    return (
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
        zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: '#fff', borderRadius: 12, padding: 28, minWidth: 340,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            <i className="bi bi-pencil-square me-2" style={{ color: '#1565c0' }}></i>{title}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>{subtitle}</div>

          {isStartSrc ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Edge Label</label>
              <input
                className="form-control form-control-sm mt-1"
                value={customVal}
                onChange={(e) => onCustom(e.target.value)}
              />
            </div>
          ) : srcActions.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>
                Action select karo
              </label>
              {srcActions.map((a: any) => (
                <label key={a.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 6,
                  border: `1.5px solid ${selectedVal === a.label ? '#1565c0' : '#e0e0e0'}`,
                  borderRadius: 8, cursor: 'pointer',
                  background: selectedVal === a.label ? '#e3f2fd' : '#fff',
                }}>
                  <input
                    type="radio"
                    name="wfe-action-pick"
                    checked={selectedVal === a.label}
                    onChange={() => onSelect(a.label)}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                    background: '#f4f5f7', padding: '1px 8px', borderRadius: 10, color: '#555',
                  }}>{a.status_code}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div className="alert alert-warning" style={{ fontSize: 12, padding: '8px 12px' }}>
                Node mein pehle Actions set karo, phir edge banao.
              </div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Custom label</label>
              <input
                className="form-control form-control-sm mt-1"
                placeholder="e.g. Forward"
                value={customVal}
                onChange={(e) => onCustom(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-sm btn-outline-secondary" onClick={onCancel}>Cancel</button>
            <button
              className="btn btn-sm btn-dark"
              onClick={onConfirm}
              disabled={!isStartSrc && srcActions.length > 0 && !selectedVal}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

      {/* New connection popup */}
      {pendingConn && renderActionPicker(
        pendingConn.sourceNode,
        '',
        selectedAction, setSelectedAction,
        customLabel, setCustomLabel,
        confirmEdge, () => setPendingConn(null),
        'Set Edge Action',
        `${pendingConn.sourceNode.data?.name || pendingConn.connection.source} → ${pendingConn.connection.target}`,
      )}

      {/* Edge label edit popup */}
      {edgeEdit && renderActionPicker(
        edgeEdit.sourceNode,
        String(edgeEdit.edge.label || ''),
        editAction, setEditAction,
        editCustom, setEditCustom,
        confirmEdgeEdit, () => setEdgeEdit(null),
        'Edit Edge Label',
        `Edge: ${edgeEdit.edge.source} → ${edgeEdit.edge.target}  (current: "${edgeEdit.edge.label}")`,
      )}

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{
          padding: '8px 12px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef',
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', marginRight: 4 }}>ADD NODE:</span>
          {[
            { type: 'startNode',   label: '● Start',   color: '#2e7d32' },
            { type: 'taskNode',    label: '▬ Task',    color: '#1565c0' },
            { type: 'gatewayNode', label: '◇ Gateway', color: '#e65100' },
            { type: 'endNode',     label: '● End',     color: '#c62828' },
          ].map((t) => (
            <button key={t.type} onClick={() => addNode(t.type)} style={{
              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
              border: `1px solid ${t.color}`, background: '#fff', color: t.color, cursor: 'pointer',
            }}>
              {t.label}
            </button>
          ))}
          <span style={{ fontSize: 10, color: '#aaa', marginLeft: 8 }}>
            💡 Edge click karo label edit karne ke liye
          </span>
          {selectedNode && (
            <button onClick={deleteSelected} style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '4px 12px',
              borderRadius: 6, border: '1px solid #c62828', background: '#fff',
              color: '#c62828', cursor: 'pointer',
            }}>
              <i className="bi bi-trash me-1"></i>Delete Selected
            </button>
          )}
        </div>

        {/* React Flow */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            defaultEdgeOptions={{
              type: 'wfeEdge',
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#555', strokeWidth: 2 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#ddd" />
            <Controls />
            <MiniMap nodeColor={(n) => {
              const m: Record<string, string> = {
                startNode: '#2e7d32', taskNode: '#1565c0',
                gatewayNode: '#e65100', endNode: '#c62828',
              };
              return m[n.type || ''] || '#888';
            }} />
          </ReactFlow>
        </div>
      </div>

      {/* Node properties panel */}
      {selectedNode && (
        <NodeProperties
          node={selectedNode}
          roles={roles}
          onUpdate={handleNodeUpdate}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
