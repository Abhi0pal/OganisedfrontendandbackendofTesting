import React from 'react';
import CapacityInputCell from '@/components/(investor)/inprinciple/steps/shared/CapacityInputCell';

type ProductItem = {
  annual_capacity?: string | number;
  product_unit?: string;
  product_hsn?: string | number;
  product_description?: string;
  existing_annual_capacity?: string | number;
};

type ExistingProductTableProps = {
  items: ProductItem[];
  disabled?: boolean;
  getHsnLabel: (value: any) => string;
  onCapacityChange: (index: number, value: string) => void;
  onDescriptionChange?: (index: number, value: string) => void;
};

export default function ExistingProductTable({
  items,
  disabled,
  getHsnLabel,
  onCapacityChange,
  onDescriptionChange,
}: ExistingProductTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="px-4 py-3">Product/HSN Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Existing Annual Capacity</th>
              <th className="px-4 py-3">New Annual Capacity</th>
              <th className="px-4 py-3">Unit</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`product-${index}`} className="border-t border-gray-200">
                <td className="px-4 py-3">{getHsnLabel(item.product_hsn)}</td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.product_description ?? ''}
                    disabled={disabled}
                    onChange={(event) => onDescriptionChange?.(index, event.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
                  />
                </td>
                <td className="px-4 py-3">{item.existing_annual_capacity ?? item.annual_capacity ?? '-'}</td>
                <td className="px-4 py-3">
                  <CapacityInputCell
                    value={item.annual_capacity}
                    existingValue={item.existing_annual_capacity ?? item.annual_capacity}
                    disabled={disabled}
                    onChange={(value) => onCapacityChange(index, value)}
                  />
                </td>
                <td className="px-4 py-3">{item.product_unit || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
