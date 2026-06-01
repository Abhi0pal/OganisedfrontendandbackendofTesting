// ===================================
// Dynamic Popup Service (Frontend)
// ===================================

import { useState, useEffect } from 'react';
import { DynamicPopupConfig, PopupSection } from '@/types/popupConfig';

export const useDynamicPopupService = () => {
  const [popupConfigs, setPopupConfigs] = useState<Record<string, DynamicPopupConfig>>({});
  const [loading, setLoading] = useState(false);

  // Load popup configurations from API
  const loadPopupConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/popups/configs');
      const configs = await response.json();
      setPopupConfigs(configs);
    } catch (error) {
      console.error('Failed to load popup configs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get popup config for a specific page/service
  const getPopupConfig = (pageId: string): DynamicPopupConfig | null => {
    return popupConfigs[pageId] || null;
  };

  // Check if popup is enabled for a page
  const isPopupEnabled = (pageId: string): boolean => {
    const config = getPopupConfig(pageId);
    return config?.enabled ?? false;
  };

  useEffect(() => {
    loadPopupConfigs();
  }, []);

  return {
    popupConfigs,
    loading,
    getPopupConfig,
    isPopupEnabled,
    reloadConfigs: loadPopupConfigs,
  };
};

// ===================================
// Dynamic Popup Component
// ===================================

import React from 'react';
import { Dialog } from 'primereact/dialog';

interface DynamicServicePopupProps {
  visible: boolean;
  config: DynamicPopupConfig | null;
  onHide: () => void;
}

export const DynamicServicePopup: React.FC<DynamicServicePopupProps> = ({
  visible,
  config,
  onHide,
}) => {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (config && visible) {
      setActiveSection((config as any).defaultSection || config.sections[0]?.id || '');
    }
  }, [config, visible]);

  if (!config) return null;

  const activeSectionData = config.sections.find(s => s.id === activeSection);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div>
          <h5 className="mb-2 fw-bold">{config.pageTitle}</h5>
          <small className="text-muted">
            <i className="bi bi-briefcase me-1"></i>
            {config.serviceName}
          </small>
        </div>
      }
      modal
      dismissableMask
      appendTo={document.body}
      baseZIndex={10000}
      style={{ width: '80vw' }}
      className="dynamic-service-popup"
    >
      {/* Radio Buttons for Section Selection */}
      <div className="popup-tabs-selector mb-4 pb-3 border-bottom">
        <div className="d-flex flex-wrap gap-3">
          {config.sections.map((section) => (
            <div key={section.id} className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="popupSection"
                id={`section-${section.id}`}
                value={section.id}
                checked={activeSection === section.id}
                onChange={(e) => setActiveSection(e.target.value)}
              />
              <label className="form-check-label" htmlFor={`section-${section.id}`}>
                {section.icon && <i className={`${section.icon} me-2`}></i>}
                <span className="fw-semibold">{section.title}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Section Content */}
      <div className="popup-content">
        {activeSectionData && (
          <DynamicSectionRenderer section={activeSectionData} />
        )}
      </div>
    </Dialog>
  );
};

// ===================================
// Dynamic Section Renderer
// ===================================

interface DynamicSectionRendererProps {
  section: PopupSection;
}

const DynamicSectionRenderer: React.FC<DynamicSectionRendererProps> = ({ section }) => {
  // This component would dynamically render content based on section type
  // In a real implementation, you'd fetch data from APIs based on section configuration

  switch (section.type) {
    case 'checklist':
      return <ChecklistSection sectionId={section.id} />;
    case 'process':
      return <ProcessSection sectionId={section.id} />;
    case 'timeline':
      return <TimelineSection sectionId={section.id} />;
    case 'documents':
      return <DocumentsSection sectionId={section.id} />;
    default:
      return <div>Section type not implemented: {section.type}</div>;
  }
};

// Individual section components would fetch their data dynamically
const ChecklistSection: React.FC<{ sectionId: string }> = ({ sectionId }) => {
  const [checklistItems, setChecklistItems] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/popups/sections/${sectionId}/checklist`)
      .then(res => res.json())
      .then(setChecklistItems);
  }, [sectionId]);

  return (
    <div className="space-y-3">
      {checklistItems.map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <p className="font-semibold">{item.documentName}</p>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProcessSection: React.FC<{ sectionId: string }> = ({ sectionId }) => {
  const [processSteps, setProcessSteps] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/popups/sections/${sectionId}/process`)
      .then(res => res.json())
      .then(setProcessSteps);
  }, [sectionId]);

  return (
    <div className="space-y-4">
      {processSteps.map((step, index) => (
        <div key={index} className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
            {step.step}
          </div>
          <div>
            <p className="font-semibold">{step.title}</p>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Similar implementations for TimelineSection and DocumentsSection...
const TimelineSection: React.FC<{ sectionId: string }> = () => <div>Timeline implementation coming soon</div>;
const DocumentsSection: React.FC<{ sectionId: string }> = () => <div>Documents implementation coming soon</div>;