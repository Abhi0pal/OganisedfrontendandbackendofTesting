'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

interface ConditionField {
  fieldKey: string;
  fieldLabel: string;
  inputType: string;
  operators: string[];
}

interface ConditionRule {
  field: string;
  operator: string;
  value: string;
}

interface ConditionRuleEditorProps {
  open: boolean;
  onClose: () => void;
  edgeData: any;
  serviceId: string;
  departmentId: number;
  onSave: (conditionJson: any, conditionLabel: string) => void;
}

export default function ConditionRuleEditor({ open, onClose, edgeData, serviceId, departmentId, onSave }: ConditionRuleEditorProps) {
  const [fields, setFields] = useState<ConditionField[]>([]);
  const [loading, setLoading] = useState(false);
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>('AND');
  const [rules, setRules] = useState<ConditionRule[]>([{ field: '', operator: '', value: '' }]);
  const [conditionLabel, setConditionLabel] = useState('');

  useEffect(() => {
    if (open && serviceId) fetchFields();
  }, [open, serviceId]);

  useEffect(() => {
    if (edgeData?.conditionJson) {
      const cj = edgeData.conditionJson;
      if (cj.operator === 'AND' || cj.operator === 'OR') {
        setLogicOperator(cj.operator);
        setRules(cj.rules || []);
      } else {
        setRules([cj]);
      }
      setConditionLabel(edgeData.conditionLabel || '');
    }
  }, [edgeData]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/workflow-builder/condition-fields', {
        params: { serviceId, departmentId }
      });
      setFields(res.data || []);
    } catch (err) {
      console.error('Failed to fetch condition fields', err);
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setRules([...rules, { field: '', operator: '', value: '' }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, key: keyof ConditionRule, value: string) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [key]: value };
    setRules(updated);
  };

  const getOperatorsForField = (fieldKey: string): string[] => {
    const field = fields.find(f => f.fieldKey === fieldKey);
    return field?.operators || ['==', '!='];
  };

  const handleSave = () => {
    const validRules = rules.filter(r => r.field && r.operator && r.value);
    if (validRules.length === 0) {
      onSave(null, '');
      onClose();
      return;
    }

    const conditionJson = validRules.length === 1
      ? validRules[0]
      : { operator: logicOperator, rules: validRules };

    onSave(conditionJson, conditionLabel);
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
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: 500,
        background: '#fff',
        zIndex: 1000,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: '#333333',
          borderBottom: '3px solid #FFE600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
            <i className="bi bi-funnel me-2"></i>Condition Rule Editor
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: 0.8 }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Edge Label */}
          <div className="mb-3">
            <label style={labelStyle}>Edge Label (shown on arrow)</label>
            <input
              className="form-control"
              value={conditionLabel}
              onChange={(e) => setConditionLabel(e.target.value)}
              placeholder='e.g., "Investment > 10Cr"'
              style={{ borderRadius: 7, fontSize: 13 }}
            />
          </div>

          <hr style={{ borderColor: '#e9ecef' }} />

          {/* Logic Operator */}
          {rules.length > 1 && (
            <div className="mb-3">
              <label style={labelStyle}>Match Logic</label>
              <select
                className="form-select"
                value={logicOperator}
                onChange={(e) => setLogicOperator(e.target.value as 'AND' | 'OR')}
                style={{ borderRadius: 7, fontSize: 13 }}
              >
                <option value="AND">ALL conditions must match (AND)</option>
                <option value="OR">ANY condition can match (OR)</option>
              </select>
            </div>
          )}

          {/* Rules */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
              Conditions
            </p>
            <button
              className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
              style={{ borderRadius: 6, fontSize: 11 }}
              onClick={addRule}
            >
              <i className="bi bi-plus"></i> Add Rule
            </button>
          </div>

          {loading ? (
            <p style={{ fontSize: 13, color: '#888' }}>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Loading fields from form builder...
            </p>
          ) : (
            rules.map((rule, i) => (
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
                <div className="d-flex gap-2 align-items-end">
                  {/* Field */}
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Field</label>
                    <select
                      className="form-select form-select-sm"
                      value={rule.field}
                      onChange={(e) => updateRule(i, 'field', e.target.value)}
                      style={{ borderRadius: 6, fontSize: 12 }}
                    >
                      <option value="">Select field</option>
                      {fields.map(f => (
                        <option key={f.fieldKey} value={f.fieldKey}>
                          {f.fieldLabel} ({f.inputType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator */}
                  <div style={{ width: 90 }}>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Operator</label>
                    <select
                      className="form-select form-select-sm"
                      value={rule.operator}
                      onChange={(e) => updateRule(i, 'operator', e.target.value)}
                      style={{ borderRadius: 6, fontSize: 12 }}
                    >
                      <option value="">Op</option>
                      {getOperatorsForField(rule.field).map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>

                  {/* Value */}
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Value</label>
                    <input
                      className="form-control form-control-sm"
                      value={rule.value}
                      onChange={(e) => updateRule(i, 'value', e.target.value)}
                      placeholder="e.g., 100000000"
                      style={{ borderRadius: 6, fontSize: 12 }}
                    />
                  </div>

                  <button
                    className="btn btn-sm btn-outline-danger"
                    style={{ borderRadius: 6 }}
                    onClick={() => removeRule(i)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>

                {i < rules.length - 1 && (
                  <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#c77700', textTransform: 'uppercase', marginTop: 6 }}>
                    {logicOperator}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}>
          <button
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: 6, fontWeight: 600 }}
            onClick={() => { onSave(null, ''); onClose(); }}
          >
            Clear Condition
          </button>
          <button
            className="btn btn-sm btn-dark"
            style={{ borderRadius: 6, fontWeight: 600 }}
            onClick={handleSave}
          >
            <i className="bi bi-check2 me-1"></i>Apply Condition
          </button>
        </div>
      </div>
    </>
  );
}
