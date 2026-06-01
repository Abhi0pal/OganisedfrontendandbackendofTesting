'use client';

import { useRef, useState } from 'react';

const PROXY = process.env.NEXT_PUBLIC_FRS_BAP_PROXY_URL || 'http://localhost:3011';
const MIME_PDF = 'application/pdf';
const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const COLORS = {
    primary: "#F6E600",
    lightGray: "#E5E5EA",
    secondLightGray: "#C7C7D1",
    faintReadableGray: "#7A7A85",
    mediumGray: "#3A3A45",
    white: "#FFFFFF",
    softYellow: "#FFFDE7",
    softYellow2: "#FFF9C4",
    redBg: "#FFF1F2",
    redBorder: "#FECDD3",
    redText: "#BE123C",
    greenSoft: "#ECFDF5",
    greenBorder: "#A7F3D0",
    greenText: "#047857",
    gradientStart: "#FFFFFF",
    gradientEnd: "#FFF6BF",
  };

const UI = {
  bg: '#f3f4f6',
  surface: '#f9fafb',
  text: '#1f2937',
  muted: '#6b7280',
  accent: '#eab308',
  accentStrong: '#ca8a04',
  border: 'rgba(234, 179, 8, 0.6)',
  borderSoft: 'rgba(234, 179, 8, 0.35)',
  accentGlow: 'rgba(234, 179, 8, 0.12)',
  error: '#b91c1c',
  errorBg: 'rgba(248, 113, 113, 0.1)',
  white: '#ffffff',
};

const isSupportedInputFile = (f) => {
  if (!f) return false;
  const name = (f.name || '').toLowerCase();
  return f.type === MIME_PDF || f.type === MIME_DOCX || name.endsWith('.pdf') || name.endsWith('.docx');
};

const getInputMimeType = (f) => {
  const name = (f?.name || '').toLowerCase();
  if (f?.type === MIME_DOCX || name.endsWith('.docx')) return MIME_DOCX;
  if (f?.type === MIME_PDF || name.endsWith('.pdf')) return MIME_PDF;
  return '';
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });

const getErrMsg = (err) => {
  if (!err) return 'Unknown error.';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err.message) return String(err.message);
  return 'Something went wrong.';
};

