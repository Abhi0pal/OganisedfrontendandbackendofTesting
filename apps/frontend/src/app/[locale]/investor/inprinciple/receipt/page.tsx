'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PrintHeader from '@/components/(investor)/inprinciple/applicationcomponent/print/PrintHeader';
import PrintFooter from '@/components/(investor)/inprinciple/applicationcomponent/print/PrintFooter';
import PrintSection from '@/components/(investor)/inprinciple/applicationcomponent/print/PrintSection';

export default function InprinciplePaymentReceiptPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams?.get('paymentId') || '--';
  const ref = searchParams?.get('ref') || '--';
  const amount = searchParams?.get('amount') || '--';
  const date = searchParams?.get('date') || '--';
  const status = searchParams?.get('status') || '--';
  const mode = searchParams?.get('mode') || '--';
  const submissionId = searchParams?.get('submissionId') || '--';
  const applicant = searchParams?.get('applicant') || '--';
  const autoPrint = searchParams?.get('autoPrint') === '1';

  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => window.print(), 250);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('print-view');
    return () => {
      document.body.classList.remove('print-view');
    };
  }, []);

  const formattedDate =
    date !== '--' && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleString()
      : date;

  const formattedAmount = Number.isFinite(Number(amount))
    ? Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount;

  return (
    <div className="print-page">
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        .print-view .investor-main-content > header,
        .print-view .investor-main-content > footer,
        .print-view .sidebar,
        .print-view .investor-sidebar {
          display: none !important;
        }
        .print-view .investor-main-content {
          margin-left: 0 !important;
        }
        .print-view .investor-main-content main {
          padding: 0 !important;
        }
        .print-view main {
          padding: 0 !important;
          background: #ffffff !important;
        }
        .print-view {
          background: #ffffff !important;
        }
        .print-page {
          width: 190mm;
          margin: 0 auto;
          color: #000;
          font-family: "Times New Roman", serif;
          font-size: 14px;
          line-height: 1.2;
          padding-bottom: 18mm;
        }
        .print-divider {
          border-top: 1px solid #000;
          margin-top: 8px;
        }
        .print-header {
          margin-bottom: 10px;
        }
        .print-header-main {
          display: grid;
          grid-template-columns: 70px 1fr 70px;
          align-items: center;
          gap: 8px;
        }
        .print-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          justify-self: center;
        }
        .print-header-text {
          text-align: center;
        }
        .print-title {
          font-size: 16px;
          font-weight: 700;
        }
        .print-subtitle {
          font-size: 12px;
        }
        .print-form-title {
          font-size: 13px;
          font-weight: 700;
          margin-top: 2px;
          text-align: center;
        }
        .print-header-lower {
          margin-top: 6px;
        }
        .print-header-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-top: 6px;
        }
        .print-section {
          border: 1px solid #000;
        }
        .print-section-title {
          background: #b91c1c;
          color: #fff;
          font-weight: 700;
          padding: 4px 6px;
        }
        .print-section-body {
          padding: 6px;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          vertical-align: top;
        }
        .print-table th {
          background: #b91c1c;
          color: #fff;
          font-weight: 700;
        }
        .print-actions {
          margin-top: 10px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .print-actions button {
          border: 1px solid #222;
          background: #fff;
          color: #222;
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-actions { display: none !important; }
          .print-footer {
            position: fixed;
            bottom: 10mm;
            left: 10mm;
            right: 10mm;
          }
        }
      `}</style>
      <PrintHeader
        unitName={applicant}
        submissionId={String(submissionId)}
        statusLabel={status === 'S' ? 'Payment Success' : 'Payment Failed'}
      />
      <PrintSection title="Payment Receipt Details">
        <table className="print-table">
          <tbody>
            <tr>
              <th>Submission ID</th>
              <td>{submissionId}</td>
              <th>Applicant</th>
              <td>{applicant}</td>
            </tr>
            <tr>
              <th>Payment ID</th>
              <td>{paymentId}</td>
              <th>Reference No</th>
              <td>{ref}</td>
            </tr>
            <tr>
              <th>Amount</th>
              <td>{formattedAmount}</td>
              <th>Payment Mode</th>
              <td>{mode}</td>
            </tr>
            <tr>
              <th>Date of Payment</th>
              <td>{formattedDate}</td>
              <th>Status</th>
              <td>{status === 'S' ? 'Success' : 'Failed'}</td>
            </tr>
          </tbody>
        </table>
      </PrintSection>

      <div className="print-actions">
        <button type="button" onClick={() => window.print()}>
          Print Receipt
        </button>
        <button type="button" onClick={() => window.close()}>
          Close
        </button>
      </div>

      <PrintFooter />
    </div>
  );
}
