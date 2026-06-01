import React from 'react';
import { formatDateTime } from '@/components/(investor)/inprinciple/utils/printUtils';

export default function PrintFooter() {
  return (
    <div
      className="print-footer"
      style={{
        borderTop: '1px solid #000',
        marginTop: '12px',
        paddingTop: '6px',
        fontSize: '10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        alignItems: 'center',
      }}
    >
      <div>Printed By: Department User</div>
      <div style={{ textAlign: 'center' }}>Printed On : {formatDateTime(new Date())}</div>
      <div className="print-page-number" style={{ textAlign: 'right' }} />
    </div>
  );
}
