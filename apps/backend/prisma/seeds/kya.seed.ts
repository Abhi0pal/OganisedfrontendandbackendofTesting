import { PrismaClient } from '@prisma/client';

/**
 * KYA (Know Your Approval) Seed Data
 * Inspired by Karnataka Single Window Clearance Portal
 *
 * Categories:
 *   1. Enterprise Information
 *   2. Land & Location Details
 *   3. Industry & Product Details
 *   4. Environmental & Pollution Details
 *   5. Labour & Employment Details
 *   6. Power & Utilities
 *   7. Fire Safety & Building Approvals
 *   8. Tax & Financial Registrations
 */

interface OptionSeed {
    optionLabel: string;
    serviceIds: number[]; // IDs from m_service table
}

interface QuestionSeed {
    questionLabel: string;
    fieldType: 'Dropdown' | 'Text' | 'Date';
    isMandatory: boolean;
    isDependent: boolean;
    isTooltipAvailable: boolean;
    tooltipText?: string;
    showReferenceDocument: boolean;
    // dependency fields (resolved at runtime)
    parentQuestionLabel?: string;
    parentOptionLabel?: string;
    options?: OptionSeed[];
}

interface CategorySeed {
    categoryName: string;
    questions: QuestionSeed[];
}

/**
 * Mapping from dummy sequential IDs (used in seed data below) to
 * actual service IDs from the m_service table (servicesData).
 *
 * This ensures the KYA service mappings point to real services
 * that have their service_name populated in the database.
 */
const SERVICE_ID_MAP: Record<number, number> = {
    1: 2341,   // Application for new connection LT line
    2: 2810,   // Registration under Shops and Establishment Act
    3: 3362,   // License under The Contract Labour Act, 1970
    4: 2823,   // Registration & grant of license under Factories Act
    5: 2334,   // Application for temporary connection - LT line
    6: 2621,   // Application for new connection HT line
    7: 2336,   // Application for load enhancement
    8: 4175,   // Registration of principal employer under Contract Labour Act
    9: 3901,   // Application for Land / Plot Allotment
    10: 2901,  // Application for Transfer Permission
    11: 2891,  // Land Use Change Permission under Section 143
    12: 3840,  // Consolidated consent & authorization - fresh
    13: 4386,  // Addition alteration
    14: 3359,  // Consent to Establish under Air & Water Act - Fresh
    15: 2637,  // Application for new submission of MDU
    16: 2323,  // Application for pre-establishment fire NOC
    17: 2324,  // Application for pre-operational fire NOC
    18: 3301,  // Application for Water Connection
    19: 4183,  // Registration under Inter-State Migrant Workmen Act
    20: 4069,  // Registration under Indian Boilers Act
};

/** Translate dummy service IDs to real ones */
function mapServiceIds(dummyIds: number[]): number[] {
    return dummyIds
        .map(id => SERVICE_ID_MAP[id])
        .filter((id): id is number => id !== undefined);
}

