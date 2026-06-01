// service-plugins/current_connection_details.ts

import type { ServiceFormPlugin } from './_types';

/**
 * FIELD CODES
 * Replace these with actual codes from form config
 */
const CONNECTION_REFERENCE = 'UK-FCL-04132_0';
const CURRENT_CONNECTION_DETAILS = 'UK-FCL-04168_0';

/**
 * Mock master data (10 dummy connections)
 */
const mockConnectionDetails: Record<string, {
  usage: string;
  pipeSize: string;
  tariff: string;
  status: string;
}> = {
  'CR-100001': {
    usage: 'Domestic ',
    pipeSize: '15 mm ',
    tariff: 'Residential - A ',
    status: 'Active',
  },
  'CR-100002': {
    usage: 'Commercial ',
    pipeSize: '25 mm ',
    tariff: 'Commercial - B ',
    status: 'Active',
  },
  'CR-100003': {
    usage: 'Domestic ',
    pipeSize: '20 mm ',
    tariff: 'Residential - B ',
    status: 'Active',
  },
  'CR-100004': {
    usage: 'Industrial ',
    pipeSize: '40 mm ',
    tariff: 'Industrial - A ',
    status: 'Active',
  },
  'CR-100005': {
    usage: 'Domestic ',
    pipeSize: '15 mm ',
    tariff: 'Residential - A ',
    status: 'Temporarily Disconnected',
  },
  'CR-100006': {
    usage: 'Commercial ',
    pipeSize: '32 mm ',
    tariff: 'Commercial - C ',
    status: 'Active',
  },
  'CR-100007': {
    usage: 'Domestic ',
    pipeSize: '15 mm ',
    tariff: 'Residential - C ',
    status: 'Active',
  },
  'CR-100008': {
    usage: 'Government ',
    pipeSize: '50 mm ',
    tariff: 'Govt - Exempted ',
    status: 'Active',
  },
  'CR-100009': {
    usage: 'Commercial ',
    pipeSize: '25 mm ',
    tariff: 'Commercial - A ',
    status: 'Inactive',
  },
  'CR-100010': {
    usage: 'Domestic ',
    pipeSize: '20 mm ',
    tariff: 'Residential - B ',
    status: 'Active',
  },
};

const plugin: ServiceFormPlugin = {
  onFieldChange(fieldCode, value) {

    // Trigger only on Connection Reference change
    if (fieldCode === CONNECTION_REFERENCE) {
      const ref = String(value ?? '').trim();
      const data = mockConnectionDetails[ref];

      if (data) {
        return {
          [CURRENT_CONNECTION_DETAILS]: 
`Usage Type: ${data.usage}
Pipe Size: ${data.pipeSize}
Current Tariff: ${data.tariff}
Connection Status: ${data.status}`,
        };
      }

      // Invalid reference → clear auto‑populated field
      return {
        [CURRENT_CONNECTION_DETAILS]: '',
      };
    }

    return undefined;
  },
};

export default plugin;