import React from 'react';

type SbOption = {
  label: string;
  value: number;
};

type ExistingBusinessSelectorProps = {
  value: number | null;
  options: SbOption[];
  loading: boolean;
  disabled?: boolean;
  error?: string | null;
  onChange: (value: number) => void;
};

export default function ExistingBusinessSelector({
  value,
  options,
  loading,
  disabled,
  error,
  onChange,
}: ExistingBusinessSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select Approved SB ID <span className="text-red-600">*</span>
      </label>
      <select
        value={value ?? ''}
        disabled={disabled || loading}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      >
        <option value="">Select SB ID (CAF ID)</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {loading && <p className="text-xs text-gray-500">Loading approved SB IDs...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