const kyaData: CategorySeed[] = [
    // =====================================================
    // CATEGORY 1: Enterprise Information
    // =====================================================
    {
        categoryName: 'Enterprise Information',
        questions: [
            {
                questionLabel: 'What is the nature of your business entity?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Select the legal structure under which your enterprise is registered or proposed to be registered.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Proprietorship Firm', serviceIds: [1] },
                    { optionLabel: 'Partnership Firm', serviceIds: [1, 2] },
                    { optionLabel: 'Limited Liability Partnership (LLP)', serviceIds: [1, 2] },
                    { optionLabel: 'Private Limited Company', serviceIds: [1, 2, 3] },
                    { optionLabel: 'Public Limited Company', serviceIds: [1, 2, 3, 4] },
                    { optionLabel: 'Society / Trust / Section 8 Company', serviceIds: [1] },
                    { optionLabel: 'Government / PSU', serviceIds: [] },
                    { optionLabel: 'Joint Venture', serviceIds: [1, 2, 3] },
                    { optionLabel: 'Foreign Company (Branch Office)', serviceIds: [1, 2, 3, 5] },
                ],
            },
            {
                questionLabel: 'Is this a new enterprise or an existing enterprise seeking expansion?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'New: Setting up for the first time. Expansion: Enhancing capacity or diversifying in an existing unit.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'New Enterprise', serviceIds: [1, 2, 3] },
                    { optionLabel: 'Expansion of Existing Enterprise', serviceIds: [1, 6] },
                    { optionLabel: 'Diversification', serviceIds: [1, 6] },
                    { optionLabel: 'Modernization / Technology Upgradation', serviceIds: [6] },
                ],
            },
            {
                questionLabel: 'Does the enterprise have Udyam/MSME Registration?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Udyam Registration is mandatory for classification as Micro, Small or Medium Enterprise under MSMED Act, 2006.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Micro Enterprise', serviceIds: [] },
                    { optionLabel: 'Yes - Small Enterprise', serviceIds: [] },
                    { optionLabel: 'Yes - Medium Enterprise', serviceIds: [] },
                    { optionLabel: 'No - Large Enterprise', serviceIds: [4] },
                    { optionLabel: 'Not yet registered', serviceIds: [7] },
                ],
            },
            {
                questionLabel: 'Enter your Udyam Registration Number',
                fieldType: 'Text',
                isMandatory: true,
                isDependent: true,
                parentQuestionLabel: 'Does the enterprise have Udyam/MSME Registration?',
                parentOptionLabel: 'Yes - Micro Enterprise',
                isTooltipAvailable: true,
                tooltipText: 'Format: UDYAM-XX-00-0000000',
                showReferenceDocument: false,
            },
            {
                questionLabel: 'What is the proposed total investment in Plant & Machinery / Equipment (in INR Lakhs)?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Investment in plant and machinery or equipment as per the latest MSME classification criteria.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Up to ₹1 Crore', serviceIds: [] },
                    { optionLabel: '₹1 Crore to ₹10 Crore', serviceIds: [] },
                    { optionLabel: '₹10 Crore to ₹50 Crore', serviceIds: [4] },
                    { optionLabel: '₹50 Crore to ₹250 Crore', serviceIds: [4, 8] },
                    { optionLabel: '₹250 Crore to ₹500 Crore', serviceIds: [4, 8, 9] },
                    { optionLabel: 'Above ₹500 Crore', serviceIds: [4, 8, 9, 10] },
                ],
            },
            {
                questionLabel: 'Date of Incorporation / Registration of the Enterprise',
                fieldType: 'Text',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
            },
        ],
    },

    // =====================================================
    // CATEGORY 2: Land & Location Details
    // =====================================================
    {
        categoryName: 'Land & Location Details',
        questions: [
            {
                questionLabel: 'In which district is the proposed project located?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Dehradun', serviceIds: [] },
                    { optionLabel: 'Haridwar', serviceIds: [] },
                    { optionLabel: 'Nainital', serviceIds: [] },
                    { optionLabel: 'Udham Singh Nagar', serviceIds: [] },
                    { optionLabel: 'Pauri Garhwal', serviceIds: [] },
                    { optionLabel: 'Tehri Garhwal', serviceIds: [] },
                    { optionLabel: 'Almora', serviceIds: [] },
                    { optionLabel: 'Pithoragarh', serviceIds: [] },
                    { optionLabel: 'Chamoli', serviceIds: [] },
                    { optionLabel: 'Champawat', serviceIds: [] },
                    { optionLabel: 'Bageshwar', serviceIds: [] },
                    { optionLabel: 'Rudraprayag', serviceIds: [] },
                    { optionLabel: 'Uttarkashi', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'What is the type of land for the proposed project?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Industrial estate land is pre-approved for industrial use. Private land may require additional land use change approvals.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'SIDCUL Industrial Estate / Park', serviceIds: [] },
                    { optionLabel: 'Private Land - Agricultural', serviceIds: [11, 12] },
                    { optionLabel: 'Private Land - Non-Agricultural / Commercial', serviceIds: [12] },
                    { optionLabel: 'Government Allotted Land', serviceIds: [] },
                    { optionLabel: 'SEZ (Special Economic Zone)', serviceIds: [13] },
                    { optionLabel: 'Land in Notified Industrial Area', serviceIds: [] },
                    { optionLabel: 'Forest Land', serviceIds: [11, 14] },
                ],
            },
            {
                questionLabel: 'Do you require land use change / conversion from agricultural to non-agricultural?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: true,
                parentQuestionLabel: 'What is the type of land for the proposed project?',
                parentOptionLabel: 'Private Land - Agricultural',
                isTooltipAvailable: true,
                tooltipText: 'As per Section 143 of U.P. Zamindari Abolition and Land Reforms Act (applicable in Uttarakhand), conversion permission is required.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes', serviceIds: [11, 12] },
                    { optionLabel: 'No - Already converted', serviceIds: [] },
                    { optionLabel: 'Applied - Pending', serviceIds: [12] },
                ],
            },
            {
                questionLabel: 'What is the total land area of the proposed project (in Acres)?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Less than 1 Acre', serviceIds: [] },
                    { optionLabel: '1 to 5 Acres', serviceIds: [] },
                    { optionLabel: '5 to 20 Acres', serviceIds: [15] },
                    { optionLabel: '20 to 50 Acres', serviceIds: [15, 16] },
                    { optionLabel: 'Above 50 Acres', serviceIds: [15, 16] },
                ],
            },
            {
                questionLabel: 'Is the project located within 10 km of any Eco-Sensitive Zone / Wildlife Sanctuary / National Park?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Projects near eco-sensitive zones require additional wildlife clearance from the National Board for Wildlife.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes', serviceIds: [14, 17] },
                    { optionLabel: 'No', serviceIds: [] },
                    { optionLabel: 'Not Sure - Need Verification', serviceIds: [17] },
                ],
            },
            {
                questionLabel: 'Does the project fall within a river regulation zone or flood plain?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes', serviceIds: [18] },
                    { optionLabel: 'No', serviceIds: [] },
                ],
            },
        ],
    },

    // =====================================================
    // CATEGORY 3: Industry & Product Details
    // =====================================================
    {
        categoryName: 'Industry & Product Details',
        questions: [
            {
                questionLabel: 'What is the primary sector of your industry?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Manufacturing', serviceIds: [1] },
                    { optionLabel: 'IT / ITeS / Software', serviceIds: [] },
                    { optionLabel: 'Food Processing & Agro-Based', serviceIds: [1, 19] },
                    { optionLabel: 'Pharmaceuticals & Medical Devices', serviceIds: [1, 20] },
                    { optionLabel: 'Textiles & Garments', serviceIds: [1] },
                    { optionLabel: 'Automobile & Auto Components', serviceIds: [1] },
                    { optionLabel: 'Chemicals & Petrochemicals', serviceIds: [1, 14] },
                    { optionLabel: 'Electronics & Electrical Equipment', serviceIds: [1] },
                    { optionLabel: 'Renewable Energy (Solar / Wind / Biomass)', serviceIds: [1] },
                    { optionLabel: 'Tourism & Hospitality', serviceIds: [] },
                    { optionLabel: 'Logistics & Warehousing', serviceIds: [1] },
                    { optionLabel: 'Mining & Minerals', serviceIds: [1, 14, 16] },
                    { optionLabel: 'Construction & Real Estate', serviceIds: [15, 16] },
                    { optionLabel: 'Healthcare & Education', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Does the manufacturing process involve hazardous chemicals or substances?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: true,
                parentQuestionLabel: 'What is the primary sector of your industry?',
                parentOptionLabel: 'Chemicals & Petrochemicals',
                isTooltipAvailable: true,
                tooltipText: 'Hazardous chemicals as defined under the Manufacture, Storage and Import of Hazardous Chemical Rules, 1989.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Schedule I chemicals', serviceIds: [14, 17] },
                    { optionLabel: 'Yes - Schedule II chemicals', serviceIds: [14] },
                    { optionLabel: 'Yes - Schedule III chemicals', serviceIds: [14] },
                    { optionLabel: 'No hazardous chemicals involved', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Do you require a Drug Manufacturing License?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: true,
                parentQuestionLabel: 'What is the primary sector of your industry?',
                parentOptionLabel: 'Pharmaceuticals & Medical Devices',
                isTooltipAvailable: true,
                tooltipText: 'Required under the Drugs and Cosmetics Act, 1940 for manufacturing of drugs, cosmetics, or medical devices.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Allopathic Drugs', serviceIds: [20] },
                    { optionLabel: 'Yes - Ayurvedic / Homeopathic', serviceIds: [20] },
                    { optionLabel: 'Yes - Medical Devices', serviceIds: [20] },
                    { optionLabel: 'No', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Does the food processing unit require FSSAI License?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: true,
                parentQuestionLabel: 'What is the primary sector of your industry?',
                parentOptionLabel: 'Food Processing & Agro-Based',
                isTooltipAvailable: true,
                tooltipText: 'FSSAI License is mandatory for food business operators with annual turnover above ₹12 Lakhs.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Central License (Turnover > ₹20 Crore)', serviceIds: [19] },
                    { optionLabel: 'Yes - State License (Turnover ₹12L - ₹20Cr)', serviceIds: [19] },
                    { optionLabel: 'Only Registration needed (Turnover < ₹12L)', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'What is the annual production capacity proposed?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Less than 100 MT per annum', serviceIds: [] },
                    { optionLabel: '100 MT to 1,000 MT per annum', serviceIds: [] },
                    { optionLabel: '1,000 MT to 10,000 MT per annum', serviceIds: [14] },
                    { optionLabel: '10,000 MT to 50,000 MT per annum', serviceIds: [14, 15] },
                    { optionLabel: 'Above 50,000 MT per annum', serviceIds: [14, 15, 16] },
                ],
            },
            {
                questionLabel: 'Do you plan to export products from this unit?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'If exporting, you may need IEC (Import Export Code) and additional certificates like BIS, APEDA, etc.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes - Direct Export', serviceIds: [5] },
                    { optionLabel: 'Yes - Deemed Export', serviceIds: [5] },
                    { optionLabel: 'No - Domestic Market Only', serviceIds: [] },
                ],
            },
        ],
    },

    // =====================================================
    // CATEGORY 4: Environmental & Pollution Details
    // =====================================================
    {
        categoryName: 'Environmental & Pollution Details',
        questions: [
            {
                questionLabel: 'Under which pollution category does your industry fall?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'As classified by the Central Pollution Control Board (CPCB) based on Pollution Index Score: Red (61-100), Orange (41-60), Green (21-40), White (0-20)',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Red Category (Highly Polluting)', serviceIds: [14, 17] },
                    { optionLabel: 'Orange Category (Moderately Polluting)', serviceIds: [14] },
                    { optionLabel: 'Green Category (Low Polluting)', serviceIds: [14] },
                    { optionLabel: 'White Category (Non-Polluting)', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Does the project require Environmental Clearance (EC) under EIA Notification 2006?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Environmental Clearance is required for projects listed in the Schedule of EIA Notification, 2006 (as amended).',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Category A (Central Level)', serviceIds: [14, 17] },
                    { optionLabel: 'Yes - Category B1 (State Level with EIA)', serviceIds: [14, 17] },
                    { optionLabel: 'Yes - Category B2 (State Level without EIA)', serviceIds: [14] },
                    { optionLabel: 'No - Exempted', serviceIds: [] },
                    { optionLabel: 'Not Sure - Need Assessment', serviceIds: [17] },
                ],
            },
            {
                questionLabel: 'What is the estimated daily water consumption for the project (in KLD)?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'KLD = Kilo Litres per Day. Include process water, cooling water, domestic use, and boiler requirements.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Less than 50 KLD', serviceIds: [] },
                    { optionLabel: '50 KLD to 200 KLD', serviceIds: [18] },
                    { optionLabel: '200 KLD to 500 KLD', serviceIds: [18] },
                    { optionLabel: '500 KLD to 2000 KLD', serviceIds: [18, 14] },
                    { optionLabel: 'Above 2000 KLD', serviceIds: [18, 14, 17] },
                ],
            },
            {
                questionLabel: 'Will the project generate hazardous waste as per Hazardous Waste Management Rules?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Hazardous waste as defined under the Hazardous and Other Wastes (Management & Transboundary Movement) Rules, 2016.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Disposed through TSDF', serviceIds: [14] },
                    { optionLabel: 'Yes - Recycled/Co-processed on-site', serviceIds: [14] },
                    { optionLabel: 'No hazardous waste generated', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Does the project require Consent to Establish (CTE) from Pollution Control Board?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'CTE is mandatory under the Water (Prevention and Control of Pollution) Act, 1974 and Air (Prevention and Control of Pollution) Act, 1981.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes', serviceIds: [14] },
                    { optionLabel: 'No - White category / Exempted', serviceIds: [] },
                    { optionLabel: 'Already obtained', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'What type of air emissions will the project generate?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Stack emissions (boiler / furnace / DG set)', serviceIds: [14] },
                    { optionLabel: 'Fugitive emissions (solvent / chemical vapors)', serviceIds: [14] },
                    { optionLabel: 'Both stack and fugitive emissions', serviceIds: [14, 17] },
                    { optionLabel: 'Negligible / No emissions', serviceIds: [] },
                ],
            },
        ],
    },

    // =====================================================
    // CATEGORY 5: Labour & Employment Details
    // =====================================================
    {
        categoryName: 'Labour & Employment Details',
        questions: [
            {
                questionLabel: 'What is the proposed total number of workers / employees?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Include direct employees, contract labour, and casual workers expected at peak operations.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Less than 10', serviceIds: [] },
                    { optionLabel: '10 to 19', serviceIds: [2] },
                    { optionLabel: '20 to 49', serviceIds: [2, 3] },
                    { optionLabel: '50 to 99', serviceIds: [2, 3] },
                    { optionLabel: '100 to 249', serviceIds: [2, 3, 4] },
                    { optionLabel: '250 to 499', serviceIds: [2, 3, 4] },
                    { optionLabel: '500 and above', serviceIds: [2, 3, 4, 8] },
                ],
            },
            {
                questionLabel: 'Will the unit employ contract labour?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Contract Labour (Regulation and Abolition) Act, 1970 applies if 20 or more contract workers are employed.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes - More than 20 contract workers', serviceIds: [2, 3] },
                    { optionLabel: 'Yes - Less than 20 contract workers', serviceIds: [] },
                    { optionLabel: 'No contract labour', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Does the establishment operate as a Factory under the Factories Act, 1948?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'A factory means any premises where 10 or more workers (with power) or 20 or more workers (without power) are employed on any day.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Factory with power (10+ workers)', serviceIds: [2, 3] },
                    { optionLabel: 'Yes - Factory without power (20+ workers)', serviceIds: [2, 3] },
                    { optionLabel: 'No - Not a factory', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Do you plan to provide residential quarters / housing for employees?',
                fieldType: 'Dropdown',
                isMandatory: false,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes', serviceIds: [15, 16] },
                    { optionLabel: 'No', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Will the unit operate in multiple shifts?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Single Shift', serviceIds: [] },
                    { optionLabel: 'Double Shift', serviceIds: [] },
                    { optionLabel: 'Triple Shift (24x7 Operation)', serviceIds: [2] },
                ],
            },
            {
                questionLabel: 'Will you employ women workers in night shifts?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: true,
                parentQuestionLabel: 'Will the unit operate in multiple shifts?',
                parentOptionLabel: 'Triple Shift (24x7 Operation)',
                isTooltipAvailable: true,
                tooltipText: 'Permission is required under Section 66 of the Factories Act, 1948 for employing women between 7 PM and 6 AM.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes - Permission required', serviceIds: [2] },
                    { optionLabel: 'No', serviceIds: [] },
                ],
            },
        ],
    },

    // =====================================================
    // CATEGORY 6: Power & Utilities
    // =====================================================
    {
        categoryName: 'Power & Utilities',
        questions: [
            {
                questionLabel: 'What is the estimated power requirement for the project (in KW / MW)?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Total connected load including production machinery, utilities, lighting, and HVAC systems.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Less than 100 KW', serviceIds: [] },
                    { optionLabel: '100 KW to 500 KW', serviceIds: [] },
                    { optionLabel: '500 KW to 1 MW', serviceIds: [8] },
                    { optionLabel: '1 MW to 5 MW', serviceIds: [8] },
                    { optionLabel: '5 MW to 25 MW', serviceIds: [8, 9] },
                    { optionLabel: 'Above 25 MW', serviceIds: [8, 9, 10] },
                ],
            },
            {
                questionLabel: 'Do you plan to install a captive power plant?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Captive power plant approval needed under the Electricity Act, 2003.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes - Diesel / Gas based', serviceIds: [8, 14] },
                    { optionLabel: 'Yes - Solar / Renewable', serviceIds: [8] },
                    { optionLabel: 'Yes - Co-generation', serviceIds: [8, 14] },
                    { optionLabel: 'No', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Will DG sets be used as standby / backup power?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'DG sets above 500 KVA require NOC from Pollution Control Board for stack emission compliance.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes - Less than 500 KVA', serviceIds: [] },
                    { optionLabel: 'Yes - 500 KVA to 2000 KVA', serviceIds: [14] },
                    { optionLabel: 'Yes - Above 2000 KVA', serviceIds: [14] },
                    { optionLabel: 'No DG Set', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Do you require a new HT (High Tension) power connection?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes - 11 KV', serviceIds: [8] },
                    { optionLabel: 'Yes - 33 KV', serviceIds: [8] },
                    { optionLabel: 'Yes - 132 KV or higher', serviceIds: [8, 9] },
                    { optionLabel: 'No - LT connection sufficient', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'What is the source of water supply for the project?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Groundwater extraction requires NOC from Central Ground Water Authority (CGWA) or State Ground Water Department.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Municipal / Local body water supply', serviceIds: [] },
                    { optionLabel: 'Industrial estate water supply (SIDCUL)', serviceIds: [] },
                    { optionLabel: 'Borewell / Tubewell (Groundwater)', serviceIds: [18] },
                    { optionLabel: 'River / Canal water abstraction', serviceIds: [18, 14] },
                    { optionLabel: 'Rainwater harvesting + Recycled water', serviceIds: [] },
                    { optionLabel: 'Combination of sources', serviceIds: [18] },
                ],
            },
        ],
    },

    // =====================================================
    // CATEGORY 7: Fire Safety & Building Approvals
    // =====================================================
    {
        categoryName: 'Fire Safety & Building Approvals',
        questions: [
            {
                questionLabel: 'What is the total built-up area of the proposed building (in sq. meters)?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Less than 500 sq.m', serviceIds: [] },
                    { optionLabel: '500 to 2,000 sq.m', serviceIds: [15] },
                    { optionLabel: '2,000 to 5,000 sq.m', serviceIds: [15, 16] },
                    { optionLabel: '5,000 to 20,000 sq.m', serviceIds: [15, 16] },
                    { optionLabel: 'Above 20,000 sq.m', serviceIds: [15, 16] },
                ],
            },
            {
                questionLabel: 'What is the height of the proposed building?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Buildings above 15 meters in height require Fire NOC as per National Building Code (NBC).',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Up to 15 meters (Ground + 3 floors)', serviceIds: [] },
                    { optionLabel: '15 to 24 meters', serviceIds: [16] },
                    { optionLabel: '24 to 45 meters (High Rise)', serviceIds: [16] },
                    { optionLabel: 'Above 45 meters', serviceIds: [16, 17] },
                ],
            },
            {
                questionLabel: 'Do you require Fire Safety NOC?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Fire NOC is mandatory for buildings above 15m height, areas above 500 sq.m, or industries handling flammable materials.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes', serviceIds: [16] },
                    { optionLabel: 'No - Exempted category', serviceIds: [] },
                    { optionLabel: 'Already obtained', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Does the project involve storage of flammable, combustible or explosive materials?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Petroleum, LPG, CNG, explosives, and other flammable materials require separate storage licenses under respective Acts.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Petroleum / Diesel storage', serviceIds: [16, 17] },
                    { optionLabel: 'Yes - LPG / CNG storage', serviceIds: [16, 17] },
                    { optionLabel: 'Yes - Industrial chemicals / solvents', serviceIds: [14, 16] },
                    { optionLabel: 'Yes - Explosives', serviceIds: [16, 17] },
                    { optionLabel: 'No', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Do you require Building Plan Approval from Local Authority?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes - Municipal / Nagar Palika area', serviceIds: [15] },
                    { optionLabel: 'Yes - Industrial estate (SIDCUL)', serviceIds: [] },
                    { optionLabel: 'Yes - Development Authority area (MDDA / UDA / etc.)', serviceIds: [15] },
                    { optionLabel: 'Not applicable', serviceIds: [] },
                ],
            },
        ],
    },

    // =====================================================
    // CATEGORY 8: Tax & Financial Registrations
    // =====================================================
    {
        categoryName: 'Tax & Financial Registrations',
        questions: [
            {
                questionLabel: 'Is the enterprise registered under GST?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'GST Registration is mandatory for businesses with turnover above ₹40 Lakhs (₹20 Lakhs for services) or for inter-state supply.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes - Regular Taxpayer', serviceIds: [] },
                    { optionLabel: 'Yes - Composition Scheme', serviceIds: [] },
                    { optionLabel: 'No - Below threshold limit', serviceIds: [] },
                    { optionLabel: 'No - Not yet registered (will apply)', serviceIds: [7] },
                ],
            },
            {
                questionLabel: 'Does the enterprise require Shop & Establishment Registration?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Required under the Uttarakhand Shops and Commercial Establishments Act for commercial establishments.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes', serviceIds: [2] },
                    { optionLabel: 'No - Manufacturing unit / Factory', serviceIds: [] },
                    { optionLabel: 'Already registered', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Do you plan to avail State Industrial Policy incentives / subsidies?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'Incentives under the Uttarakhand Industrial Investment Policy include capital subsidy, interest subsidy, land cost reimbursement, etc.',
                showReferenceDocument: true,
                options: [
                    { optionLabel: 'Yes - Capital Subsidy', serviceIds: [6] },
                    { optionLabel: 'Yes - Interest Subsidy', serviceIds: [6] },
                    { optionLabel: 'Yes - Stamp Duty Exemption', serviceIds: [6] },
                    { optionLabel: 'Yes - Multiple Incentives', serviceIds: [6, 9] },
                    { optionLabel: 'No', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Does the enterprise require IEC (Import Export Code)?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: true,
                tooltipText: 'IEC is a 10-digit code issued by DGFT, mandatory for importing or exporting goods and services.',
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes', serviceIds: [5] },
                    { optionLabel: 'No - Domestic trade only', serviceIds: [] },
                    { optionLabel: 'Already obtained', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'Do you require registration under the Professional Tax Act?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Yes', serviceIds: [7] },
                    { optionLabel: 'No', serviceIds: [] },
                    { optionLabel: 'Not applicable in this state', serviceIds: [] },
                ],
            },
            {
                questionLabel: 'What is the expected annual turnover of the enterprise (in INR Crore)?',
                fieldType: 'Dropdown',
                isMandatory: true,
                isDependent: false,
                isTooltipAvailable: false,
                showReferenceDocument: false,
                options: [
                    { optionLabel: 'Up to ₹5 Crore', serviceIds: [] },
                    { optionLabel: '₹5 Crore to ₹25 Crore', serviceIds: [] },
                    { optionLabel: '₹25 Crore to ₹100 Crore', serviceIds: [4] },
                    { optionLabel: '₹100 Crore to ₹500 Crore', serviceIds: [4, 8] },
                    { optionLabel: 'Above ₹500 Crore (Mega Project)', serviceIds: [4, 8, 9, 10] },
                ],
            },
        ],
    },
];

