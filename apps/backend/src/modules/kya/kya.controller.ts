import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    ParseIntPipe,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { KyaService } from './kya.service';
import { CreateKyaQuestionDto, UpdateKyaQuestionDto } from './dto';
import { Public } from '../../common/public.decorator';

// Multer config for KYA file uploads
const kyaMulterOptions = {
    storage: diskStorage({
        destination: './uploads/kya',
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            cb(null, `kya-${uniqueSuffix}${ext}`);
        },
    }),
};

@Public()
@Controller('kya')
export class KyaController {
    constructor(private readonly kyaService: KyaService) { }

    // GET /kya/categories - Get all KYA categories
    @Get('categories')
    getCategories() {
        return this.kyaService.getCategories();
    }

    // POST /kya/categories - Create a new category
    @Post('categories')
    createCategory(@Body() body: { categoryName: string }) {
        return this.kyaService.createCategory(body.categoryName);
    }

    // PUT /kya/categories/:id - Update a category
    @Put('categories/:id')
    updateCategory(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { categoryName: string },
    ) {
        return this.kyaService.updateCategory(id, body.categoryName);
    }

    // PUT /kya/categories/delete/:id - Soft delete a category
    @Put('categories/delete/:id')
    deleteCategory(@Param('id', ParseIntPipe) id: number) {
        return this.kyaService.deleteCategory(id);
    }

    // GET /kya/questions/fetch - Get all questions with options
    @Get('questions/fetch')
    getQuestions() {
        return this.kyaService.getQuestions();
    }

    // POST /kya/questions - Create a new question
    @Post('questions')
    @UseInterceptors(
        FileFieldsInterceptor(
            [{ name: 'url_document', maxCount: 1 }],
            kyaMulterOptions,
        ),
    )
    createQuestion(
        @Body() dto: CreateKyaQuestionDto,
        @UploadedFiles() files: { url_document?: Express.Multer.File[] },
    ) {
        return this.kyaService.createQuestion(dto, files);
    }

    // PUT /kya/questions/update/:id - Update a question
    @Put('questions/update/:id')
    @UseInterceptors(
        FileFieldsInterceptor(
            [{ name: 'url_document', maxCount: 1 }],
            kyaMulterOptions,
        ),
    )
    updateQuestion(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateKyaQuestionDto,
        @UploadedFiles() files: { url_document?: Express.Multer.File[] },
    ) {
        return this.kyaService.updateQuestion(id, dto, files);
    }

    // PUT /kya/questions/delete/:id/:userId - Soft delete a question
    @Put('questions/delete/:id/:userId')
    deleteQuestion(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
    ) {
        return this.kyaService.deleteQuestion(id, userId);
    }

    // GET /kya/services - Get all services for dropdown
    @Get('services')
    getServices() {
        return this.kyaService.getServices();
    }

    // GET /kya/departments - Get all departments
    @Get('departments')
    getDepartments() {
        return this.kyaService.getDepartments();
    }

    // ------------------SERVICE DETAILS ENDPOINTS------------------

    // GET /kya/service-details - Get all service details
    @Get('service-details')
    getServiceDetails() {
        return this.kyaService.getServiceDetails();
    }

    // POST /kya/service-details - Create service detail with file uploads
    @Post('service-details')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'sopDocument', maxCount: 1 },
                { name: 'feeStructureDocument', maxCount: 1 },
                { name: 'listOfRequiredDocuments', maxCount: 1 },
            ],
            kyaMulterOptions,
        ),
    )
    createServiceDetail(
        @Body() body: any,
        @UploadedFiles() files: {
            sopDocument?: Express.Multer.File[];
            feeStructureDocument?: Express.Multer.File[];
            listOfRequiredDocuments?: Express.Multer.File[];
        },
    ) {
        return this.kyaService.createServiceDetail(body, files);
    }

    // PUT /kya/service-details/:id - Update service detail with file uploads
    @Put('service-details/:id')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'sopDocument', maxCount: 1 },
                { name: 'feeStructureDocument', maxCount: 1 },
                { name: 'listOfRequiredDocuments', maxCount: 1 },
            ],
            kyaMulterOptions,
        ),
    )
    updateServiceDetail(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
        @UploadedFiles() files: {
            sopDocument?: Express.Multer.File[];
            feeStructureDocument?: Express.Multer.File[];
            listOfRequiredDocuments?: Express.Multer.File[];
        },
    ) {
        return this.kyaService.updateServiceDetail(id, body, files);
    }

    // PUT /kya/service-details/delete/:id - Soft delete service detail
    @Put('service-details/delete/:id')
    deleteServiceDetail(@Param('id', ParseIntPipe) id: number) {
        return this.kyaService.deleteServiceDetail(id);
    }

    //POST /kya/service-details/byids - Get services by IDs for KYA approvals
    @Post('service-details/byids')
    getServiceDetailsByIds(@Body('service_ids') serviceIds: number[]) {
        return this.kyaService.getServiceDetailsByIds(serviceIds);
    }
}
