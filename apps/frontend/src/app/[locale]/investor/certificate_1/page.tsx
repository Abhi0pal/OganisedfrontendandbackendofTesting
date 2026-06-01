'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import apiClient from '@/lib/api-client';

const IMG_PATH = '/img/nmc_certificate_imgs';

export default function Certificate1Page() {
  const certRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const submissionId = searchParams?.get('submissionId');

  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    apiClient
      .get(`/investor/services/submissions/${submissionId}`)
      .then((res) => {
        const submission = res.data || {};
        const rawData = submission.formData || submission.fieldValue || submission.field_value || {};
        const data = rawData.fields ? { ...rawData, ...rawData.fields } : rawData;
        
        console.log('Submission ID:', submissionId);
        console.log('Data keys:', Object.keys(data));
        console.log('Husband Photo Field:', data['UK-FCL-03052_0']);
        console.log('Wife Photo Field:', data['UK-FCL-03143_0']);

        // Extracting day, month, year from date if possible
        const rawDate = data['UK-FCL-03015_0'] || new Date().toLocaleDateString('en-IN');
        const dateParts = rawDate.split('/');
        
        setCertData({
          certificateNo: submissionId,
          serialNo: `${submissionId}-NMC`,
          volumeNo: `VOL-${submissionId}`,
          place: data['UK-FCL-03020_0'] || 'Nashik Municipal Corporation',
          date: rawDate,
          day: dateParts[0] || '',
          month: dateParts[1] || '',
          year: dateParts[2] ? dateParts[2].slice(-2) : '',
          fullYear: dateParts[2] || '',
          husband: {
            name: data['UK-FCL-03285_0'] || '—',
            aadhaar: data['UK-FCL-03227_0'] || '—',
            address: data['UK-FCL-03050_0'] || '—',
            photo: data['UK-FCL-03052_0'],
          },
          wife: {
            name: data['UK-FCL-03265_0'] || '—',
            aadhaar: data['UK-FCL-03276_0'] || '—',
            address: data['UK-FCL-03281_0'] || '—',
            photo: data['UK-FCL-03143_0'],
          },
          registrar: 'Registrar of Marriage Nashik Municipal Corporation',
        });
      })
      .catch((err) => {
        console.error('Failed to fetch certificate data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [submissionId]);
  const getImageUrl = (path: any) => {
    if (!path) return '';
    const filePath = typeof path === 'object' ? path.filePath : path;
    if (!filePath || typeof filePath !== 'string') return '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `${baseUrl}/${cleanPath}`;
  };

  const handleDownload = useCallback(async () => {
    if (!certRef.current || !certData) return;
    setDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: `Marriage_Certificate_${certData.certificateNo}.pdf`,
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
  }, [certData]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>Loading Certificate…</div>;
  }

  if (!certData) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb', color: '#6b7280' }}>Certificate data not found for ID: {submissionId}</div>;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --primary-color: #7A1E1C; --primary-color-rbg: 122, 30, 28; }
        
        .certificate-container { font-family: Arial, sans-serif; background: #FFFFFF; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 30px 10px; }
        .cert-download-bar { width: 100%; max-width: 700px; display: flex; justify-content: flex-end; margin-bottom: 20px; }
        .cert-download-btn { background: #7A1E1C; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; }
        .cert-download-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .certificate { background: #fff; width: 700px; min-height: 900px; border: 3px solid rgba(122, 30, 28, 0.5); padding: 28px 36px 36px; position: relative; overflow: hidden; }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 320px; height: 320px; pointer-events: none; z-index: 0; opacity: 0.1; }
        .certificate > *:not(.watermark) { position: relative; z-index: 1; }
        
        .header-logos { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .header-logos img { height: 60px; width: auto; }
        
        .header-text { text-align: center; margin-bottom: 6px; }
        .header-text p { font-size: 12px; line-height: 1.7; color: #111; margin: 0; }
        .header-text .bold { font-weight: bold; }
        
        .divider { border: none; border-top: 1px solid #000000; margin: 8px 0; }
        .certified-title { text-align: center; font-size: 12px; font-weight: bold; color: var(--primary-color); margin: 10px 0 14px; line-height: 1.5; }

        .parties-row { display: flex; gap: 16px; margin-bottom: 18px; }
        .party-box { flex: 1; display: flex; gap: 0; min-height: 110px; border: none; }
        .party-label { border: 1px solid #7A1E1C; color: #7A1E1C; font-size: 12px; font-weight: bold; padding: 8px 6px; display: flex; align-items: center; justify-content: center; white-space: nowrap; width: 75px; height: 100px; }
        .party-info { flex: 1; padding: 10px 12px; }
        .party-field-label { font-size: 10px; color: var(--primary-color); font-weight: 400; margin-bottom: 1px; }
        .party-field-value { font-size: 11px; font-weight: 400; color: #000000; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; margin-top: 5px; min-height: 1.2em; }

        .address-section { margin-bottom: 14px; }
        .section-label { font-size: 12px; font-weight: bold; color: #7A1E1C; margin-bottom: 10px; }
        .address-value { font-size: 12px; color: #111; text-decoration: underline; line-height: 1.5; margin-bottom: 30px; }

        .body-text { margin: 16px 0; padding: 14px 0; }
        .body-text p { font-size: 12px; color: #222; line-height: 1.8; margin-bottom: 10px; margin: 0; }
        .body-text .fill-line { display: inline-block; min-width: 80px; border-bottom: 1px solid #555; text-align: center; padding: 0 5px; }
        .body-text .fill-line-sm { min-width: 40px; }

        .footer { margin-top: 20px; }
        .footer-row { display: flex; justify-content: space-between; align-items: flex-end; }
        .footer-left p { font-size: 12.5px; line-height: 1.9; color: #111; margin: 0; }
        .footer-left .label { font-weight: normal; color: #555; }
        .footer-left .value { font-weight: bold; }
        .footer-left .value.red { color: #7A1E1C; text-decoration: underline; }
        .registrar-title { text-align: center; font-size: 12px; font-weight: bold; color: #111; margin-top: 12px; padding-top: 8px; }
        
        .mt-5 { margin-top: 5px; }
        .mt-10 { margin-top: 10px; }
        .mt-15 { margin-top: 15px; }
        .mt-20 { margin-top: 20px; }

        @media print {
          body { background: #fff; padding: 0; margin: 0; }
          .certificate-container { padding: 0; }
          .cert-download-bar { display: none; }
          .certificate { width: 100%; border: 3px solid #7A1E1C; page-break-inside: avoid; }
        }
      ` }} />

      <div className="certificate-container">
        <div className="cert-download-bar">
          <button className="cert-download-btn" onClick={handleDownload} disabled={downloading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading ? 'Generating PDF…' : 'Download Certificate PDF'}
          </button>
        </div>

        <div className="certificate" ref={certRef}>
          {/* Watermark blob */}
          <div className="watermark">
            <img src={`${IMG_PATH}/watermark-NMC.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* ── Header logos ── */}
          <div className="header-logos">
            <img src={`${IMG_PATH}/nasik-mahanagarpalika.svg`} alt="Nashik Municipal Corporation" />
            <img src={`${IMG_PATH}/government-of-india.svg`} alt="Government of India" />
            <img src={`${IMG_PATH}/seal_of_maharashtra.svg`} alt="Seal of Maharashtra" />
          </div>

          {/* ── Header text ── */}
          <div className="header-text">
            <p>महाराष्ट्र शासन / <span className="bold">Government of Maharashtra</span></p>
            <p>नाशिक महानगरपालिका / <span className="bold">Nashik Municipal Corporation</span></p>
            <p className="bold">विवाह नोंदणी प्रमाणपत्र / Certificate of Registration of Marriage</p>
            <p>कलम 6 (1) आणि नियम 5 / see section 6(1) and Rule 5</p>
          </div>

          {/* ── Certified title ── */}
          <div className="certified-title">
            प्रमाणित करण्यात येते की / Certified that Marriage Between
          </div>

          {/* ── Parties ── */}
          <div className="parties-row">
            {/* Husband */}
            <div className="party-box">
              <div className="party-label" style={{ padding: 0, overflow: 'hidden' }}>
                {certData.husband.photo ? (
                  <img src={getImageUrl(certData.husband.photo)} alt="Husband" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                ) : (
                  'पतीचा'
                )}
              </div>
              <div className="party-info">
                <div className="party-field-label">पतीचे नाव / Husband Name</div>
                <div className="party-field-value">{certData.husband.name}</div>
                <div className="party-field-label">आधार क्रमांक / Aadhaar Number</div>
                <div className="party-field-value">{certData.husband.aadhaar}</div>
              </div>
            </div>

            {/* Wife */}
            <div className="party-box">
              <div className="party-label" style={{ padding: 0, overflow: 'hidden' }}>
                {certData.wife.photo ? (
                  <img src={getImageUrl(certData.wife.photo)} alt="Wife" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                ) : (
                  'पत्नीचा'
                )}
              </div>
              <div className="party-info">
                <div className="party-field-label">पत्नीचे नाव / Wife Name</div>
                <div className="party-field-value">{certData.wife.name}</div>
                <div className="party-field-label">आधार क्रमांक / Aadhaar Number</div>
                <div className="party-field-value">{certData.wife.aadhaar}</div>
              </div>
            </div>
          </div>

          {/* ── Husband address ── */}
          <div className="address-section">
            <div className="section-label">पतीचा रिहवासी पत्ता / Husband's resident address</div>
            <div className="address-value">{certData.husband.address}</div>
          </div>

          {/* ── Wife address ── */}
          <div className="address-section">
            <div className="section-label">पत्नीचा रिहवासी पत्ता / Wife's resident address</div>
            <div className="address-value">{certData.wife.address}</div>
          </div>

          {/* ── Body text (bilingual) ── */}
          <div className="body-text">
            {/* Marathi paragraph */}
            <p>
              लग्नाची तारीख &nbsp;
              <span className="fill-line fill-line-sm">{certData.day}</span> /
              <span className="fill-line fill-line-sm">{certData.month}</span> /२०
              <span className="fill-line fill-line-sm">{certData.year}</span>
              &nbsp; at (स्थान) &nbsp;
              <span className="fill-line" style={{ minWidth: '180px' }}>{certData.place}</span>
              &nbsp; मेरे द्वारा पंजीकृत &nbsp;
              <span className="fill-line fill-line-sm">{certData.day}</span> /
              <span className="fill-line fill-line-sm">{certData.month}</span> /२०
              <span className="fill-line fill-line-sm">{certData.year}</span>
              &nbsp; क्रम संख्या पर {certData.serialNo} खंड संख्या का {certData.volumeNo} महाराष्ट्र विवाह ब्यूरो विनियमन और विवाह पंजीकरण अधिनियम, 1998 के अंतर्गत संधारित विवाह रजिस्टर का
            </p>

            {/* English paragraph */}
            <p className="mt-20">
              Solemnized on dated &nbsp;
              <span className="fill-line fill-line-sm">{certData.day}</span> /
              <span className="fill-line fill-line-sm">{certData.month}</span> /20
              <span className="fill-line fill-line-sm">{certData.year}</span>
              &nbsp; at (Place) <span style={{ textDecoration: 'underline' }}>{certData.place}</span> is registered by me on &nbsp;
              <span className="fill-line fill-line-sm">{certData.day}</span> /
              <span className="fill-line fill-line-sm">{certData.month}</span> /20
              <span className="fill-line fill-line-sm">{certData.year}</span>
              &nbsp; at serial No: {certData.serialNo} of Volume No {certData.volumeNo} of Register of Marriage maintained under the Maharashtra Regulation at Marriage Bureaus and Registration of Marriages Act 1998.
            </p>
          </div>

          <hr className="divider" />

          {/* ── Footer ── */}
          <div className="footer">
            <div className="footer-row">
              <div className="footer-left">
                <p>
                  <span className="label">प्रमाणपत्र क्रमांक / Certificate Number : </span>
                  <span className="value red">{certData.certificateNo}</span>
                </p>
                <p className="mt-5">
                  <span className="label">ठिकाण / Place : </span>
                  <span className="value red">नाशिक महानगरपालिका</span>
                </p>
                <p className="mt-5">
                  <span className="label">दिनांक / Date : </span>
                  <span className="value red">{certData.date}</span>
                </p>
                <div className="registrar-title">
                  विवाह नोंदणी अधिकारी / Registrar of Marriage Nashik Municipal Corporation
                </div>
              </div>

              {/* QR Code */}
              <div>
                <QRCodeCanvas 
                  value={`CERT:${certData.certificateNo}|SN:${certData.serialNo}|VOL:${certData.volumeNo}`} 
                  size={80} 
                  level="M" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
