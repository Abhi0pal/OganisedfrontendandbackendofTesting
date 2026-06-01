'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  MarkerType,
  BackgroundVariant,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ProcessNode from './nodes/ProcessNode';
import StepConfigPanel from './StepConfigPanel';
import ConditionRuleEditor from './ConditionRuleEditor';
import apiClient from '@/lib/api-client';
import { toast } from '@/lib/sonner';

const nodeTypes = {
  processNode: ProcessNode,
};

export default function WorkflowCanvas({ definition }: { definition: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [saving, setSaving] = useState(false);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [formTypes, setFormTypes] = useState<any[]>([]);
  const reactFlowWrapper = useRef(null);

  // Step Config Panel state
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Condition Editor state
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [conditionOpen, setConditionOpen] = useState(false);

  // Fetch roles and form types on mount
  useEffect(() => {
    Promise.all([
      apiClient.get('/workflow-builder/roles'),
      apiClient.get('/workflow-builder/form-types')
    ]).then(([resRoles, resForms]) => {
      setRoles(resRoles.data || []);
      setFormTypes(resForms.data || []);
    }).catch(() => {});
  }, []);

  // Initialize from DB
  useEffect(() => {
    if (definition?.processes) {
      const initialNodes = definition.processes.map((p: any) => {
        const nodeId = p.processCode || String(p.id);
        return {
          id: nodeId,
          type: 'processNode',
          position: { x: p.positionX || 0, y: p.positionY || 0 },
          data: {
            ...p,
            label: p.name,
            roleName: p.roleName || p.role?.name,
          },
        };
      });
      setNodes(initialNodes);

      const initialEdges: Edge[] = [];
      definition.processes.forEach((p: any) => {
        const sourceId = p.processCode || String(p.id);
        
        // Transitions are now mapped in the backend to a compatibility shape
        const transitions = p.outgoingTransitions || [];
        
        transitions.forEach((t: any) => {
          const targetId = t.targetProcessCode || String(t.targetProcessId);
          initialEdges.push({
            id: `e-${sourceId}-${targetId}-${t.id || Math.random()}`,
            source: sourceId,
            sourceHandle: t.actionCode,
            target: targetId,
            label: t.label || t.conditionLabel || undefined,
            animated: !!t.conditionJson,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            data: {
              conditionJson: t.conditionJson,
              conditionLabel: t.conditionLabel,
              priority: t.priority,
            },
          });
        });
      });
      setEdges(initialEdges);
    }
  }, [definition, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: false,
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
    setConfigOpen(true);
  }, []);

  const onEdgeDoubleClick = useCallback((_: any, edge: Edge) => {
    setSelectedEdge(edge);
    setConditionOpen(true);
  }, []);

  const handleNodeConfigSave = (updatedData: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          return { ...n, data: { ...n.data, ...updatedData } };
        }
        return n;
      }),
    );
  };

  const handleNodeDelete = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setConfigOpen(false);
    setSelectedNode(null);
  };

  const handleConditionSave = (conditionJson: any, conditionLabel: string) => {
    if (!selectedEdge) return;
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === selectedEdge.id) {
          return {
            ...e,
            label: conditionLabel || e.label,
            animated: !!conditionJson,
            data: { ...e.data, conditionJson, conditionLabel },
          };
        }
        return e;
      }),
    );
  };

  const onAddNode = () => {
    const isFirst = nodes.length === 0;
    const processCode = `P_${Date.now()}`;
    const newNode: Node = {
      id: processCode,
      type: 'processNode',
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: {
        processCode,
        stepOrder: nodes.length + 1,
        label: isFirst ? 'Applicant Submit' : `Step ${nodes.length + 1}`,
        nodeType: isFirst ? 'START' : 'STANDARD',
        assigneeType: 'ROLE',
        roleName: '',
        slaHours: 0,
        slaBreachAction: 'NONE',
        canVerifyDocument: false,
        canRevertToApplicant: false,
        actions: isFirst
          ? [{ actionCode: 'FORWARD', actionLabel: 'Submit Application' }]
          : [
              { actionCode: 'FORWARD', actionLabel: 'Forward' },
              { actionCode: 'REJECT', actionLabel: 'Reject' },
            ],
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onAddEndNode = () => {
    const processCode = `END_${Date.now()}`;
    const newNode: Node = {
      id: processCode,
      type: 'processNode',
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: {
        processCode,
        stepOrder: nodes.length + 1,
        label: 'End',
        nodeType: 'END',
        assigneeType: 'ROLE',
        roleName: '',
        slaHours: 0,
        slaBreachAction: 'NONE',
        canVerifyDocument: false,
        canRevertToApplicant: false,
        actions: [],
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/workflow-builder/save-canvas', {
        workflowDefId: definition.id,
        nodes,
        edges,
      });
      toast.success('Workflow saved successfully!');
    } catch (err: any) {
      toast.error('Failed to save workflow canvas');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishErrors([]);
      await apiClient.post(`/workflow-builder/definitions/${definition.id}/publish`);
      toast.success('Workflow published!');
      window.location.reload();
    } catch (err: any) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setPublishErrors(err.response.data.errors);
        toast.error('Workflow validation failed. Please fix the errors before publishing.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to publish');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* ─── Toolbar ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        background: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: '#333', fontSize: 15 }}>{definition?.name || 'Workflow Designer'}</span>
          {definition?.department?.name && (
            <span style={{ fontSize: 12, color: '#888' }}>• {definition.department.name}</span>
          )}
          <span style={{ fontSize: 10, fontWeight: 600, background: '#e8eaed', padding: '2px 8px', borderRadius: 4 }}>
            v{definition?.version}
          </span>
          <span className={`ey-pill ${definition?.status === 'PUBLISHED' ? 'success' : 'pending'}`} style={{ fontSize: 10 }}>
            {definition?.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
            style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
            onClick={onAddNode}
          >
            <i className="bi bi-plus-circle"></i> Add Step
          </button>
          <button
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
            style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
            onClick={onAddEndNode}
          >
            <i className="bi bi-stop-circle"></i> Add END
          </button>
          <button
            className="btn btn-sm btn-dark d-flex align-items-center gap-1"
            style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
            onClick={handleSave}
            disabled={saving}
          >
            <i className="bi bi-save"></i> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: definition?.status === 'PUBLISHED' ? '#e8f5e9' : '#2e7d32',
              color: definition?.status === 'PUBLISHED' ? '#2e7d32' : '#fff',
              border: '1px solid #2e7d32',
            }}
            onClick={handlePublish}
            disabled={definition?.status === 'PUBLISHED'}
          >
            <i className="bi bi-play-fill"></i>
            {definition?.status === 'PUBLISHED' ? 'Published' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ─── Hint Bar ─── */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(255,230,0,0.12), transparent)',
        borderBottom: '1px solid rgba(255,230,0,0.3)',
        padding: '6px 16px',
        fontSize: 11,
        color: '#777',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <i className="bi bi-info-circle" style={{ color: '#c77700' }}></i>
        <span><strong>Tip:</strong> Double-click a step to configure it. Double-click an edge to add conditions. Drag between handles to connect steps.</span>
      </div>

      {/* ─── Validation Errors ─── */}
      {publishErrors.length > 0 && (
        <div style={{ padding: '16px', background: '#fdf3f4', borderBottom: '1px solid #f5c2c7' }}>
           <h6 style={{ color: '#842029', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
             <i className="bi bi-exclamation-octagon-fill"></i> Cannot Publish Workflow
             <button className="btn btn-sm text-danger ms-auto" style={{ padding: 0 }} onClick={() => setPublishErrors([])}>
               <i className="bi bi-x-lg" style={{ fontSize: '14px' }}></i>
             </button>
           </h6>
           <ul style={{ margin: 0, paddingLeft: '24px', color: '#842029', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
             {publishErrors.map((err, i) => <li key={i}>{err}</li>)}
           </ul>
        </div>
      )}

      {/* ─── Canvas ─── */}
      <div style={{ flex: 1, width: '100%' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#ddd" />
          <Controls
            style={{
              background: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: 8,
            }}
          />
        </ReactFlow>
      </div>

      {/* Step Config Panel */}
      <StepConfigPanel
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        nodeData={selectedNode?.data}
        roles={roles}
        formTypes={formTypes}
        serviceId={definition?.serviceId || ''}
        departmentId={definition?.departmentId || 0}
        onSave={handleNodeConfigSave}
        onDelete={handleNodeDelete}
      />

      {/* Condition Rule Editor */}
      <ConditionRuleEditor
        open={conditionOpen}
        onClose={() => setConditionOpen(false)}
        edgeData={selectedEdge?.data}
        serviceId={definition?.serviceId || ''}
        departmentId={definition?.departmentId || 0}
        onSave={handleConditionSave}
      />
    </div>
  );
}
