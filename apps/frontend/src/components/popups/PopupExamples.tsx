/**
 * Example Implementation of UnifiedServicePopup
 * Shows how to use the unified popup across different pages and services
 */

'use client';

import React from 'react';
import { UnifiedServicePopup, PopupTabContent } from '@/components/popups/UnifiedServicePopup';
import { useDynamicPopup } from '@/hooks/useDynamicPopup';

// ===================================
// Example 1: Marriage Registration Service Popup
// ===================================
export const MarriageRegistrationPopupExample = () => {
  const popup = useDynamicPopup();

  const handleOpenMarriagePopup = () => {
    const tabs: PopupTabContent[] = [
      {
        id: 'checklist',
        label: 'Document Checklist',
        icon: 'bi bi-file-earmark-check',
        content: (
          <div>
            <div className="alert alert-info mb-3">
              <strong>Required Documents:</strong> Please prepare all documents listed below
            </div>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Birth Certificate</td>
                  <td>Original + Copy</td>
                  <td><span className="badge bg-danger">Yes</span></td>
                </tr>
                <tr>
                  <td>Identity Proof</td>
                  <td>Aadhar/Passport</td>
                  <td><span className="badge bg-danger">Yes</span></td>
                </tr>
                <tr>
                  <td>Address Proof</td>
                  <td>Utility Bill/Lease</td>
                  <td><span className="badge bg-success">Optional</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },
      {
        id: 'process',
        label: 'Process Flow',
        icon: 'bi bi-diagram-3',
        content: (
          <div>
            <h6 className="mb-3 fw-bold">Marriage Registration Process</h6>
            <div className="timeline">
              <div className="timeline-item mb-3">
                <div className="d-flex gap-3">
                  <div className="badge bg-primary rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
                  <div>
                    <h6 className="mb-1">Submit Application</h6>
                    <p className="text-muted small">Fill the marriage registration form with required details</p>
                  </div>
                </div>
              </div>
              <div className="timeline-item mb-3">
                <div className="d-flex gap-3">
                  <div className="badge bg-primary rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                  <div>
                    <h6 className="mb-1">Payment</h6>
                    <p className="text-muted small">Make online payment for registration fee (₹50)</p>
                  </div>
                </div>
              </div>
              <div className="timeline-item mb-3">
                <div className="d-flex gap-3">
                  <div className="badge bg-primary rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
                  <div>
                    <h6 className="mb-1">Document Verification</h6>
                    <p className="text-muted small">Submit documents for verification (1-2 days)</p>
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="d-flex gap-3">
                  <div className="badge bg-success rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                  <div>
                    <h6 className="mb-1">Certificate Issued</h6>
                    <p className="text-muted small">Marriage certificate will be issued</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'timeline',
        label: 'Timeline & Fees',
        icon: 'bi bi-clock-history',
        content: (
          <div className="row g-3">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title fw-bold mb-3">
                    <i className="bi bi-hourglass-split text-warning me-2"></i>
                    Processing Time
                  </h6>
                  <div className="mb-2">
                    <small className="text-muted">Normal Processing:</small>
                    <p className="mb-0 fw-semibold">5-7 Working Days</p>
                  </div>
                  <div>
                    <small className="text-muted">Expedited Processing:</small>
                    <p className="mb-0 fw-semibold">2-3 Working Days</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title fw-bold mb-3">
                    <i className="bi bi-currency-rupee text-success me-2"></i>
                    Fees
                  </h6>
                  <div className="mb-2">
                    <small className="text-muted">Registration Fee:</small>
                    <p className="mb-0 fw-semibold">₹50</p>
                  </div>
                  <div>
                    <small className="text-muted">Certificate Copy:</small>
                    <p className="mb-0 fw-semibold">₹10 per copy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ];

    popup.openPopup({
      id: 'marriage-registration',
      title: 'Service Information & Requirements',
      serviceName: 'Marriage Registration',
      tabs,
      defaultTab: 'checklist',
    });
  };

  return (
    <div>
      <button className="btn btn-primary" onClick={handleOpenMarriagePopup}>
        <i className="bi bi-info-circle me-2"></i>
        View Marriage Registration Details
      </button>

      {popup.config && (
        <UnifiedServicePopup
          visible={popup.isVisible}
          onHide={popup.closePopup}
          title={popup.config.title}
          serviceName={popup.config.serviceName}
          tabs={popup.config.tabs}
          defaultTab={popup.config.defaultTab}
          size="large"
        />
      )}
    </div>
  );
};

// ===================================
// Example 2: Birth Certificate Service Popup
// ===================================
export const BirthCertificatePopupExample = () => {
  const popup = useDynamicPopup();

  const handleOpenBirthCertPopup = () => {
    const tabs: PopupTabContent[] = [
      {
        id: 'checklist',
        label: 'Documents Required',
        icon: 'bi bi-file-earmark-check',
        content: (
          <div className="alert alert-light border">
            <h6 className="mb-3 fw-bold">Required Documents:</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="bi bi-check-circle text-success me-2"></i>
                <strong>Original Birth Certificate</strong> (if available)
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle text-success me-2"></i>
                <strong>Applicant ID Proof:</strong> Aadhar, Passport, Voter ID, or Driving License
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle text-success me-2"></i>
                <strong>Applicant Address Proof:</strong> Recent utility bill or bank statement
              </li>
              <li className="mb-2">
                <i className="bi bi-info-circle text-info me-2"></i>
                <strong>For Minor:</strong> Parent/Guardian ID and proof of relationship
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'process',
        label: 'Application Process',
        icon: 'bi bi-diagram-3',
        content: (
          <div>
            <div className="alert alert-info mb-3">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Online Application Available:</strong> You can apply online through the portal
            </div>
            <ol className="list-group list-group-numbered">
              <li className="list-group-item">
                <strong>Create Account</strong> - Register with email and mobile number
              </li>
              <li className="list-group-item">
                <strong>Fill Application</strong> - Enter applicant details and select document type
              </li>
              <li className="list-group-item">
                <strong>Upload Documents</strong> - Upload scanned copies of required documents
              </li>
              <li className="list-group-item">
                <strong>Make Payment</strong> - Complete online payment via UPI/Debit Card
              </li>
              <li className="list-group-item">
                <strong>Track Status</strong> - Monitor application status in real-time
              </li>
              <li className="list-group-item">
                <strong>Receive Certificate</strong> - Certificate will be sent via email/post
              </li>
            </ol>
          </div>
        ),
      },
    ];

    popup.openPopup({
      id: 'birth-certificate',
      title: 'Service Information',
      serviceName: 'Birth Certificate',
      tabs,
      defaultTab: 'checklist',
    });
  };

  return (
    <div>
      <button className="btn btn-success" onClick={handleOpenBirthCertPopup}>
        <i className="bi bi-file-earmark me-2"></i>
        Birth Certificate Details
      </button>

      {popup.config && (
        <UnifiedServicePopup
          visible={popup.isVisible}
          onHide={popup.closePopup}
          title={popup.config.title}
          serviceName={popup.config.serviceName}
          tabs={popup.config.tabs}
          defaultTab={popup.config.defaultTab}
          size="large"
        />
      )}
    </div>
  );
};

// ===================================
// Example 3: Generic Page Popup Integration
// ===================================
export const ServiceDetailsPage = ({ serviceId, serviceName }: { serviceId: number; serviceName: string }) => {
  const popup = useDynamicPopup();
  const [serviceData, setServiceData] = React.useState<any>(null);

  // Simulate fetching service data
  const loadServicePopup = async () => {
    // In real implementation, fetch from API based on serviceId
    const mockData = {
      documentChecklist: [
        { name: 'ID Proof', required: true },
        { name: 'Address Proof', required: true },
        { name: 'Application Form', required: true },
      ],
      processList: [
        { step: 1, desc: 'Submit application online' },
        { step: 2, desc: 'Document verification' },
        { step: 3, desc: 'Approval and issuance' },
      ],
      timeline: '5-7 working days',
      fee: '₹100-500',
    };

    const tabs: PopupTabContent[] = [
      {
        id: 'checklist',
        label: 'Checklist',
        icon: 'bi bi-clipboard-check',
        content: (
          <div>
            {mockData.documentChecklist.map((item, idx) => (
              <div key={idx} className="form-check mb-2">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id={`doc-${idx}`}
                  defaultChecked={item.required}
                  disabled={item.required}
                />
                <label className="form-check-label" htmlFor={`doc-${idx}`}>
                  {item.name} {item.required && <span className="text-danger ms-1">*</span>}
                </label>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: 'process',
        label: 'Process',
        icon: 'bi bi-list-check',
        content: (
          <ol className="list-group list-group-numbered">
            {mockData.processList.map((item, idx) => (
              <li key={idx} className="list-group-item">{item.desc}</li>
            ))}
          </ol>
        ),
      },
    ];

    popup.openPopup({
      id: `service-${serviceId}`,
      title: serviceName,
      serviceName: serviceName,
      tabs,
    });
  };

  return (
    <div>
      <button className="btn btn-info" onClick={loadServicePopup}>
        View Service Details
      </button>

      {popup.config && (
        <UnifiedServicePopup
          visible={popup.isVisible}
          onHide={popup.closePopup}
          title={popup.config.title}
          serviceName={popup.config.serviceName}
          tabs={popup.config.tabs}
          size="large"
        />
      )}
    </div>
  );
};

// ===================================
// Example Usage in Component
// ===================================
/*
export default function Page() {
  return (
    <div className="p-4">
      <h2>Service Popups Demo</h2>
      
      <div className="row gap-3">
        <div className="col-auto">
          <MarriageRegistrationPopupExample />
        </div>
        <div className="col-auto">
          <BirthCertificatePopupExample />
        </div>
        <div className="col-auto">
          <ServiceDetailsPage serviceId={1} serviceName="Test Service" />
        </div>
      </div>
    </div>
  );
}
*/
