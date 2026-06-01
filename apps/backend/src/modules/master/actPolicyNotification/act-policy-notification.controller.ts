import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ActPolicyNotificationService } from './act-policy-notification.service';
import { CreateActPolicyNotificationDto, UpdateActPolicyNotificationDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Public()
@Controller('master/actPolicyNotification')
export class ActPolicyNotificationController {
    constructor(private ActPolicyNotificationService: ActPolicyNotificationService) {}
    
    @Get()
    async findAll(
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
    ) {
        const filters: any = {};

        if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
        }

        if (search) {
        filters.search = search;
        }

        return this.ActPolicyNotificationService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ActPolicyNotificationService.findOne(parseInt(id));
    }

    @Post()
    create(@Body() CreateActPolicyNotificationDto: CreateActPolicyNotificationDto) {
    return this.ActPolicyNotificationService.create(CreateActPolicyNotificationDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateActPolicyNotificationDto) {
         return this.ActPolicyNotificationService.update(parseInt(id), data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.ActPolicyNotificationService.delete(parseInt(id));
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: string) {
        return this.ActPolicyNotificationService.toggle(parseInt(id));
    }

    /* ================= AMENDMENTS ================= */

    @Get(':id/amendments')
    getAmendments(@Param('id') id: string) {
        return this.ActPolicyNotificationService.getAmendments(+id);
    }

    @Post(':id/amendments')
    createAmendment(
        @Param('id') id: string,
        @Body() data: any,
    ) {
        return this.ActPolicyNotificationService.createAmendment(+id, data);
    }

    @Put('amendments/:amendmentId')
    updateAmendment(
        @Param('amendmentId') amendmentId: string,
        @Body() data: any,
    ) {
        return this.ActPolicyNotificationService.updateAmendment(+amendmentId, data);
    }

    @Post(':id/amendments/upload')
    @UseInterceptors(
    FileInterceptor('file', {
        storage: diskStorage({
        destination: './uploads/act-policy-notification/amendments',
        filename: (req, file, cb) => {
            cb(null, Date.now() + extname(file.originalname));
        },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
    }),
    )
    uploadAmendmentDocument(
        @UploadedFile() file: Express.Multer.File,
    ){
    if (!file) {
        throw new BadRequestException('File upload failed');
    }

        return {
            filePath: `/uploads/act-policy-notification/amendments/${file.filename}`,
        };
    }



    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
            destination: './uploads/act-policy-notification',
            filename: (req, file, cb) => {
                const uniqueName = Date.now() + extname(file.originalname);
                cb(null, uniqueName);
            },
            }),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
            fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/pdf|jpeg|jpg|png/)) {
                return cb(
                new BadRequestException('Only PDF / JPG / PNG files allowed'),
                false,
                );
            }
            cb(null, true);
            },
        }),
    )
    uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
        throw new BadRequestException('File upload failed');
    }

    return {
        filePath: `/uploads/act-policy-notification/${file.filename}`,
    };
    }

}

