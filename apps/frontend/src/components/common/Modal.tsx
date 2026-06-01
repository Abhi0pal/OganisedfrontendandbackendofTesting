'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void | Promise<void>;
  isPrimaryLoading?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  full: 'max-w-[95%]',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  primaryButtonText,
  secondaryButtonText,
  onPrimaryClick,
  isPrimaryLoading,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm transition-all">
      <div className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl transition-all`}>
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{title ?? 'Modal Title'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="mt-4 text-lg leading-relaxed text-gray-600">{children}</div>

        {(primaryButtonText || secondaryButtonText) && (
          <div className="mt-10 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
            {secondaryButtonText && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-gray-200 px-8 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 active:scale-95"
              >
                {secondaryButtonText}
              </button>
            )}
            {primaryButtonText && (
              <button
                type="button"
                onClick={onPrimaryClick}
                disabled={isPrimaryLoading}
                style={{ backgroundColor: 'var(--primary-color)' }}
                className="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPrimaryLoading && (
                  <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {primaryButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}