export async function seedKya(prisma: PrismaClient) {
    console.log('\n📋 Seeding KYA (Know Your Approval) data...');

    // Clear existing KYA data
    console.log('  🗑️  Clearing existing KYA data...');
    await prisma.kyaServiceMapping.deleteMany({});
    await prisma.kyaOption.deleteMany({});
    await prisma.kyaQuestion.deleteMany({});
    await prisma.kyaCategory.deleteMany({});
    console.log('  ✓ Cleared existing KYA data');

    // Reset sequences
    try {
        await prisma.$executeRawUnsafe(`SELECT setval('m_kya_categories_id_seq', 1, false);`);
        await prisma.$executeRawUnsafe(`SELECT setval('kya_questions_id_seq', 1, false);`);
        await prisma.$executeRawUnsafe(`SELECT setval('kya_options_id_seq', 1, false);`);
        await prisma.$executeRawUnsafe(`SELECT setval('kya_service_mappings_id_seq', 1, false);`);
        console.log('  ✓ Reset KYA sequences');
    } catch (err) {
        console.warn('  ⚠️  Could not reset KYA sequences:', (err as Error).message);
    }

    let totalCategories = 0;
    let totalQuestions = 0;
    let totalOptions = 0;
    let totalMappings = 0;

    for (const catData of kyaData) {
        // Create category
        const category = await prisma.kyaCategory.create({
            data: {
                categoryName: catData.categoryName,
                isActive: true,
            },
        });
        totalCategories++;
        console.log(`  ✓ Category: ${category.categoryName} (ID: ${category.id})`);

        // First pass: create non-dependent questions
        const questionIdMap: Record<string, number> = {};
        const optionIdMap: Record<string, number> = {};

        for (const qData of catData.questions) {
            if (qData.isDependent) continue; // skip dependent questions for now

            const question = await prisma.kyaQuestion.create({
                data: {
                    categoryId: category.id,
                    questionLabel: qData.questionLabel,
                    fieldType: qData.fieldType,
                    isMandatory: qData.isMandatory,
                    isDependent: false,
                    isTooltipAvailable: qData.isTooltipAvailable,
                    tooltipText: qData.tooltipText || null,
                    showReferenceDocument: qData.showReferenceDocument,
                    userId: 1,
                    isActive: true,
                },
            });
            questionIdMap[qData.questionLabel] = question.id;
            totalQuestions++;

            // Create options
            if (qData.options) {
                for (const optData of qData.options) {
                    const option = await prisma.kyaOption.create({
                        data: {
                            questionId: question.id,
                            optionLabel: optData.optionLabel,
                            isActive: true,
                        },
                    });
                    optionIdMap[`${qData.questionLabel}::${optData.optionLabel}`] = option.id;
                    totalOptions++;

                    // Create service mappings (translate dummy IDs to real ones)
                    const realServiceIds = mapServiceIds(optData.serviceIds);
                    for (const svcId of realServiceIds) {
                        try {
                            await prisma.kyaServiceMapping.create({
                                data: {
                                    optionId: option.id,
                                    serviceId: svcId,
                                    isActive: true,
                                },
                            });
                            totalMappings++;
                        } catch (err) {
                            // Skip if service doesn't exist
                        }
                    }
                }
            }
        }

        // Second pass: create dependent questions
        for (const qData of catData.questions) {
            if (!qData.isDependent) continue;

            const parentQuestionId = qData.parentQuestionLabel
                ? questionIdMap[qData.parentQuestionLabel]
                : null;
            const kyaOptionId = qData.parentQuestionLabel && qData.parentOptionLabel
                ? optionIdMap[`${qData.parentQuestionLabel}::${qData.parentOptionLabel}`]
                : null;

            if (!parentQuestionId) {
                console.warn(`    ⚠️  Parent question not found for: ${qData.questionLabel}`);
                continue;
            }

            const question = await prisma.kyaQuestion.create({
                data: {
                    categoryId: category.id,
                    questionLabel: qData.questionLabel,
                    fieldType: qData.fieldType,
                    isMandatory: qData.isMandatory,
                    isDependent: true,
                    parentQuestionId: parentQuestionId,
                    kyaOptionId: kyaOptionId,
                    isTooltipAvailable: qData.isTooltipAvailable,
                    tooltipText: qData.tooltipText || null,
                    showReferenceDocument: qData.showReferenceDocument,
                    userId: 1,
                    isActive: true,
                },
            });
            questionIdMap[qData.questionLabel] = question.id;
            totalQuestions++;

            // Create options for dependent questions
            if (qData.options) {
                for (const optData of qData.options) {
                    const option = await prisma.kyaOption.create({
                        data: {
                            questionId: question.id,
                            optionLabel: optData.optionLabel,
                            isActive: true,
                        },
                    });
                    optionIdMap[`${qData.questionLabel}::${optData.optionLabel}`] = option.id;
                    totalOptions++;

                    const realServiceIds = mapServiceIds(optData.serviceIds);
                    for (const svcId of realServiceIds) {
                        try {
                            await prisma.kyaServiceMapping.create({
                                data: {
                                    optionId: option.id,
                                    serviceId: svcId,
                                    isActive: true,
                                },
                            });
                            totalMappings++;
                        } catch (err) {
                            // Skip if service doesn't exist
                        }
                    }
                }
            }
        }
    }

    console.log(`\n✅ KYA seeding completed successfully!`);
    console.log(`   📁 Categories: ${totalCategories}`);
    console.log(`   ❓ Questions: ${totalQuestions}`);
    console.log(`   🔘 Options: ${totalOptions}`);
    console.log(`   🔗 Service Mappings: ${totalMappings}`);
}
