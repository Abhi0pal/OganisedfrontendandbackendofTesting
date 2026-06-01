import { Controller } from 'react-hook-form';
import { AutoComplete } from 'primereact/autocomplete';
import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';
import ExistingCapacityTable from '@/components/(investor)/inprinciple/steps/ExistingCapacityTable';
import ExistingProductTable from '@/components/(investor)/inprinciple/steps/ExistingProductTable';

type Step = DynamicFormConfig['steps'][number];

export type ProposedProjectDetailsContext = {
  capacityItems: any[];
  setCapacityItems: (next: any[]) => void;
  productItems: any[];
  setProductItems: (next: any[]) => void;
  nicCodes: { value: string | number; label: string }[];
  hsnCodes: { value: string | number; label: string }[];
  filteredNicCodes: { value: string | number; label: string }[];
  filteredHsnCodes: { value: string | number; label: string }[];
  setFilteredNicCodes: (next: { value: string | number; label: string }[]) => void;
  setFilteredHsnCodes: (next: { value: string | number; label: string }[]) => void;
  sectorOptions: { value: string | number; label: string }[];
  digitsPattern: RegExp;
  conditionalRequired: (fieldPath: string, expectedValue: string, message: string) => (value: any) => true | string;
  getFieldError: (methods: any, name: string) => string | undefined;
  setFormMethodsRef: (methods: any) => void;
  // Existing investor flow
  isExistingMode?: boolean;
  isFormLocked?: boolean;
  existingEmployment?: number | null;
  isDiversification?: boolean;
};

