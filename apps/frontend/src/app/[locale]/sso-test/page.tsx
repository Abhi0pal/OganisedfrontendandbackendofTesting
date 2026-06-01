'use client';

import React, { useState } from 'react';
import { initiateSso } from '@/lib/sso-client';

export default function SsoTestPage() {
  const [form, setForm] = useState({
    // 👉 Use the mock department tag and service_id
    dept_tag: 'SIIDCUL_SWCS_$#@',
    service_id: '21',
    caf_id: '53534',
    app_id: '51649983948895210',
    uid: 'SW3249548270',
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await initiateSso(form);
      setResult(res);
    } catch (err: any) {
      setResult({ statusCode: 500, message: err?.message || 'Error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h1>SSO Test</h1>
      <p>Use this form to trigger <code>/sso/initiate</code> with the selected values.</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Department Tag
          <input value={form.dept_tag} onChange={update('dept_tag')} />
        </label>

        <label>
          Service ID
          <input value={form.service_id} onChange={update('service_id')} />
        </label>

        <label>
          CAF ID
          <input value={form.caf_id} onChange={update('caf_id')} />
        </label>

        <label>
          App ID
          <input value={form.app_id} onChange={update('app_id')} />
        </label>

        <label>
          UID
          <input value={form.uid} onChange={update('uid')} />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing…' : 'Initiate SSO'}
        </button>
      </form>

      <section style={{ marginTop: 24 }}>
        <h2>Response</h2>
        <pre style={{ background: '#f7f7f7', padding: 12, overflowX: 'auto' }}>
          {result ? JSON.stringify(result, null, 2) : 'Awaiting submission…'}
        </pre>
      </section>
    </main>
  );
}
