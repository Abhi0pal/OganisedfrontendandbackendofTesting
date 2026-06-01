'use client'

import * as React from "react"

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  children: React.ReactNode;
}

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType>({ open: false, setOpen: () => {} });

function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext);
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);
  return <span className={value ? '' : 'text-muted-foreground'}>{value || placeholder || 'Select...'}</span>;
}

function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen } = React.useContext(SelectContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div ref={ref} className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 ${className || ''}`}>
      {children}
    </div>
  );
}

function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(SelectContext);
  return (
    <div
      onClick={() => { ctx.onValueChange?.(value); ctx.setOpen(false); }}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${ctx.value === value ? 'bg-accent text-accent-foreground' : ''} ${className || ''}`}
    >
      {children}
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
