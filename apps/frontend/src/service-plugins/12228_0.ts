// service-plugins/12228_0.ts

import type { ServiceFormPlugin } from './_types';

// Step 1 fields
const PROPERTY_ID = 'UK-FCL-04114_0';
const PROPERTY_SEARCH_RESULT = 'UK-FCL-04115_0';
const OWNER_DETAILS = 'UK-FCL-04116_0';
const SERVICE_CATEGORY = 'UK-FCL-04117_0';

// Step 2 fields
const SAME_AS_OWNER_CHECKBOX = 'UK-FCL-04120_0';
const APPLICANT_NAME = 'UK-FCL-04121_0';
const GENDER = 'UK-FCL-00294_0';
const MOBILE = 'UK-FCL-03393_0';
const GUARDIAN = 'UK-FCL-04122_0';
const RELATIONSHIP = 'UK-FCL-01395_0';
const SPECIAL_CATEGORY = 'UK-FCL-01113_0';
const ADDRESS = 'UK-FCL-04123_0';

// Mock data — replace with real API when team provides endpoint
const mockPropertyData: Record<string, {
    searchResult: string;
    ownerDetails: string;
    serviceCategory: string;
    gender: string;
    mobile: string;
    guardian: string;
    address: string;
}> = {
    'HMWSSB/PROP/2021/004587': {
        searchResult: 'Property Found – H.No. 7-1-620, Ameerpet, Hyderabad',
        ownerDetails: 'Ramesh Kumar, S/o S. Narayana',
        serviceCategory: 'Domestic Water Connection',
        gender: 'Male',
        mobile: '9876543210',
        guardian: 'S/o S. Narayana',
        address: 'H.No. 7-1-620, Ameerpet, Hyderabad, Telangana – 500016',
    },
};

// Store resolved property data to use in Step 2
let resolvedPropertyData: typeof mockPropertyData[string] | null = null;

const plugin: ServiceFormPlugin = {
    onFieldChange(fieldCode, value, allValues) {

        // Step 1 — Property ID lookup
        if (fieldCode === PROPERTY_ID) {
            const data = mockPropertyData[String(value ?? '').trim()];
            resolvedPropertyData = data ?? null;

            if (data) {
                return {
                    [PROPERTY_SEARCH_RESULT]: data.searchResult,
                    [OWNER_DETAILS]: data.ownerDetails,
                    [SERVICE_CATEGORY]: data.serviceCategory,
                };
            }
            return {
                [PROPERTY_SEARCH_RESULT]: 'No property found',
                [OWNER_DETAILS]: '',
                [SERVICE_CATEGORY]: '',
            };
        }

        // Step 2 — Same as Owner Details checkbox
        if (fieldCode === SAME_AS_OWNER_CHECKBOX) {
            const isChecked = value === true || value === '1' ||
                (Array.isArray(value) && value.length > 0);

            if (isChecked && resolvedPropertyData) {
                return {
                    [APPLICANT_NAME]: resolvedPropertyData.ownerDetails,
                    [GENDER]: resolvedPropertyData.gender,
                    [MOBILE]: resolvedPropertyData.mobile,
                    [GUARDIAN]: resolvedPropertyData.guardian,
                    [ADDRESS]: resolvedPropertyData.address,
                };
            }

            if (!isChecked) {
                return {
                    [APPLICANT_NAME]: '',
                    [GENDER]: '',
                    [MOBILE]: '',
                    [GUARDIAN]: '',
                    [ADDRESS]: '',
                };
            }
        }

        return undefined;
    },
};

export default plugin;
