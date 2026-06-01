'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// ===================================
// Types
// ===================================
export interface PopupTabContent {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
}

export interface UnifiedServicePopupProps {
  visible: boolean;
  title: string;
  serviceName?: string;
  tabs: PopupTabContent[];
  defaultTab?: string;
  onHide: () => void;
  footerContent?: React.ReactNode;
  size?: 'normal' | 'large';
  showDownloadButton?: boolean;
  onDownload?: () => void;
}

// ===================================
// Main Component
// ===================================
export const UnifiedServicePopup: React.FC<UnifiedServicePopupProps> = ({
  visible,
  title,
  serviceName,
  tabs,
  defaultTab,
  onHide,
  footerContent,
  size = 'large',
  showDownloadButton = false,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '');

  // Reset tab when popup opens
  React.useEffect(() => {
    if (visible) {
      setActiveTab(defaultTab || tabs[0]?.id || '');
    }
  }, [visible, tabs, defaultTab]);

  const activeTabContent = tabs.find((tab) => tab.id === activeTab);

  const dialogWidth = size === 'large' ? '80vw' : '50vw';

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div>
          <h5 className="mb-2 fw-bold">{title}</h5>
          {serviceName && (
            <small className="text-muted">
              <i className="bi bi-briefcase me-1"></i>
              {serviceName}
            </small>
          )}
        </div>
      }
      modal
      dismissableMask
      appendTo={document.body}
      maskStyle={{ opacity: 0.45 }}
      baseZIndex={10000}
      style={{ width: dialogWidth }}
      breakpoints={{ '960px': '90vw', '640px': '95vw' }}
      className="unified-service-popup"
    >
      {/* Radio Buttons for Tab Selection */}
      <div className="popup-tabs-selector mb-4 pb-3 border-bottom">
        <div className="d-flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <div key={tab.id} className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="popupTab"
                id={`tab-${tab.id}`}
                value={tab.id}
                checked={activeTab === tab.id}
                onChange={(e) => setActiveTab(e.target.value)}
              />
              <label className="form-check-label" htmlFor={`tab-${tab.id}`}>
                {tab.icon && <i className={`${tab.icon} me-2`}></i>}
                <span className="fw-semibold">{tab.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="popup-content">
        {activeTabContent ? (
          <div className="tab-pane-content">
            {activeTabContent.content}
          </div>
        ) : (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No content available for this section.
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {(footerContent || showDownloadButton) && (
        <div className="popup-footer mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
          <div>{footerContent}</div>
          {showDownloadButton && (
            <button
              type="button"
              className="btn btn-success"
              onClick={onDownload}
              disabled={!onDownload}
            >
              <i className="bi bi-download me-2"></i>
              Download {activeTabContent?.label || 'Document'}
            </button>
          )}
        </div>
      )}
    </Dialog>
  );
};

export default UnifiedServicePopup;
