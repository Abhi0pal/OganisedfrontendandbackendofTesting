import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export type YnFlag = 'Y' | 'N';

export type PreviewOption = {
  label: string;
  value: any;
  disabled?: boolean;
  order?: number;
};

export type PreviewOptionConfig = {
  source_type: 'STATIC' | 'MASTER';
  master_table_id: number | null;
  parent_builder_field_id: number | null;
};

export type PreviewAddMoreColumn = {
  id: number;
  builder_field_id: number;
  col_order: number;
  field_code: string;
  label: string;
  input_type: string;
  is_required: YnFlag;
  is_editable: YnFlag;
  is_readonly: YnFlag;
  min_length: number | null;
  max_length: number | null;
  pattern: string | null;
  step: string | null;
  help_text: string | null;
  option_config?: PreviewOptionConfig | null;
  options: PreviewOption[] | null;
};

export type PreviewAddMoreGroup = {
  id: number;
  label: string;
  min_rows: number;
  max_rows: number | null;
  trigger_builder_field_id: number;
  columns: PreviewAddMoreColumn[];
};

export type PreviewField = {
  id: number;
  preference: number;
  field_code: string;
  label: string;
  input_type: string;
  is_required: YnFlag;
  is_editable: YnFlag;
  is_readonly: YnFlag;
  min_length: number | null;
  max_length: number | null;
  pattern: string | null;
  step: string | null;
  help_text: string | null;
  option_config?: PreviewOptionConfig | null;
  options: PreviewOption[] | null;
  add_more_groups: PreviewAddMoreGroup[];
};

export type PreviewCategory = {
  page_category_mapping_id: number;
  category_id: number;
  category_name: string;
  preference: number;
  help_text: string | null;
  fields: PreviewField[];
};

export type PreviewPage = {
  id: number;
  preference: number;
  page_name: string;
  name_in_hindi: string | null;
  categories: PreviewCategory[];
};

export type PreviewMeta = {
  serviceId: string;
  serviceName: string;
  formTypeId: number;
  formTypeName: string;
  departmentId?: number;
  departmentName?: string;
  formCode?: string;
  formName?: string;
};

export type PreviewRule = {
  id: number;
  scope: string;
  when_json: any;
  then_json: any;
  is_active: YnFlag;
};

export type FormBuilderPreviewResponse = {
  meta: PreviewMeta;
  pages: PreviewPage[];
  rules?: PreviewRule[];
  note?: string;
};

async function fetchFormBuilderPreview(serviceId: string, formTypeId: number, locale?: string) {
  const { data } = await apiClient.get<FormBuilderPreviewResponse>(
    `/master/form-builder/services/${serviceId}/forms/${formTypeId}/preview`,
    { params: { locale } },
  );
  return data;
}

export function useFormBuilderPreview(serviceId?: string, formTypeId?: number, locale?: string) {
  return useQuery({
    queryKey: ['fb-form-preview', serviceId, formTypeId, locale],
    queryFn: () => fetchFormBuilderPreview(serviceId as string, formTypeId as number, locale),
    enabled: Boolean(serviceId) && typeof formTypeId === 'number' && !Number.isNaN(formTypeId),
    staleTime: 30_000,
  });
}
