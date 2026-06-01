import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * CIS Inspection Seed Data
 * Creates:
 * - Sample Application Submissions (Units)
 * - Third Party Inspectors
 * - Inspection Transactions with CIS fields
 */

// Districts lookup (assuming these exist in m_districts)
const DISTRICTS = ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'];
const DEPARTMENTS = [
    { id: 1, name: 'Labour', abbr: 'LAB' },
    { id: 2, name: 'PCB', abbr: 'PCB' },
    { id: 3, name: 'Fire', abbr: 'FIRE' },
    { id: 4, name: 'Factory', abbr: 'FAC' },
];

export async function seedCISInspections(prisma: PrismaClient) {
    console.log('  📋 Seeding CIS Inspection data...');

    try {
        // ============================================
        // 1. CREATE INSPECTOR USERS (5-10 inspectors)
        // ============================================
        const inspectorPassword = await bcrypt.hash('inspector@123', 10);

        const inspectorRole = await prisma.roles.findFirst({ where: { name: 'Inspector' } });
        const deptUserRole = await prisma.roles.findFirst({ where: { name: 'department_user' } });

        const inspectorProfiles = [
            { name: 'Raj Kumar Sharma', email: 'raj.sharma@inspector.mp.gov.in', mobile: '9876543201', district: 'Bhopal', deptId: 1 },
            { name: 'Priya Singh', email: 'priya.singh@inspector.mp.gov.in', mobile: '9876543202', district: 'Indore', deptId: 1 },
            { name: 'Amit Verma', email: 'amit.verma@inspector.mp.gov.in', mobile: '9876543203', district: 'Gwalior', deptId: 2 },
            { name: 'Sunita Patel', email: 'sunita.patel@inspector.mp.gov.in', mobile: '9876543204', district: 'Jabalpur', deptId: 2 },
            { name: 'Vikram Tiwari', email: 'vikram.tiwari@inspector.mp.gov.in', mobile: '9876543205', district: 'Ujjain', deptId: 3 },
            { name: 'Meera Joshi', email: 'meera.joshi@inspector.mp.gov.in', mobile: '9876543206', district: 'Bhopal', deptId: 3 },
            { name: 'Rakesh Dubey', email: 'rakesh.dubey@inspector.mp.gov.in', mobile: '9876543207', district: 'Indore', deptId: 4 },
            { name: 'Kavita Yadav', email: 'kavita.yadav@inspector.mp.gov.in', mobile: '9876543208', district: 'Gwalior', deptId: 4 },
        ];

        const createdInspectors: { userId: bigint; name: string; deptId: number }[] = [];

        for (const inspector of inspectorProfiles) {
            // Check if user exists
            let user = await prisma.users.findFirst({ where: { email: inspector.email } });

            if (!user) {
                user = await prisma.users.create({
                    data: {
                        email: inspector.email,
                        password_hash: inspectorPassword,
                        password_algo: 'bcrypt',
                        user_type: 'INSPECTOR',
                        is_email_verified: 1,
                        role_id: inspectorRole?.id || deptUserRole?.id,
                    }
                });
            }

            // Create department_users profile if not exists
            const existingProfile = await prisma.department_users.findUnique({ where: { user_id: user.id } });
            if (!existingProfile) {
                await prisma.department_users.create({
                    data: {
                        user_id: user.id,
                        full_name: inspector.name,
                        email: inspector.email,
                        mobile: inspector.mobile,
                        dept_id: inspector.deptId,
                        status: 1,
                    }
                });
            }

            createdInspectors.push({ userId: user.id, name: inspector.name, deptId: inspector.deptId });
            console.log(`    ✓ Inspector ${inspector.name} created`);
        }

        // ============================================
        // 2. CREATE THIRD PARTY INSPECTORS (18 for testing)
        // ============================================
        const thirdPartyInspectors = [
            { recognitionId: 'TPI-MP-2024-001', organization: 'SafetyFirst Consultants Pvt Ltd' },
            { recognitionId: 'TPI-MP-2024-002', organization: 'QualityCheck India' },
            { recognitionId: 'TPI-MP-2024-003', organization: 'InspectorPro Services' },
            { recognitionId: 'TPI-MP-2024-004', organization: 'Secure Audit & Assurance LLP' },
            { recognitionId: 'TPI-MP-2024-005', organization: 'Compliance Masters India' },
            { recognitionId: 'TPI-MP-2024-006', organization: 'TechCheck Solutions Pvt Ltd' },
            { recognitionId: 'TPI-MP-2024-007', organization: 'National Safety Inspectors Association' },
            { recognitionId: 'TPI-MP-2024-008', organization: 'Prime Verification Services' },
            { recognitionId: 'TPI-MP-2024-009', organization: 'Industrial Compliance Group' },
            { recognitionId: 'TPI-MP-2024-010', organization: 'CertifyRight Agencies' },
            { recognitionId: 'TPI-MP-2024-011', organization: 'Green Environ Inspectors' },
            { recognitionId: 'TPI-MP-2024-012', organization: 'SafeWork Auditors Pvt Ltd' },
            { recognitionId: 'TPI-MP-2024-013', organization: 'QualityEdge Inspections' },
            { recognitionId: 'TPI-MP-2024-014', organization: 'Industrial Assessment Partners' },
            { recognitionId: 'TPI-MP-2024-015', organization: 'Reliable Compliance Services' },
            { recognitionId: 'TPI-MP-2024-016', organization: 'Excellence Certification India' },
            { recognitionId: 'TPI-MP-2024-017', organization: 'Bharat Safety Consultants' },
            { recognitionId: 'TPI-MP-2024-018', organization: 'Integrated Inspection Services' },
        ];

        // Get Uttarakhand districts from m_districts (stateId: 1286)
        const uttarakhandDistricts = await prisma.district.findMany({
            where: { stateId: 1286 },
            select: { id: true, name: true }
        });
        const districtNames = uttarakhandDistricts.map(d => d.name);
        console.log(`    📍 Found ${uttarakhandDistricts.length} Uttarakhand districts`);

        for (let i = 0; i < thirdPartyInspectors.length; i++) {
            const tpi = thirdPartyInspectors[i];
            const email = `tpi${i + 1}@thirdparty.gov.in`;

            // Check if user already exists
            let user = await prisma.users.findFirst({ where: { email } });

            if (!user) {
                user = await prisma.users.create({
                    data: {
                        email,
                        password_hash: inspectorPassword,
                        password_algo: 'bcrypt',
                        user_type: 'THIRD_PARTY', // Third Party Inspector type
                        is_email_verified: 1,
                        role_id: inspectorRole?.id || deptUserRole?.id,
                    }
                });
            }

            // Create department_users entry for third party inspector
            const existingDeptUser = await prisma.department_users.findUnique({ where: { user_id: user.id } });
            if (!existingDeptUser) {
                await prisma.department_users.create({
                    data: {
                        user_id: user.id,
                        full_name: tpi.organization,
                        email: email,
                        mobile: `98765${(10000 + i).toString().slice(-5)}`,
                        dept_id: (i % 4) + 1, // Distribute across departments 1-4
                        status: 1,
                    }
                });
            }

            const existing = await (prisma as any).thirdPartyInspector.findUnique({
                where: { userId: user.id }
            });

            if (!existing) {
                // Assign to Uttarakhand districts based on index
                const districtSet = [
                    districtNames[i % districtNames.length] || 'DEHRADUN',
                    districtNames[(i + 3) % districtNames.length] || 'HARIDWAR',
                    districtNames[(i + 6) % districtNames.length] || 'NAINITAL',
                ];

                await (prisma as any).thirdPartyInspector.create({
                    data: {
                        userId: user.id,
                        recognitionId: tpi.recognitionId,
                        organization: tpi.organization,
                        validUntil: new Date('2026-12-31'),
                        status: 'ACTIVE',
                        authorizedDistricts: districtSet,
                        authorizedServices: [1, 2, 3, 4], // All departments
                    }
                });
                console.log(`    ✓ Third Party Inspector ${tpi.recognitionId} - ${tpi.organization} created`);
            }
        }

        // ============================================
        // 3. CREATE APPLICATION SUBMISSIONS (Units)
        // Using Uttarakhand districts (stateId: 1286)
        // ============================================
        const units = [
            { unitName: 'ABC Manufacturing Pvt Ltd', districtId: 543, address: 'Plot No. 45, Industrial Area, Selaqui', contact: '9111222333', deptId: 1 },
            { unitName: 'XYZ Chemicals Ltd', districtId: 544, address: 'SIIDCUL Haridwar, Sector 2', contact: '9111222334', deptId: 2 },
            { unitName: 'Sunrise Textiles', districtId: 545, address: 'Industrial Area, Rudrapur', contact: '9111222335', deptId: 1 },
            { unitName: 'Green Energy Solutions', districtId: 539, address: 'SIDCUL Sitarganj', contact: '9111222336', deptId: 3 },
            { unitName: 'Metro Steel Works', districtId: 550, address: 'Roorkee Industrial Area', contact: '9111222337', deptId: 4 },
            { unitName: 'Bharat Pharma Industries', districtId: 543, address: 'Pharma Zone, Selaqui', contact: '9111222338', deptId: 2 }, // PCB
            { unitName: 'Shree Cement Factory', districtId: 544, address: 'SIIDCUL Haridwar, Sector 5', contact: '9111222339', deptId: 4 }, // Factory
            { unitName: 'Modern Plastics Ltd', districtId: 545, address: 'Pantnagar Industrial Area', contact: '9111222340', deptId: 3 }, // Fire
            { unitName: 'Reliable Auto Parts', districtId: 550, address: 'Rudrapur Sidcul', contact: '9111222341', deptId: 1 }, // Labour
            { unitName: 'Digital Electronics Hub', districtId: 543, address: 'IT Park, Dehradun', contact: '9111222342', deptId: 2 }, // PCB
            { unitName: 'Prime Food Processing', districtId: 544, address: 'Food Park, Haridwar', contact: '9111222343', deptId: 4 }, // Factory
            { unitName: 'Galaxy Garments', districtId: 545, address: 'Textile Zone, Pantnagar', contact: '9111222344', deptId: 1 }, // Labour
            { unitName: 'Central Packaging Co', districtId: 539, address: 'Industrial Estate, Almora Rd', contact: '9111222345', deptId: 3 }, // Fire
            { unitName: 'Himalayan Refineries', districtId: 550, address: 'Roorkee Industrial Estate', contact: '9111222346', deptId: 2 }, // PCB
            { unitName: 'Ganga Fertilizers', districtId: 544, address: 'SIDCUL Haridwar, Sector 8', contact: '9111222347', deptId: 4 }, // Factory
        ];

        // Get an investor user for reference
        const investorUser = await prisma.users.findFirst({ where: { user_type: 'INVESTOR' } });
        const investorId = investorUser?.id || BigInt(1);

        const createdSubmissions: number[] = [];

        for (let i = 0; i < units.length; i++) {
            const unit = units[i];

            // Check if already exists by unit name
            const existing = await (prisma as any).applicationSubmission.findFirst({
                where: { unitName: unit.unitName }
            });

            if (!existing) {
                const submission = await (prisma as any).applicationSubmission.create({
                    data: {
                        applicationId: 100 + i,
                        parentSubId: 0,
                        serviceId: '1',
                        userId: investorId,
                        deptId: unit.deptId,
                        fieldValue: {
                            address: unit.address,
                            contactNumber: unit.contact,
                            districtId: unit.districtId,
                            establishmentYear: 2020 + (i % 5),
                            employeeCount: 50 + (i * 10),
                        },
                        unitName: unit.unitName,
                        applicationStatus: 'A', // Approved
                        ipAddress: '127.0.0.1',
                        userAgent: 'Seed Script',
                        processingLevel: 'District',
                        landrigionId: unit.districtId, // District ID 539-551
                    }
                });
                createdSubmissions.push(submission.submissionId);
                console.log(`    ✓ Application ${unit.unitName} created`);
            } else {
                await (prisma as any).applicationSubmission.update({
                    where: { submissionId: existing.submissionId },
                    data: { landrigionId: unit.districtId }
                });
                createdSubmissions.push(existing.submissionId);
                console.log(`    ↻ Application ${unit.unitName} updated with district ${unit.districtId}`);
            }
        }

        // ============================================
        // 4. CREATE INSPECTION TRANSACTIONS
        // ============================================
        // First, get a checklist
        const checklist = await (prisma as any).inspectionChecklist.findFirst({
            where: { isActive: true }
        });

        if (!checklist) {
            console.log('    ⚠️ No checklist found, skipping inspection creation');
            return;
        }

        const service = await (prisma as any).service.findFirst({
            where: { id: checklist.serviceId }
        });

        const inspectionStatuses = ['SCHEDULED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'REPORT_PUBLISHED'];
        const riskCategories = ['HIGH', 'MEDIUM', 'LOW'];
        const inspectionTypes = ['SINGLE', 'JOINT'];

        const today = new Date();

        for (let i = 0; i < Math.min(createdSubmissions.length, 20); i++) {
            const submissionId = createdSubmissions[i];
            const unit = units[i];
            const inspector = createdInspectors[i % createdInspectors.length];

            // Check if inspection already exists for this application
            const existingInspection = await (prisma as any).inspectionTransaction.findFirst({
                where: { applicationSubmissionId: submissionId }
            });

            if (!existingInspection) {
                const statusIndex = i % inspectionStatuses.length;
                const status = inspectionStatuses[statusIndex];
                const isCompleted = status === 'REPORT_PUBLISHED' || status === 'PENDING_APPROVAL';

                const scheduledDate = new Date(today);
                scheduledDate.setDate(today.getDate() - 30 + (i * 3)); // Spread over last 60 days

                const slaDueDate = new Date(scheduledDate);
                slaDueDate.setDate(scheduledDate.getDate() + 7); // 7 days SLA

                const inspection = await (prisma as any).inspectionTransaction.create({
                    data: {
                        applicationId: `APP-2025-${String(i + 1).padStart(4, '0')}`,
                        serviceId: service?.id || 1,
                        checklistId: checklist.id,
                        applicationSubmissionId: submissionId,
                        districtId: unit.districtId,
                        status: status,
                        scheduledDate: scheduledDate,
                        inspectorType: i % 3 === 0 ? 'THIRD_PARTY' : 'DEPARTMENT_OFFICIAL',
                        departmentInspectorId: inspector.userId,
                        inspectionType: inspectionTypes[i % 2],
                        isThirdParty: i % 3 === 0,
                        riskCategory: riskCategories[i % 3],
                        complianceScore: isCompleted ? 60 + Math.floor(Math.random() * 40) : null,
                        completedAt: isCompleted ? new Date(scheduledDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
                        slaDueDate: slaDueDate,
                        slaBreached: slaDueDate < today && !isCompleted,
                        feeDetails: isCompleted ? `Inspection Fee - ${DEPARTMENTS.find(d => d.id === unit.deptId)?.name}` : null,
                        totalFeeCharge: isCompleted ? (3000 + (i * 500)) : null,
                        feeStatus: isCompleted ? 'PAID' : 'PENDING',
                        financialYear: '2025-2026',
                        allocatedBy: BigInt(1),
                        allocatedAt: new Date(scheduledDate.getTime() - 2 * 24 * 60 * 60 * 1000),
                        priority: i % 4 === 0 ? 'HIGH' : 'NORMAL',
                    }
                });
                console.log(`    ✓ Inspection ${inspection.id.slice(0, 8)}... for ${unit.unitName}`);
            } else {
                await (prisma as any).inspectionTransaction.update({
                    where: { id: existingInspection.id },
                    data: { districtId: unit.districtId }
                });
                console.log(`    ↻ Inspection ${existingInspection.id.slice(0, 8)}... updated with district ${unit.districtId}`);
            }
        }

        console.log('  ✅ CIS Inspection data seeded successfully');
    } catch (error) {
        console.error('  ❌ CIS Inspection seeding failed:', error);
        throw error;
    }
}
