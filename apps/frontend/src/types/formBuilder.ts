export type FbFormSummary = {
  id: number;
  formTypeId: number;
  formName: string;
  formCode: string;
  pagesCount: number;
  tenantId?: number | null;
  projectId?: number | null;
  role_id?: number | null;
  tenant?: { name: string; tenant_ID?: string } | null;
  project?: { name: string; project_ID?: string } | null;
  role?: { name: string } | null;
};

export type FbServiceRow = {
  id: number; // numeric PK from m_service for DataTable dataKey
  serviceId: string;
  serviceName: string | null;
  forms: FbFormSummary[];
  tenantId?: number | null;
  projectId?: number | null;
  tenantName?: string | null;
  tenantCode?: string | null;
  projectName?: string | null;
  projectCode?: string | null;
};

export type FbPage = {
  id: number;
  service_id: string;
  page_name: string;
  name_in_hindi?: string | null;
  preference: number;
  form_id: number;
  form_code?: string | null;
  is_active: 'Y' | 'N';
};

export type FbPageCategory = {
  id: number;
  page_id: number;
  category_id: number;
  preference: number;
  help_text?: string | null;
  is_active: 'Y' | 'N';
};
