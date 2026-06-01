'use client';

interface TransitionTarget { next_step: number; next_role_id: number }
interface WorkflowStep {
  step: number; step_name: string; role_name: string; role_id: number;
  sla_hours: number; form_type_id: number; action_allowed_json: string[];
  transition_map_json: Record<string, TransitionTarget>;
  can_verify_document?: string; sla_breach_requires_reason?: boolean;
  is_delay_reason_required?: string; jurisdiction_level?: string;
}
interface FormType { id: number; type_name: string }
interface Props { steps: WorkflowStep[]; formTypes?: FormType[]; onClose: () => void }

// Layout
const CW = 178, CH = 268, GAP = 90, PX = 40, PTOP = 78, PBOT = 105, STEP = CW + GAP;

const THEMES = [
  { hdr: '#1d4ed8', body: '#dbeafe', border: '#3b82f6', txt: '#1e3a8a', acc: '#1d4ed8' },
  { hdr: '#6d28d9', body: '#ede9fe', border: '#8b5cf6', txt: '#3b0764', acc: '#6d28d9' },
  { hdr: '#0e7490', body: '#cffafe', border: '#06b6d4', txt: '#164e63', acc: '#0e7490' },
  { hdr: '#b45309', body: '#fef3c7', border: '#f59e0b', txt: '#78350f', acc: '#b45309' },
  { hdr: '#15803d', body: '#dcfce7', border: '#22c55e', txt: '#14532d', acc: '#15803d' },
];
const th = (i: number) => THEMES[i % THEMES.length];

const AC: Record<string, { c: string; l: string }> = {
  APPROVE:             { c: '#15803d', l: 'Approve'           },
  SUBMIT:              { c: '#1d4ed8', l: 'Submit'            },
  FORWARD:             { c: '#1d4ed8', l: 'Forward'           },
  SUBMIT_REPORT:       { c: '#1d4ed8', l: 'Submit Report'     },
  REJECT:              { c: '#dc2626', l: 'Reject'            },
  REVERT:              { c: '#c2410c', l: 'Revert'            },
  REVERT_TO_APPLICANT: { c: '#c2410c', l: 'Revert to Applicant' },
  QUERY:               { c: '#b45309', l: 'Send Query'        },
  SAVE_DRAFT:          { c: '#475569', l: 'Save Draft'        },
};
const ac = (a: string) => AC[a.toUpperCase()] ?? { c: '#1d4ed8', l: a.replace(/_/g, ' ') };

// SVG text with white outline so it's always visible
function T({ x, y, txt, size, weight, fill, anchor = 'middle' }: {
  x: number; y: number; txt: string; size: number; weight: number; fill: string; anchor?: string;
}) {
  const base = { textAnchor: anchor as any, fontSize: size, fontWeight: weight, fontFamily: 'Arial, system-ui, sans-serif' };
  return (
    <>
      <text x={x} y={y} {...base} fill="#fff" stroke="#fff" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke">{txt}</text>
      <text x={x} y={y} {...base} fill={fill}>{txt}</text>
    </>
  );
}

function Arrow({ x, y, dir, c }: { x: number; y: number; dir: 'r' | 'd' | 'l' | 'u'; c: string }) {
  if (dir === 'r') return <polygon points={`${x},${y - 5} ${x + 9},${y} ${x},${y + 5}`} fill={c} />;
  if (dir === 'd') return <polygon points={`${x - 5},${y} ${x + 5},${y} ${x},${y + 9}`} fill={c} />;
  if (dir === 'u') return <polygon points={`${x - 5},${y} ${x + 5},${y} ${x},${y - 9}`} fill={c} />;
  return <polygon points={`${x},${y - 5} ${x - 9},${y} ${x},${y + 5}`} fill={c} />;
}

