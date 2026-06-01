'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

const NODE_TYPES = ['START', 'STANDARD', 'FORK', 'JOIN', 'CONDITIONAL', 'END'];
const ASSIGNEE_TYPES = ['ROLE', 'USER', 'ROLE_AND_USER'];
const SLA_BREACH_ACTIONS = ['NONE', 'ESCALATE', 'NOTIFY', 'AUTO_FORWARD'];
const DEFAULT_ACTIONS = [
  { actionCode: 'FORWARD', actionLabel: 'Forward' },
  { actionCode: 'APPROVE', actionLabel: 'Approve' },
  { actionCode: 'REJECT', actionLabel: 'Reject' },
  { actionCode: 'REVERT', actionLabel: 'Revert to Applicant' },
  { actionCode: 'HOLD', actionLabel: 'Hold' },
  { actionCode: 'CHALLAN', actionLabel: 'Generate Challan' },
];

interface StepConfigPanelProps {
  open: boolean;
  onClose: () => void;
  nodeData: any;
  roles: any[];
  formTypes?: any[];
  serviceId?: string;
  departmentId?: number;
  onSave: (updatedData: any) => void;
  onDelete: () => void;
}

export default function StepConfigPanel({ open, onClose, nodeData, roles, formTypes = [], serviceId, departmentId, onSave, onDelete }: StepConfigPanelProps) {
  const [fields, setFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    label: '',
    description: '',
    nodeType: 'STANDARD',
    assigneeType: 'ROLE',
    roleId: '',
    formTypeId: '',
    slaHours: 0,
    slaBreachAction: 'NONE',
    slaBreachPercentage: '',
    canVerifyDocument: false,
    canRevertToApplicant: false,
    allowPaymentDemand: false,
    challanRules: [],
    actions: [],
  });

  useEffect(() => {
    if (open && serviceId) {
      apiClient.get('/workflow-builder/condition-fields', { params: { serviceId, departmentId } })
        .then((res: any) => setFields(res.data || []))
        .catch((err: any) => console.error(err));
    }
  }, [open, serviceId, departmentId]);

  useEffect(() => {
    if (nodeData) {
      setFormData({
        label: nodeData.label || '',
        description: nodeData.description || '',
        nodeType: nodeData.nodeType || 'STANDARD',
        assigneeType: nodeData.assigneeType || 'ROLE',
        roleId: nodeData.roleId ? String(nodeData.roleId) : '',
        formTypeId: nodeData.formTypeId ? String(nodeData.formTypeId) : '',
        slaHours: nodeData.slaHours || 0,
        slaBreachAction: nodeData.slaBreachAction || 'NONE',
        slaBreachPercentage: nodeData.slaBreachPercentage || '',
        canVerifyDocument: nodeData.canVerifyDocument || false,
        canRevertToApplicant: nodeData.canRevertToApplicant || false,
        allowPaymentDemand: nodeData.allowPaymentDemand || false,
        challanRules: nodeData.challanRules || [],
        actions: nodeData.actions || [{ actionCode: 'FORWARD', actionLabel: 'Forward' }],
      });
    }
  }, [nodeData]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const addAction = () => {
    setFormData((prev: any) => ({
      ...prev,
      actions: [...(prev.actions || []), { actionCode: '', actionLabel: '', requiresComment: false, requiresDocument: false, requiresReason: false }]
    }));
  };

  const removeAction = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      actions: prev.actions.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateAction = (index: number, key: string, value: any) => {
    setFormData((prev: any) => {
      const actions = [...prev.actions];
      actions[index] = { ...actions[index], [key]: value };
      return { ...prev, actions };
    });
  };

  const addChallanRule = () => {
    setFormData((prev: any) => ({
      ...prev,
      challanRules: [...(prev.challanRules || []), { name: '', condition: 'default', formula: '' }]
    }));
  };

  const removeChallanRule = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      challanRules: prev.challanRules.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateChallanRule = (index: number, key: string, value: any) => {
    setFormData((prev: any) => {
      const rules = [...prev.challanRules];
      rules[index] = { ...rules[index], [key]: value };
      return { ...prev, challanRules: rules };
    });
  };

  const handleSave = () => {
    const roleName = roles.find((r) => String(r.id) === formData.roleId)?.name || '';
    onSave({
      ...formData,
      roleId: formData.roleId ? Number(formData.roleId) : null,
      formTypeId: formData.formTypeId ? Number(formData.formTypeId) : null,
      roleName,
      slaHours: Number(formData.slaHours),
      slaBreachPercentage: formData.slaBreachPercentage ? Number(formData.slaBreachPercentage) : null,
    });
    onClose();
  };

  if (!open) return null;

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    color: '#555',
    marginBottom: 4,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: 440,
          background: '#fff',
          zIndex: 1000,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: '#333333',
          borderBottom: '3px solid #FFE600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '0.2px' }}>
            <i className="bi bi-gear me-2"></i>Process Configuration
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: 0.8 }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
          {/* Basic Info */}
          <div className="mb-3">
            <label style={labelStyle}>Process Name *</label>
            <input
              className="form-control"
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., JD Review Process"
              style={{ borderRadius: 7, fontSize: 13 }}
            />
          </div>
          <div className="mb-3">
            <label style={labelStyle}>Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What happens at this process?"
              rows={2}
              style={{ borderRadius: 7, fontSize: 13 }}
            />
          </div>

          <hr style={{ borderColor: '#e9ecef' }} />

          {/* Node Type & Assignment */}
          <div className="row mb-3">
            <div className="col-6">
              <label style={labelStyle}>Process Type</label>
              <select
                className="form-select"
                value={formData.nodeType}
                onChange={(e) => handleChange('nodeType', e.target.value)}
                style={{ borderRadius: 7, fontSize: 13 }}
              >
                {NODE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label style={labelStyle}>Assignment Type</label>
              <select
                className="form-select"
                value={formData.assigneeType}
                onChange={(e) => handleChange('assigneeType', e.target.value)}
                style={{ borderRadius: 7, fontSize: 13 }}
              >
                {ASSIGNEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Assigned Role */}
          <div className="row mb-3">
            <div className="col-6">
              <label style={labelStyle}>Assigned Role</label>
              <select
                className="form-select"
                value={formData.roleId}
                onChange={(e) => handleChange('roleId', e.target.value)}
                style={{ borderRadius: 7, fontSize: 13 }}
              >
                <option value="">No Role</option>
                {roles.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-6">
              <label style={labelStyle}>Attached Form (Phase 3)</label>
              <select
                className="form-select"
                value={formData.formTypeId}
                onChange={(e) => handleChange('formTypeId', e.target.value)}
                style={{ borderRadius: 7, fontSize: 13 }}
              >
                <option value="">Configured Form (Default)</option>
                {formTypes.map((ft) => <option key={ft.id} value={String(ft.id)}>{ft.name} ({ft.abbr})</option>)}
              </select>
            </div>
          </div>

          {formData.nodeType === 'START' ? (
            <div className="mb-3 p-3" style={{ background: '#f0f7ff', border: '1px solid #b6d4fe', borderRadius: 8 }}>
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-info-circle-fill" style={{ color: '#0d6efd', fontSize: 14 }}></i>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0a58ca', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Starting Process
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.5 }}>
                This is the entry point of the workflow. SLA, breach rules, capabilities, and permitted actions
                are not applicable here as this process handles initial form submission.
              </p>
            </div>
          ) : (
            <>
              <hr style={{ borderColor: '#e9ecef' }} />

              {/* SLA */}
              <div className="row mb-3">
                <div className="col-6">
                  <label style={labelStyle}>SLA Duration (Hours)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    value={formData.slaHours}
                    onChange={(e) => handleChange('slaHours', e.target.value)}
                    style={{ borderRadius: 7, fontSize: 13 }}
                  />
                </div>
                <div className="col-6">
                  <label style={labelStyle}>Breach Action</label>
                  <select
                    className="form-select"
                    value={formData.slaBreachAction}
                    onChange={(e) => handleChange('slaBreachAction', e.target.value)}
                    style={{ borderRadius: 7, fontSize: 13 }}
                  >
                    {SLA_BREACH_ACTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12">
                  <label style={labelStyle}>SLA Breach Threshold (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    max={100}
                    value={formData.slaBreachPercentage || ''}
                    onChange={(e) => handleChange('slaBreachPercentage', e.target.value)}
                    placeholder="e.g. 80"
                    style={{ borderRadius: 7, fontSize: 13 }}
                  />
                </div>
              </div>

              <hr style={{ borderColor: '#e9ecef' }} />

              {/* Capabilities */}
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                Process Capabilities
              </p>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label style={{ fontSize: 13, color: '#333' }}>Enable Document Verification</label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formData.canVerifyDocument}
                    onChange={(e) => handleChange('canVerifyDocument', e.target.checked)}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label style={{ fontSize: 13, color: '#333' }}>Allow Revert to Applicant</label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formData.canRevertToApplicant}
                    onChange={(e) => handleChange('canRevertToApplicant', e.target.checked)}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label style={{ fontSize: 13, color: '#333' }}>Allow Payment Demand (Challan)</label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formData.allowPaymentDemand}
                    onChange={(e) => handleChange('allowPaymentDemand', e.target.checked)}
                  />
                </div>
              </div>

              {/* Challan Rules Builder */}
              {formData.allowPaymentDemand && (
                <div className="mb-4 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, lineHeight: 1.2 }}>
                      Challan Calculation<br/>Rules
                    </p>
                    <button
                      className="btn btn-sm d-flex align-items-center justify-content-center gap-1"
                      style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#eab308', border: '1px solid #fde047', background: '#fff', padding: '6px 12px', minWidth: '130px' }}
                      onClick={addChallanRule}
                    >
                      <span style={{ fontSize: 14 }}>+</span> <span style={{ textAlign: 'center', lineHeight: 1.2 }}>Add Fee<br/>Component</span>
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
                    Formulas support math (e.g. <span style={{ color: '#d63384', fontFamily: 'monospace' }}>formData.area * 50</span>) and ternary if/else (e.g. <span style={{ color: '#d63384', fontFamily: 'monospace' }}>formData.days &gt; 100 ? 1000 : 500</span>).
                  </p>
                  {formData.challanRules?.map((rule: any, i: number) => (
                    <div key={i} className="mb-3 p-3 bg-white border" style={{ borderRadius: 10 }}>
                      <div className="d-flex justify-content-between mb-3">
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>Component #{i + 1}</span>
                        <button className="btn btn-sm p-0 border-0" onClick={() => removeChallanRule(i)}>
                          <i className="bi bi-trash" style={{ color: '#facc15', fontSize: 18 }}></i>
                        </button>
                      </div>
                      
                      <div className="mb-3">
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Component Name (e.g. Processing Fee)</label>
                        <input
                          className="form-control"
                          value={rule.name}
                          onChange={(e) => updateChallanRule(i, 'name', e.target.value)}
                          placeholder="Base Fee"
                          style={{ borderRadius: 8, fontSize: 13 }}
                        />
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', margin: 0 }}>Condition (use 'default' to always apply)</label>
                          <select 
                            className="form-select" 
                            style={{ width: '140px', fontSize: 11, padding: '4px 24px 4px 8px', borderRadius: 6 }}
                            onChange={(e) => {
                              if (e.target.value) {
                                const currentCond = rule.condition || '';
                                const insertStr = `formData.${e.target.value}`;
                                const newVal = (currentCond === 'default' || currentCond === '') ? insertStr : currentCond + ' ' + insertStr;
                                updateChallanRule(i, 'condition', newVal);
                                e.target.value = ""; // reset
                              }
                            }}
                          >
                            <option value="">+ Insert Field</option>
                            {fields.map(f => (
                              <option key={f.fieldKey} value={f.fieldKey}>{f.fieldLabel}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          className="form-control font-monospace"
                          value={rule.condition}
                          onChange={(e) => updateChallanRule(i, 'condition', e.target.value)}
                          placeholder="default"
                          style={{ borderRadius: 8, fontSize: 13 }}
                        />
                      </div>

                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#555', margin: 0 }}>Amount / Formula</label>
                          <select 
                            className="form-select" 
                            style={{ width: '140px', fontSize: 11, padding: '4px 24px 4px 8px', borderRadius: 6 }}
                            onChange={(e) => {
                              if (e.target.value) {
                                const currentFormula = rule.formula || '';
                                updateChallanRule(i, 'formula', currentFormula + (currentFormula ? ' ' : '') + `formData.${e.target.value}`);
                                e.target.value = ""; // reset
                              }
                            }}
                          >
                            <option value="">+ Insert Field</option>
                            {fields.map(f => (
                              <option key={f.fieldKey} value={f.fieldKey}>{f.fieldLabel}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          className="form-control font-monospace"
                          value={rule.formula}
                          onChange={(e) => updateChallanRule(i, 'formula', e.target.value)}
                          placeholder="e.g. formData.area * 50 + 100"
                          style={{ borderRadius: 8, fontSize: 13 }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!formData.challanRules || formData.challanRules.length === 0) && (
                    <div className="text-center py-2 text-muted" style={{ fontSize: 12 }}>
                      No rules configured. Officer will enter challan manually.
                    </div>
                  )}
                </div>
              )}

              <hr style={{ borderColor: '#e9ecef' }} />

              {/* Actions */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
                  Permitted Actions
                </p>
                <button
                  className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
                  style={{ borderRadius: 6, fontSize: 11 }}
                  onClick={addAction}
                >
                  <i className="bi bi-plus"></i> Add
                </button>
              </div>

              {formData.actions?.map((act: any, i: number) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid #e9ecef',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 10,
                    background: '#fafbfc',
                  }}
                >
                  <div className="d-flex gap-2 mb-2">
                    <div style={{ flex: 1 }}>
                      <label style={{ ...labelStyle, fontSize: 10 }}>Action Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={act.actionCode}
                        onChange={(e) => {
                          const match = DEFAULT_ACTIONS.find(a => a.actionCode === e.target.value);
                          updateAction(i, 'actionCode', e.target.value);
                          if (match) updateAction(i, 'actionLabel', match.actionLabel);
                        }}
                        style={{ borderRadius: 6, fontSize: 12 }}
                      >
                        <option value="">Select</option>
                        {DEFAULT_ACTIONS.map(a => <option key={a.actionCode} value={a.actionCode}>{a.actionCode}</option>)}
                        {act.actionCode && !DEFAULT_ACTIONS.find(a => a.actionCode === act.actionCode) && (
                          <option value={act.actionCode}>{act.actionCode}</option>
                        )}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...labelStyle, fontSize: 10 }}>Display Label</label>
                      <input
                        className="form-control form-control-sm"
                        value={act.actionLabel}
                        onChange={(e) => updateAction(i, 'actionLabel', e.target.value)}
                        placeholder="Button label"
                        style={{ borderRadius: 6, fontSize: 12 }}
                      />
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger align-self-end"
                      style={{ borderRadius: 6 }}
                      onClick={() => removeAction(i)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                  <div className="d-flex gap-3" style={{ fontSize: 11 }}>
                    <label className="d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={act.requiresComment} onChange={(e) => updateAction(i, 'requiresComment', e.target.checked)} />
                      Requires Comment
                    </label>
                    <label className="d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={act.requiresDocument} onChange={(e) => updateAction(i, 'requiresDocument', e.target.checked)} />
                      Requires Document
                    </label>
                    <label className="d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={act.requiresReason} onChange={(e) => updateAction(i, 'requiresReason', e.target.checked)} />
                      Requires Reason
                    </label>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <button
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
            style={{ borderRadius: 6, fontWeight: 600 }}
            onClick={onDelete}
          >
            <i className="bi bi-trash"></i> Delete Process
          </button>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              style={{ borderRadius: 6, fontWeight: 600 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm btn-dark"
              style={{ borderRadius: 6, fontWeight: 600 }}
              onClick={handleSave}
            >
              <i className="bi bi-check2 me-1"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
