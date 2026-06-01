import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface MasterOption {
  value: string | number;
  label: string;
}

type MasterConfig = {
  url: string;
  parentParam?: string;
  map: (item: any) => MasterOption;
};

const MASTER_ENDPOINTS: Record<string, MasterConfig> = {
  COUNTRY: {
    url: '/master/countries',
    map: (item) => ({ value: item.id, label: item.name }),
  },
  STATE: {
    url: '/master/states',
    parentParam: 'countryId',
    map: (item) => ({ value: item.id, label: item.name }),
  },
  DISTRICT: {
    url: '/master/districts',
    parentParam: 'stateId',
    map: (item) => ({ value: item.id, label: item.name }),
  },
  BLOCK: {
    url: '/master/blocks',
    parentParam: 'districtId',
    map: (item) => ({ value: item.id, label: item.name }),
  },
  TEHSIL: {
    url: '/tehsils',
    map: (item) => ({ value: item.id, label: item.name }),
  },
  VILLAGE: {
    url: '/villages',
    map: (item) => ({ value: item.id, label: item.name }),
  },
  NIC_CODE: {
    url: '/master/nic-codes',
    map: (item) => ({
      value: item.id,
      label: item.nicVDigit ? `${item.nicVDigit} - ${item.description}` : item.description,
    }),
  },
  HSN_CODE: {
    url: '/master/hsn-codes',
    map: (item) => ({
      value: item.hsnCode,
      label: item.hsnCode ? `${item.hsnCode} - ${item.commodityName}` : item.commodityName,
    }),
  },
};

const fetchMasterOptions = async (code: string, parent?: string | number) => {
  const config = MASTER_ENDPOINTS[code];
  if (!config) {
    throw new Error(`Unsupported master code: ${code}`);
  }

  const params = new URLSearchParams();
  if (config.parentParam && parent !== undefined && parent !== null && parent !== '') {
    params.append(config.parentParam, String(parent));
  }

  const query = params.toString();
  const url = query ? `${config.url}?${query}` : config.url;

  const res = await apiClient.get(url);
  const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
  return data.map(config.map) as MasterOption[];
};

export const useMasterOptions = (code: string, parent?: string | number, enabled = true) =>
  useQuery({
    queryKey: ['master-options', code, parent],
    queryFn: () => fetchMasterOptions(code, parent),
    enabled: enabled && !!code,
  });

export const useNicCodes = () => useMasterOptions('NIC_CODE');
export const useHsnCodes = () => useMasterOptions('HSN_CODE');
