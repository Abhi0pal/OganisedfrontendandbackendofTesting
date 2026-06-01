import React from 'react';

type PrintSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function PrintSection({ title, children }: PrintSectionProps) {
  return (
    <div className="print-section">
      <div className="print-section-title">{title}</div>
      <div className="print-section-body">{children}</div>
    </div>
  );
}
