'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface WorkflowDef {
  id: number;
  name: string;
  serviceId: string;
  processes: any[];
}

export default function WorkflowFieldPermissionsPage() {
  const [definitions, setDefinitions] = useState<WorkflowDef[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [masterFields, setMasterFields] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load master list of fields
  const loadMasterFields = async () => {
    try {
      const res = await apiClient.get('/workflow-builder/fields/master');
      setMasterFields(res.data);
    } catch (err) {
      toast.error('Failed to load master fields');
    }
  };

  /**
   * Add a master field to the current workflow step's form mapping
   */
  const handleAddField = async (fieldId: number) => {
    if (loading || !selectedWorkflowId || !selectedStepId || !selectedWorkflow || !selectedStep?.formTypeId) return;
    try {
      setLoading(true);
      await apiClient.post('/workflow-builder/fields/add-to-step', {
        serviceId: selectedWorkflow.serviceId,
        formTypeId: selectedStep.formTypeId,
        fieldId,
        workflowStepId: selectedStepId,
      });
      toast.success('Field added to step');
      // Refresh step configuration to show new field in matrix
      loadStepConfiguration(selectedWorkflow.serviceId, selectedStep.formTypeId, selectedStepId);
      setShowFieldPicker(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add field to step');
    } finally {
      setLoading(false);
    }
  };

  // Load all workflows
  useEffect(() => {
    const fetchWfs = async () => {
      try {
        const res = await apiClient.get('/workflow-builder/definitions');
        setDefinitions(res.data);
      } catch (err) {
        toast.error('Failed to load workflows');
      }
    };
    fetchWfs();
  }, []);

  const selectedWorkflow = definitions.find(d => d.id === selectedWorkflowId);
  const selectedStep = selectedWorkflow?.processes.find((p: any) => p.id === selectedStepId);

  // Load fields and existing permissions when step changes
  useEffect(() => {
    if (selectedWorkflowId && selectedStepId && selectedWorkflow && selectedStep?.formTypeId) {
      loadStepConfiguration(selectedWorkflow.serviceId, selectedStep.formTypeId, selectedStepId);
    } else {
      setFields([]);
    }
  }, [selectedWorkflowId, selectedStepId]);

  const loadStepConfiguration = async (serviceId: string, formTypeId: number, stepId: number) => {
    setLoading(true);
    try {
      // 1. Fetch form structure (fields)
      const formRes = await apiClient.get(`/workflow-engine/form/${serviceId}/${formTypeId}`);
      const allFields: any[] = [];
      formRes.data.pages.forEach((p: any) => {
        p.categories.forEach((c: any) => {
          c.fields.forEach((f: any) => {
            allFields.push({ ...f, categoryName: c.categoryName, categoryId: c.categoryId });
          });
        });
      });
      
      // Deduplicate fields by ID just in case
      const uniqueFields = Array.from(
        new Map(allFields.map(f => [f.id, f])).values()
      );
      setFields(uniqueFields);


    } catch (err) {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="container-fluid p-4">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-1">Department Form Builder</h4>
          <p className="text-muted small">Add or remove the internal fields each role will fill during workflow processing.</p>
        </div>
        <div className="d-flex gap-2">
          {selectedStepId && selectedStep?.formTypeId && (
            <button 
              className="btn btn-outline-primary fw-bold shadow-sm"
              onClick={() => {
                setShowFieldPicker(true);
                loadMasterFields();
              }}
              disabled={loading}
            >
              <i className="bi bi-plus-lg me-1"></i> Add Field
            </button>
          )}
        </div>
      </div>

      {/* Field Picker Modal */}
      {showFieldPicker && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Select Field from Master List</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowFieldPicker(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search by field name or code..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="list-group overflow-auto" style={{ maxHeight: '400px' }}>
                  {masterFields
                    .filter(f => 
                      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      f.formCheckId?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(field => (
                      <button
                        key={field.id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
                        onClick={() => handleAddField(field.id)}
                      >
                        <div>
                          <div className="fw-bold">{field.name}</div>
                          <code className="x-small text-muted">{field.formCheckId}</code>
                        </div>
                        <span className="btn btn-sm btn-primary">Add</span>
                      </button>
                    ))
                  }
                  {masterFields.length === 0 && <div className="text-center py-4 text-muted">No fields found</div>}
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowFieldPicker(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label small fw-bold">1. Select Workflow</label>
          <select 
            className="form-select" 
            value={selectedWorkflowId || ''} 
            onChange={(e) => {
              setSelectedWorkflowId(Number(e.target.value));
              setSelectedStepId(null);
            }}
          >
            <option value="">-- Choose Workflow --</option>
            {definitions.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.serviceId})</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold">2. Select Process Step</label>
          <select 
            className="form-select" 
            value={selectedStepId || ''} 
            onChange={(e) => setSelectedStepId(Number(e.target.value))}
            disabled={!selectedWorkflowId}
          >
            <option value="">-- Choose Step --</option>
            {selectedWorkflow?.processes.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} [{p.role?.name || 'No Role'}]</option>
            ))}
          </select>
        </div>
      </div>

      {selectedStepId && !selectedStep?.formTypeId && (
        <div className="alert alert-info">
          This step does not have an attached form. Please attach a form in the Workflow Builder first.
        </div>
      )}

      {selectedStepId && selectedStep?.formTypeId && (
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">Department Form Fields (Role-Specific)</h6>
            <span className="text-muted small">Only the internal fields for this role are managed here.</span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '45%' }}>Field Name</th>
                  <th style={{ width: '35%' }}>Category</th>
                  <th style={{ width: '20%' }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(field => (
                  <tr key={`${field.categoryId}-${field.id}`}>
                    <td>
                      <div className="fw-bold text-dark">{field.label || field.field_code || field.fieldCode}</div>
                      <code className="x-small text-muted">{field.field_code || field.fieldCode}</code>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">{field.categoryName}</span>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm px-3"
                        onClick={async () => {
                          if (confirm('Are you sure you want to remove this field?')) {
                            await apiClient.post(`/workflow-builder/fields/remove/${field.id}`);
                            toast.success('Field removed');
                            loadStepConfiguration(selectedWorkflow!.serviceId, selectedStep!.formTypeId, selectedStepId!);
                          }
                        }}
                      >
                        <i className="bi bi-trash me-1"></i> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
