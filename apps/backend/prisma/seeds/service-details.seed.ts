import { PrismaClient } from '@prisma/client';

/**
 * Service Details Seed Data
 * Populates the m_service_details table by matching services by name
 * from the m_service table.
 */

interface ServiceDetailEntry {
    departmentName: string;
    serviceName: string;
    typeOfService: string;
    serviceIncidence: string;
    serviceSoP: string;
    serviceTimeline: string;
    serviceFee: string;
}

const serviceDetailsData: ServiceDetailEntry[] = [
    {
        departmentName: "Agriculture Department",
        serviceName: "New License for manufacturing of Fertilisers",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-186-0.pdf",
        serviceTimeline: "30",
        serviceFee: "1000"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment in license for manufacturing of fertilizer",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-186-1.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Surrender license for manufacturing of fertilizer",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-186-3.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Issue duplicate license for manufacturing of fertilizer",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-186-5.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "New license for manufacturing of mixture fertilisers",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment in license for manufacturing of mixture fertilizer",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-187-1.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Surrender license for manufacturing of mixture fertilizer",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-187-3.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Issue duplicate license for manufacturing of mixture fertilizer",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Renewal license for manufacturing of mixture fertilisers",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-187-6.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "New license for manufacturing of special fertilizer",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-188-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment in license for manufacturing of special fertilizer",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Surrender license for manufacturing of special fertilizer",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-188-3.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Issue duplicate license for manufacturing of special fertilizer",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Renewal of license for manufacturing of special fertilizer",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-188-6.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "License for pool handling of fertiliser",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Renewal of license for pool handling of fertiliser",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-189-6.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Application for Sell/Storage for Wholeseller/Retailer (Service Under Fertilizer)",
        typeOfService: "License",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-190-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment of Application for Sell/Storage for Wholeseller/Retailer (Service Under Fertilizer)",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-190-1.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Renewal of Application for Sell/Storage for Wholeseller/Retailer (Service Under Fertilizer)",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-190-6.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Application for Letter of Authorisation for Fertiliser State Cell C&F Under The Fertilizer Control Order, 1985",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-191-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment of Application for Letter of Authorisation for Fertiliser State Cell C&F Under The Fertilizer Control Order, 1985",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-191-1.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Renewal of Application for Letter of Authorisation for Fertiliser State Cell C&F Under The Fertilizer Control Order, 1985",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-191-6.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "NOC for  Manufacturing of Notified Product under The  Fertilizer Control Order, 1985",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-192-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Application for grant license to stock and use of insecticide commercial pest control operations",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-193-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Renewal of Application for grant license to stock and use of insecticide commercial pest control operations",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-193-6.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Application for Grant of License to Manufacture Insecticides",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-194-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment of Application for Grant License to Manufacture Insecticides",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-194-1.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Application for grant of license for sell and storage of seeds",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-195-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment of application for grant of license for sell and storage of seeds",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Renewal of application for grant of license for sell and storage of seeds",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-195-6.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Legacy Form - Application for grant of license for sell and storage of seeds",
        typeOfService: "Utilities",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Registration of firm for certified seed production",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-196-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Certificate for Manufacturing Mixture/Special Mixture  Fertilizer under The Fertilizer Control Order,1985",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-197-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment of Certificate for Manufacturing Mixture/Special Mixture Fertilizer under The Fertilizer Control Order,1985",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Renewal of Certificate for Manufacturing Mixture/Special Mixture Fertilizer under The Fertilizer Control Order,1985",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-197-6.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Application for Grant of License to Sell,Stock or Exhibit for Sale or Distribute Insecticides",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-577-0.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Agriculture Department",
        serviceName: "Amendment of Application for Grant of License to Sell,Stock or Exhibit for Sale or Distribute Insecticides",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-577-1.pdf",
        serviceTimeline: "30",
        serviceFee: "500"
    },
    {
        departmentName: "Bridge, Ropeway, Tunnel And Other Infrastructure Development Corporation Of Uttarakhand Limited(BRIDCUL)",
        serviceName: "Application for empanelment of Contractors",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "125"
    },
    {
        departmentName: "Co-operative Department",
        serviceName: "Registration of Co-operative Society",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-648-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "DA-District Supply Office",
        serviceName: "License for ration shop",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "DA-District Supply Office",
        serviceName: "Cancellation of license of ration shop",
        typeOfService: "Amendment - Cancellation",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "DA-District Supply Office",
        serviceName: "Transfer of license of ration shop",
        typeOfService: "Amendment - Transfer",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "DA-District Supply Office",
        serviceName: "Renewal of license for ration shop",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "DA-District Supply Office",
        serviceName: "License for high speed diesel",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "DA-District Supply Office",
        serviceName: "Renewal of license for high speed diesel",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "DA-District Supply Office",
        serviceName: "License for petty diesel",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Education",
        serviceName: "NOC for setting up CBSE/ICSE/BSB school",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-630-0.pdf",
        serviceTimeline: "",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-630-0.pdf"
    },
    {
        departmentName: "Department of Education",
        serviceName: "Approval for setting up a hostel",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-631-0.pdf",
        serviceTimeline: "",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Education",
        serviceName: "Application for Registration under RTE",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-632-0.pdf",
        serviceTimeline: "",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Education",
        serviceName: "Renewal of Application for Registration under RTE",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Education",
        serviceName: "Approval for setting up and operating of Play/ Pre-Primary School",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-633-0.pdf",
        serviceTimeline: "",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Food and Civil Safety",
        serviceName: "Registration under FSSAI",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-217-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-217-0.pdf"
    },
    {
        departmentName: "Department of Food and Civil Safety",
        serviceName: "License under FSSAI",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-218-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-218-0.pdf"
    },
    {
        departmentName: "Department of Food and Civil Supplies",
        serviceName: "Application For License For Fair Price Shops (for URBAN Areas Only)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-641-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-641-0.pdf"
    },
    {
        departmentName: "Department of Higher Education",
        serviceName: "Setting Up of Private University LoI",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-286-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Higher Education",
        serviceName: "Permission for Setting up Private University",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-937-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for addition alteration of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-46-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for compounding of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for completion cum occupancy certificate of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of multiple dwelling unit",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-49-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-49-0.pdf"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for addition alteration of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-50-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-50-0.pdf"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for compounding of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for completion cum occupancy certificate of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-52-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-52-0.pdf"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of group housing",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for addition alteration of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-53-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for compounding of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-55-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-55-0.pdf"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for completion cum occupancy certificate of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of non-residential map",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for layout plan approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Plinth level inspection of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Land use conversion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-258-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-258-0.pdf"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Land use report",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Reopening of new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Time Extension of Approved Map of Multiple Dwelling Unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Reopening of new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Time extension of approved map of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Reopening of new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Time extension of approved map of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Intermediate inspection of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Intimation for Completion Certificate",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for self-compounding of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for self-compounding of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Application for self-compounding of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Plinth level inspection of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Intermediate inspection of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Plinth level inspection of non-residential maps",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Intermediate inspection of non-residential maps",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Completion cum Occupancy permit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-662-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-662-0.pdf"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Modification and Alteration in Building Plan",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Housing (UHUDA)",
        serviceName: "Change of Land Use (CLU)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration under Shops and Establishment Act AND/OR Issuance of Trade License",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-2-0.pdf",
        serviceTimeline: "1",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-2-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment under The Dookan aur Vanijya Adhisthan Adhiniyam, 1962",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-2-1.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-2-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal under The Dookan aur Vanijya Adhisthan Adhiniyam, 1962",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-2-6.pdf",
        serviceTimeline: "1",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-2-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "License under The Contract Labour Act, (Regulation and Abolition),1970",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-3-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-3-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal of license under The Contract Labour Act, 1970",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-3-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-3-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment of license under The Contract Labour Act, 1970",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-3-1.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-3-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment of license under The Factories Act, 1948",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-4-1.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-4-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Surrender of license under The Factories Act, 1948",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-4-3.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Transfer of license under The Factories Act, 1948",
        typeOfService: "Amendment - Transfer",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Duplicate of license under The Factories Act, 1948",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration & grant of license under The Factories Act, 1948",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-4-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-4-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration & grant of license under The Factories Act, 1948",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-4-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-4-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal of license under The Factories Act, 1948",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-4-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-4-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Site plan approval under The Factories Act, 1948",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-5-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-5-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Site plan approval under The Factories Act, 1948",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-5-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-5-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment of Site plan approval under The Factories Act, 1948",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration of principal employer under The Contract Labour Act, 1970",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-10-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-10-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration of principal employer under The Contract Labour Act, 1970",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-10-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-10-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment of registration of principal employer under The Contract Labour Act, 1970",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-10-1.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-10-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration under The Motor Transport Workers Act, 1961",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-13-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-13-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration under The Motor Transport Workers Act, 1961",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-13-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-13-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment under The Motor Transport Workers Act, 1961",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-13-1.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-13-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Surrender under The Motor Transport Workers Act, 1961",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-13-3.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Certificate Transfer - The Motor Transport Workers Act, 1961",
        typeOfService: "Amendment - Transfer",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal under The Motor Transport Workers Act, 1961",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-13-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-13-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration of principal employer under The Inter-State Migrant Workmen (RE&CS) Act, 1979",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-16-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-16-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment of registration of principal employer under The Inter-State Migrant Workmen (RE&CS) Act, 1979",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-16-1.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-16-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Surrender of registration of principal employer under The Inter-State Migrant Workmen (RE&CS) Act, 1979",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-16-3.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "License of contractor under The Inter-State Migrant Workmen (RE&CS) Act, 1979",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-18-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-18-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment of license of contractor under The Inter-State Migrant Workmen (RE&CS) Act, 1979",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-18-1.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-18-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal of license of contractor under The Inter-State Migrant Workmen (RE&CS) Act, 1979",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-18-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-18-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration of establishment under The Building and Other Construction Workers Act, 1996",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-23-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-23-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration of establishment under The Building and Other Construction Workers Act, 1996",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-23-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-23-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Extension under The Building and Other Construction Workers Act, 1996",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-23-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-23-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration of establishment under The Indian Boilers Act, 1923 (Boiler & Economiser)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-98-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-98-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration of establishment under The Indian Boilers Act, 1923 (Boiler & Economiser)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-98-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-98-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment under the The Indian Boilers Act, 1923 (Boiler & Economiser)",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-98-1.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-98-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal under The Indian Boilers Act, 1923 (Boiler & Economiser)",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-98-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-98-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Approval for boiler manufacturer certificate",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-120-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-120-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Amendment of boiler manufacturer certificate",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-120-1.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal of boiler manufacturer certificate",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-120-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-120-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Approval for boiler erector certificate",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-121-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-121-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal of boiler erector certificate",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-121-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-121-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Approval for draft standing order",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-284-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Modification of standing order",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-284-1.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Boiler component approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-285-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-285-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Renewal of boiler component approval",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-285-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-285-6.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Welder certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-288-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-288-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Certification of hindi and english version of standing order under The Industrial Establishment (Standing Order) Act, 1946",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Certification of hindi and english version of standing order under The Industrial Establishment (Standing Order) Act, 1946",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Endorsement certificate (erector & welder)",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-382-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-382-0.pdf"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Permission for closure - mandatory for more than 300 workers",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-383-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Permission for lay-off - mandatory for more than 100 workers",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-384-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Record transfer of boiler",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Steam test of boilers",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-386-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Remnant life assessment of boiler",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-387-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Registration under start up self-certification scheme (Labour)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Labour",
        serviceName: "Single integrated Returns",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Education",
        serviceName: "Medical college- essentiality certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-213-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Education",
        serviceName: "Dental college- essentiality certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-214-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-214-0.pdf"
    },
    {
        departmentName: "Department of Medical Education",
        serviceName: "Nursing school / college -certificate of essentiality",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Education",
        serviceName: "NOC to establish para medical college and further to be approved by PMC",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-216-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to manufacture for sale or for distribution of drugs",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-125-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-125-0.pdf"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to manufacture for sale or for distribution of drugs",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to manufacture for sale or for distribution of drugs",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-125-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-125-6.pdf"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to manufacture for sale or for distribution of homoeopathic medicines",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to manufacture for sale or for distribution of homoeopathic medicines",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to manufacture for sale or for distribution of homoeopathic medicines",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to operate a blood bank for collection, storage and processing of whole human blood and/or its components for sale or distribution",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to operate a blood bank for collection, storage and processing of whole human blood and/or* its components for sale or distribution",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to operate a blood bank for collection, storage and processing of whole human blood and/or its components for sale or distribution",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to manufacture and store blood products for sale or distribution",
        typeOfService: "License",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to manufacture and store blood products for sale or distribution",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to manufacture and store blood products for sale or distribution",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to manufacture cosmetics for sale or for distribution",
        typeOfService: "License",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Loan licence to manufacture cosmetics for sale or for distribution",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "License to sell, stock or exhibit [or offer] for sale, or distribute] by retail, drugs",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-393-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-393-0.pdf"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate license to sell, stock [or exhibit] or offer for sale, or distribute] by retail, drugs",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Retension of license to sell, stock or exhibit [or offer] for sale, or distribute] by retail, drugs",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-393-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-393-6.pdf"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to sell, stock or exhibit [or offer] for sale, or distribute by wholesale, drugs",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-394-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-394-0.pdf"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to sell, stock or exhibit [or offer] for sale, or distribute by wholesale, drugs",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Retention of licence to sell, stock or exhibit [or offer] for sale, or distribute by wholesale, drugs",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-394-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-394-6.pdf"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Loan licence to manufacture for sale or for distribution of drugs",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate loan licence to manufacture for sale or for distribution of drugs",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of loan licence to manufacture for sale or for distribution of drugs",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to repack for sale or distribution of drugs being drugs",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to repack for sale or distribution of drugs being drugs",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to repack for sale or distribution of drugs being drugs",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to sell by wholesale or to distribute drugs from a motor vehicle.",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-548-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to sell by wholesale or to distribute drugs from a motor vehicle.",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to sell by wholesale or to distribute drugs from a motor vehicle.",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to manufacture for sale or for distribution of large volume parenterals/sera and vaccines/recombinant DNA (R-DNA) derived drugs specified in schedules C and C (i) excluding those specified in schedule X",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to manufacture for sale or for distribution of large volume parenterals/sera and vaccines/recombinant DNA (R-DNA) derived drugs specified in schedules C and C (i) excluding those specified in schedule X",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to manufacture for sale or for distribution of large volume parenterals/sera and vaccines/recombinant DNA (R-DNA) derived drugs specified in schedules C and C (i) excluding those specified in schedule X",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Loan licence to manufacture for sale or for distribution of large volume parenterals/sera and vaccines/recombinant DNA (R-DNA) derived drugs excluding those specified in schedule X",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate loan licence to manufacture for sale or for distribution of large volume parenterals/sera and vaccines/recombinant DNA (R-DNA) derived drugs excluding those specified in schedule X",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of loan licence to manufacture for sale or for distribution of large volume parenterals/sera and vaccines/recombinant DNA (R-DNA) derived drugs excluding those specified in schedule X",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to collect, process, test, store, banking and release of umbilical cord blood stem cells",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to collect, process, test, store, banking and release of umbilical cord blood stem cells",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to collect, process, test, store, banking and release of umbilical cord blood stem cells",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to manufacture drugs for purposes of examination, test or analysis",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Approval for carrying out tests on drugs / cosmetics and raw materials used in their manufacture on behalf of licensees for manufacture for sale of drugs / cosmetics",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to sell, stock or exhibit or offer for sale, or distribute] homoeopathic medicines by retail",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-554-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to sell, stock or exhibit or offer for sale, or distribute] homoeopathic medicines by retail",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to sell, stock or exhibit or offer for sale, or distribute] homoeopathic medicines by retail",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to sell, stock or exhibit or offer for sale, or distribute] homoeopathic medicines by wholesale",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-555-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Issuance of duplicate licence to sell, stock or exhibit or offer for sale, or distribute] homoeopathic medicines by wholesale",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to sell, stock or exhibit or offer for sale, or distribute] homoeopathic medicines by wholesale",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Licence to manufacture for sale of ayurvedic (including siddha) or unani drugs",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of licence to manufacture for sale of ayurvedic (including siddha) or unani drugs",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Loan licence to manufacture for sale ayurvedic (including siddha) or unani drugs",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of loan licence to manufacture for sale ayurvedic (including siddha) or unani drugs",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Approval for carrying out tests or analysis on ayurvedic, siddha and unani drugs or raw materials used in the manufacture thereof on behalf of licensees for manufacture for sale of ayurvedic, siddha and unani drugs",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of approval for carrying out tests or analysis on ayurvedic, siddha and unani drugs or raw materials used in the manufacture thereof on behalf of licensees for manufacture for sale of ayurvedic, siddha and unani drugs",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "License of application for New Registration Under PC & PNDT Act, 1994",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-652-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Renewal of License of application for New Registration Under PC & PNDT Act, 1994",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Drug Manufacturing License",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-674-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-674-0.pdf"
    },
    {
        departmentName: "Department of Medical Health and Family Welfare",
        serviceName: "Drug Manufacturing License(Retention)",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Panchayati Raj",
        serviceName: "License to operate shops",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Panchayati Raj",
        serviceName: "License for contractors",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Panchayati Raj",
        serviceName: "Tax on circumstances and property",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land Use Change Permission under Section 143 of UPZA&LR Act",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-31-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-31-0.pdf"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land Use Change Permission under Section 143 of UPZA&LR Act",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-31-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-31-0.pdf"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land purchase permission (sec 154 ZA&LR Act)",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Mutation of land",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "45",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Domicile certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Freedom fighter certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Character verification (under the jurisdiction of revenue police)",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Uttarjivi (succession or family membership) certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Income certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Caste certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Issuance of character certificate (for employment)",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Title certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Character certificate (for contractor)",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Providing copy of ROR - on application in tehsil",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Providing copy of ROR - on application to lekhpal in rural area / deputy revenue inspector (patwari)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Providing copy of land map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Providing copy of khasra",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land Purchase Permission for Medical or Health Purpose under Section 154 (4)(3)(a)(i) UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-605-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land Purchase Permission for Hotel, Lodge, Guesthouse, Restaurant, Bar , Resort under Section 154 (4)(3)(a)(ii) of UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land Purchase Permission for Educational Purposes under Section 154 (4)(3)(a)(iii) of UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land Purchase Permission for Cultural Purposes under Section 154 (4)(3)(a)(iv) of UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land Purchase Permission for others under Section 154 (4)(3)(a)(vi) of UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Land Purchase Permission for Agriculture/Horticulture under 154 (4)(3)(b) of UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Revenue",
        serviceName: "Change of Land Use under Section 144 of UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Delivery of registered document",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Delivery of most urgent certified copy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Disposal of most urgent application for certified copy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of conveyance, sale deed",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Delivery of urgent certified copy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of sale certificate",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Disposal of urgent application for certified copy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of agreement",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Delivery of general certified copy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Disposal of general application for certified copy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Search / inspection application",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Issue of non-encumbrance certificate",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of warrant of goods",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of lease",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of transfer of lease",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of transfer deed",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of mortgage deed",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of share warrants",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of bond",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of surrender of lease",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of indemnity bond",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of bill of exchange",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of dissolution of partnership",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of development agreement",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of debenture",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of receipt",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of custom bonds",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of power of attorney",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of counterpart",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of exchange of property",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of composition deed",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of cancellation (will)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of gift immovable",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of respondentia bond",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of will",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of rectification deed",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of deed of adoption",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of re-conveyance",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of arbitration and award",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of memorandum of association",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of partition deed",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of authenticated power of attorney",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of partnership",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of affidavit",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of acknowledgement",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of release",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of agreement of apprenticeship",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of settlement",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of hire â€“ purchase agreement",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of security bond",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Registration of trust",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Department of Stamps & Registration",
        serviceName: "Property Registration",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "Issuance of phytosanitary certificates",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "Subsidy for establishment of food parks and food processing units within food parks",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "NOC for tree felling ( fruit plants)",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-392-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "test",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "test",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "tetst",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "tett",
        typeOfService: "Amendment - Transfer",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "ettdtddt",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Horticulture and Food Processing",
        serviceName: "etdtt",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Udyog Aadhar registration",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-278-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Land allotment in departmental industrial estates",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-279-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Time extension for new industrial units",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-279-1.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Transfer of plot in departmental industrial estates",
        typeOfService: "Amendment - Transfer",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-279-4.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Rent permission in departmental industrial estates",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-280-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration certificate under MSME policy 2015 - Uttarakhand micro and small enterprise facilitation council",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-281-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration under purchase preference policy, 2014 for micro and small units",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-282-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "In principle approval - common application form",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-283-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application under PMEGP for credit linked subsidy programme",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-318-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration under special package of industrial incentive scheme (CCIS-2013)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-319-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim of central capital investment subsidy for new units",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-320-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration under freight subsidy scheme 2013",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-321-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim of freight subsidy scheme 2013",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-322-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application under Chief Minister Swarojgar Yojna for Credit Linked Subsidy programme",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-323-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration under MSME policy, 2015",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-324-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim of the investment promotion incentive under MSME policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-326-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim of the interest subsidy under MSME policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-328-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Reimbursement of electricity bills under MSME policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-332-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim of state transport subsidy under MSME policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-334-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Reimbursement of VAT under MSME policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-336-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim of the capital subsidy under hill policy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-338-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim of the interest subsidy under hill policy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-340-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Reimbursement of electricity bills under hill policy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-343-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim of state transport subsidy under hill policy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-344-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Reimbursement of VAT under hill policy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-345-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim for capital subsidy under special promotional scheme for women entrepreneurs",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-347-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Claim for interest subsidy under special promotional scheme for women entrepreneurs",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-348-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Restoration of allotment of cancelled plots",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-388-0.pdf",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Permission for Relocation within district",
        typeOfService: "Permission",
        serviceIncidence: "Pre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-389-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Permission for Relocation within State",
        typeOfService: "Permission",
        serviceIncidence: "Pre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-390-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Permission for Relocation outside State",
        typeOfService: "Permission",
        serviceIncidence: "Pre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-391-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration of Existing Enterprise",
        typeOfService: "Approval",
        serviceIncidence: "Pre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration under Uttarakhand Start-up Policy 2018",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for monetary benefits for startups under Uttarakhand State Start-up Policy 2018",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for monetary benefits for incubators under Uttarakhand State Start-up Policy 2018",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for availing sponsorship assistance under Uttarakhand State Start-up Policy 2018",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration of Incubator under Uttarakhand State Start-Up Policy 2018",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration of Nodal Agency under Uttarakhand State Start-Up Policy 2018",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Registration of Mentor under Uttarakhand Start-up Policy 2018",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for In-principle Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Capital Subsidy Under MSME",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for claiming Incentives for reimbursement of Stamp Duty Under MSME",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Land Purchase Permission for Hotel, Lodge, Guesthouse, Restaurant, Bar , Resort under Section 154 (4)(3)(a)(ii) of UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Land Purchase Permission for Educational Purposes under Section 154 (4)(3)(a)(iii) of UP ZA & LR Act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for claiming Incentives for reimbursement of SGST under MSME Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for claiming Incentives for reimbursement of Internet Charges under MSME Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for claiming Incentives for reimbursement of Excise Duty under MSME Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for claiming Incentives for reimbursement of ISO charges under MSME Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for claiming Incentives for reimbursement of Mandi Tax Under MSME Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Capital Subsidy Under MSME Policy (Women Entrepreneur)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Interest Subsidy Under MSME Policy (Women Entrepreneur)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for Rebate/ Concession on Land Cost",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for Reimbursement of Land Conversion Fee",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for Marketing Assistance",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for Skill Development Support",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Financial incentives for Research & Development",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for Reimbursement of Quality Certification Costs",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for Reimbursement of Interest on Working Capital",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Investment Proposal",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "IN-Principal Approval New",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Industries",
        serviceName: "Application for Private Industrial Estate Notification CAF",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Directorate of Technical Education",
        serviceName: "NOC for the establishment of ITI, polytechnic, engineering college, MBA, MCA institutions in the state",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "Land purchase permission of agriculture land",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "Sale of agriculture land",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "License to possess and sell from a shop small-arms nitro-compound",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "Firework license for storage and sale",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "Renewal of license of firework for storage and sale",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "License for sale of fire crackers",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-277-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-277-0.pdf"
    },
    {
        departmentName: "District  Administration",
        serviceName: "License for Screening of Films (GRANT OF CINEMATOGRAPH LICENSE)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-656-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-656-0.pdf"
    },
    {
        departmentName: "District  Administration",
        serviceName: "NOC required for setting up of  Petroleum, Diesel & Naphtha  manufacturing, storage, sale, transport",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-664-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "NOC required for setting up of Explosives Manufacturing, Storage, Sale, Transport",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-665-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "Permission for Cable Television under The Uttarakhand Cable Television Network (Exhibition) Rules, 2012",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District  Administration",
        serviceName: "Permission for DTH under The Uttarakhand DTH broadcasting Service (Exhibition )Rules,2009",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Almora",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Bageshwar",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Chamoli",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Champawat",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "New Submission (Building Plan Approval)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Dehradun (MDDA)",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Haridwar  (HRDA)",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Nainital",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pauri Garhwal",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Pithoragarh",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Rudraprayag",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Tehri",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Udham Singh Nagar",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "New Submission",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Self Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Intermediate Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "District Development Authority - Uttarkashi",
        serviceName: "Occupancy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Approval of drawing, map, plan and sections as per sec. 53 (f) of The Electricity Act, 2003",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-128-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-128-0.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Testing of temporary connection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-129-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-129-0.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Re-testing of temporary connection",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-129-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-129-6.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Application for approval of CEI prior to energization of electrical installation for voltage greater than 650V (Regulation 43)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-130-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-130-0.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Application for inspection and testing of consumer's / owner's LT installation",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-131-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-131-0.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Inspection and testing of special equipment - CT scanner / MRI",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Approval for installation of passenger lift and lift shaft and machine room",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Permission for erection or alteration of building, structure, flood banks and elevation of roads",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Inspection and testing of special equipment - X-ray / neon sign boards",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Inspection and testing of special equipment - welding set of single phase type",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Inspection and testing of special equipment - welding set of two phase type",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Inspection and testing of special equipment - welding set of three phase type",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Inspection and testing of special equipment - electric furnace",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Inspection and testing of associated sub station equipment (linked switch, breaker, isolator, HT, EHT voltage)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Application for testing meters of any description",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Examination of supervisor",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "National competency certificate for supervisor",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Certificate of competency -supervisors class A",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Renewal of certificate of competency - supervisors class A",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Certificate of competency -supervisors class B",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Renewal of certificate of competency - supervisors class B",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Application for examination of workman permit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Certificate of workman permit class A",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Renewal of certificate of workman permit class A",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Certificate of workman permit class B",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Renewal of certificate of workman permit class B",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Licence for electrical contractor class A",
        typeOfService: "License",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Renewal of license for electrical contractor class A",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Licence for electrical contractor class B",
        typeOfService: "License",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Renewal of license for electrical contractor class B",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Licence for electrical contractor class C",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Renewal of license for electrical contractor class C",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Upgradaton of license for electrical contractor",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Half Yealry returns submitted by contractor",
        typeOfService: "Intimation",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Register of contracts (contractor)",
        typeOfService: "Intimation",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Approval of electrical installations of Generating Sets under regulation 32",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-582-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/3.Fee Structure CEIG approval greater than 650V reg 32.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Renewal of electrical installations of Generating Sets under regulation 32",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Retesting of Temporary electrical installations under Section 54",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "7",
        serviceFee: "0"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Approval of drawing, map, plan and sections as per sec. 53 (f) of The Electricity Act, 2003â€™ under regulation 32 (Generator Set)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-603-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/3.Fee Structure Drawing Map reg 32.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Approval of drawing, map, plan and sections as per sec. 53 (f) of The Electricity Act, 2003â€™ under regulation 32 (Generator Set)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-603-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/3.Fee Structure Drawing Map reg 32.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Approval of Temporary electrical installations under Section 54",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-604-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/3.Fee Structure Testing & Re-Testing of Temp Connection under section 54.pdf"
    },
    {
        departmentName: "Electrical Inspectorate",
        serviceName: "Retesting of Temporary electrical installations under Section 54",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-EstablishmentPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-604-1.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/3.Fee Structure Testing & Re-Testing of Temp Connection under section_54.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-39 (license for possession of specially denatured spirit)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-40 (license for possession of specially denatured spirit where alcohol is used as solvent or processing unit)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-41 (license for possession of specially denatured spirit where alcohol is used as a solvent or vehicle dietary and appears to some extent in final product)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-5D (retail sale of foreign liquor in sealed bottle)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-6 (bar license to operate in hotel)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-360-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-360-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Renewal of FL-6 (bar license to operate in hotel)",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-360-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-360-6.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-7C (permit for possession of foreign liquor by clubs)",
        typeOfService: "Permit",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-6A composite (license to operate in hotel premise)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-7 (bar license to operate in restaurant)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-364-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-364-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Renewal of FL-7 (bar license to operate in restaurant)",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-364-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-364-6.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "CL-5 (license to retail sale country liquor)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FLM-2 (license for establishment of bottling plant)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-366-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-366-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FLM-3 (license to operate bottling plant)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-367-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-367-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "PD-33 (license for establishment of distillery)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-368-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-368-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "PD-2 (license to operate distillery)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-369-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-369-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "B-20 (license for establishment of brewery)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-370-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-370-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "B-1 (license to operate brewery)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-371-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-371-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "V-1 (license for establishment of vintnery)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-372-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "License to operate vintnery",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "M.A-4, M.A-1 (retail sale of methyl alcohol)",
        typeOfService: "License",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-32 (license to use spirit  for manufacturing / testing of medicines)",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "NDLC - narcotic drug license for chemist",
        typeOfService: "License",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Narcotic drug license for dealer",
        typeOfService: "License",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-1 (license to manufacture medicinal and toilet preparation containing alcohol, opium, Indian hemp and other narcotic drug and narcotics under bond for payment of duty",
        typeOfService: "License",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Wholesaler for IMFL",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-379-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-379-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-11 (license to occasional consumption of foreign liquor)",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Label Registration - Foreign Liquor",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-453-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-453-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Brand registration - country liquor",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-454-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-454-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Registration for one day bar license",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-455-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-455-0.pdf"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-2A â€“ Wholesaler for CSD (Canteen Store Dept.)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-653-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-2B â€“ Wholesaler for Beer",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-654-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "FL-9A â€“ Retailer for CSD",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-655-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Export & Import Permit of Spirit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "License for Bonded warehouse",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-681-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Excise Department",
        serviceName: "Excise Verification Certificate",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-892-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-892-0.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Application For Registration Under Rule 27 Of The Legal Metrology (Packaged Commodities) Rules,2011",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-119-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-119-0.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Amendment For Registration Under Rule 27 Of The Legal Metrology (Packaged Commodities) Rules,2011",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-119-1.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-119-1.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Surrender For Registration Under Rule 27 Of The Legal Metrology (Packaged Commodities) Rules,2011",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-119-3.pdf",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Application for Licence as Manufacturer of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-226-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-226-0.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Application for Licence as Manufacturer of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-226-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-226-0.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Amendment in Licence as Manufacturer of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-226-1.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-226-1.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Surrender Licence as Manufacturer of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-226-3.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-226-3.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Renewal of Licence as Manufacturer of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-226-6.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-226-6.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Renewal of Licence as Manufacturer of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-226-6.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-226-6.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Application for Licence as Dealers of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-227-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-227-0.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Amendment in Licence as Dealers of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-227-1.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-227-1.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Surrender Licence as Dealers of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-227-3.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-227-3.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Renewal of Licence as Dealers of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-227-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-227-6.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Application for Licence as Repairers of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-228-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-228-0.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Amendment in Licence as Repairers of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-228-1.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-228-1.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Surrender Licence as Repairers of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-228-3.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-228-3.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Renewal of  Licence as Repairers of Weights & Measures under Legal Metrology Act, 2009",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-228-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-228-6.pdf"
    },
    {
        departmentName: "FCS - Legal Metrology Department",
        serviceName: "Application for verification/re-verification of weights and measures",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-635-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-635-0.pdf"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "Permission for screening plant",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-219-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "Stone Crusher/Screening Plants Permits and Storage License and Renewal under Uttarakhand Stone Crusher, Screening Plant, Mobile Stone Crusher, Mobile Screening Plant, Pulveriser Plant, Hot Mix Plant, Ready Mix Plant License Rules 2020",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-220-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-220-0.pdf"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "Sanction of Storage of Construction Materials",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-221-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-221-0.pdf"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "License for minor minerals",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-222-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "License for major minerals â€“ reconnaissance permit",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-223-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "License for major minerals â€“ prospecting license",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-224-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "License for major minerals â€“ transfer of prospecting license",
        typeOfService: "Amendment - Transfer",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-224-4.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "License for major minerals â€“ renewal of prospecting license",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-224-6.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "License for major minerals â€“ mining lease",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-225-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "License for major minerals â€“ transfer of mining lease",
        typeOfService: "Amendment - Transfer",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-225-4.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "License for major minerals â€“ renewal of mining lease",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-225-6.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "Applications for Short Term Permit for Soil Excavation and Filling",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-267-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-267-0.pdf"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "Issuance of Letter of Intent for Mining Lease (Under Uttarakhand Minor Mineral Rules 2017)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-659-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-659-0.pdf"
    },
    {
        departmentName: "Geology and Mining Unit",
        serviceName: "Approval of Mining Plan and Issuance of Mining Lease",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-660-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-660-0.pdf"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-33-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for addition alteration of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-34-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for compounding of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-35-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for completion cum occupancy certificate of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of multiple dwelling unit",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-37-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for compounding of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-39-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for completion cum occupancy certificate of group housing",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of group housing",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-41-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for addition alteration of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-42-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for compounding of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-43-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for completion cum occupancy certificate of non-residential map",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of non-residential map",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for layout plan approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Land use conversion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Land use report",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Reopening of new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-416-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Time extension of approved map of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-417-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Reopening of new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-418-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Time extension of approved map of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-419-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Reopening of new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-420-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Time extension of approved map of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-421-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Intimation of Plinth Level Inspection",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for self-compounding of group housing",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for self-compounding of non-residential map",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Intimation for Intermediate Level Inspection",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Intimation for Completion Certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Application for self-compounding of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Plinth level inspection of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Intermediate inspection of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Plinth level inspection of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Intermediate inspection of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Plinth level inspection of non-residential maps",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Haridwar Roorkee Development Authority (HRDA)",
        serviceName: "Intermediate inspection of non-residential maps",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for addition alteration of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-70-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for compounding of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for completion cum occupancy certificate of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of multiple dwelling unit",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for addition alteration of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-81-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for compounding of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-83-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for completion cum occupancy certificate of group housing",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of group housing",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-86-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for addition alteration of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-87-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for compounding of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for completion cum occupancy certificate of non-residential map",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of non-residential map",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for layout plan approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Land use conversion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Land use report",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Reopening of new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Time extension of approved map of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Reopening of new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Time extension of approved map of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-433-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Reopening of new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Time extension of approved map of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Plinth level inspection of group housing",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Plinth level inspection of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Plinth level inspection of non-residential maps",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Intermediate inspection of group housing",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Intermediate inspection of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Intermediate inspection of non-residential maps",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for self-compounding of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for self-compounding of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Lake Development Authority (LDA)",
        serviceName: "Application for self-compounding of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for addition alteration of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for compounding of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for completion cum occupancy certificate of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of multiple dwelling unit",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for addition alteration of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for compounding of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for completion cum occupancy certificate of group housing",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "8",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of group housing",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "8",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for addition alteration of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for compounding of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for completion cum occupancy certificate of non-residential map",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "8",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of non-residential map",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "8",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for layout plan approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Reopening of new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Time extension of approved map of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Reopening of New Submission of Group Housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Time extension of approved map of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Reopening of New Submission of Non-Residential Map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Plinth level inspection of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Time extension of approved map of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Land use conversion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Land use report",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Intermediate inspection of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Intimation for Completion Certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for self-compounding of group housing",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for self-compounding of non-residential map",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Application for self-compounding of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Plinth level inspection of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "7",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Intermediate inspection of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Plinth level inspection of non-residential maps",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "7",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Intermediate inspection of non-residential maps",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Mussorie Dehradun Development Authority (MDDA)",
        serviceName: "Commencement of Construction",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for new submission of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-57-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for addition alteration of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-58-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for compounding of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-59-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for completion cum occupancy certificate of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of multiple dwelling unit",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for addition alteration of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-62-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for compounding of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for completion cum occupancy certificate of group housing",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of group housing",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for addition alteration of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-66-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for compounding of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for completion cum occupancy certificate of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of non-residential map",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for layout plan approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Land use conversion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Land use report",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Reopening of New Submission of Multiple Dwelling Unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Time extension of approved map of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Reopening of new submission of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Time extension of approved map of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Reopening of new submission of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Time extension of approved map of non-residential map",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Plinth level inspection of multiple dwelling unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Intermediate inspection of multiple dwelling unit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Intimation for Completion Certificate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for self-compounding of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for self-compounding of non-residential map",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Application for Self Compounding of Multiple Dwelling Unit",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Plinth level inspection of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Intermediate inspection of group housing",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Plinth level inspection of non-residential maps",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "HD - Special Area Development Authority (SADA)",
        serviceName: "Intermediate inspection of non-residential maps",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Information Technology Development Agency",
        serviceName: "Application for permission / renewal for laying / establishment of underground telecom infrastructure / Optical Fibre Cable",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Information Technology Development Agency",
        serviceName: "Application for permission / renewal of permission for installation of over ground Telecom Infrastructure/ Mobile Tower Approval",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-581-0.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-581-0.pdf"
    },
    {
        departmentName: "Information Technology Development Agency",
        serviceName: "Right of way (ROW)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Information Technology Development Agency",
        serviceName: "Application for survey of underground/overground",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Information Technology Development Agency",
        serviceName: "Force Majeure for RoW",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for connectivity to distribution system by open access customer under UERC (Terms and Conditions for Intra-State Open Access) Regulations, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-299-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for connectivity in inter-state transmission system under CERC (Open Access in Inter-State Transmission) Regulations, 2008",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-300-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for long-term access involving inter-state transmission system under CERC (Open Access in Inter-State Transmission) Regulations, 2008",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-301-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for long-term access without involving inter-state transmission system under UERC (Terms and Conditions for Intra-State Open Access) Regulations, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-302-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for long-term access involving distribution system under UERC (Terms and Conditions for Intra-State Open Access) Regulations, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-303-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for medium-term access involving inter-state transmission system under CERC (Open Access in Inter-State Transmission) Regulations, 2008",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-304-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for medium-term access without involving inter-state transmission system UERC (Terms and Conditions for Intra-State Open Access) Regulations, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-305-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for medium-term access involving distribution system UERC (Terms and Conditions for Intra-State Open Access) Regulations, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-306-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for short-term access involving inter-state transmission system under CERC (Open Access in Inter-State Transmission) Regulations, 2008",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-307-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for short-term access without involving inter-state transmission system -open access in advanced",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-308-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for short-term access without involving inter-state transmission system â€“ bidding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-309-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for short-term access without involving inter-state transmission system - day ahead operation",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-310-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for short-term access involving distribution system - open access in advanced",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-311-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for short-term access involving distribution system - bidding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-312-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Application for short-term access involving distribution system - day ahead operation",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-313-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Consent by STU / SLDC for open access without involving inter-state transmission system under UERC (Terms and Conditions for Intra-State Open Access) regulations, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-314-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Power Transmission Corporation of Uttarakhand Ltd.",
        serviceName: "Consent by STU / SLDC for open access involving distribution system under UERC (Terms and Conditions for Intra-State Open Access) regulations, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-315-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Right of Way",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-256-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-256-0.pdf"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Permission for laying of service such as pipeline, sewerage line, electrical cables, telephone cables etc., along or across the road or bridge",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Permission for mining activities within 50 meters from either side of existing road or 500 meters upstream or downstream of a bridge",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Permission for carrying out any private or commercial activity within the acquired and controlled area",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Permission for installation of hand pumps within the acquired and controlled area",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Permission for parking of accidental vehicles / machinery on the road upto 48 hours",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Permission for temporary stacking of materials / goods on the road for a period not exceeding 48 hours",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Permission to erect or re-erect any building, or make or extend any excavation, or lay-out any means of access to a road in a controlled area",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Public Works Department",
        serviceName: "Registration of Contractors for Works and Services",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-647-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-647-0.pdf"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Registration of Partnership Firms under the (Uttar Pradesh) Indian Partnership Rules, 1933",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-126-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-126-0.pdf"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Registration of society under the Uttar Pradesh Societies Registration Rules, 1976",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-127-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-127-0.pdf"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Registration of chits under The Chits Funds Act, 1982",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-255-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Change in the name of the firm",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-395-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Change / alternation made in the location of the principal place of a registered firm.",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-396-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Registered firm ceasing to continue business or beginning to carry on business at the place other than the principal one.",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Alternation in the name of any partner in a registered firm.",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-398-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Alternation in the permanent address of a partner is a registered firm.",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-399-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Change in the constitution of a registered firm.",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-400-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Firm dissolution",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-401-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Minor of becoming or not becoming a partner in a registered firm.",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-402-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Applying for copy of document of a registered firm - memorandum of association",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-403-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Applying for copy of document for registered firm - registration certificate",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-404-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Annual return of registered society â€“ section 4a",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-405-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Amendment of details of registered society â€“ change in the address of the society",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-406-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Amendment of details of registered society â€“ change of a member in governing body",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-407-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Amendment of details of registered society â€“ memorandum of association",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-408-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Amendment of details of registered society â€“ prior approval for name change of society",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-409-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Amendment of details of registered society â€“ change in the name of the society",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-410-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Amendment of details of registered society â€“ rules & regulations",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-411-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Renewal of registration of society â€“ prior permission procedure",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-412-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Renewal of registration of society",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-413-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Copy of document of a society registered â€“ memorandum of association",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-414-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Copy of document of a society registered â€“ registration certificate",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-415-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Registration of Societies",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-669-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-669-0.pdf"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Amendment in Societies",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Renewal of Societies",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Registration of Firm",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-670-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-670-0.pdf"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Amendment in Firm",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Registrar of Firms, Societies and Chits",
        serviceName: "Renewal of Firm",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Addition alteration",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-28-1.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Re-validation (time extension)",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Occupancy",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-29-0.pdf",
        serviceTimeline: "8",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-29-0.pdf"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Periodic renewal of occupancy certificate - medium / high risk category of multiple dwelling unit",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "8",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Layout Approval",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-254-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Revision of layout plan approval",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-254-1.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Plinth Level Inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-481-0.pdf",
        serviceTimeline: "7",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Intermediate inspection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Completion",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Commencement of Construction",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Building Plan Approval (CTE)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Revision",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "One Time Settlement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Addition Alteration",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Extension",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Compounding",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Industrial Development Authority",
        serviceName: "Self Certification",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for Land / Plot Allotment",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-12-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-12-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for Land / Plot Allotment",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-12-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-12-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Time Extension of allotted plot",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-12-1.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-12-1.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Surrender of plot(s)",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for Transfer Permission",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-14-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-14-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for Transfer Permission",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-14-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-14-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for water connection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-15-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-15-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for water connection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-15-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-15-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for water connection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-15-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-15-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for mortgage permission",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-17-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-17-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for mortgage permission",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-17-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-17-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for reconstitution of allottee organization",
        typeOfService: "Intimation",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-19-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-19-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for subletting / sub-lease of plots / units",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-20-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-20-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for change in the name of allottee organization",
        typeOfService: "Intimation",
        serviceIncidence: "Pre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-21-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-21-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Application for Product Change Permission",
        typeOfService: "Permission",
        serviceIncidence: "Pre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-22-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-22-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Provisional entitlement certificate under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-317-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-317-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Eligibility certificate under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-325-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-325-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "VAT reimbursement under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-327-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-327-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Power assistance / power bill rebate under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-329-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-329-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Interest subsidy under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-330-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-330-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Mandi tax / fee exemption under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-331-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-331-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "CST reimbursement under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-333-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-333-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Reimbursement of registration fee under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-335-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-335-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Subsidy for establishment of ETP under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-337-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-337-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Payroll assistance under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-339-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-339-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Stamp duty exemption / reimbursement under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-341-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-341-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Provisional entitlement certificate under Mega Textile Park Policy, 2014",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-342-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-342-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Eligibility certificate under Mega Textile Park Policy, 2014",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-346-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-346-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "VAT reimbursement under Mega Textile Park Policy, 2014",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-349-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-349-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Power assistance / power bill rebate under Mega Textile Park Policy, 2014",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-350-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-350-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Stamp duty exemption / reimbursement under Mega Textile Park Policy, 2014",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-351-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-351-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Interest subsidy under Mega Textile Park Policy, 2014",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-353-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-353-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "CST reimbursement under Mega Textile Park Policy, 2014",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-355-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-355-0.pdf"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Restoration of allotment of cancelled plots",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "15",
        serviceFee: "0"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Claim of Reimbursement of SGST under Mega Industrial and Investment Policy, 2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Claim of Reimbursement of SGST under Mega Textile Park Policy, 2014",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Registration Fee Subsidy under Mega Investment Policy,2015",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "State Infrastructure and Industrial Development Corporation of Uttarakhand Ltd.",
        serviceName: "Certificate of Non Availability of Water",
        typeOfService: "Certificate",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-956-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-956-0.pdf"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for Hotels",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for dharamshala / ashram",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for hotel - spa resort",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-101-0.pdf",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for tent colony",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for time share apartments",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for motor caravan",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for river / lake cruise and / or house boats",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for Travel Agent, Domestic Tour Operator, Excursion Agents",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-106-0.pdf",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for restaurant / beer bar, fast food centre / food plaza / food court",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for adventure tour operator (operators dealing with water sports)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for adventure tour operator (operators dealing with aero sports)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for adventure tour operator (operators dealing with safaris of various types)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for adventure tour operator (operators dealing with mountaineering and trekking)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for river rafting",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for yoga kendra",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for wildlife photography",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for amusement park",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-115-0.pdf",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for Wedding Points",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for para gliding, ice skating, flying box, motor cycle rally",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration under home stay  scheme",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-118-0.pdf",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "New registration under Uttarakhand Tourism Travel Trade Registration act",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-230-0.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-230-0.pdf"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Subsidy under Veerchandra Singh Garhwali Tourism Self Employment Scheme",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-316-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration under the Uttarakhand river rafting / kayaking (amendment) rules 2015 (commercial)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-443-0.pdf",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration under the Uttarakhand river rafting / kayaking (amendment) rules 2015 (commercial)",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-443-0.pdf",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Renewal under the Uttarakhand river rafting / kayaking (amendment) rules 2015",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-443-6.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Registration for Incentives",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for claiming Incentives for reimbursement of Stamp Duty",
        typeOfService: "Renewal",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for claiming Incentives on Interest Subsidy",
        typeOfService: "Renewal",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for reimbursement of Stamp Duty under Tourism Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for claim of capital subsidy under Tourism Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for reimbursement of SGST under Tourism Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for claiming Incentives for reimbursement of electricity bills under Tourism Policy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for claiming Incentives for Subsidy on Effluent Treatment Plant under Tourism Policy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for claiming Incentives for Reimbursement of Registration Charges under Tourism Policy",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for eligibility under Uttarakhand Tourism Policy, 2023",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Tourism Department",
        serviceName: "Application for claiming Incentives for reimbursement of interest subsidy under Tourism Policy",
        typeOfService: "Approval",
        serviceIncidence: "Post-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "60",
        serviceFee: "0"
    },
    {
        departmentName: "Town & Country Planning",
        serviceName: "Registration of registered habitat developer",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Town & Country Planning",
        serviceName: "Renewal of registered habitat developer",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Town & Country Planning",
        serviceName: "Technical no-objection to habitat project of registered habitat developer",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Town & Country Planning",
        serviceName: "Sanction of habitat project of RHD",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Town & Country Planning",
        serviceName: "Completion certificate of habitat project of registered habitat developer",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Urban Development Directorate",
        serviceName: "NOC for building construction",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Urban Development Directorate",
        serviceName: "Sanction of building plan by municipal corporation / municipal council / nagar panchayat (only for areas outside the jurisdiction of regulated area / development authorities)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Urban Development Directorate",
        serviceName: "Registration under Shops and Establishment Act AND/OR Issuance of Trade License",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-249-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-249-0.pdf"
    },
    {
        departmentName: "Urban Development Directorate",
        serviceName: "Property Transfer Certificate (non-disputed)",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Urban Development Directorate",
        serviceName: "Property transfer certificate (disputed)",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Urban Development Directorate",
        serviceName: "Assessment of Property Tax",
        typeOfService: "Intimation",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-452-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Urban Development Directorate",
        serviceName: "Approval for right of way / road cutting regarding drinking water / electricity line",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Urban Development Directorate",
        serviceName: "NoC from Municipality for State License for Food Business",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-672-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-672-0.pdf"
    },
    {
        departmentName: "Uttarakhand Bio Diversity Board",
        serviceName: "Approval for commercial utilisation of \"\"Biological Resources\"\"",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Bio Diversity Board",
        serviceName: "Application for access to biological resources and associated traditional knowledge",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Bio Diversity Board",
        serviceName: "Revocation of access to biological resources and associated traditional knowledge",
        typeOfService: "Amendment - Cancellation",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Bio Diversity Board",
        serviceName: "Third Party transfer of knowledge on biological resources and associated traditional knowledge",
        typeOfService: "Amendment - Transfer",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Bio Diversity Board",
        serviceName: "Application for seeking approval for Intellectual Property Protection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Bio Diversity Board",
        serviceName: "Approval for transferring results of research",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Film Development Council",
        serviceName: "Permission For Film Shooting",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-571-0.pdf",
        serviceTimeline: "14",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-571-0.pdf"
    },
    {
        departmentName: "Uttarakhand Fire and Emergency Services",
        serviceName: "Application for pre-establishment fire NOC",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-26-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-26-0.pdf"
    },
    {
        departmentName: "Uttarakhand Fire and Emergency Services",
        serviceName: "Application for pre-establishment fire NOC",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-26-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-26-0.pdf"
    },
    {
        departmentName: "Uttarakhand Fire and Emergency Services",
        serviceName: "Application for pre-operational fire NOC",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-27-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-27-0.pdf"
    },
    {
        departmentName: "Uttarakhand Fire and Emergency Services",
        serviceName: "Application for pre-operational fire NOC",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-27-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-27-0.pdf"
    },
    {
        departmentName: "Uttarakhand Fire and Emergency Services",
        serviceName: "Annual clearance certificate",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-27-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-27-6.pdf"
    },
    {
        departmentName: "Uttarakhand Forest Department",
        serviceName: "NOC for tree felling",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-24-0.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-24-0.pdf"
    },
    {
        departmentName: "Uttarakhand Forest Department",
        serviceName: "Tree transit permit",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-122-0.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-122-0.pdf"
    },
    {
        departmentName: "Uttarakhand Forest Department",
        serviceName: "Letter of Distance from Forest",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "10",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Application for right of way along canal",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-183-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "NOC for surface water extraction",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-184-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Registration under water tax for hydro projects",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-185-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Application for construction of new water course",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Application for cutting of supply for not being irrigated at site",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Application for acquisition of land and construction work",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Application for transfer of water course",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Permission to draw water from Irrigation canal/Reservoir/River/Gadera/Spring for Commercial use",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-541-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-541-0.pdf"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Permission for usage of water by installation of hydro-electric generation unit",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "Permission to supply of water through intervening water-courses or change of source of water supply",
        typeOfService: "Permission",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Irrigation Department",
        serviceName: "NOC for water from rivers , canals tube wells , lift scheme at a fixed rate",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Jal Sansthan",
        serviceName: "Application for Water Connection",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-25-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-25-0.pdf"
    },
    {
        departmentName: "Uttarakhand Jal Sansthan",
        serviceName: "Wherever it is possible technically sanctioning of new sewer connection in any colony or institution / group of institutions otherwise rejection in special circumstances",
        typeOfService: "Permission",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-446-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-446-0.pdf"
    },
    {
        departmentName: "Uttarakhand Jal Sansthan",
        serviceName: "NOC for availability of Water Connection by UJS",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-576-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-576-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consent to Establish under Air (Prevention and Control of Pollution) Act, 1981 & Water (Prevention and Control of Pollution) Act, 1974 - Fresh",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-30_0_Green.pdf,/themes/backend/services/sop-30_0_Orange.pdf,/themes/backend/services/sop-30_0_Red.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-30-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consent to Establish under Air (Prevention and Control of Pollution) Act, 1981 & Water (Prevention and Control of Pollution) Act, 1974 - Fresh",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-30_0_Green.pdf,/themes/backend/services/sop-30_0_Orange.pdf,/themes/backend/services/sop-30_0_Red.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-30-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consent to Establish under Air (Prevention and Control of Pollution) Act, 1981 & Water (Prevention and Control of Pollution) Act, 1974 - Expansion",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-30_1_Green.pdf,/themes/backend/services/sop-30_1_Orange.pdf,/themes/backend/services/sop-30_1_Red.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-30-1.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consent to Establish under Air (Prevention and Control of Pollution) Act, 1981 & Water (Prevention and Control of Pollution) Act, 1974 - Expansion",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-30_1_Green.pdf,/themes/backend/services/sop-30_1_Orange.pdf,/themes/backend/services/sop-30_1_Red.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-30-1.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consent to Establish under Air (Prevention and Control of Pollution) Act, 1981 & Water (Prevention and Control of Pollution) Act, 1974 -Extension",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-30-6.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-30-6.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consolidated consent & authorization under Water Act, 1974, Air Act, 1981 & authorization under the hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016 - fresh",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-32_0_Green.pdf,/themes/backend/services/sop-32_0_Orange.pdf,/themes/backend/services/sop-32_0_Red.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-32-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consolidated consent & authorization under Water Act, 1974, Air Act, 1981 & authorization under the hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016 - fresh",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-32_0_Green.pdf,/themes/backend/services/sop-32_0_Orange.pdf,/themes/backend/services/sop-32_0_Red.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-32-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consolidated consent & authorization under Water Act, 1974, Air Act, 1981 & authorization under the Hazardous and Other Wastes (Management and Transboundary Movement) Rules - expansion",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-32_1_Green.pdf,/themes/backend/services/sop-32_1_Red.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-32-1.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consolidated consent & authorization under Water Act, 1974, Air Act, 1981 & authorization under the Hazardous and Other Wastes (Management and Transboundary Movement) Rules - expansion",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-32_1_Green.pdf,/themes/backend/services/sop-32_1_Red.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-32-1.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consolidated consent & authorization under Water Act, 1974, Air Act, 1981 & authorization under the Hazardous and Other Wastes (Management and Transboundary Movement) Rules - renewal",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-32_6_Green.pdf,/themes/backend/services/sop-32_6_Orange.pdf,/themes/backend/services/sop-32_6_Red.pdf",
        serviceTimeline: "60",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-32-6.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Consolidated consent & authorization under Water Act, 1974, Air Act, 1981 & authorization under the Hazardous and Other Wastes (Management and Transboundary Movement) Rules - renewal",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-32_6_Green.pdf,/themes/backend/services/sop-32_6_Orange.pdf,/themes/backend/services/sop-32_6_Red.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-32-6.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Authorization under Solid Waste Management Rules, 2016",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-231-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-231-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Renewal for Authorization under Solid Waste Management Rules, 2016",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Authorization under Bio-medical Waste Management Rules, 2016 (bedded occupiers)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-232-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-232-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Renewal of authorization under Bio-medical Waste Management Rules, 2016 (bedded occupiers)",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-232-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-232-6.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Authorization for ( collection, treatment, storage & transportation) of e-waste",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-233-0.pdf",
        serviceTimeline: "120",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-233-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Renewal of authorization for ( collection, treatment, storage & transportation) of e-waste",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-233-6.pdf",
        serviceTimeline: "120",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-233-6.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Registration under Plastic Waste (Management & Handling) Rules, 2016",
        typeOfService: "Registration",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-234-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Registration under Battery Waste Management Rules 2022",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-668-0.pdf",
        serviceTimeline: "90",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-668-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Renewal under Battery Waste Management Rules 2022",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-668-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-668-6.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Application under green category",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Auto Renewal Under Green Category",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-OperationPost-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Authorization under Construction & Demolition Waste Management Rules, 2016",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-895-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-895-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Renewal for Authorization under Construction & Demolition Waste Management Rules, 2016",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Bio Medical Waste",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-917-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-917-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Renewal For Bio Medical Waste",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Registration under E-Waste Management Rules, 2022",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-960-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-960-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Renewal under E-Waste Management Rules, 2022",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-960-6.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-960-6.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Registration under Plastic Waste Management Rules, 2022",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-961-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-961-0.pdf"
    },
    {
        departmentName: "Uttarakhand Pollution Control Board",
        serviceName: "Registration/renewal under the Battery Waste Management Rules 2022",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-962-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for new connection LT line - non domestic / industrial",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-1-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-1-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for new connection LT line - non domestic / industrial",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-1-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-1-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for new connection LT line - non domestic / industrial",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-1-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-1-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for temporary connection - LT line",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-6-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-6-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for temporary connection - LT line",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-6-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-6-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for temporary connection - LT line",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-6-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-6-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for new connection HT line - non domestic / industrial",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-7-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-7-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for new connection HT line - non domestic / industrial",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-7-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-7-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for new connection HT line - non domestic / industrial",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-7-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-7-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Change of category-HT",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Permanent disconnection â€“ HT",
        typeOfService: "Amendment - Surrender",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-7-3.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for load enhancement",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-8-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-8-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for temporary connection - HT line",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-11-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-11-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for temporary connection - HT line",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-11-0.pdf",
        serviceTimeline: "7",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-11-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for temporary connection - HT line",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-11-0.pdf",
        serviceTimeline: "15",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-11-0.pdf"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Transfer of connection - change of ownership",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-449-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Transfer of connection â€“ transfer to legal heir",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-450-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Re-connection of disconnected connection",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for new connection LT line - non domestic / industrial (upto 5KW)",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Power Corporation Limited",
        serviceName: "Application for new connection HT line - non domestic / industrial upto 200KW",
        typeOfService: "Approval",
        serviceIncidence: "Pre-EstablishmentPre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-7-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Renewable Energy Development Agency",
        serviceName: "Accreditation of renewable energy generation project or distribution licensee under REC mechanism",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-229-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Renewable Energy Development Agency",
        serviceName: "Annual renewal of accreditation of renewable energy generation project or distribution licensee under REC mechanism",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-229-6.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand Renewable Energy Development Agency",
        serviceName: "Revalidation of accreditation of renewable energy generation project or distribution licensee under REC mechanism",
        typeOfService: "Certificates",
        serviceIncidence: "Pre-Establishment",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-451-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "License of a driving school",
        typeOfService: "License",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-250-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "Increase in number of cars of driving school",
        typeOfService: "Amendment - Others",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-250-1.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "Cancelation of license of driving school",
        typeOfService: "Amendment - Cancellation",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-250-2.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "Duplicate copy of license of driving school",
        typeOfService: "Duplicate Copy",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-250-5.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "Renewal of license of a driving school",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-250-6.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "Instructor authorization of driving school",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-251-0.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "Renewal of instructor authorization",
        typeOfService: "Renewal",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-251-6.pdf",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "Fitness test",
        typeOfService: "Approval",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in",
        serviceTimeline: "30",
        serviceFee: "0"
    },
    {
        departmentName: "Uttarakhand State Transport Department",
        serviceName: "Registration of vehicle",
        typeOfService: "Registration",
        serviceIncidence: "Pre-Operation",
        serviceSoP: "https://investuttarakhand.uk.gov.in/themes/backend/services/sop-253-0.pdf",
        serviceTimeline: "30",
        serviceFee: "https://investuttarakhand.uk.gov.in/themes/backend/services/fee_structure-253-0.pdf"
    }
];

