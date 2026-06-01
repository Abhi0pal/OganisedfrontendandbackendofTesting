import React from 'react';

type PrintHeaderProps = {
  unitName: string;
  submissionId: string;
  statusLabel: string;
};

export default function PrintHeader({ unitName, submissionId, statusLabel }: PrintHeaderProps) {
  return (
    <div className="print-header">
      <div className="print-header-main">
        <img src="/uk-logo.png" alt="Uttarakhand Logo" className="print-logo" />
        <div className="print-header-text">
          <div className="print-title">Uttarakhand Single Window Clearance System</div>
          <div className="print-subtitle">Govt. of Uttarakhand</div>
        </div>
        <img src="/img/departments/msme.png" alt="MSME Logo" className="print-logo" />
      </div>

      <div className="print-divider" />

      <div className="print-header-lower">
        <div className="print-form-title">IN-PRINCIPLE APPROVAL (CAF) APPLICATION FORM</div>
        <div className="print-header-meta">
          <div>Unit Name: {unitName}</div>
          <div>
            Status for CAF ID: {submissionId} is {statusLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
