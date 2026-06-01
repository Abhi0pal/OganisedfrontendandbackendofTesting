'use client'

import * as React from "react"

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      {children}
    </div>
  );
}

function SheetContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`fixed right-0 top-0 h-full bg-background p-6 shadow-lg border-l animate-in slide-in-from-right ${className || 'w-[400px]'}`}>
      {children}
    </div>
  );
}

function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-2 ${className || ''}`}>{children}</div>;
}

function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className || ''}`}>{children}</h2>;
}

export { Sheet, SheetContent, SheetHeader, SheetTitle }