const getDownloadBaseName = (data) => {
  const raw = String(data?.formMetadata?.formName || 'BAP_SRS').trim();
  return raw.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const S = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
    background: UI.bg,
    minHeight: '100vh',
    color: UI.text,
  },
  shell: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '12px 12px 52px',
  },
  eyebrow: {
    display: 'inline-block',
    marginBottom: 18,
    color: UI.accentStrong,
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    padding: '6px 10px',
    border: `1px solid ${UI.borderSoft}`,
    borderRadius: 6,
    background: UI.accentGlow,
  },
  title: {
    margin: 0,
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(2.2rem, 5.3vw, 4.2rem)',
    lineHeight: 1.08,
    letterSpacing: '-0.02em',
    color: UI.text,
  },
  subtitle: {
    maxWidth: 760,
    marginTop: 16,
    marginBottom: 28,
    color: UI.muted,
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  panel: {
    border: `2px dashed ${UI.border}`,
    borderRadius: 20,
    background: UI.surface,
    padding: '44px 28px',
    marginBottom: 22,
  },
  uploadWrap: {
    textAlign: 'center',
  },
  uploadIconCircle: {
    width: 58,
    height: 58,
    borderRadius: '50%',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${UI.borderSoft}`,
    background: UI.accentGlow,
    color: UI.accentStrong,
  },
  uploadHeading: {
    margin: '0 0 8px',
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(1.25rem, 2.1vw, 2rem)',
    color: UI.text,
  },
  uploadHint: {
    color: UI.muted,
    fontSize: '1.05rem',
    marginBottom: 10,
  },
  uploadBadge: {
    display: 'inline-block',
    border: `1px solid ${UI.borderSoft}`,
    borderRadius: 999,
    padding: '4px 12px',
    color: UI.accentStrong,
    background: UI.accentGlow,
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    letterSpacing: '0.12em',
  },
  uploadDropArea: {
    marginTop: 18,
    border: `2px dashed ${UI.borderSoft}`,
    borderRadius: 16,
    padding: '18px 14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  selectedFile: {
    marginTop: 12,
    fontSize: 14,
    color: UI.text,
    fontWeight: 600,
  },
  selectedSub: {
    marginTop: 4,
    fontSize: 12,
    color: UI.muted,
  },
  actionRow: {
    marginTop: 20,
    display: 'flex',
    justifyContent: 'center',
  },
  btnPrimary: (disabled) => ({
    background: disabled ? '#d1d5db' : UI.accent,
    color: disabled ? '#9ca3af' : '#111827',
    border: 'none',
    padding: '12px 28px',
    fontWeight: 700,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: 0.6,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    boxShadow: disabled ? 'none' : `0 6px 20px ${UI.accentGlow}`,
  }),
  btnOutline: (disabled) => ({
    background: UI.white,
    color: disabled ? '#9ca3af' : UI.text,
    border: `1.5px solid ${disabled ? '#d1d5db' : UI.borderSoft}`,
    padding: '10px 18px',
    fontWeight: 700,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: 0.6,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
  }),
  downloadHeading: {
    margin: 0,
    fontFamily: "'Space Mono', monospace",
    fontSize: '1.25rem',
    color: UI.text,
    textAlign: 'center',
  },
  downloadRow: {
    marginTop: 16,
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  statusText: {
    fontSize: 13,
    color: UI.muted,
    marginBottom: 8,
    fontWeight: 600,
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    background: '#e5e7eb',
    overflow: 'hidden',
    borderRadius: 999,
  },
  errorCard: {
    marginTop: 20,
    padding: '16px 20px',
    background: UI.errorBg,
    borderLeft: `4px solid ${UI.error}`,
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: UI.error,
    marginBottom: 6,
  },
  errorBody: {
    fontSize: 13,
    color: '#7f1d1d',
    whiteSpace: 'pre-line',
    lineHeight: 1.6,
  },
};

export default function FrsToBapSrs() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [srsData, setSrsData] = useState(null);
  const fileRef = useRef(null);

  const isBusy = status === 'extracting' || status === 'downloading';

  const onFile = (uploadedFile) => {
    if (!uploadedFile) return;
    if (!isSupportedInputFile(uploadedFile)) {
      setStatus('error');
      setErrorMsg('Unsupported file type. Please upload a PDF or DOCX file.');
      return;
    }

    setFile(uploadedFile);
    setSrsData(null);
    setStatus('idle');
    setErrorMsg('');
    setProgress('');
    setProgressPct(0);
  };

  const generateSrs = async () => {
    if (!file || isBusy) return;

    setStatus('extracting');
    setErrorMsg('');
    setProgress('Checking SRS service...');
    setProgressPct(10);

    try {
      const health = await fetch(`${PROXY}/health`, { signal: AbortSignal.timeout(5000) });
      if (!health.ok) {
        throw new Error('SRS service is currently unavailable. Please retry in a moment.');
      }

      setProgress('Reading file...');
      setProgressPct(25);

      const fileBase64 = await toBase64(file);
      const mimeType = getInputMimeType(file);

      if (!mimeType) {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
      }

      setProgress('Generating SRS...');
      setProgressPct(45);

      let animatedPct = 45;
      const timer = setInterval(() => {
        animatedPct = Math.min(animatedPct + 3, 88);
        setProgressPct(animatedPct);
      }, 1200);

      const res = await fetch(`${PROXY}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64, fileName: file.name, mimeType }),
      });

      clearInterval(timer);

      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error(`Invalid service response (HTTP ${res.status}).`);
      }

      if (!res.ok || !json.ok || !json.data) {
        throw new Error(json?.error || 'Unable to generate SRS.');
      }

      setSrsData(json.data);
      setStatus('generated');
      setProgress('SRS generated successfully.');
      setProgressPct(100);
    } catch (err) {
      setStatus('error');
      setErrorMsg(getErrMsg(err));
    }
  };

  const downloadPdf = async () => {
    if (!srsData || isBusy) return;
    setStatus('downloading');
    setErrorMsg('');
    setProgress('Preparing PDF...');

    try {
      const res = await fetch(`${PROXY}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srsData }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || `PDF download failed (HTTP ${res.status}).`);
      }

      const base = getDownloadBaseName(srsData);
      downloadBlob(new Blob([await res.arrayBuffer()], { type: 'application/pdf' }), `${base}.pdf`);

      setStatus('generated');
      setProgress('PDF downloaded.');
    } catch (err) {
      setStatus('error');
      setErrorMsg(getErrMsg(err));
    }
  };

  const downloadDocx = async () => {
    if (!srsData || isBusy) return;
    setStatus('downloading');
    setErrorMsg('');
    setProgress('Preparing DOCX...');

    try {
      const res = await fetch(`${PROXY}/docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srsData }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || `DOCX download failed (HTTP ${res.status}).`);
      }

      const base = getDownloadBaseName(srsData);
      downloadBlob(
        new Blob([await res.arrayBuffer()], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        `${base}.docx`,
      );

      setStatus('generated');
      setProgress('DOCX downloaded.');
    } catch (err) {
      setStatus('error');
      setErrorMsg(getErrMsg(err));
    }
  };

  return (
    <div className="container">
      <div className="build-srs-wrap mt-5">
        <div className="m-auto">
          {/* <span className="badge mb-2">AI QA AUTOMATION</span> */}
          <h1 style={{ fontSize: "40px",textAlign: "center" , fontWeight: 800, color: COLORS.mediumGray, marginBottom: "16px" }}>FRS to BAP SRS Generator</h1>
          <p style={{ textAlign: "center" }}>Upload an SRS document, let the pipeline process it in real time, then download your structured SRS output as PDF or DOCX.</p>

          <section className="upload-wrap p-5 my-5 rounded-4">
            <div style={S.uploadWrap}>
              <div className="icon-wrap iw-md d-flex justify-content-center align-items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4-4m0 0l-4 4m4-4v9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="fs-4 mb-2">Upload SRS Document</h2>
              <p className="mb-3">Drag & drop a PDF or DOCX, or click to browse</p>
              <span className="bg-dark text-primary" style={S.uploadBadge}>PDF / DOCX</span>

              <div className="bg-white"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files[0]);
                }}
                style={{
                  ...S.uploadDropArea,
                  borderColor: file ? UI.border : UI.borderSoft,
                  background: file ? UI.accentGlow : 'transparent',
                }}
              >
                {file ? (
                  <>
                    <div style={S.selectedFile}>{file.name}</div>
                    <div style={S.selectedSub}>{(file.size / 1024).toFixed(1)} KB | Click to change</div>
                  </>
                ) : (
                  <>
                    <p>Drop file here or click to browse</p>
                    <p><small>Only PDF and DOCX are supported</small></p>
                  </>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => onFile(e.target.files?.[0])}
                style={{ display: 'none' }}
              />

              <div style={S.actionRow}>
                <button className="bg-primary" onClick={generateSrs} disabled={!file || isBusy} style={S.btnPrimary(!file || isBusy)}>
                  {status === 'extracting' ? 'GENERATING...' : 'GENERATE SRS'}
                </button>
              </div>

              {!!progress && (
                <div style={{ marginTop: 20 }}>
                  <div style={S.statusText}>{progress}</div>
                  <div style={S.progressTrack}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        background: progressPct === 100 ? '#16A34A' : UI.accent,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {status === 'error' && errorMsg && (
                <div style={S.errorCard}>
                  <div style={S.errorTitle}>Error</div>
                  <div style={S.errorBody}>{errorMsg}</div>
                </div>
              )}
            </div>
          </section>

          {srsData && (
            <section style={S.panel}>
              <h3 style={S.downloadHeading}>Download SRS</h3>
              <div style={S.downloadRow}>
                <button onClick={downloadPdf} disabled={isBusy} style={S.btnPrimary(isBusy)}>
                  {status === 'downloading' ? 'WORKING...' : 'PDF'}
                </button>
                <button onClick={downloadDocx} disabled={isBusy} style={S.btnOutline(isBusy)}>
                  {status === 'downloading' ? 'WORKING...' : 'DOCX'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
