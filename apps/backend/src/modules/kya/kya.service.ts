import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateKyaQuestionDto, UpdateKyaQuestionDto } from './dto';

@Injectable()
export class KyaService {
    constructor(private prisma: PrismaService) { }

    // Get all KYA categories
    async getCategories() {
        return this.prisma.kyaCategory.findMany({
            where: { isActive: true },
            select: {
                id: true,
                categoryName: true,
            },
            orderBy: { id: 'asc' },
        });
    }

    // Create a new category
    async createCategory(categoryName: string) {
        if (!categoryName || categoryName.trim() === '') {
            throw new BadRequestException('Category name is required');
        }
        return this.prisma.kyaCategory.create({
            data: { categoryName: categoryName.trim() },
        });
    }

    // Update a category
    async updateCategory(id: number, categoryName: string) {
        const existing = await this.prisma.kyaCategory.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return this.prisma.kyaCategory.update({
            where: { id },
            data: { categoryName: categoryName.trim() },
        });
    }

    // Soft delete a category
    async deleteCategory(id: number) {
        const existing = await this.prisma.kyaCategory.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return this.prisma.kyaCategory.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Get all questions with options and service mappings
    async getQuestions() {
        return this.prisma.kyaQuestion.findMany({
            where: { isActive: true },
            include: {
                category: {
                    select: { id: true, categoryName: true },
                },
                options: {
                    where: { isActive: true },
                    include: {
                        serviceMappings: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                serviceId: true,
                            },
                        },
                    },
                },
            },
            orderBy: { id: 'asc' },
        });
    }

    // Create a new question with options
    async createQuestion(dto: CreateKyaQuestionDto, files?: any) {
        // Handle file upload path
        let urlDocument: string | null = null;
        if (files?.url_document?.[0]) {
            urlDocument = `uploads/kya/${files.url_document[0].filename}`;
        }

        // Parse options if string
        let optionDetails = dto.optionDetails;
        if (typeof dto.optionDetails === 'string') {
            try {
                optionDetails = JSON.parse(dto.optionDetails);
            } catch {
                throw new BadRequestException('Invalid JSON in optionDetails');
            }
        }

        // Convert FormData string values to proper types
        const categoryId = typeof dto.categoryId === 'string' ? parseInt(dto.categoryId) : dto.categoryId;
        const isDependent = typeof dto.isDependent === 'string' ? dto.isDependent === 'true' : (dto.isDependent ?? false);
        const isMandatory = typeof dto.isMandatory === 'string' ? dto.isMandatory === 'true' : (dto.isMandatory ?? true);
        const isTooltipAvailable = typeof dto.isTooltipAvailable === 'string' ? dto.isTooltipAvailable === 'true' : (dto.isTooltipAvailable ?? false);
        const showReferenceDocument = typeof dto.showReferenceDocument === 'string' ? dto.showReferenceDocument === 'true' : (dto.showReferenceDocument ?? false);
        const parentQuestionId = dto.parentQuestionId ? (typeof dto.parentQuestionId === 'string' ? parseInt(dto.parentQuestionId) : dto.parentQuestionId) : null;
        const kyaOptionId = dto.kyaOptionId ? (typeof dto.kyaOptionId === 'string' ? parseInt(dto.kyaOptionId) : dto.kyaOptionId) : null;
        const userId = dto.userId ? (typeof dto.userId === 'string' ? parseInt(dto.userId) : dto.userId) : null;

        return this.prisma.$transaction(async (tx) => {
            // Create the question
            const question = await tx.kyaQuestion.create({
                data: {
                    categoryId,
                    questionLabel: dto.questionLabel,
                    fieldType: dto.fieldType,
                    isDependent,
                    parentQuestionId,
                    kyaOptionId,
                    isMandatory,
                    isTooltipAvailable,
                    tooltipText: dto.tooltipText || null,
                    showReferenceDocument,
                    urlDocument,
                    userId,
                },
            });

            // Create options and service mappings
            if (optionDetails && Array.isArray(optionDetails)) {
                for (const opt of optionDetails) {
                    const option = await tx.kyaOption.create({
                        data: {
                            questionId: question.id,
                            optionLabel: opt.option_label,
                        },
                    });

                    // Create service mappings
                    if (opt.approvals && Array.isArray(opt.approvals)) {
                        for (const serviceId of opt.approvals) {
                            await tx.kyaServiceMapping.create({
                                data: {
                                    optionId: option.id,
                                    serviceId: Number(serviceId),
                                },
                            });
                        }
                    }
                }
            }

            return { message: 'KYA Question created successfully', questionId: question.id };
        });
    }

    // Update a question
    async updateQuestion(id: number, dto: UpdateKyaQuestionDto, files?: any) {
        const existing = await this.prisma.kyaQuestion.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Question with ID ${id} not found`);
        }

        // Handle file upload
        let urlDocument = existing.urlDocument;
        if (files?.url_document?.[0]) {
            urlDocument = `uploads/kya/${files.url_document[0].filename}`;
        }

        // Parse options if string
        let optionDetails = dto.optionDetails;
        if (typeof dto.optionDetails === 'string') {
            try {
                optionDetails = JSON.parse(dto.optionDetails);
            } catch {
                throw new BadRequestException('Invalid JSON in optionDetails');
            }
        }

        // Convert FormData string values to proper types
        const categoryId = dto.categoryId ? (typeof dto.categoryId === 'string' ? parseInt(dto.categoryId) : dto.categoryId) : undefined;
        const isDependent = dto.isDependent !== undefined ? (typeof dto.isDependent === 'string' ? dto.isDependent === 'true' : dto.isDependent) : undefined;
        const isMandatory = dto.isMandatory !== undefined ? (typeof dto.isMandatory === 'string' ? dto.isMandatory === 'true' : dto.isMandatory) : undefined;
        const isTooltipAvailable = dto.isTooltipAvailable !== undefined ? (typeof dto.isTooltipAvailable === 'string' ? dto.isTooltipAvailable === 'true' : dto.isTooltipAvailable) : undefined;
        const showReferenceDocument = dto.showReferenceDocument !== undefined ? (typeof dto.showReferenceDocument === 'string' ? dto.showReferenceDocument === 'true' : dto.showReferenceDocument) : undefined;
        const parentQuestionId = dto.parentQuestionId ? (typeof dto.parentQuestionId === 'string' ? parseInt(dto.parentQuestionId) : dto.parentQuestionId) : null;
        const kyaOptionId = dto.kyaOptionId ? (typeof dto.kyaOptionId === 'string' ? parseInt(dto.kyaOptionId) : dto.kyaOptionId) : null;
        const userId = dto.userId ? (typeof dto.userId === 'string' ? parseInt(dto.userId) : dto.userId) : null;

        console.log('[KYA UPDATE] Question ID:', id);
        console.log('[KYA UPDATE] optionDetails received:', JSON.stringify(optionDetails, null, 2));

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // Update question
                await tx.kyaQuestion.update({
                    where: { id },
                    data: {
                        categoryId,
                        questionLabel: dto.questionLabel,
                        fieldType: dto.fieldType,
                        isDependent,
                        parentQuestionId,
                        kyaOptionId,
                        isMandatory,
                        isTooltipAvailable,
                        tooltipText: dto.tooltipText,
                        showReferenceDocument,
                        urlDocument,
                        updatedBy: userId,
                    },
                });
                console.log('[KYA UPDATE] Question record updated');

                // Update options
                if (optionDetails && Array.isArray(optionDetails)) {
                    for (let i = 0; i < optionDetails.length; i++) {
                        const opt = optionDetails[i];
                        console.log(`[KYA UPDATE] Processing option ${i}:`, JSON.stringify({ id: opt.id, option_label: opt.option_label, approvals: opt.approvals }));

                        if (opt.id) {
                            // Update existing option
                            await tx.kyaOption.update({
                                where: { id: Number(opt.id) },
                                data: { optionLabel: opt.option_label },
                            });
                            console.log(`[KYA UPDATE] Updated option ${opt.id}`);

                            // Deactivate old mappings
                            await tx.kyaServiceMapping.updateMany({
                                where: { optionId: Number(opt.id) },
                                data: { isActive: false },
                            });

                            // Create new mappings
                            if (opt.approvals && Array.isArray(opt.approvals)) {
                                for (const serviceId of opt.approvals) {
                                    await tx.kyaServiceMapping.upsert({
                                        where: {
                                            optionId_serviceId: { optionId: Number(opt.id), serviceId: Number(serviceId) },
                                        },
                                        update: { isActive: true },
                                        create: {
                                            optionId: Number(opt.id),
                                            serviceId: Number(serviceId),
                                        },
                                    });
                                }
                                console.log(`[KYA UPDATE] Upserted ${opt.approvals.length} mappings for option ${opt.id}`);
                            }
                        } else {
                            // Create new option
                            console.log(`[KYA UPDATE] Creating new option: "${opt.option_label}"`);
                            const newOption = await tx.kyaOption.create({
                                data: {
                                    questionId: id,
                                    optionLabel: opt.option_label,
                                },
                            });
                            console.log(`[KYA UPDATE] Created new option ID: ${newOption.id}`);

                            if (opt.approvals && Array.isArray(opt.approvals)) {
                                for (const serviceId of opt.approvals) {
                                    await tx.kyaServiceMapping.create({
                                        data: {
                                            optionId: newOption.id,
                                            serviceId: Number(serviceId),
                                        },
                                    });
                                }
                                console.log(`[KYA UPDATE] Created ${opt.approvals.length} mappings for new option ${newOption.id}`);
                            }
                        }
                    }
                }

                return { message: 'KYA Question updated successfully' };
            });
            console.log('[KYA UPDATE] Transaction completed successfully');
            return result;
        } catch (error) {
            console.error('[KYA UPDATE] Transaction FAILED:', error);
            throw error;
        }
    }

    // Soft delete a question
    async deleteQuestion(id: number, userId?: number) {
        const existing = await this.prisma.kyaQuestion.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Question with ID ${id} not found`);
        }

        return this.prisma.$transaction(async (tx) => {
            // Soft delete question
            await tx.kyaQuestion.update({
                where: { id },
                data: {
                    isActive: false,
                    updatedBy: userId,
                },
            });

            // Get options for this question
            const options = await tx.kyaOption.findMany({
                where: { questionId: id, isActive: true },
            });

            // Soft delete service mappings
            if (options.length > 0) {
                const optionIds = options.map((o) => o.id);
                await tx.kyaServiceMapping.updateMany({
                    where: { optionId: { in: optionIds } },
                    data: { isActive: false },
                });
            }

            // Soft delete options
            await tx.kyaOption.updateMany({
                where: { questionId: id },
                data: { isActive: false },
            });

            return { message: 'KYA Question deleted successfully' };
        });
    }

    // Get all services (for dropdown in frontend)
    async getServices() {
        return this.prisma.service.findMany({
            where: { isActive: true },
            select: {
                id: true,
                service_name: true,
            },
            orderBy: { service_name: 'asc' },
        });
    }

    // Get all departments
    async getDepartments() {
        return this.prisma.department.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                abbreviation: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    // ------------------SERVICE DETAILS METHODS------------------

    // Get all service details
    async getServiceDetails() {
        return this.prisma.serviceDetail.findMany({
            where: { isActive: true },
            include: {
                service: {
                    select: {
                        id: true,
                        service_name: true,
                        service_level: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Create service detail with file uploads
    async createServiceDetail(body: any, files: any) {
        const serviceId = parseInt(body.serviceId);
        const timeline = body.timeline ? parseInt(body.timeline) : null;

        const data: any = {
            serviceId,
            serviceCategory: body.serviceCategory,
            authorityName: body.authorityName || null,
            timeline,
        };

        // Handle file uploads
        if (files?.sopDocument?.[0]?.filename) {
            data.sopDocument = `uploads/kya/${files.sopDocument[0].filename}`;
        }
        if (files?.feeStructureDocument?.[0]?.filename) {
            data.feeStructureDocument = `uploads/kya/${files.feeStructureDocument[0].filename}`;
        }
        if (files?.listOfRequiredDocuments?.[0]?.filename) {
            data.listOfRequiredDocuments = `uploads/kya/${files.listOfRequiredDocuments[0].filename}`;
        }

        return this.prisma.serviceDetail.create({ data });
    }

    // Update service detail with file uploads
    async updateServiceDetail(id: number, body: any, files: any) {
        const existing = await this.prisma.serviceDetail.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Service detail with ID ${id} not found`);
        }

        const timeline = body.timeline ? parseInt(body.timeline) : null;

        const data: any = {
            serviceCategory: body.serviceCategory,
            authorityName: body.authorityName || null,
            timeline,
        };

        // Handle file uploads (only update if new files provided)
        if (files?.sopDocument?.[0]?.filename) {
            data.sopDocument = `uploads/kya/${files.sopDocument[0].filename}`;
        }
        if (files?.feeStructureDocument?.[0]?.filename) {
            data.feeStructureDocument = `uploads/kya/${files.feeStructureDocument[0].filename}`;
        }
        if (files?.listOfRequiredDocuments?.[0]?.filename) {
            data.listOfRequiredDocuments = `uploads/kya/${files.listOfRequiredDocuments[0].filename}`;
        }

        return this.prisma.serviceDetail.update({
            where: { id },
            data,
        });
    }

    // Soft delete service detail
    async deleteServiceDetail(id: number) {
        const existing = await this.prisma.serviceDetail.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Service detail with ID ${id} not found`);
        }

        return this.prisma.serviceDetail.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Get services by IDs for KYA approvals
    async getServiceDetailsByIds(serviceIds: number[]) {
        console.log('🔍 Received internal IDs:', serviceIds);

        // Step 1: Look up services by internal ID with department info
        const services = await this.prisma.service.findMany({
            where: {
                id: { in: serviceIds },
                isActive: true,
            },
            select: {
                id: true,
                service_id: true,
                service_name: true,
                service_level: true,
            },
        });

        console.log('📦 Found services:', services.length);

        // Step 2: Extract service_id strings for ServiceDetail lookup
        const serviceIdStrings = services
            .map(s => s.service_id)
            .filter((id): id is string => id !== null);

        // Step 3: Query service details (may not exist for all services)
        const serviceDetails = await this.prisma.serviceDetail.findMany({
            where: {
                serviceId: { in: serviceIdStrings },
                isActive: true,
            },
        });

        // Step 4: Build a map of service_id -> ServiceDetail for quick lookup
        const detailMap = new Map<string, typeof serviceDetails[0]>();
        for (const detail of serviceDetails) {
            detailMap.set(detail.serviceId, detail);
        }

        // Step 5: Return ALL services in the desired format
        const result = services.map((service) => {
            const detail = service.service_id ? detailMap.get(service.service_id) : null;
            // Generate KYA reference ID: KYA-service_id
            return {
                id: service.id,
                kya_reference_id: `KYA-${service.service_id || service.id}`,
                service_name: service.service_name || '',
                department: '',
                service_category: detail?.serviceCategory || 'Pre Establishment',
                is_central_govt_service: service.service_level === 'Central' ? 'Y' : 'N',
                timeline: detail?.timeline || null,
                steps: detail?.sopDocument || null,
                list_of_required_documents: detail?.listOfRequiredDocuments || null,
                document_link: service.service_id ? `https://investuttarakhand.uk.gov.in/themes/backend/services/documentchecklist-${service.service_id.replace(/\./g, '-')}.pdf` : null,
                fee_structure_document: detail?.feeStructureDocument || null,
                service_type: detail?.serviceType || 'Mandatory',
                legal_provision: null,
            };
        });

        console.log('✅ Returning', result.length, 'services');
        return result;
    }
}
