export type ShellState = {
  action: string;
  comments: string;
  reasonForDelay: string;
  roleIdsCsv: string;
  userIdsCsv: string;
  supportiveDocument: string;
  blockPayload: Record<string, unknown>;
  forwardRoleIds: number[];
  forwardDestinations: string[];
  forwardedDeptIds: number[];
  selectedRecipients: SelectedRecipient[];
};

export type SelectedRecipient = {
  forwardedDeptId: number;
  nextRoleId: number;
  nextUserId: number;
};

export type WorkflowDocument = {
  documentsId: number;
  checklistDocumentName: string;
  fileName?: string | null;
  filePath?: string | null;
  mappingStatus?: string | null;
  documentStatus?: string | null;
  createdOn?: string | null;
  isMandatory?: boolean;
  comments?: string | null;
  documentTypeName?: string | null;
  documentVersion?: string | null;
};

export type DocumentStatus = 'V' | 'U' | 'R' | 'M';

export type DocumentActionState = {
  status: DocumentStatus;
  comments: string;
  savedStatus?: DocumentStatus;
  savedComments?: string;
  locked?: boolean;
};

export type TimelineEntry = {
  id: number;
  sequence: number;
  status: string;
  actionBy: string;
  actorName?: string | null;
  actorRole?: string | null;
  actionOn?: string | null;
  comments?: string | null;
  timeTakenByApplicantSeconds?: number;
  timeTakenByDepartmentSeconds?: number;
  timeTakenByLineDepartmentSeconds?: number;
  nextRoleId?: string | null;
  param1?: string | null;
};

export type DropdownOption = {
  label: string;
  value?: string;
  disabled?: boolean;
};

export type AssignableRole = {
  roleId: number;
  users: Array<{
    userId: number;
    fullName?: string | null;
    deptId?: number | null;
    districtId?: number | null;
  }>;
};

export type ForwardRecipientPreviewRow = {
  forwardedDeptId?: number;
  nextRoleId?: number;
  nextUserId?: number | null;
  forwardedDistId?: number | null;
  departmentId: number;
  departmentName: string | null;
  roleId: number;
  roleName: string | null;
  userId: number | null;
  userName: string | null;
  districtId?: number | null;
  districtName?: string | null;
  jurisdictionLevel: string;
};
