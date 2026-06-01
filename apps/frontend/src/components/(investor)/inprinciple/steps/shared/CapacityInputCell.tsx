import React from 'react';
import { toNumber } from '@/components/(investor)/inprinciple/utils/numberUtils';

type CapacityInputCellProps = {
  value: string | number | null | undefined;
  existingValue: string | number | null | undefined;
  disabled?: boolean;
  onChange: (value: string) => void;
  errorMessage?: string;
};

export default function CapacityInputCell({
  value,
  existingValue,
  disabled,
  onChange,
  errorMessage = 'New capacity cannot be less than existing.',
}: CapacityInputCellProps) {
  const baseValue = toNumber(existingValue);
  const nextValue = toNumber(value);
  const showError = nextValue > 0 && nextValue < baseValue;

  return (
    <>
      <input
        type="text"
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-2 py-1.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
      />
      {showError && <p className="mt-1 text-xs text-red-600 font-medium">{errorMessage}</p>}
    </>
  );
}
