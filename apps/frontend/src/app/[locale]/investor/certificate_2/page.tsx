'use client';

import { useRef, useState, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import '../certificate.css';

/* ── Sample Data ───────────────────────────────────────────────────────── */
const DATA = {
  certificateNo: '0000551',
  date: '05/05/2026',
  marriageDate: '15/03/2026',
  marriagePlace: 'Nashik, Maharashtra',
  husband: {
    name: 'Keshavraj Deshpandey',
    aadhaar: '9947574893757',
    citizenship: 'Indian',
    ageDob: '28 / 15-06-1998',
    occupation: 'Software Engineer',
    address: 'Flat No. 402, Shiveni Heights, Gangapur Road, Nashik – 422013',
    parentGuardian: 'Mr. Ramesh Deshpandey (Father)',
    father: 'Mr. Ramesh Deshpandey',
    mother: 'Mrs. Sunita Deshpandey',
  },
  wife: {
    name: 'Mrinalini Bose Deshpandey',
    aadhaar: '9947574893757',
    citizenship: 'Indian',
    ageDob: '26 / 22-09-2000',
    occupation: 'Architect',
    address: 'Flat No. 38, Shantiniketan Apts, Kolkata – 700029',
    parentGuardian: 'Mr. Sunil Bose (Father)',
    father: 'Mr. Sunil Bose',
    mother: 'Mrs. Anita Bose',
  },
  registrar: 'Registrar of Marriage Nashik Municipal Corporation',
};

const IMG_PATH = '/img/nmc_certificate_imgs';

/* ── Detail rows config ────────────────────────────────────────────────── */
const DETAIL_ROWS: { label: string; hKey: keyof typeof DATA.husband; wKey: keyof typeof DATA.wife }[] = [
  { label: 'Citizenship', hKey: 'citizenship', wKey: 'citizenship' },
  { label: 'Age and Date of Birth', hKey: 'ageDob', wKey: 'ageDob' },
  { label: 'Occupation', hKey: 'occupation', wKey: 'occupation' },
  { label: 'Permanent Residence Address', hKey: 'address', wKey: 'address' },
  { label: "Parent's / Guardian's Name & Relation", hKey: 'parentGuardian', wKey: 'parentGuardian' },
  { label: 'Father', hKey: 'father', wKey: 'father' },
  { label: 'Mother', hKey: 'mother', wKey: 'mother' },
];

export default function Certificate2Page() {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: `Marriage_Certificate_${DATA.certificateNo}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all'] },
      };
      await html2pdf().set(opt).from(certRef.current).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <>
      {/* Download button */}
      <div className="cert-download-bar">
        <button
          className="cert-download-btn"
          onClick={handleDownload}
          disabled={downloading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {downloading ? 'Generating PDF…' : 'Download Certificate PDF'}
        </button>
      </div>

      {/* Certificate */}
      <div className="cert-page" ref={certRef}>
        {/* Watermark */}
        <div className="cert-watermark">
          <img src={`${IMG_PATH}/watermark-logo.png`} alt="" />
        </div>

        <div className="cert-border-single">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="cert-header">
            <img
              src={`${IMG_PATH}/ashok-stamb.png`}
              alt="Ashok Stambh"
              className="cert-header-logo-sm"
            />
            <div className="cert-header-text">
              <h1>Government of Maharashtra</h1>
              <h2>Nashik Municipal Corporation</h2>
              <h3>Certificate of Registration of Marriage</h3>
              <p>Section 6 (1) and Rule 5, Marriage Act, 1998</p>
            </div>
            <img
              src={`${IMG_PATH}/nmc-logo.png`}
              alt="NMC Logo"
              className="cert-header-logo-sm"
            />
          </div>

          <hr className="cert-divider" />

          {/* ── Certificate Details Row ────────────────────────────────── */}
          <div className="cert-info-row">
            <div className="cert-info-item">
              <strong>Certificate Details / Certificate No:</strong> {DATA.certificateNo}
            </div>
            <div className="cert-info-item">
              <strong>Date:</strong> {DATA.date}
            </div>
          </div>

          {/* ── Marriage info ──────────────────────────────────────────── */}
          <table className="cert-details-table">
            <tbody>
              <tr>
                <td className="cert-detail-label">Marriage Date / Date of Marriage</td>
                <td className="cert-detail-value">{DATA.marriageDate}</td>
              </tr>
              <tr>
                <td className="cert-detail-label">Marriage Place / Place of Marriage</td>
                <td className="cert-detail-value">{DATA.marriagePlace}</td>
              </tr>
            </tbody>
          </table>

          {/* ── Marriage Party Information ─────────────────────────────── */}
          <div className="cert-section-title">
            Marriage Party Information
          </div>

          {/* Party names with photo placeholders */}
          <table className="cert-table">
            <thead>
              <tr>
                <th className="cert-photo-cell">&nbsp;</th>
                <th>Husband Name / Aadhaar Number</th>
                <th>Wife Name / Aadhaar Number</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cert-photo-cell">
                  <div className="cert-photo-placeholder">Photo</div>
                </td>
                <td>
                  <div className="cert-party-name">{DATA.husband.name}</div>
                  <div className="cert-party-detail">
                    <strong>Aadhaar:</strong> {DATA.husband.aadhaar}
                  </div>
                </td>
                <td>
                  <div className="cert-party-name">{DATA.wife.name}</div>
                  <div className="cert-party-detail">
                    <strong>Aadhaar:</strong> {DATA.wife.aadhaar}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="cert-photo-cell">&nbsp;</td>
                <td><strong>Husband</strong></td>
                <td><strong>Wife</strong></td>
              </tr>
            </tbody>
          </table>

          {/* ── Detail Rows ────────────────────────────────────────────── */}
          <table className="cert-details-table">
            <thead>
              <tr>
                <td className="cert-detail-label">Details</td>
                <td className="cert-detail-label">Husband</td>
                <td className="cert-detail-label">Wife</td>
              </tr>
            </thead>
            <tbody>
              {DETAIL_ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="cert-detail-label">{row.label}</td>
                  <td className="cert-detail-value">{DATA.husband[row.hKey]}</td>
                  <td className="cert-detail-value">{DATA.wife[row.wKey]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="cert-footer">
            <div className="cert-footer-left">
              <img
                src={`${IMG_PATH}/maharashtra-logo.png`}
                alt="Seal"
                className="cert-seal"
              />
              <span>Seal</span>
            </div>
            <div className="cert-footer-center">
              <QRCodeCanvas
                value={`CERT:${DATA.certificateNo}|DATE:${DATA.date}|MARRIAGE:${DATA.marriageDate}`}
                size={90}
                level="M"
                className="cert-qr"
              />
            </div>
            <div className="cert-footer-right">
              <div className="cert-registrar">{DATA.registrar}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