export async function seedServiceDetails(prisma: PrismaClient) {
    console.log('\n🌱 Seeding Service Details (m_service_details)...');

    let upserted = 0;
    let skipped = 0;

    for (const entry of serviceDetailsData) {
        // Find the service by matching service_name (case-insensitive)
        const service = await prisma.service.findFirst({
            where: {
                service_name: {
                    equals: entry.serviceName,
                    mode: 'insensitive',
                },
                isActive: true,
            },
            select: { id: true, service_id: true, service_name: true },
        });

        if (!service || !service.service_id) {
            console.warn(`  ⚠️  Service not found: "${entry.serviceName}"`);
            skipped++;
            continue;
        }

        // Normalize serviceIncidence
        let serviceCategory = entry.serviceIncidence;
        if (serviceCategory.includes('Pre-Establishment')) {
            serviceCategory = 'Pre-Establishment';
        }

        // Determine serviceType: License/Approval = Mandatory, others = Desirable
        const serviceType = ['License', 'Approval', 'NOC', 'Registration'].some(
            t => entry.typeOfService.includes(t)
        ) ? 'Mandatory' : 'Desirable';

        try {
            await prisma.serviceDetail.upsert({
                where: { serviceId: service.service_id },
                update: {
                    serviceCategory,
                    authorityName: entry.departmentName,
                    timeline: parseInt(entry.serviceTimeline) || null,
                    sopDocument: entry.serviceSoP,
                    feeStructureDocument: entry.serviceFee,
                    serviceType,
                    isActive: true,
                },
                create: {
                    serviceId: service.service_id,
                    serviceCategory,
                    authorityName: entry.departmentName,
                    timeline: parseInt(entry.serviceTimeline) || null,
                    sopDocument: entry.serviceSoP,
                    feeStructureDocument: entry.serviceFee,
                    serviceType,
                },
            });
            upserted++;
            console.log(`  ✅ Upserted: "${entry.serviceName}"`);
        } catch (error) {
            console.error(`  ❌ Error for "${entry.serviceName}":`, (error as Error).message);
            skipped++;
        }
    }

    console.log(`\n📊 Service Details seeding completed: upserted: ${upserted}, skipped: ${skipped}`);
}