function Lbl({ cx, cy, txt, c, w }: { cx: number; cy: number; txt: string; c: string; w?: number }) {
  const bw = w ?? Math.max(txt.length * 7 + 16, 52);
  return (
    <g>
      <rect x={cx - bw / 2} y={cy - 9} width={bw} height={18} rx={9} fill="#fff" stroke={c} strokeWidth={1.5} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill={c} fontSize={9.5} fontWeight={800} fontFamily="Arial, sans-serif">{txt}</text>
    </g>
  );
}

export default function WorkflowVisualizer({ steps, formTypes = [], onClose }: Props) {
  const sorted  = [...steps].sort((a, b) => a.step - b.step);
  const stepMap = new Map(sorted.map((s, i) => [s.step, { ...s, idx: i }]));
  const ftMap   = new Map(formTypes.map(f => [f.id, f.type_name]));
  const n       = sorted.length;

  const VW = PX * 2 + n * CW + (n - 1) * GAP + GAP + 155;
  const VH = PTOP + CH + PBOT;

  const cX  = (i: number) => PX + i * STEP;           // card left edge
  const cCX = (i: number) => cX(i) + CW / 2;          // card center-x
  const midY = PTOP + CH / 2;
  const endNX = PX + n * STEP + 8;                     // end node x
  const endNY = PTOP + CH / 2 - 26;                    // end node y

  // Find which step/action leads to the end node for APPROVE-type final decision
  const approveTerminals = sorted.flatMap((s, idx) =>
    Object.entries(s.transition_map_json ?? {})
      .filter(([a, t]) => t.next_step === 0 && ['APPROVE','FORWARD','SUBMIT','SUBMIT_REPORT'].includes(a.toUpperCase()))
      .map(([a]) => ({ idx, stepNum: s.step, action: a }))
  );
  const rejectTerminals = sorted.flatMap((s, idx) =>
    Object.entries(s.transition_map_json ?? {})
      .filter(([a, t]) => t.next_step === 0 && !['APPROVE','FORWARD','SUBMIT','SUBMIT_REPORT'].includes(a.toUpperCase()))
      .map(([a]) => ({ idx, stepNum: s.step, action: a }))
  );
  const hasEnd = approveTerminals.length > 0 || (n > 0 && Object.values(sorted[n-1].transition_map_json ?? {}).some(t => t.next_step === 0));

  return (
    <div style={S.ov} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={S.hdr}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-diagram-3-fill" style={{ fontSize: 19, color: '#6d28d9' }} />
            <span style={{ fontWeight: 800, fontSize: 17, color: '#1e293b' }}>Workflow Flowchart</span>
            <span style={{ fontSize: 11, background: '#e2e8f0', color: '#475569', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
              {n} steps
            </span>
          </div>
          <button onClick={onClose} style={S.closeBtn}><i className="bi bi-x-lg" /></button>
        </div>

        {/* Legend */}
        <div style={S.leg}>
          {[['FORWARD','Forward / Approve'],['REJECT','Reject'],['REVERT_TO_APPLICANT','Revert'],['QUERY','Query']].map(([k, l]) => (
            <span key={k} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11 }}>
              <svg width={28} height={10}>
                <line x1={0} y1={5} x2={18} y2={5} stroke={ac(k).c} strokeWidth={2.5} />
                <polygon points="18,2 28,5 18,8" fill={ac(k).c} />
              </svg>
              <span style={{ color:'#334155', fontWeight:700 }}>{l}</span>
            </span>
          ))}
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:'#475569', fontWeight:600 }}>
            <svg width={28} height={10}><line x1={0} y1={5} x2={28} y2={5} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4,2" /></svg>
            Loop back
          </span>
        </div>

        {/* SVG canvas — viewBox auto-scales, no scroll */}
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
            <rect width={VW} height={VH} fill="#f1f5f9" />

            {/* ── Arrows behind cards ── */}
            {sorted.map((step, idx) => {
              const txs   = Object.entries(step.transition_map_json ?? {});
              const srcR  = cX(idx) + CW;
              const srcL  = cX(idx);
              const srcCX = cCX(idx);
              return (
                <g key={`a-${step.step}`}>
                  {txs.map(([action, target]) => {
                    const { c, l } = ac(action);
                    const isApproveType = ['APPROVE','FORWARD','SUBMIT','SUBMIT_REPORT'].includes(action.toUpperCase());

                    // Forward →
                    if (target.next_step > step.step) {
                      const tgt = [...stepMap.values()].find(s => s.step === target.next_step);
                      if (!tgt) return null;
                      const tgtL = cX(tgt.idx);
                      const mx = (srcR + tgtL) / 2;
                      return (
                        <g key={action}>
                          <line x1={srcR} y1={midY} x2={tgtL - 8} y2={midY} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
                          <Arrow x={tgtL - 8} y={midY} dir="r" c={c} />
                          <Lbl cx={mx} cy={midY - 16} txt={l} c={c} />
                        </g>
                      );
                    }

                    // Terminal APPROVE → Application Completed (bottom path)
                    if (target.next_step === 0 && isApproveType) {
                      if (idx === n - 1) {
                        // Last step → straight right to end node
                        return (
                          <g key={action}>
                            <line x1={srcR} y1={midY} x2={endNX - 1} y2={midY} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
                            <Arrow x={endNX - 1} y={midY} dir="r" c={c} />
                            <Lbl cx={(srcR + endNX) / 2} cy={midY - 14} txt={l} c={c} />
                          </g>
                        );
                      } else {
                        // Non-last step → path below all cards to end node
                        const belowY = PTOP + CH + 55;
                        const endBtm = endNY + 52;
                        return (
                          <g key={action}>
                            <path
                              d={`M ${srcCX} ${PTOP + CH} L ${srcCX} ${belowY} L ${endNX + 65} ${belowY} L ${endNX + 65} ${endBtm}`}
                              fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                            />
                            <Arrow x={endNX + 65} y={endBtm} dir="d" c={c} />
                            <Lbl cx={(srcCX + endNX + 65) / 2} cy={belowY - 11} txt={l} c={c} />
                          </g>
                        );
                      }
                    }

                    // Terminal REJECT → drop down below step
                    if (target.next_step === 0 && !isApproveType) {
                      const dY  = PTOP + CH + 16;
                      const eY  = VH - 24;
                      return (
                        <g key={action}>
                          <line x1={srcCX} y1={PTOP + CH} x2={srcCX} y2={eY - 8} stroke={c} strokeWidth={2} strokeDasharray="5,3" strokeLinecap="round" />
                          <Arrow x={srcCX} y={eY - 8} dir="d" c={c} />
                          <Lbl cx={srcCX} cy={dY + 10} txt={l} c={c} w={54} />
                          <rect x={srcCX - 40} y={eY} width={80} height={22} rx={11} fill={c + '18'} stroke={c} strokeWidth={1.5} />
                          <text x={srcCX} y={eY + 15} textAnchor="middle" fill={c} fontSize={10} fontWeight={800} fontFamily="Arial,sans-serif">End / Rejected</text>
                        </g>
                      );
                    }

                    // Loop-back arc ↩
                    if (target.next_step > 0 && target.next_step < step.step) {
                      const tgt  = [...stepMap.values()].find(s => s.step === target.next_step);
                      if (!tgt) return null;
                      const tgtR = cX(tgt.idx) + CW;
                      const aY   = PTOP - 22;
                      const mAX  = (srcL + tgtR) / 2;
                      return (
                        <g key={action}>
                          <path
                            d={`M ${srcL} ${PTOP + 22} C ${srcL - 20} ${aY - 28}, ${tgtR + 20} ${aY - 28}, ${tgtR} ${PTOP + 22}`}
                            fill="none" stroke={c} strokeWidth={2} strokeDasharray="6,3" strokeLinecap="round"
                          />
                          <Arrow x={tgtR} y={PTOP + 22} dir="r" c={c} />
                          <Lbl cx={mAX} cy={aY - 36} txt={l} c={c} w={Math.max(l.length * 7 + 14, 60)} />
                        </g>
                      );
                    }
                    return null;
                  })}
                </g>
              );
            })}

            {/* ── Step Cards ── */}
            {sorted.map((step, idx) => {
              const t    = th(idx);
              const x    = cX(idx);
              const abbr = ftMap.get(step.form_type_id) ?? null;
              const HDR  = 38;
              const bY   = PTOP + HDR;  // body top y

              // wrap step_name into lines
              const words = step.step_name.split(' ');
              const half  = Math.ceil(words.length / 2);
              const ln1   = words.slice(0, half).join(' ');
              const ln2   = words.slice(half).join(' ');
              const oneLn = step.step_name.length <= 18;

              const actions = step.action_allowed_json ?? [];
              const ph = 24, pg = 5;

              const metaItems: Array<{ lbl: string }> = [];
              if (step.sla_hours > 0) metaItems.push({ lbl: `⏱ ${step.sla_hours}h SLA` });
              if (step.sla_breach_requires_reason || step.is_delay_reason_required === 'Y') metaItems.push({ lbl: '⚠ Delay Req.' });
              if (step.can_verify_document === 'Y') metaItems.push({ lbl: '✓ Doc Verify' });
              if (step.jurisdiction_level) metaItems.push({ lbl: `📍 ${step.jurisdiction_level}` });

              return (
                <g key={step.step}>
                  {/* Shadow */}
                  <rect x={x + 3} y={PTOP + 3} width={CW} height={CH} rx={14} fill="rgba(0,0,0,0.13)" />
                  {/* Body */}
                  <rect x={x} y={PTOP} width={CW} height={CH} rx={14} fill={t.body} stroke={t.border} strokeWidth={2} />
                  {/* Header */}
                  <rect x={x} y={PTOP} width={CW} height={HDR} rx={14} fill={t.hdr} />
                  <rect x={x} y={PTOP + HDR - 10} width={CW} height={10} fill={t.hdr} />

                  {/* Step badge */}
                  <rect x={x + 8} y={PTOP + 7} width={58} height={24} rx={12} fill="rgba(255,255,255,0.25)" />
                  <text x={x + 37} y={PTOP + 24} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={900} fontFamily="Arial,sans-serif">STEP {step.step}</text>

                  {/* Form abbr */}
                  {abbr && (
                    <text x={x + CW - 8} y={PTOP + 25} textAnchor="end" fill="#fff" fontSize={13} fontWeight={900} fontFamily="monospace">{abbr}</text>
                  )}

                  {/* Step name — large bold */}
                  {oneLn ? (
                    <text x={x + CW / 2} y={bY + 27} textAnchor="middle" fill={t.txt} fontSize={15} fontWeight={900} fontFamily="Arial,sans-serif">{step.step_name}</text>
                  ) : (
                    <>
                      <text x={x + CW / 2} y={bY + 19} textAnchor="middle" fill={t.txt} fontSize={15} fontWeight={900} fontFamily="Arial,sans-serif">{ln1}</text>
                      <text x={x + CW / 2} y={bY + 36} textAnchor="middle" fill={t.txt} fontSize={15} fontWeight={900} fontFamily="Arial,sans-serif">{ln2}</text>
                    </>
                  )}

                  {/* Role */}
                  <text x={x + CW / 2} y={bY + 55} textAnchor="middle" fill={t.acc} fontSize={13} fontWeight={800} fontFamily="Arial,sans-serif">▶ {step.role_name}</text>

                  {/* Divider */}
                  <line x1={x + 12} y1={bY + 63} x2={x + CW - 12} y2={bY + 63} stroke={t.border} strokeWidth={1.5} />

                  {/* Meta badges */}
                  {(() => {
                    const bw = 78, bh = 20, bgap = 4, perRow = 2;
                    return metaItems.map((m, mi) => {
                      const col2 = mi % perRow, row = Math.floor(mi / perRow);
                      const rowCount = Math.min(metaItems.length - row * perRow, perRow);
                      const rowW = rowCount * bw + (rowCount - 1) * bgap;
                      const bx  = x + CW / 2 - rowW / 2 + col2 * (bw + bgap);
                      const by2 = bY + 69 + row * (bh + 4);
                      return (
                        <g key={mi}>
                          <rect x={bx} y={by2} width={bw} height={bh} rx={10} fill={t.hdr + '22'} stroke={t.border} strokeWidth={1.3} />
                          <text x={bx + bw / 2} y={by2 + 14} textAnchor="middle" fill={t.acc} fontSize={11} fontWeight={800} fontFamily="Arial,sans-serif">{m.lbl}</text>
                        </g>
                      );
                    });
                  })()}

                  {/* Actions label */}
                  <text x={x + CW / 2} y={bY + 122} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={800} fontFamily="Arial,sans-serif" letterSpacing={1.5}>ACTIONS</text>

                  {/* Action pills — dynamic width, 2 per row */}
                  {(() => {
                    return actions.map((a, ai) => {
                      const col  = ac(a);
                      const pw2  = Math.min(Math.max(col.l.length * 8 + 18, 60), CW - 20);
                      const row  = Math.floor(ai / 2);
                      const ci   = ai % 2;
                      const rCount = Math.min(actions.length - row * 2, 2);
                      const rW   = rCount === 1 ? pw2 : Math.min(pw2 * 2 + pg, CW - 20);
                      const aw2  = rCount === 1 ? pw2 : (rW - pg) / 2;
                      const ax   = x + CW / 2 - rW / 2 + ci * (aw2 + pg);
                      const ay   = bY + 128 + row * (ph + 5);
                      return (
                        <g key={a}>
                          <rect x={ax} y={ay} width={aw2} height={ph} rx={12} fill={col.c + '1a'} stroke={col.c} strokeWidth={2} />
                          <text x={ax + aw2 / 2} y={ay + 16} textAnchor="middle" fill={col.c} fontSize={11.5} fontWeight={900} fontFamily="Arial,sans-serif">{col.l}</text>
                        </g>
                      );
                    });
                  })()}
                </g>
              );
            })}

            {/* ── Application Completed node ── */}
            {hasEnd && (
              <g>
                <rect x={endNX + 2} y={endNY + 2} width={132} height={52} rx={26} fill="rgba(0,0,0,0.1)" />
                <rect x={endNX} y={endNY} width={132} height={52} rx={26} fill="#f0fdf4" stroke="#16a34a" strokeWidth={2.5} />
                <text x={endNX + 66} y={endNY + 19} textAnchor="middle" fill="#15803d" fontSize={12} fontWeight={900} fontFamily="Arial,sans-serif">🏁 Application</text>
                <text x={endNX + 66} y={endNY + 37} textAnchor="middle" fill="#15803d" fontSize={12} fontWeight={900} fontFamily="Arial,sans-serif">Completed</text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

const S = {
  ov:      { position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16 } as React.CSSProperties,
  modal:   { background:'#fff', borderRadius:18, border:'1px solid #e2e8f0', width:'96vw', maxWidth:1440, height:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 30px 80px rgba(0,0,0,0.3)', overflow:'hidden' } as React.CSSProperties,
  hdr:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid #e2e8f0', background:'#fff', flexShrink:0 } as React.CSSProperties,
  closeBtn:{ background:'none', border:'none', fontSize:17, cursor:'pointer', color:'#94a3b8', padding:'4px 8px', borderRadius:6 } as React.CSSProperties,
  leg:     { display:'flex', flexWrap:'wrap' as const, gap:18, padding:'7px 20px', borderBottom:'1px solid #f1f5f9', background:'#fafafa', flexShrink:0 } as React.CSSProperties,
};
