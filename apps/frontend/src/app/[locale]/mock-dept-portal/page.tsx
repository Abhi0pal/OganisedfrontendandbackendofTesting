
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

export default function MockDeptPortalPage() {
  // This hook is safe for hydration: Next provides a stable snapshot of the URL search params
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const app = searchParams.get('app');

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h1>Mock Department Portal</h1>
      <p>This is a dummy page to simulate the department redirect.</p>

      <ul>
        {uid && (
          <li>
            <strong>UID:</strong> {uid}
          </li>
        )}
        {app && (
          <li>
            <strong>App ID:</strong> {app}
          </li>
        )}
      </ul>

      <p style={{ marginTop: 16, color: '#666' }}>
        Replace this page with the real department’s portal once integrated.
      </p>
    </main>
  );
}
