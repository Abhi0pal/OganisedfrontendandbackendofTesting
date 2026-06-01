'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Bootstrap is loaded globally via CDN in your _document or layout ──

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  currentLang: string;
}

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'ta', label: 'தமிழ்' },
  { id: 'te', label: 'తెలుగు' },
  { id: 'kn', label: 'ಕನ್ನಡ' },
  { id: 'ml', label: 'മലയാളം' },
  { id: 'bn', label: 'বাংলা' },
  { id: 'mr', label: 'मराठी' },
  { id: 'gu', label: 'ગુજરાતી' },
  { id: 'pa', label: 'ਪੰਜਾਬੀ' },
  { id: 'ur', label: 'اردو' },
  { id: 'or', label: 'ଓଡ଼ିଆ' },
  { id: 'as', label: 'অসমীয়া' },
];

const STAGES = [
  { id: '1', label: 'Pre-Establishment', value: 'Pre-establishment' },
  { id: '2', label: 'Pre-Operational', value: 'Pre-Operational' },
  { id: '3', label: 'Post-Operational', value: 'Operational' },
];

const POLICIES = [
  { value: 'swm', name: 'Solid Waste Management Act - 2026' }
];

type ChatMode = 'policy' | 'approval';

export default function JharkhandAssistant() {
  const [isOpen, setIsOpen]               = useState(false);
  const [mode, setMode]                   = useState<ChatMode>('policy');
  const [input, setInput]                 = useState('');
  const [selectedLang, setSelectedLang]   = useState('en');
  const [selectedPolicy, setSelectedPolicy] = useState('swm');
  const [selectedStage, setSelectedStage]   = useState('Pre-establishment');
  const [messages, setMessages]           = useState<Message[]>([]);
  const [isTyping, setIsTyping]           = useState(false);
  const [isRecording, setIsRecording]     = useState(false);

  const scrollRef       = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleChat = () => {
    setIsOpen(prev => {
      if (!prev) setMessages([]);
      return !prev;
    });
  };

  // ── Translation ──────────────────────────────────────────────────────────
  const handleTranslate = async (messageId: string, currentContent: string, newTargetLang: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || newTargetLang === msg.currentLang) return;

    try {
      const res = await fetch('https://admin.models.ai4bharat.org/inference/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLanguage: msg.currentLang,
          targetLanguage: newTargetLang,
          input: currentContent,
          task: 'translation',
          serviceId: 'ai4bharat/indictrans--gpu-t4',
          track: true,
        }),
      });
      const data = await res.json();
      const translated = data.output?.[0]?.target;
      if (translated) {
        setMessages(prev =>
          prev.map(m => m.id === messageId ? { ...m, content: translated, currentLang: newTargetLang } : m)
        );
      }
    } catch (err) { console.error('Translation Error:', err); }
  };

  // ── Voice ────────────────────────────────────────────────────────────────
  const transcribeAudio = async (blob: Blob, lang: string): Promise<string | null> => {
    const fd = new FormData();
    fd.append('audio', blob);
    fd.append('preferredLang', lang);
    try {
      const res = await fetch('http://localhost:8001/transcribe', { method: 'POST', body: fd });
      if (!res.ok) return null;
      const data = await res.json();
      return data.transcribed_text || null;
    } catch { return null; }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        setIsTyping(true);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const text = await transcribeAudio(blob, selectedLang);
        if (text) setInput(text);
        setIsTyping(false);
      };
      mr.start();
      setIsRecording(true);
    } catch { alert('Please allow microphone access.'); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  // ── API calls ────────────────────────────────────────────────────────────
  const fetchPolicyResponse = async (query: string) => {
    console.log('Fetching policy response for:', query, 'with policy:', selectedPolicy);
    const res = await fetch('http://localhost:8001/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.toLowerCase(), policy: selectedPolicy }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.response as string;
  };

  const fetchApprovalResponse = async (query: string) => {
    const res = await fetch('http://localhost:8001/api/know-your-approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.toLowerCase(), stage: selectedStage }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.response as string;
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, currentLang: selectedLang };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const botContent = mode === 'policy'
        ? await fetchPolicyResponse(userMsg.content)
        : await fetchApprovalResponse(userMsg.content);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: botContent || "Sorry, I couldn't process your request.",
        currentLang: selectedLang,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch { 
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role:'bot', content:'Unable to fetch response from server.', currentLang: selectedLang }]);
    } finally { setIsTyping(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1055 }}
      className="d-flex flex-column align-items-end"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              width: 'min(600px, 95vw)',
              height: '92vh',
              transformOrigin: 'bottom right',
            }}
            className="card shadow-lg border-0 d-flex flex-column overflow-hidden rounded-4"
          >
            {/* ── Header ── */}
            <div
              className="p-3 text-white position-relative flex-shrink-0"
              style={{ background: ' #335539' }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-sm position-absolute top-0 end-0 m-2 text-white"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, padding: 0 }}
              >
                <X size={16} />
              </button>
              <h5 className="fw-bold mb-0">
                Hello! I'm {process.env.NEXT_PUBLIC_CHATBOT_NAME}
              </h5>
              <small className="opacity-75 text-uppercase fw-semibold" style={{ letterSpacing: '0.08em' }}>
                Central Pollution Control Board Virtual Assistant
              </small>
            </div>

            {/* ── Sub-header ── */}
            <div className="px-3 py-1 bg-light border-bottom flex-shrink-0">
              <small className="text-muted">
                Round-the-Clock Support Bot 
              </small>
            </div>

            {/* ── Mode Toggle ── */}
            <div className="px-3 pt-2 pb-0 bg-white flex-shrink-0">
              <ul className="nav nav-tabs border-0" role="tablist">
                <li className="nav-item">
                  <button
                    className={`nav-link fw-semibold px-3 py-2 ${mode === 'policy' ? 'active' : 'text-secondary'}`}
                    style={mode === 'policy' ? { color: ' #335539', borderBottom: '2px solid  #335539', borderRadius: 0 } : {}}
                    onClick={() => { setMode('policy'); setMessages([]); }}
                  >
                    Know Your Acts
                  </button>
                </li>
              </ul>
            </div>

            {/* ── Filter Bar ── */}
            <div className="px-3 py-2 bg-light border-bottom flex-shrink-0">
              <div className="row g-2 align-items-center">
                {/* Language */}
                <div className="col-auto">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <RotateCcw size={13} style={{ color: ' #335539' }} />
                    </span>
                    <select
                      className="form-select form-select-sm border-start-0"
                      style={{ fontSize: '0.7rem', minWidth: 100 }}
                      value={selectedLang}
                      onChange={e => setSelectedLang(e.target.value)}
                    >
                      {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Policy or Stage */}
                <div className="col">
                  {mode === 'policy' ? (
                    <select
                      className="form-select form-select-sm border-primary"
                      style={{ fontSize: '0.7rem' }}
                      value={selectedPolicy}
                      onChange={e => setSelectedPolicy(e.target.value)}
                    >
                      {POLICIES.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
                    </select>
                  ) : (
                    <select
                      className="form-select form-select-sm border-primary"
                      style={{ fontSize: '0.7rem' }}
                      value={selectedStage}
                      onChange={e => setSelectedStage(e.target.value)}
                    >
                      {STAGES.map(s => <option key={s.id} value={s.value}>{s.label}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              className="flex-grow-1 overflow-auto p-3 bg-white"
              style={{ background: '#fff' }}
            >
              {messages.length === 0 && (
                <div className="text-center text-muted mt-4" style={{ fontSize: '0.85rem' }}>
                  <img src="/img/jiva_4.png" alt="bot" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 8 }} />
                  <p className="mb-0">
                    Welcome to <strong>GREENMIND AI</strong>, your CPCB Virtual Assistant. <br/>
                    Ask me anything about {mode === 'policy' ? 'environmental regulations, waste management rules, and compliance policies' : 'approvals, authorizations, and compliance procedures'}.
                    </p>
                </div>
              )}

              {messages.map(m => (
                <div
                  key={m.id}
                  className={`d-flex align-items-start gap-2 mb-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={m.role === 'user' ? '/img/user_avatar.png' : '/img/jiva_4.png'}
                    alt={m.role}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #e0e0e0' }}
                  />
                  <div
                    className={`d-flex flex-column ${m.role === 'user' ? 'align-items-end' : 'align-items-start'}`}
                    style={{ maxWidth: '78%' }}
                  >
                    <div
                      className={`p-2 rounded-3 shadow-sm ${
                        m.role === 'user'
                          ? 'bg-opacity-10 border text-dark rounded-top-end-0'
                          : 'text-dark rounded-top-start-0'
                      }`}
                      style={{
                        fontSize: '0.85rem',
                        background: m.role === 'bot' ? '#f0f2f5' : undefined,
                        borderColor: m.role === 'user' ? 'var(--primary-color,#2e7d32)' : undefined,
                      }}
                    >
                      {m.role === 'bot'
                        ? <div dangerouslySetInnerHTML={{ __html: m.content }} />
                        : <div>{m.content}</div>
                      }
                    </div>

                    {m.role === 'bot' && (
                      <div className="d-flex align-items-center gap-1 mt-1">
                        <small className="text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>Translate:</small>
                        <select
                          className="form-select form-select-sm py-0"
                          style={{ fontSize: '0.65rem', width: 'auto', height: 24 }}
                          value={m.currentLang}
                          onChange={e => handleTranslate(m.id, m.content, e.target.value)}
                        >
                          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="d-flex align-items-center gap-2 opacity-50 mb-2">
                  <div className="rounded-circle bg-secondary" style={{ width: 28, height: 28 }} />
                  <div
                    className="rounded-pill px-3 py-1 text-muted fst-italic"
                    style={{ background: '#f0f2f5', fontSize: '0.72rem' }}
                  >
                    {process.env.NEXT_PUBLIC_CHATBOT_NAME} is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* ── Input Area ── */}
            <div className="p-3 border-top bg-white flex-shrink-0">
              <div className="d-flex justify-content-between align-items-center mb-1 px-1">
                <small className="text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                  Please enter your query:
                </small>
                <button
                  className="btn btn-sm p-0 border-0"
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  <Mic
                    size={18}
                    style={{ color: isRecording ? '#dc3545' : ' #335539' }}
                    className={isRecording ? 'opacity-75' : ''}
                  />
                </button>
              </div>

              <div className="input-group rounded-3 shadow-sm">
                <textarea
                  className="form-control rounded-start-3 border-end-0"
                  placeholder="Type here..."
                  value={input}
                  rows={2}
                  style={{ resize: 'none', fontSize: '0.9rem' }}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="btn input-group-text rounded-end-3"
                  style={{ background: ' #335539', border: 'none' }}
                  onClick={handleSend}
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Button ── */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={toggleChat}
          className="btn p-0 border-0 shadow-lg rounded-circle"
          style={{ background: 'transparent' }}
          title="Open Assistant"
        >
          <img src="/img/jiva_4.png" alt="Open Chat" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
        </motion.button>
      )}
    </div>
  );
}