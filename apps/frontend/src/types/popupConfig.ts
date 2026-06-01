// ===================================
// Popup Configuration Types
// ===================================

export interface PopupSection {
  id: string;
  title: string;
  icon?: string;
  type: 'checklist' | 'process' | 'documents' | 'timeline' | 'custom';
  description?: string;
}

export interface ServicePopupConfig {
  serviceId: number;
  serviceName: string;
  displayTitle?: string;
  sections: PopupSection[];
  defaultSection?: string;
  showDownloadButton?: boolean;
  size?: 'normal' | 'large';
}

export interface DynamicPopupConfig {
  id: string;
  pageId: string;
  pageTitle: string;
  serviceName: string;
  sections: PopupSection[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ===================================
// Popup Data Structures
// ===================================

export interface ChecklistItem {
  id?: string;
  documentCode?: string;
  documentType?: string;
  issuedBy?: string;
  documentName?: string;
  is_required?: string;
  doc_comment?: string;
  documentPath?: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  duration?: string;
  icon?: string;
}

export interface TimelineItem {
  phase: string;
  duration: string;
  description: string;
}

// ===================================
// Default Configurations by Service Type
// ===================================

export const DEFAULT_POPUP_SECTIONS: Record<string, PopupSection[]> = {
  MARRIAGE_REGISTRATION: [
    {
      id: 'document-checklist',
      title: 'Document Checklist',
      icon: 'bi-file-earmark-check',
      type: 'checklist',
      description: 'Required documents for marriage registration',
    },
    {
      id: 'process-flow',
      title: 'Process Flow',
      icon: 'bi-diagram-3',
      type: 'process',
      description: 'Step-by-step process to complete registration',
    },
    {
      id: 'timeline',
      title: 'Timeline & Fees',
      icon: 'bi-clock-history',
      type: 'timeline',
      description: 'Expected duration and fee structure',
    },
  ],
  GENERAL_SERVICE: [
    {
      id: 'documents',
      title: 'Required Documents',
      icon: 'bi-file-earmark',
      type: 'documents',
    },
    {
      id: 'process',
      title: 'Process',
      icon: 'bi-list-check',
      type: 'process',
    },
  ],
};
