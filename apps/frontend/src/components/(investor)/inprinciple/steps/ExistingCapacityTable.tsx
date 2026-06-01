import React from 'react';
import CapacityInputCell from '@/components/(investor)/inprinciple/steps/shared/CapacityInputCell';

type CapacityItem = {
  activity_nic?: string | number;
  sector?: string | number;
  item_description?: string;
  proposed_capacity?: string | number;
  unit_type?: string;
  existing_proposed_capacity?: string | number;
};

type ExistingCapacityTableProps = {
  items: CapacityItem[];
  disabled?: boolean;
  getNicLabel: (value: any) => string;
  getSectorLabel: (value: any) => string;
  onCapacityChange: (index: number, value: string) => void;
  onDescriptionChange?: (index: number, value: string) => void;
};

export default function ExistingCapacityTable({
  items,
  disabled,
  getNicLabel,
  getSectorLabel,
  onCapacityChange,
  onDescriptionChange,
}: ExistingCapacityTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Item Description</th>
              <th className="px-4 py-3">Existing Capacity</th>
              <th className="px-4 py-3">New Proposed Capacity</th>
              <th className="px-4 py-3">Unit</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`capacity-${index}`} className="border-t border-gray-200">
                <td className="px-4 py-3">{getNicLabel(item.activity_nic)}</td>
                <td className="px-4 py-3">{getSectorLabel(item.sector)}</td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.item_description ?? ''}
                    disabled={disabled}
                    onChange={(event) => onDescriptionChange?.(index, event.target.value)}
                    className="w-full px-2 py-1.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100"
                  />
                </td>
                <td className="px-4 py-3">{item.existing_proposed_capacity ?? item.proposed_capacity ?? '-'}</td>
                <td className="px-4 py-3">
                  <CapacityInputCell
                    value={item.proposed_capacity}
                    existingValue={item.existing_proposed_capacity ?? item.proposed_capacity}
                    disabled={disabled}
                    onChange={(value) => onCapacityChange(index, value)}
                  />
                </td>
                <td className="px-4 py-3">{item.unit_type || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
