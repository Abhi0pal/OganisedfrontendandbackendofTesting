// service-plugins/transfer_rename_step1.ts

import type { ServiceFormPlugin } from './_types';

/**
 * STEP 1 FIELD CODES
 * (Replace with actual field codes from your form)
 */
const CONNECTION_REFERENCE = 'UK-FCL-04132_0';
const EXISTING_REGISTERED_NAME = 'UK-FCL-04240_0';

/**
 * Mock connection master
 * Keyed ONLY by Connection Reference / Index Number
 */
const mockConnectionData: Record<string, string> = {
  'CR-100001': 'Rahul Sharma',
  'CR-100002': 'Ananya Verma',
  'CR-100003': 'Mandeep Singh',
  'CR-100004': 'Neha Kapoor',
  'CR-100005': 'Ajay Mehta',

  'HMWSSB/WS/2021/004587': 'Ramesh Kumar',
  'HMWSSB/WS/2022/008921': 'Sunita Reddy',
  'HMWSSB/WS/2023/002114': 'Praveen Rao',

  'WS-DEL-458921': 'Alok Jain',
  'WS-DEL-672345': 'Nisha Gupta',

  'ZN05-DV02-WS-009821': 'Sanjay Khanna',
  'ZN07-DV01-WS-004375': 'Kavita Arora',

  '4587219': 'Rohit Bansal',
  '9032841': 'Pooja Malhotra'
};

const plugin: ServiceFormPlugin = {
  onFieldChange(fieldCode, value) {

    /**
     * Auto‑populate Existing Registered Name
     * solely based on Connection Reference
     */
    if (fieldCode === CONNECTION_REFERENCE) {
      const connectionRef = String(value ?? '').trim();
      const registeredName = mockConnectionData[connectionRef];

      return {
        [EXISTING_REGISTERED_NAME]: registeredName ?? '',
      };
    }

    return undefined;
  },
};

export default plugin;