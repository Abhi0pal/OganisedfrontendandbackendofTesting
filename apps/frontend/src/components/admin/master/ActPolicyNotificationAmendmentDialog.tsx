'use client';

import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';

import DocumentUpload from '@/components/common/DocumentUpload';
import {
  useActPolicyNotificationAmendments,
  useCreateAmendment,
  useUpdateAmendment,
  useUploadAmendmentDocument,
} from '@/hooks/master/useActPolicyNotifications';
import { resolveFileUrl } from '@/lib/fileUtils';

export const ActPolicyNotificationAmendmentDialog = ({
  visible,
  onHide,
  actPolicyNotification,
}: any) => {
  const actId = actPolicyNotification.id;

  const { data = [] } = useActPolicyNotificationAmendments(actId);
  const createMutation = useCreateAmendment(actId);
  const updateMutation = useUpdateAmendment(actId);
  const uploadMutation = useUploadAmendmentDocument(actId);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<any>({
    level: '',
    name: '',
    brief: '',
    englishfilePath: '',
    hindifilePath: '',
    start_date: null,
    end_date: null,
    isActive: true,
  });

  const handleUpload = async (file: File) => {
    const res = await uploadMutation.mutateAsync(file);
    return res.filePath;
  };

  const resetForm = () => {
    setFormData({
      level: '',
      name: '',
      brief: '',
      englishfilePath: '',
      hindifilePath: '',
      start_date: null,
      end_date: null,
      isActive: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      start_date: formData.start_date
        ? new Date(formData.start_date).toISOString()
        : null,
      end_date: formData.end_date
        ? new Date(formData.end_date).toISOString()
        : null,
    };

    if (editingId) {
      await updateMutation.mutateAsync({
        amendmentId: editingId,
        data: payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }

    resetForm();
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Amendments – ${actPolicyNotification.name}`}
      style={{ width: '65vw' }}
    >
      {/* ================= FORM ================= */}

      <div className="mb-3">
        <label>Level</label>
        <Dropdown
          value={formData.level}
          options={[
            { label: 'Central', value: 'Central' },
            { label: 'State', value: 'State' },
          ]}
          onChange={(e) =>
            setFormData({ ...formData, level: e.value })
          }
          className="w-100"
        />
      </div>

      <div className="mb-3">
        <label>Name *</label>
        <InputText
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="w-100"
        />
      </div>

      <div className="mb-3">
        <label>Brief</label>
        <InputTextarea
          value={formData.brief}
          onChange={(e) =>
            setFormData({ ...formData, brief: e.target.value })
          }
          className="w-100"
          rows={3}
        />
      </div>

      <div className="grid mb-3">
        <DocumentUpload
          label="English Amendment"
          field="englishfilePath"
          value={formData.englishfilePath}
          onUpload={handleUpload}
          onChange={(k, v) =>
            setFormData({ ...formData, [k]: v })
          }
        />

        <DocumentUpload
          label="Hindi Amendment"
          field="hindifilePath"
          value={formData.hindifilePath}
          onUpload={handleUpload}
          onChange={(k, v) =>
            setFormData({ ...formData, [k]: v })
          }
        />
      </div>

      <div className="mb-3">
        <label>Start Date</label>
        <InputText
          type="date"
          value={formData.start_date || ''}
          onChange={(e) =>
            setFormData({ ...formData, start_date: e.target.value })
          }
          className="w-100"
        />
      </div>

      <div className="mb-3">
        <label>End Date</label>
        <InputText
          type="date"
          value={formData.end_date || ''}
          onChange={(e) =>
            setFormData({ ...formData, end_date: e.target.value })
          }
          className="w-100"
        />
      </div>

      <div className="mb-3">
        <label>Status</label>
        <Dropdown
          value={formData.isActive}
          options={[
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ]}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.value })
          }
          className="w-100"
        />
      </div>

      <div className="d-flex gap-2 mb-4">
        <Button
          label={editingId ? 'Update Amendment' : 'Add Amendment'}
          onClick={handleSubmit}
        />
        <Button
          label="Reset"
          severity="secondary"
          onClick={resetForm}
        />
      </div>

      {/* ================= AMENDMENT LIST ================= */}
      <hr />
      <h4 className="mb-3">Existing Amendments</h4>

      {data.length === 0 ? (
        <p className="text-muted">No amendments added yet.</p>
      ) : (
        <div className="flex flex-column gap-3">
          {data.map((a: any) => (
            <div
              key={a.id}
              className="p-3 border rounded-lg shadow-sm bg-white"
            >
              {/* Header */}
              <div className="flex justify-content-between align-items-center mb-2">
                <div>
                  <h5 className="mb-1">{a.name}</h5>
                  <small className="text-muted">
                    Level: <strong>{a.level || 'NA'}</strong>
                  </small>
                </div>

                <span
                  className={`px-2 py-1 text-sm rounded ${
                    a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {a.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Brief */}
              {a.brief && (
                <p className="mb-2 text-sm text-gray-700">
                  {a.brief}
                </p>
              )}

              {/* Documents */}
              <div className="flex gap-3 align-items-center">
                {a.englishfilePath && (
                  <a
                    href={resolveFileUrl(a.englishfilePath)}
                    target="_blank"
                    className="text-primary flex align-items-center gap-1"
                  >
                    <i className="pi pi-file-pdf" />
                    English Document
                  </a>
                )}

                {a.hindifilePath && (
                  <a
                    href={resolveFileUrl(a.hindifilePath)}
                    target="_blank"
                    className="text-primary flex align-items-center gap-1"
                  >
                    <i className="pi pi-file-pdf" />
                    Hindi Document
                  </a>
                )}
              </div>

              {/* Dates */}
              {(a.start_date || a.end_date) && (
                <div className="mt-2 text-sm text-muted">
                  {a.start_date && (
                    <>From: {new Date(a.start_date).toLocaleDateString('en-IN')} </>
                  )}
                  {a.end_date && (
                    <> | To: {new Date(a.end_date).toLocaleDateString('en-IN')}</>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </Dialog>
  );
};