export const buildProposedProjectDetailsStep = (ctx: ProposedProjectDetailsContext): Step => {
  const {
    capacityItems,
    setCapacityItems,
    productItems,
    setProductItems,
    nicCodes,
    hsnCodes,
    filteredNicCodes,
    filteredHsnCodes,
    setFilteredNicCodes,
    setFilteredHsnCodes,
    sectorOptions,
    digitsPattern,
    conditionalRequired,
    getFieldError,
    setFormMethodsRef,
  } = ctx;

  const isLocked = !!ctx.isFormLocked;
  const isExistingMode = !!ctx.isExistingMode;
  const isDiversification = !!ctx.isDiversification;
  const existingEmployment = Number(ctx.existingEmployment ?? 0);

  return {
    id: 'step-3',
    title: 'Proposed Project Details',
    sections: [
      {
        id: 'activity-details',
        title: 'Proposed Capacity',
        columns: 3,
        fields: [
          { name: 'project.capacity_items', type: 'hidden' },
          {
            name: 'project.capacity_entry',
            label: '',
            type: 'custom',
            colSpan: 3,
          render: (methods) => {
            setFormMethodsRef(methods);
            const isLocked = !!ctx.isFormLocked;
            const isExistingMode = !!ctx.isExistingMode;
            const watchedItems = methods.watch('project.capacity_items');
            const currentItems = Array.isArray(watchedItems) ? watchedItems : capacityItems;
            const handleAddCapacity = async () => {
                if (isLocked) return;
                const fieldsToValidate = [
                  'project.activity_nic',
                  'project.sector',
                  'project.item_description',
                  'project.proposed_capacity',
                  'project.unit_type',
                ];
                const isValid = await methods.trigger(fieldsToValidate);
                if (!isValid) return;

                const data = methods.getValues('project') || {};
                  const next = [
                    ...capacityItems,
                    {
                      activity_nic: data.activity_nic || '',
                      sector: data.sector || '',
                      item_description: data.item_description || '',
                      proposed_capacity: data.proposed_capacity || '',
                      unit_type: data.unit_type || '',
                    },
                  ];
                  setCapacityItems(next);
                  methods.setValue('project.capacity_items', next);

                fieldsToValidate.forEach((field) => methods.setValue(field, ''));
              };

              const handleRemoveCapacity = (index: number) => {
                if (isLocked) return;
                const next = capacityItems.filter((_, i) => i !== index);
                setCapacityItems(next);
                methods.setValue('project.capacity_items', next);
              };

              const getNicLabel = (value: any) =>
                (nicCodes || []).find(
                  (opt: { value: string | number; label: string }) =>
                    String(opt.value) === String(value)
                )?.label || value || '-';
              const getSectorLabel = (value: any) =>
                sectorOptions.find(
                  (opt: { value: string | number; label: string }) =>
                    String(opt.value) === String(value)
                )?.label || value || '-';

              if (isExistingMode) {
                const handleCapacityChange = (index: number, value: string) => {
                  const cleaned = value.replace(/\D/g, '');
                  const next = currentItems.map((item: any, idx: number) =>
                    idx === index ? { ...item, proposed_capacity: cleaned } : item
                  );
                  setCapacityItems(next);
                  methods.setValue('project.capacity_items', next, { shouldValidate: true });
                };
                const handleDescriptionChange = (index: number, value: string) => {
                  const next = currentItems.map((item: any, idx: number) =>
                    idx === index ? { ...item, item_description: value } : item
                  );
                  setCapacityItems(next);
                  methods.setValue('project.capacity_items', next, { shouldValidate: true });
                };
                if (!isDiversification) {
                  return (
                    <ExistingCapacityTable
                      items={currentItems}
                      disabled={isLocked}
                      getNicLabel={getNicLabel}
                      getSectorLabel={getSectorLabel}
                      onCapacityChange={handleCapacityChange}
                      onDescriptionChange={handleDescriptionChange}
                    />
                  );
                }
                const handleAddCapacity = async () => {
                  if (isLocked) return;
                  const fieldsToValidate = [
                    'project.activity_nic',
                    'project.sector',
                    'project.item_description',
                    'project.proposed_capacity',
                    'project.unit_type',
                  ];
                  const isValid = await methods.trigger(fieldsToValidate);
                  if (!isValid) return;

                  const data = methods.getValues('project') || {};
                  const next = [
                    ...currentItems,
                    {
                      activity_nic: data.activity_nic || '',
                      sector: data.sector || '',
                      item_description: data.item_description || '',
                      proposed_capacity: data.proposed_capacity || '',
                      unit_type: data.unit_type || '',
                      is_new: true,
                    },
                  ];
                  setCapacityItems(next);
                  methods.setValue('project.capacity_items', next);
                  fieldsToValidate.forEach((field) => methods.setValue(field, ''));
                };

                const handleRemoveCapacity = (index: number) => {
                  if (isLocked) return;
                  const item = currentItems[index];
                  if (!item?.is_new) return;
                  const next = currentItems.filter((_, i) => i !== index);
                  setCapacityItems(next);
                  methods.setValue('project.capacity_items', next);
                };

                return (
                  <div className="space-y-6">
                    <ExistingCapacityTable
                      items={currentItems}
                      disabled={isLocked}
                      getNicLabel={getNicLabel}
                      getSectorLabel={getSectorLabel}
                      onCapacityChange={handleCapacityChange}
                      onDescriptionChange={handleDescriptionChange}
                    />
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Activity <span className="text-red-600">*</span>
                        </label>
                        <Controller
                          name="project.activity_nic"
                          control={methods.control}
                          rules={{ required: 'Please select activity' }}
                          render={({ field }) => (
                            <AutoComplete
                              value={
                                (nicCodes || []).find(
                                  (opt: { value: string | number; label: string }) =>
                                    String(opt.value) === String(field.value)
                                ) || ''
                              }
                              disabled={isLocked}
                              suggestions={filteredNicCodes}
                              completeMethod={(event) => {
                                const query = (event.query || '').toLowerCase();
                                if (!query) {
                                  setFilteredNicCodes(
                                    [...(nicCodes || [])] as { value: string | number; label: string }[]
                                  );
                                  return;
                                }
                                setFilteredNicCodes(
                                  (nicCodes || []).filter((opt: { label: string }) =>
                                    opt.label.toLowerCase().includes(query)
                                  ) as { value: string | number; label: string }[]
                                );
                              }}
                              field="label"
                              dropdown
                              placeholder="Select..."
                              className="w-full"
                              inputClassName="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                              panelClassName="swcs-autocomplete-panel"
                              appendTo="self"
                              dropdownMode="blank"
                              onFocus={() =>
                                setFilteredNicCodes(
                                  [...(nicCodes || [])] as { value: string | number; label: string }[]
                                )
                              }
                              onChange={(e) => {
                                if (e.value && typeof e.value === 'object' && 'value' in e.value) {
                                  field.onChange(e.value.value);
                                } else {
                                  field.onChange('');
                                }
                              }}
                              onClear={() =>
                                setFilteredNicCodes(
                                  [...(nicCodes || [])] as { value: string | number; label: string }[]
                                )
                              }
                              onBlur={field.onBlur}
                            />
                          )}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sector <span className="text-red-600">*</span>
                        </label>
                        <select
                          {...methods.register('project.sector', { required: 'Please select sector' })}
                          disabled={isLocked}
                          className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        >
                          <option value="">Select...</option>
                          {sectorOptions.map(
                            (option: { value: string | number; label: string }, index: number) => (
                              <option
                                key={`${String(option.value)}-${String(option.label)}-${index}`}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Description <span className="text-red-600">*</span>
                        </label>
                        <input
                          {...methods.register('project.item_description', {
                            required: 'Please enter item description',
                          })}
                          disabled={isLocked}
                          className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Proposed Annual Capacity <span className="text-red-600">*</span>
                        </label>
                        <input
                          {...methods.register('project.proposed_capacity', {
                            required: 'Please enter proposed annual capacity',
                            pattern: { value: digitsPattern, message: 'Proposed annual capacity should be numeric' },
                          })}
                          disabled={isLocked}
                          className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit(s) (Units/PD) <span className="text-red-600">*</span>
                        </label>
                        <select
                          {...methods.register('project.unit_type', { required: 'Please select unit type' })}
                          disabled={isLocked}
                          className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        >
                          <option value="">Select...</option>
                          <option value="meter">Meter</option>
                          <option value="ton">Ton</option>
                          <option value="metric_ton">Metric Ton</option>
                          <option value="kilo_liters_per_day">Kilo Liters per Day</option>
                          <option value="number">NUMBER</option>
                        </select>
                      </div>
                      <div className="col-span-12 md:col-span-4 flex items-end justify-end">
                        <button
                          type="button"
                          onClick={handleAddCapacity}
                          disabled={isLocked}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-700"
                        >
                          Add More
                        </button>
                      </div>
                    </div>
                    {currentItems.some((item: any) => item?.is_new) && (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-[900px] w-full text-left text-sm">
                            <thead className="bg-gray-700 text-white">
                              <tr>
                                <th className="px-4 py-3">Activity</th>
                                <th className="px-4 py-3">Sector</th>
                                <th className="px-4 py-3">Item Description</th>
                                <th className="px-4 py-3">Capacity</th>
                                <th className="px-4 py-3">Unit</th>
                                <th className="px-4 py-3">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems
                                .map((item: any, index: number) => ({ item, index }))
                                .filter((row) => row.item?.is_new)
                                .map(({ item, index }) => (
                                  <tr key={`new-capacity-${index}`} className="border-t border-gray-200">
                                    <td className="px-4 py-3">{getNicLabel(item.activity_nic)}</td>
                                    <td className="px-4 py-3">{getSectorLabel(item.sector)}</td>
                                    <td className="px-4 py-3">{item.item_description || '-'}</td>
                                    <td className="px-4 py-3">{item.proposed_capacity || '-'}</td>
                                    <td className="px-4 py-3">{item.unit_type || '-'}</td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCapacity(index)}
                                        disabled={isLocked}
                                        className="text-red-600 hover:underline"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Activity <span className="text-red-600">*</span>
                      </label>
                      <Controller
                        name="project.activity_nic"
                        control={methods.control}
                        rules={{ required: 'Please select activity' }}
                        render={({ field }) => (
                          <AutoComplete
                            value={
                              (nicCodes || []).find(
                                (opt: { value: string | number; label: string }) =>
                                  String(opt.value) === String(field.value)
                              ) || ''
                            }
                            disabled={isLocked}
                            suggestions={filteredNicCodes}
                            completeMethod={(event) => {
                              const query = (event.query || '').toLowerCase();
                              if (!query) {
                                setFilteredNicCodes(
                                  [...(nicCodes || [])] as { value: string | number; label: string }[]
                                );
                                return;
                              }
                              setFilteredNicCodes(
                                (nicCodes || []).filter((opt: { label: string }) =>
                                  opt.label.toLowerCase().includes(query)
                                ) as { value: string | number; label: string }[]
                              );
                            }}
                            field="label"
                            dropdown
                            placeholder="Select..."
                            className="w-full"
                            inputClassName="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            panelClassName="swcs-autocomplete-panel"
                            appendTo="self"
                            dropdownMode="blank"
                            onFocus={() =>
                              setFilteredNicCodes(
                                [...(nicCodes || [])] as { value: string | number; label: string }[]
                              )
                            }
                            onChange={(e) => {
                              if (e.value && typeof e.value === 'object' && 'value' in e.value) {
                                field.onChange(e.value.value);
                              } else {
                                field.onChange('');
                              }
                            }}
                            onClear={() =>
                              setFilteredNicCodes(
                                [...(nicCodes || [])] as { value: string | number; label: string }[]
                              )
                            }
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sector <span className="text-red-600">*</span>
                      </label>
                      <select
                        {...methods.register('project.sector', { required: 'Please select sector' })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">Select...</option>
                        {sectorOptions.map(
                          (option: { value: string | number; label: string }, index: number) => (
                          <option
                            key={`${String(option.value)}-${String(option.label)}-${index}`}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Description <span className="text-red-600">*</span>
                      </label>
                      <input
                        {...methods.register('project.item_description', {
                          required: 'Please enter item description',
                        })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proposed Annual Capacity <span className="text-red-600">*</span>
                      </label>
                      <input
                        {...methods.register('project.proposed_capacity', {
                          required: 'Please enter proposed annual capacity',
                          pattern: { value: digitsPattern, message: 'Proposed annual capacity should be numeric' },
                        })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit(s) (Units/PD) <span className="text-red-600">*</span>
                      </label>
                      <select
                        {...methods.register('project.unit_type', { required: 'Please select unit type' })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">Select...</option>
                        <option value="meter">Meter</option>
                        <option value="ton">Ton</option>
                        <option value="metric_ton">Metric Ton</option>
                        <option value="kilo_liters_per_day">Kilo Liters per Day</option>
                        <option value="number">NUMBER</option>
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-4 flex items-end justify-end">
                      <button
                        type="button"
                        onClick={handleAddCapacity}
                        disabled={isLocked}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Add More
                      </button>
                    </div>
                  </div>

                  {capacityItems.length > 0 && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full text-left text-sm">
                          <thead className="bg-gray-700 text-white">
                            <tr>
                              <th className="px-4 py-3">Activity</th>
                              <th className="px-4 py-3">Sector</th>
                              <th className="px-4 py-3">Item Description</th>
                              <th className="px-4 py-3">Capacity</th>
                              <th className="px-4 py-3">Unit</th>
                              <th className="px-4 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {capacityItems.map((item, index) => (
                              <tr key={`${item.item_description}-${index}`} className="border-t border-gray-200">
                                <td className="px-4 py-3">{getNicLabel(item.activity_nic)}</td>
                                <td className="px-4 py-3">{getSectorLabel(item.sector)}</td>
                                <td className="px-4 py-3">{item.item_description || '-'}</td>
                                <td className="px-4 py-3">{item.proposed_capacity || '-'}</td>
                                <td className="px-4 py-3">{item.unit_type || '-'}</td>
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCapacity(index)}
                                    disabled={isLocked}
                                    className="text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            },
          },
        ],
      },
      {
        id: 'product-details',
        title: 'Product Details',
        columns: 3,
        fields: [
          { name: 'project.product_items', type: 'hidden' },
          {
            name: 'project.product_entry',
            label: '',
            type: 'custom',
            colSpan: 3,
          render: (methods) => {
            setFormMethodsRef(methods);
            const isLocked = !!ctx.isFormLocked;
            const isExistingMode = !!ctx.isExistingMode;
            const watchedItems = methods.watch('project.product_items');
            const currentItems = Array.isArray(watchedItems) ? watchedItems : productItems;

            if (isExistingMode) {
              const getHsnLabel = (value: any) =>
                (hsnCodes || []).find(
                  (opt: { value: string | number; label: string }) =>
                    String(opt.value) === String(value)
                )?.label || value || '-';

              const handleCapacityChange = (index: number, value: string) => {
                const cleaned = value.replace(/\D/g, '');
                const next = currentItems.map((item: any, idx: number) =>
                  idx === index ? { ...item, annual_capacity: cleaned } : item
                );
                setProductItems(next);
                methods.setValue('project.product_items', next, { shouldValidate: true });
              };
              const handleDescriptionChange = (index: number, value: string) => {
                const next = currentItems.map((item: any, idx: number) =>
                  idx === index ? { ...item, product_description: value } : item
                );
                setProductItems(next);
                methods.setValue('project.product_items', next, { shouldValidate: true });
              };

              if (!isDiversification) {
                return (
                  <ExistingProductTable
                    items={currentItems}
                    disabled={isLocked}
                    getHsnLabel={getHsnLabel}
                    onCapacityChange={handleCapacityChange}
                    onDescriptionChange={handleDescriptionChange}
                  />
                );
              }

              const handleAddProduct = async () => {
                if (isLocked) return;
                const fieldsToValidate = [
                  'project.product_annual_capacity',
                  'project.product_unit',
                  'project.product_hsn',
                  'project.product_description',
                ];
                const isValid = await methods.trigger(fieldsToValidate);
                if (!isValid) return;

                const data = methods.getValues('project') || {};
                const next = [
                  ...currentItems,
                  {
                    annual_capacity: data.product_annual_capacity || '',
                    product_unit: data.product_unit || '',
                    product_hsn: data.product_hsn || '',
                    product_description: data.product_description || '',
                    is_new: true,
                  },
                ];
                setProductItems(next);
                methods.setValue('project.product_items', next);
                fieldsToValidate.forEach((field) => methods.setValue(field, ''));
              };

              const handleRemoveProduct = (index: number) => {
                if (isLocked) return;
                const item = currentItems[index];
                if (!item?.is_new) return;
                const next = currentItems.filter((_, i) => i !== index);
                setProductItems(next);
                methods.setValue('project.product_items', next);
              };

              return (
                <div className="space-y-6">
                  <ExistingProductTable
                    items={currentItems}
                    disabled={isLocked}
                    getHsnLabel={getHsnLabel}
                    onCapacityChange={handleCapacityChange}
                    onDescriptionChange={handleDescriptionChange}
                  />
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product/HSN Code <span className="text-red-600">*</span>
                      </label>
                      <Controller
                        name="project.product_hsn"
                        control={methods.control}
                        rules={{ required: 'Please select product/HSN code' }}
                        render={({ field }) => (
                          <AutoComplete
                            value={
                              (hsnCodes || []).find(
                                (opt: { value: string | number; label: string }) =>
                                  String(opt.value) === String(field.value)
                              ) || ''
                            }
                            disabled={isLocked}
                            suggestions={filteredHsnCodes}
                            completeMethod={(event) => {
                              const query = (event.query || '').toLowerCase();
                              if (!query) {
                                setFilteredHsnCodes(
                                  [...(hsnCodes || [])] as { value: string | number; label: string }[]
                                );
                                return;
                              }
                              setFilteredHsnCodes(
                                (hsnCodes || []).filter((opt: { label: string }) =>
                                  opt.label.toLowerCase().includes(query)
                                ) as { value: string | number; label: string }[]
                              );
                            }}
                            field="label"
                            dropdown
                            placeholder="Select..."
                            className="w-full"
                            inputClassName="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            panelClassName="swcs-autocomplete-panel"
                            appendTo="self"
                            dropdownMode="blank"
                            onFocus={() =>
                              setFilteredHsnCodes(
                                [...(hsnCodes || [])] as { value: string | number; label: string }[]
                              )
                            }
                            onChange={(e) => {
                              if (e.value && typeof e.value === 'object' && 'value' in e.value) {
                                field.onChange(e.value.value);
                              } else {
                                field.onChange('');
                              }
                            }}
                            onClear={() =>
                              setFilteredHsnCodes(
                                [...(hsnCodes || [])] as { value: string | number; label: string }[]
                              )
                            }
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Annual Capacity <span className="text-red-600">*</span>
                      </label>
                      <input
                        {...methods.register('project.product_annual_capacity', {
                          required: 'Please enter annual capacity',
                          pattern: { value: digitsPattern, message: 'Annual Capacity should be numeric' },
                        })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit(s) (Units/PD) <span className="text-red-600">*</span>
                      </label>
                      <select
                        {...methods.register('project.product_unit', { required: 'Please select unit' })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">Select...</option>
                        <option value="meter">Meter</option>
                        <option value="ton">Ton</option>
                        <option value="metric_ton">Metric Ton</option>
                        <option value="kilo_liters_per_day">Kilo Liters per Day</option>
                        <option value="number">NUMBER</option>
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-600">*</span>
                      </label>
                      <input
                        {...methods.register('project.product_description', {
                          required: 'Please enter description',
                        })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div className="col-span-12 flex items-end justify-end">
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        disabled={isLocked}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Add More
                      </button>
                    </div>
                  </div>
                  {currentItems.some((item: any) => item?.is_new) && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full text-left text-sm">
                          <thead className="bg-gray-700 text-white">
                            <tr>
                              <th className="px-4 py-3">Annual Capacity</th>
                              <th className="px-4 py-3">Unit</th>
                              <th className="px-4 py-3">Product/HSN Code</th>
                              <th className="px-4 py-3">Description</th>
                              <th className="px-4 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems
                              .map((item: any, index: number) => ({ item, index }))
                              .filter((row) => row.item?.is_new)
                              .map(({ item, index }) => (
                                <tr key={`new-product-${index}`} className="border-t border-gray-200">
                                  <td className="px-4 py-3">{item.annual_capacity || '-'}</td>
                                  <td className="px-4 py-3">{item.product_unit || '-'}</td>
                                  <td className="px-4 py-3">{getHsnLabel(item.product_hsn)}</td>
                                  <td className="px-4 py-3">{item.product_description || '-'}</td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProduct(index)}
                                      disabled={isLocked}
                                      className="text-red-600 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            const handleAddProduct = async () => {
                if (isLocked) return;
                const fieldsToValidate = [
                  'project.product_annual_capacity',
                  'project.product_unit',
                  'project.product_hsn',
                  'project.product_description',
                ];
                const isValid = await methods.trigger(fieldsToValidate);
                if (!isValid) return;

                const data = methods.getValues('project') || {};
                const next = [
                  ...productItems,
                  {
                    annual_capacity: data.product_annual_capacity || '',
                    product_unit: data.product_unit || '',
                    product_hsn: data.product_hsn || '',
                    product_description: data.product_description || '',
                  },
                ];
                setProductItems(next);
                methods.setValue('project.product_items', next);

                fieldsToValidate.forEach((field) => methods.setValue(field, ''));
              };

              const handleRemoveProduct = (index: number) => {
                if (isLocked) return;
                const next = productItems.filter((_, i) => i !== index);
                setProductItems(next);
                methods.setValue('project.product_items', next);
              };

              const getHsnLabel = (value: any) =>
                (hsnCodes || []).find(
                  (opt: { value: string | number; label: string }) =>
                    String(opt.value) === String(value)
                )?.label || value || '-';

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product/HSN Code <span className="text-red-600">*</span>
                      </label>
                      <Controller
                        name="project.product_hsn"
                        control={methods.control}
                        rules={{ required: 'Please select product/HSN code' }}
                        render={({ field }) => (
                            <AutoComplete
                              value={
                                (hsnCodes || []).find(
                                  (opt: { value: string | number; label: string }) =>
                                    String(opt.value) === String(field.value)
                                ) || ''
                              }
                              disabled={isLocked}
                              suggestions={filteredHsnCodes}
                            completeMethod={(event) => {
                              const query = (event.query || '').toLowerCase();
                              if (!query) {
                                setFilteredHsnCodes(
                                  [...(hsnCodes || [])] as { value: string | number; label: string }[]
                                );
                                return;
                              }
                              setFilteredHsnCodes(
                                (hsnCodes || []).filter((opt: { label: string }) =>
                                  opt.label.toLowerCase().includes(query)
                                ) as { value: string | number; label: string }[]
                              );
                            }}
                            field="label"
                            dropdown
                            placeholder="Select..."
                            className="w-full"
                            inputClassName="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            panelClassName="swcs-autocomplete-panel"
                            appendTo="self"
                            dropdownMode="blank"
                            onFocus={() =>
                              setFilteredHsnCodes(
                                [...(hsnCodes || [])] as { value: string | number; label: string }[]
                              )
                            }
                            onChange={(e) => {
                              if (e.value && typeof e.value === 'object' && 'value' in e.value) {
                                field.onChange(e.value.value);
                              } else {
                                field.onChange('');
                              }
                            }}
                            onClear={() =>
                              setFilteredHsnCodes(
                                [...(hsnCodes || [])] as { value: string | number; label: string }[]
                              )
                            }
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Annual Capacity <span className="text-red-600">*</span>
                      </label>
                      <input
                        {...methods.register('project.product_annual_capacity', {
                          required: 'Please enter annual capacity',
                          pattern: { value: digitsPattern, message: 'Annual capacity should be numeric' },
                        })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit(s) (Units/PD) <span className="text-red-600">*</span>
                      </label>
                      <select
                        {...methods.register('project.product_unit', {
                          required: 'Please select unit',
                        })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">Select...</option>
                        <option value="meter">Meter</option>
                        <option value="ton">Ton</option>
                        <option value="metric_ton">Metric Ton</option>
                        <option value="kilo_liters_per_day">Kilo Liters per Day</option>
                        <option value="number">NUMBER</option>
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-600">*</span>
                      </label>
                      <input
                        {...methods.register('project.product_description', {
                          required: 'Please enter description',
                        })}
                        disabled={isLocked}
                        className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none border-2 border-black focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div className="col-span-12 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        disabled={isLocked}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Add More
                      </button>
                    </div>
                  </div>

                  {productItems.length > 0 && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full text-left text-sm">
                          <thead className="bg-gray-700 text-white">
                            <tr>
                              <th className="px-4 py-3">Annual Capacity</th>
                              <th className="px-4 py-3">Unit</th>
                              <th className="px-4 py-3">Product/HSN Code</th>
                              <th className="px-4 py-3">Description</th>
                              <th className="px-4 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productItems.map((item, index) => (
                              <tr key={`${item.product_description}-${index}`} className="border-t border-gray-200">
                                <td className="px-4 py-3">{item.annual_capacity || '-'}</td>
                                <td className="px-4 py-3">{item.product_unit || '-'}</td>
                                <td className="px-4 py-3">{getHsnLabel(item.product_hsn)}</td>
                                <td className="px-4 py-3">{item.product_description || '-'}</td>
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(index)}
                                    disabled={isLocked}
                                    className="text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            },
          },
        ],
      },
      {
        id: 'production-details',
        title: 'Other Details',
        columns: 3,
        fields: [
        {
          name: 'project.exported',
          label: 'Production to be exported',
          type: 'radio',
          disabled: isLocked,
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          validation: { required: 'Please select an option' },
        },
        {
          name: 'project.export_percentage',
          label: 'Percentage of Production to be exported',
          type: 'custom',
          colSpan: 1,
          dependsOn: { field: 'project.exported', value: 'yes', show: true },
          render: (methods) =>
            methods.watch('project.exported') === 'yes' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage of Production to be exported <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...methods.register('project.export_percentage', {
                    validate: conditionalRequired(
                      'project.exported',
                      'yes',
                      'Please enter export percentage'
                    ),
                    pattern: {
                      value: /^\d+(\.\d+)?$/,
                      message: 'Percentage should be a number',
                    },
                  })}
                  inputMode="decimal"
                  disabled={isLocked}
                  onChange={(event) => {
                    const cleaned = event.target.value.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    const normalized = parts.length > 1
                      ? `${parts[0]}.${parts.slice(1).join('')}`
                      : cleaned;
                    methods.setValue('project.export_percentage', normalized, { shouldValidate: true });
                  }}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                {getFieldError(methods, 'project.export_percentage') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'project.export_percentage')}
                  </p>
                )}
              </div>
            ) : null,
        },
        {
          name: 'project.commencement_date',
          label: 'Expected Date of Commencement of Commercial Production',
          type: 'custom',
          colSpan: 1,
          dependsOn: { field: 'project.exported', value: 'yes', show: true },
          render: (methods) =>
            methods.watch('project.exported') === 'yes' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Date of Commencement of Commercial Production <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  {...methods.register('project.commencement_date', {
                    validate: conditionalRequired(
                      'project.exported',
                      'yes',
                      'Please select expected date'
                    ),
                  })}
                  disabled={isLocked}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                {getFieldError(methods, 'project.commencement_date') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'project.commencement_date')}
                  </p>
                )}
              </div>
            ) : null,
        },
        {
          name: 'project.row_break_1',
          label: '',
          type: 'custom',
          colSpan: 3,
          render: () => <div className="h-0" />,
        },
        {
          name: 'project.mou_signed',
          label: 'Have you signed MoU with Govt of Uttarakhand?',
          type: 'radio',
          colSpan: 1,
          disabled: isLocked,
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          validation: { required: 'Please select an option' },
        },
        {
          name: 'project.mou_month',
          label: 'Enter the Month and Year of MoU Signing',
          type: 'custom',
          colSpan: 1,
          dependsOn: { field: 'project.mou_signed', value: 'yes', show: true },
          render: (methods) => (
            <div className="min-h-[74px]">
              {methods.watch('project.mou_signed') === 'yes' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter the Month and Year of MoU Signing <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="month"
                    {...methods.register('project.mou_month', {
                      validate: conditionalRequired(
                        'project.mou_signed',
                        'yes',
                        'Please select MoU month/year'
                      ),
                    })}
                    disabled={isLocked}
                    className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                  {getFieldError(methods, 'project.mou_month') && (
                    <p className="mt-1 text-sm text-red-600 font-medium">
                      {getFieldError(methods, 'project.mou_month')}
                    </p>
                  )}
                </>
              )}
            </div>
          ),
        },
          {
            name: 'project.mou_spacer',
            label: '',
            type: 'custom',
            colSpan: 1,
            render: () => <div />,
          },
        {
          name: 'project.row_break_2',
          label: '',
          type: 'custom',
          colSpan: 3,
          render: () => <div className="h-0" />,
        },
        {
          name: 'project.iem_approval',
          label: 'Whether IEM Govt of India Approval Obtained?',
          type: 'radio',
          disabled: isLocked,
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          validation: { required: 'Please select an option' },
        },
        {
          name: 'project.iem_number',
          label: 'IEM Number',
          type: 'custom',
          colSpan: 1,
          dependsOn: { field: 'project.iem_approval', value: 'yes', show: true },
          render: (methods) =>
            methods.watch('project.iem_approval') === 'yes' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IEM Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...methods.register('project.iem_number', {
                    validate: conditionalRequired(
                      'project.iem_approval',
                      'yes',
                      'Please enter IEM number'
                    ),
                    pattern: { value: digitsPattern, message: 'IEM Number should be numeric' },
                  })}
                  inputMode="numeric"
                  disabled={isLocked}
                  onChange={(event) => {
                    const cleaned = event.target.value.replace(/\D/g, '');
                    methods.setValue('project.iem_number', cleaned, { shouldValidate: true });
                  }}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                {getFieldError(methods, 'project.iem_number') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'project.iem_number')}
                  </p>
                )}
              </div>
            ) : null,
        },
        {
          name: 'project.iem_spacer',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: () => <div />,
        },
        {
          name: 'project.row_break_3',
          label: '',
          type: 'custom',
          colSpan: 3,
          render: () => <div className="h-0" />,
        },
        {
          name: 'project.industrial_license',
          label:
            'Does your industry fall under any of the following sectors/activities for which an Industrial License (IL) under the Industries (Development & Regulation) Act 1951 is compulsory?',
          type: 'custom',
          colSpan: 2,
          render: (methods) => {
            const rawSelected = methods.watch('project.industrial_license');
            const selected: string[] = Array.isArray(rawSelected)
              ? rawSelected
              : rawSelected
                ? [String(rawSelected)]
                : [];
            const isNotApplicable = selected.includes('na');
            const hasOtherSelection = selected.some((item) => item !== 'na');
            const toggleValue = (value: string) => {
              let next = Array.isArray(selected) ? [...selected] : [];
              if (value === 'na') {
                next = isNotApplicable ? [] : ['na'];
              } else {
                next = next.filter((item) => item !== 'na');
                if (next.includes(value)) {
                  next = next.filter((item) => item !== value);
                } else {
                  next.push(value);
                }
              }
              methods.setValue('project.industrial_license', next);
            };

            const options = [
              { label: 'Not Applicable', value: 'na' },
              { label: 'Defence Sector', value: 'defence' },
              { label: 'Explosives Sector', value: 'explosives' },
              { label: 'Manufacturing of hazardous chemicals', value: 'hazard' },
              { label: 'Cigars and cigarettes of tobacco', value: 'tobacco' },
              { label: 'Manufacturing/testing of arms and ammunition', value: 'arms' },
            ];

            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Does your industry fall under any of the following sectors/activities for which an Industrial License (IL) under the Industries (Development & Regulation) Act 1951 is compulsory?
                  <span className="text-red-600 ml-1">*</span>
                </label>
                <input
                  type="hidden"
                  {...methods.register('project.industrial_license', {
                    validate: (value: string[]) =>
                      value && value.length > 0 ? true : 'Please select at least one option',
                  })}
                />
                <div className="flex flex-wrap gap-4 mt-1">
                  {options.map((option) => (
                    <label
                      key={option.value}
                      className="inline-flex items-center cursor-pointer mr-2.5 checkbox-wrap"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(option.value)}
                        disabled={
                          isLocked ||
                          (isNotApplicable && option.value !== 'na') ||
                          (hasOtherSelection && option.value === 'na')
                        }
                        onChange={() => toggleValue(option.value)}
                        className="w-4 h-4 mr-2"
                      />
                      <span className="text-sm text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          },
        },
        {
          name: 'project.industrial_license_obtained',
          label: 'Do you obtain the Industrial License Number?',
          type: 'custom',
          colSpan: 1,
          render: (methods) => {
            const selected: string[] = methods.watch('project.industrial_license') || [];
            if (!selected.length || selected.includes('na')) return null;
            return (
              <div className="mb-2.5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Do you obtain the Industrial License Number? <span className="text-red-600">*</span>
                </label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {['yes', 'no'].map((value) => (
                    <label
                      key={value}
                      className="inline-flex items-center cursor-pointer mr-2.5 radio-wrap"
                    >
                      <input
                        type="radio"
                        value={value}
                        {...methods.register('project.industrial_license_obtained', {
                          required: 'Please select an option',
                        })}
                        disabled={isLocked}
                        className="w-4 h-4 mr-2"
                      />
                      <span className="text-sm text-gray-900">
                        {value === 'yes' ? 'Yes' : 'No'}
                      </span>
                    </label>
                  ))}
                </div>
                {getFieldError(methods, 'project.industrial_license_obtained') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'project.industrial_license_obtained')}
                  </p>
                )}
              </div>
            );
          },
        },
        {
          name: 'project.industrial_license_number',
          label: 'Industrial License Number',
          colSpan: 1,
          type: 'custom',
          render: (methods) =>
            methods.watch('project.industrial_license_obtained') === 'yes' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industrial License Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...methods.register('project.industrial_license_number', {
                    validate: conditionalRequired(
                      'project.industrial_license_obtained',
                      'yes',
                      'Please enter Industrial License Number'
                    ),
                    pattern: { value: digitsPattern, message: 'Industrial License Number should be numeric' },
                  })}
                  disabled={isLocked}
                  className="w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50 border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                {getFieldError(methods, 'project.industrial_license_number') && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {getFieldError(methods, 'project.industrial_license_number')}
                  </p>
                )}
              </div>
            ) : null,
        },
        {
          name: 'project.row_break_5',
          label: '',
          type: 'custom',
          colSpan: 3,
          render: () => <div className="h-0" />,
        },
        {
          name: 'project.existing_direct_employment',
          label: 'Existing Direct Employment',
          type: 'text',
          colSpan: 1,
          disabled: true,
          dependsOn: {
            field: 'company.proposal_type',
            value: ['expansion', 'modernisation', 'diversification'],
            show: true,
          },
        },
        {
          name: 'project.total_direct_employment',
          label: 'Total Direct Employment',
          type: 'text',
          colSpan: 1,
          validation: {
            required: 'Please enter total direct employment',
            pattern: { value: digitsPattern, message: 'Total direct employment should be numeric' },
            validate: (value: any) => {
              if (!isExistingMode) return true;
              const current = Number(value || 0);
              if (!Number.isFinite(current)) return 'Total direct employment should be numeric';
              if (current < existingEmployment) {
                return 'Total direct employment cannot be less than existing employment';
              }
              return true;
            },
          },
          disabled: isLocked,
        },
      ],
    },
  ],
  };
};
