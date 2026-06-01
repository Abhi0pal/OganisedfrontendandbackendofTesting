'use client';

import { DynamicForm, DynamicFormConfig } from '@/components/ui/DynamicForm';
import { useState } from 'react';
import ApplicantTable from '@/components/custom/ApplicantTable';


export default function NewApplicationPage() {
    const [districts, setDistricts] = useState<{ label: string; value: string }[]>([]);

    // Mock function to fetch districts based on state
    const fetchDistricts = (stateValue: string) => {
        const districtData: Record<string, { label: string; value: string }[]> = {
            uttarakhand: [
                { label: 'Dehradun', value: 'dehradun' },
                { label: 'Haridwar', value: 'haridwar' },
                { label: 'Nainital', value: 'nainital' },
                { label: 'Udham Singh Nagar', value: 'usn' },
            ],
            up: [
                { label: 'Lucknow', value: 'lucknow' },
                { label: 'Noida', value: 'noida' },
                { label: 'Agra', value: 'agra' },
            ],
            delhi: [
                { label: 'New Delhi', value: 'new_delhi' },
                { label: 'South Delhi', value: 'south_delhi' },
                { label: 'North Delhi', value: 'north_delhi' },
            ],
        };
        setDistricts(districtData[stateValue] || []);
    };

    const formConfig: DynamicFormConfig = {
        id: 'new-application',
        showStepIndicator: true,
        allowStepNavigation: false,
        submitButtonText: 'Submit Application',
        steps: [
            // ========== Step 1: Applicant Information ==========
            {
                id: 'step-1',
                title: 'Applicant Information',
                description: 'Provide your personal and contact details',
                sections: [
                    {
                        id: 'personal-info',
                        title: 'Personal Details',
                        columns: 4,
                        fields: [
                            {
                                name: 'applicant.fullName',
                                label: 'Full Name',
                                type: 'text',
                                placeholder: 'Enter your full name',
                                validation: { required: 'Full name is required' }
                            },
                            {
                                name: 'applicant.email',
                                label: 'Email Address',
                                type: 'email',
                                placeholder: 'example@email.com',
                                validation: {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                                }
                            },
                            {
                                name: 'applicant.mobile',
                                label: 'Mobile Number',
                                type: 'tel',
                                placeholder: '9876543210',
                                validation: {
                                    required: 'Mobile number is required',
                                    pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
                                }
                            },
                            {
                                name: 'applicant.pan',
                                label: 'PAN Number',
                                type: 'text',
                                placeholder: 'ABCDE1234F',
                                validation: {
                                    required: 'PAN is required',
                                    pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Invalid PAN format (e.g., ABCDE1234F)' }
                                }
                            },
                            {
                                name: 'applicant.address',
                                label: 'Address',
                                type: 'textarea',
                                placeholder: 'Enter your full address',
                                colSpan: 4,
                                rows: 3
                            }
                        ]
                    },
                    {
                        id: 'applicant-type',
                        title: 'Applicant Type',
                        columns: 2,
                        fields: [
                            {
                                name: 'applicant.type',
                                label: 'Are you applying as',
                                type: 'radio',
                                colSpan: 2,
                                options: [
                                    { label: 'Individual', value: 'individual' },
                                    { label: 'Proprietorship', value: 'proprietorship' },
                                    { label: 'Partnership', value: 'partnership' },
                                    { label: 'Company (Pvt/Ltd)', value: 'company' },
                                    { label: 'LLP', value: 'llp' }
                                ],
                                validation: { required: 'Please select applicant type' }
                            }
                        ]
                    },
                    {
                        id: 'applicant-type-2',
                        title: 'Table Name',
                        columns: 2,
                        fields: [
                            {
                            name: 'applicant.table',
                            type: 'custom',
                            colSpan: 2,
                            render: () => <ApplicantTable />
                            }
                        ]
                    },
                    // Conditional Section: Company Details (shows for company, llp, partnership)
                    {
                        id: 'company-details',
                        title: 'Company / Firm Details',
                        columns: 2,
                        dependsOn: {
                            field: 'applicant.type',
                            value: ['company', 'llp', 'partnership'],
                            show: true
                        },
                        fields: [
                            {
                                name: 'company.name',
                                label: 'Company/Firm Name',
                                type: 'text',
                                placeholder: 'Enter company name',
                                validation: { required: 'Company name is required' }
                            },
                            {
                                name: 'company.cin',
                                label: 'CIN/LLPIN Number',
                                type: 'text',
                                placeholder: 'Enter CIN or LLPIN',
                                dependsOn: {
                                    field: 'applicant.type',
                                    value: ['company', 'llp'],
                                    show: true
                                }
                            },
                            {
                                name: 'company.gstin',
                                label: 'GSTIN',
                                type: 'text',
                                placeholder: '22AAAAA0000A1Z5',
                                validation: {
                                    pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, message: 'Invalid GSTIN format' }
                                }
                            },
                            {
                                name: 'company.authorizedPerson',
                                label: 'Authorized Signatory Name',
                                type: 'text',
                                placeholder: 'Name of authorized person'
                            },
                            {
                                name: 'company.designation',
                                label: 'Designation',
                                type: 'text',
                                placeholder: 'e.g., Director, Partner'
                            },
                            {
                                name: 'company.registeredAddress',
                                label: 'Registered Office Address',
                                type: 'textarea',
                                placeholder: 'Enter registered office address',
                                colSpan: 2,
                                rows: 2
                            }
                        ]
                    }
                ]
            },
            // ========== Step 2: Project Details ==========
            {
                id: 'step-2',
                title: 'Project Details',
                description: 'Provide details about your proposed project',
                sections: [
                    {
                        id: 'project-info',
                        title: 'Project Information',
                        columns: 2,
                        fields: [
                            {
                                name: 'project.type',
                                label: 'Project Type',
                                type: 'select',
                                options: [
                                    { label: 'New Project', value: 'new' },
                                    { label: 'Expansion', value: 'expansion' },
                                    { label: 'Modernization', value: 'modernization' },
                                    { label: 'Diversification', value: 'diversification' }
                                ],
                                validation: { required: 'Please select project type' }
                            },
                            {
                                name: 'project.sector',
                                label: 'Industry Sector',
                                type: 'select',
                                options: [
                                    { label: 'Manufacturing', value: 'manufacturing' },
                                    { label: 'IT/ITES', value: 'it' },
                                    { label: 'Food Processing', value: 'food' },
                                    { label: 'Pharmaceuticals', value: 'pharma' },
                                    { label: 'Textiles', value: 'textile' },
                                    { label: 'Automobile', value: 'automobile' },
                                    { label: 'Electronics', value: 'electronics' },
                                    { label: 'Others', value: 'others' }
                                ],
                                validation: { required: 'Please select industry sector' }
                            },
                            {
                                name: 'project.name',
                                label: 'Project Name',
                                type: 'text',
                                placeholder: 'Enter project name',
                                colSpan: 2,
                                validation: { required: 'Project name is required' }
                            },
                            {
                                name: 'project.investment',
                                label: 'Proposed Investment (₹ Lakhs)',
                                type: 'number',
                                placeholder: '100',
                                validation: {
                                    required: 'Investment amount is required',
                                    min: { value: 1, message: 'Must be at least ₹1 Lakh' }
                                }
                            },
                            {
                                name: 'project.employment',
                                label: 'Proposed Employment',
                                type: 'number',
                                placeholder: '50',
                                helpText: 'Number of people to be employed'
                            },
                            {
                                name: 'project.startDate',
                                label: 'Proposed Start Date',
                                type: 'date',
                                validation: { required: 'Start date is required' }
                            },
                            {
                                name: 'project.completionDate',
                                label: 'Expected Completion Date',
                                type: 'date'
                            },
                            {
                                name: 'project.description',
                                label: 'Project Description',
                                type: 'textarea',
                                placeholder: 'Describe your project in detail including products/services',
                                colSpan: 2,
                                rows: 4
                            }
                        ]
                    },
                    // Conditional: Expansion Details
                    {
                        id: 'expansion-details',
                        title: 'Existing Unit Details',
                        columns: 2,
                        collapsible: true,
                        dependsOn: {
                            field: 'project.type',
                            value: ['expansion', 'modernization', 'diversification'],
                            show: true
                        },
                        fields: [
                            {
                                name: 'existing.unitName',
                                label: 'Existing Unit Name',
                                type: 'text',
                                placeholder: 'Name of existing unit'
                            },
                            {
                                name: 'existing.registrationNo',
                                label: 'Registration Number',
                                type: 'text',
                                placeholder: 'Existing registration/license no.'
                            },
                            {
                                name: 'existing.currentInvestment',
                                label: 'Current Investment (₹ Lakhs)',
                                type: 'number',
                                placeholder: '50'
                            },
                            {
                                name: 'existing.currentEmployment',
                                label: 'Current Employment',
                                type: 'number',
                                placeholder: '25'
                            }
                        ]
                    }
                ]
            },
            // ========== Step 3: Location & Land ==========
            {
                id: 'step-3',
                title: 'Location Details',
                description: 'Provide location and land requirement details',
                sections: [
                    {
                        id: 'location-info',
                        title: 'Proposed Location',
                        columns: 2,
                        fields: [
                            {
                                name: 'location.state',
                                label: 'State',
                                type: 'select',
                                options: [
                                    { label: 'Uttarakhand', value: 'uttarakhand' },
                                    { label: 'Uttar Pradesh', value: 'up' },
                                    { label: 'Delhi', value: 'delhi' }
                                ],
                                validation: { required: 'Please select state' },
                                // onChange callback to fetch districts
                                onChange: (value, formMethods) => {
                                    formMethods.setValue('location.district', '');
                                    fetchDistricts(value);
                                }
                            },
                            {
                                name: 'location.district',
                                label: 'District',
                                type: 'select',
                                options: districts.length > 0 ? districts : [{ label: 'Select state first', value: '', disabled: true }],
                                validation: { required: 'Please select district' }
                            },
                            {
                                name: 'location.tehsil',
                                label: 'Tehsil/Block',
                                type: 'text',
                                placeholder: 'Enter tehsil/block name'
                            },
                            {
                                name: 'location.village',
                                label: 'Village/Town',
                                type: 'text',
                                placeholder: 'Enter village/town name'
                            },
                            {
                                name: 'location.pincode',
                                label: 'PIN Code',
                                type: 'text',
                                placeholder: '248001',
                                validation: {
                                    required: 'PIN code is required',
                                    pattern: { value: /^[0-9]{6}$/, message: 'Must be 6 digits' }
                                }
                            },
                            {
                                name: 'location.gpsCoordinates',
                                label: 'GPS Coordinates (Optional)',
                                type: 'text',
                                placeholder: '30.3165, 78.0322',
                                helpText: 'Latitude, Longitude format'
                            }
                        ]
                    },
                    {
                        id: 'land-requirement',
                        title: 'Land Requirement',
                        columns: 2,
                        fields: [
                            {
                                name: 'land.type',
                                label: 'Land Requirement Type',
                                type: 'radio',
                                colSpan: 2,
                                options: [
                                    { label: 'Require Government Land (SIIDCUL/IIE)', value: 'government' },
                                    { label: 'Will acquire Private Land', value: 'private' },
                                    { label: 'Already have Land', value: 'owned' }
                                ],
                                validation: { required: 'Please select land type' }
                            }
                        ]
                    },
                    // Conditional: Government Land Details
                    {
                        id: 'govt-land-details',
                        title: 'Government Land Preference',
                        columns: 2,
                        dependsOn: {
                            field: 'land.type',
                            value: 'government',
                            show: true
                        },
                        fields: [
                            {
                                name: 'land.preferredArea',
                                label: 'Preferred Industrial Area',
                                type: 'select',
                                options: [
                                    { label: 'SIIDCUL Haridwar', value: 'siidcul-haridwar' },
                                    { label: 'SIIDCUL Pantnagar', value: 'siidcul-pantnagar' },
                                    { label: 'IIE Sitarganj', value: 'iie-sitarganj' },
                                    { label: 'IIE Kashipur', value: 'iie-kashipur' },
                                    { label: 'Growth Centre Sigaddi', value: 'gc-sigaddi' },
                                    { label: 'Others', value: 'others' }
                                ]
                            },
                            {
                                name: 'land.areaRequired',
                                label: 'Land Area Required (Sq. Mtr)',
                                type: 'number',
                                placeholder: '1000',
                                validation: { required: 'Land area is required' }
                            }
                        ]
                    },
                    // Conditional: Owned Land Details
                    {
                        id: 'owned-land-details',
                        title: 'Existing Land Details',
                        columns: 2,
                        dependsOn: {
                            field: 'land.type',
                            value: 'owned',
                            show: true
                        },
                        fields: [
                            {
                                name: 'land.khasraNo',
                                label: 'Khasra/Plot Number',
                                type: 'text',
                                placeholder: 'Enter khasra/plot number',
                                validation: { required: 'Khasra/Plot number is required' }
                            },
                            {
                                name: 'land.totalArea',
                                label: 'Total Land Area (Sq. Mtr)',
                                type: 'number',
                                placeholder: '2000'
                            },
                            {
                                name: 'land.ownershipType',
                                label: 'Ownership Type',
                                type: 'select',
                                options: [
                                    { label: 'Freehold', value: 'freehold' },
                                    { label: 'Leasehold', value: 'leasehold' },
                                    { label: 'Registered Sale Deed', value: 'sale_deed' }
                                ]
                            }
                        ]
                    }
                ]
            },
            // ========== Step 4: Services Required ==========
            {
                id: 'step-4',
                title: 'Services Required',
                description: 'Select the clearances and approvals you need',
                sections: [
                    {
                        id: 'services',
                        title: 'Select Required Services',
                        columns: 1,
                        fields: [
                            {
                                name: 'services.required',
                                label: 'Services Required (Select all that apply)',
                                type: 'checkbox',
                                options: [
                                    { label: 'Land Allotment', value: 'land' },
                                    { label: 'Building Permission', value: 'building' },
                                    { label: 'Environmental Clearance (EC)', value: 'environment' },
                                    { label: 'Consent to Establish (CTE)', value: 'cte' },
                                    { label: 'Power Connection', value: 'power' },
                                    { label: 'Water Connection', value: 'water' },
                                    { label: 'Fire NOC', value: 'fire' },
                                    { label: 'Factory License', value: 'factory' },
                                    { label: 'Shops & Establishment Registration', value: 'shops' },
                                    { label: 'Trade License', value: 'trade' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'utility-requirements',
                        title: 'Utility Requirements',
                        columns: 2,
                        collapsible: true,
                        fields: [
                            {
                                name: 'utilities.powerLoad',
                                label: 'Power Load Required (KW)',
                                type: 'number',
                                placeholder: '100'
                            },
                            {
                                name: 'utilities.powerVoltage',
                                label: 'Voltage Required',
                                type: 'select',
                                options: [
                                    { label: '220V (Single Phase)', value: '220' },
                                    { label: '440V (Three Phase)', value: '440' },
                                    { label: '11KV (HT)', value: '11000' },
                                    { label: '33KV (HT)', value: '33000' }
                                ]
                            },
                            {
                                name: 'utilities.waterRequirement',
                                label: 'Water Requirement (KLD)',
                                type: 'number',
                                placeholder: '50',
                                helpText: 'Kilo Liters per Day'
                            },
                            {
                                name: 'utilities.waterSource',
                                label: 'Preferred Water Source',
                                type: 'select',
                                options: [
                                    { label: 'Industrial Water Supply', value: 'industrial' },
                                    { label: 'Ground Water (Borewell)', value: 'ground' },
                                    { label: 'River/Canal', value: 'river' }
                                ]
                            }
                        ]
                    }
                ]
            },
            // ========== Step 5: Documents & Declaration ==========
            {
                id: 'step-5',
                title: 'Documents & Declaration',
                description: 'Upload required documents and provide declaration',
                sections: [
                    {
                        id: 'documents',
                        title: 'Upload Documents',
                        columns: 2,
                        fields: [
                            {
                                name: 'documents.panCard',
                                label: 'PAN Card',
                                type: 'file',
                                accept: '.pdf,.jpg,.jpeg,.png',
                                helpText: 'PDF, JPG or PNG (max 2MB)',
                                validation: { required: 'PAN card is required' }
                            },
                            {
                                name: 'documents.aadhaar',
                                label: 'Aadhaar Card',
                                type: 'file',
                                accept: '.pdf,.jpg,.jpeg,.png',
                                helpText: 'PDF, JPG or PNG (max 2MB)'
                            },
                            {
                                name: 'documents.projectReport',
                                label: 'Detailed Project Report (DPR)',
                                type: 'file',
                                accept: '.pdf',
                                helpText: 'PDF format only'
                            },
                            {
                                name: 'documents.photo',
                                label: 'Passport Size Photo',
                                type: 'file',
                                accept: '.jpg,.jpeg,.png',
                                helpText: 'JPG or PNG (max 500KB)'
                            }
                        ]
                    },
                    // Conditional: Company Documents
                    {
                        id: 'company-documents',
                        title: 'Company Documents',
                        columns: 2,
                        dependsOn: {
                            field: 'applicant.type',
                            value: ['company', 'llp', 'partnership'],
                            show: true
                        },
                        fields: [
                            {
                                name: 'documents.incorporation',
                                label: 'Certificate of Incorporation',
                                type: 'file',
                                accept: '.pdf',
                                helpText: 'PDF format only'
                            },
                            {
                                name: 'documents.moa',
                                label: 'MOA/AOA or Partnership Deed',
                                type: 'file',
                                accept: '.pdf',
                                helpText: 'PDF format only'
                            },
                            {
                                name: 'documents.boardResolution',
                                label: 'Board Resolution',
                                type: 'file',
                                accept: '.pdf',
                                helpText: 'For companies only'
                            },
                            {
                                name: 'documents.gstCertificate',
                                label: 'GST Registration Certificate',
                                type: 'file',
                                accept: '.pdf',
                                helpText: 'PDF format only'
                            }
                        ]
                    },
                    {
                        id: 'declaration',
                        title: 'Declaration',
                        columns: 1,
                        fields: [
                            {
                                name: 'declaration.accuracy',
                                label: 'I hereby declare that all the information provided above is true and accurate to the best of my knowledge. I understand that any false information may lead to rejection of my application.',
                                type: 'checkbox',
                                validation: { required: 'You must accept this declaration' }
                            },
                            {
                                name: 'declaration.terms',
                                label: 'I agree to the Terms and Conditions and Privacy Policy of the Single Window Clearance System. I consent to the processing of my data for the purpose of this application.',
                                type: 'checkbox',
                                validation: { required: 'You must agree to terms and conditions' }
                            },
                            {
                                name: 'declaration.communication',
                                label: 'I agree to receive updates about my application via SMS and Email.',
                                type: 'checkbox'
                            }
                        ]
                    }
                ]
            }
        ],
        onSubmit: async (data) => {
            console.log('Application Data:', data);
            // In real implementation:
            // await api.post('/applications', data);
            alert('Application submitted successfully! You will receive a confirmation email shortly.');
        },
        onStepChange: (step, data) => {
            console.log(`Moved to step ${step + 1}`);
            // Save draft to localStorage or API
        }
    };

    return (
        <div className="max-w mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">New Application</h1>
                <p className="text-gray-500 mt-1">
                    Fill out the form below to submit a new application for government clearances.
                    Fields marked with <span style={{ color: '#dc2626' }}>*</span> are mandatory.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <DynamicForm config={formConfig} />
            </div>
        </div>
    );
}
