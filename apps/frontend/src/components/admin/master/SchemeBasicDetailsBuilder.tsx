"use client";

import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { useServices } from "@/hooks/master/useServices";

interface Props {
  formData: any;
  policyOptions: { label: string; value: number }[];
  editingId: number | null;
  onChange: (e: any) => void;
}

export const SchemeBasicDetailsBuilder = ({
  formData,
  policyOptions,
  editingId,
  onChange,
}: Props) => {
  const { data: services, isLoading: servicesLoading } = useServices();

  const serviceOptions =
    services?.map((service: any) => ({
      label: service.service_name,
      value: service.service_id,
    })) ?? [];

  return (
    <div className="d-flex flex-column gap-3">
      <h5 className="mb-1">Scheme Basic Details</h5>
      <div className="card p-3">
        {/* Row 1 */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Policy *</label>
            <Dropdown
              value={formData.policy_id}
              options={policyOptions}
              placeholder="Select Policy"
              className="w-100"
              filter
              required
              onChange={(e) =>
                onChange({
                  target: { name: "policy_id", value: Number(e.value) || null },
                })
              }
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Version</label>
            <InputNumber
              value={formData.version}
              min={1}
              className="w-100"
              disabled={!!editingId}
              required
              onValueChange={(e) =>
                onChange({ target: { name: "version", value: e.value } })
              }
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">Scheme Name *</label>
            <InputText
              value={formData.scheme_name}
              className="w-100"
              placeholder="Enter scheme name"
              onChange={onChange}
              name="scheme_name"
              required
            />
            <small className="text-muted">
              Display name visible to investors
            </small>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold">
              Scheme Code *
              {!editingId && (
                <span className="text-muted ms-1">(Auto-generated)</span>
              )}
            </label>
            <InputText
              value={formData.scheme_code}
              className="w-100"
              readOnly={!editingId}
              name="scheme_code"
              onChange={onChange}
              style={!editingId ? { backgroundColor: "#f8f9fa" } : {}}
              required
            />
            <small className="text-muted">Uppercase, unique identifier</small>
          </div>
        </div>

        {/* Row 3 */}
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label fw-semibold">Service *</label>
            <Dropdown
              value={formData.service_id}
              options={serviceOptions}
              optionLabel="label"
              optionValue="value"
              required
              placeholder={
                servicesLoading ? "Loading services..." : "Select Service"
              }
              className="w-100"
              filter
              showClear
              panelStyle={{ width: "350px" }}
              onChange={(e) =>
                onChange({
                  target: {
                    name: "service_id",
                    value: e.value,
                  },
                })
              }
            />
            <small className="text-muted">
              Service mapped for document mapping
            </small>
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label fw-semibold">Valid From *</label>
            <Calendar
              value={formData.valid_from}
              dateFormat="dd/mm/yy"
              showIcon
              required
              className="w-100"
              onChange={(e) =>
                onChange({ target: { name: "valid_from", value: e.value } })
              }
            />
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label fw-semibold">Valid To *</label>
            <Calendar
              value={formData.valid_to}
              dateFormat="dd/mm/yy"
              showIcon
              required
              className="w-100"
              onChange={(e) =>
                onChange({ target: { name: "valid_to", value: e.value } })
              }
            />
          </div>

          <div className="col-md-3 mb-3">
            <div className="form-check mt-5">
              <input
                type="checkbox"
                className="form-check-input"
                checked={formData.is_current_version}
                onChange={onChange}
                name="is_current_version"
              />
              <label className="form-check-label fw-semibold">
                Is Current Version
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
