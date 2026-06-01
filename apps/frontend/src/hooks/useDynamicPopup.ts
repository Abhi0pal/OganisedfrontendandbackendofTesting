import { useState, useCallback } from 'react';
import { PopupTabContent } from '@/components/popups/UnifiedServicePopup';

// ===================================
// Hook for Dynamic Popup Management
// ===================================

export interface DynamicPopupConfig {
  id: string;
  title: string;
  serviceName?: string;
  tabs: PopupTabContent[];
  defaultTab?: string;
}

export interface UseDynamicPopupReturn {
  isVisible: boolean;
  config: DynamicPopupConfig | null;
  openPopup: (config: DynamicPopupConfig) => void;
  closePopup: () => void;
  updateTabs: (tabs: PopupTabContent[]) => void;
}

/**
 * Hook for managing dynamic popups across pages and services
 * Can be used to show different popup configurations for any page/service
 * 
 * Usage Example:
 * ```tsx
 * const popup = useDynamicPopup();
 * 
 * // Open popup with tabs
 * popup.openPopup({
 *   id: 'service-details-1',
 *   title: 'Service Details',
 *   serviceName: 'Marriage Registration',
 *   tabs: [
 *     { id: 'checklist', label: 'Checklist', content: <ChecklistComponent /> },
 *     { id: 'process', label: 'Process', content: <ProcessComponent /> }
 *   ]
 * });
 * ```
 */
export const useDynamicPopup = (): UseDynamicPopupReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [config, setConfig] = useState<DynamicPopupConfig | null>(null);

  const openPopup = useCallback((newConfig: DynamicPopupConfig) => {
    setConfig(newConfig);
    setIsVisible(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsVisible(false);
    // Delay clearing config for animation
    setTimeout(() => setConfig(null), 300);
  }, []);

  const updateTabs = useCallback((tabs: PopupTabContent[]) => {
    if (config) {
      setConfig({ ...config, tabs });
    }
  }, [config]);

  return {
    isVisible,
    config,
    openPopup,
    closePopup,
    updateTabs,
  };
};
