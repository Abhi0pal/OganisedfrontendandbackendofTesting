import { useEffect, useState } from 'react';
import type { ServiceFormPlugin } from './_types';
 
/**
 * Dynamically loads the service-specific plugin for the given serviceId.
 * Returns null if no plugin file exists for that service — form works normally.
 *
 * File naming: replace '.' with '_' in serviceId.
 *   e.g. serviceId "12222.0" → file "src/service-plugins/12222_0.ts"
 */
export function useServicePlugin(serviceId?: string): ServiceFormPlugin | null {
  const [plugin, setPlugin] = useState<ServiceFormPlugin | null>(null);
 
  useEffect(() => {
    if (!serviceId) {
      setPlugin(null);
      return;
    }
 
    const key = serviceId.replace(/\./g, '_');
 
    import(`./${key}`)
      .then((mod) => {
        const p: ServiceFormPlugin = mod.default ?? mod.plugin ?? null;
        setPlugin(p);
        console.info(`[ServicePlugin] Loaded plugin for service "${serviceId}"`);
      })
      .catch(() => {
        // No plugin for this service — completely normal, no warning needed
        setPlugin(null);
      });
  }, [serviceId]);
 
  return plugin;
}
 