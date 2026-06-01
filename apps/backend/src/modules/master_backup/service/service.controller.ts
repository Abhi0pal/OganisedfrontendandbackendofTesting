import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';

@Public()
@Controller('master/service')
export class ServiceController {
    constructor(private ServiceService: ServiceService) {}
    
    @Get()
    async findAll(
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
        @Query('departmentIds') departmentIds?: string,
        @Query('swcsServiceIds') swcsServiceIds?: string,
    ) {
        const filters: any = {};

        if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
        }

        if (search) {
        filters.search = search;
        }

        if (departmentIds) {
        filters.departmentIds = departmentIds
            .split(',')
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id));
        }

        if (swcsServiceIds) {
        filters.swcsServiceIds = swcsServiceIds
            .split(',')
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id));
        }

        return this.ServiceService.findAll(filters);
    }

    @Get('dms/by-service-id')
    async getDmsByServiceId(@Query('serviceId') serviceId: string) {
        return this.ServiceService.getDmsByServiceId(serviceId);
    }

    @Put('dms/by-service-id')
    async saveDmsByServiceId(@Query('serviceId') serviceId: string, @Body() data: any) {
        return this.ServiceService.saveDmsByServiceId(serviceId, data);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ServiceService.findOne(parseInt(id));
    }

    @Get(':id/dms')
    async getDms(@Param('id') id: string) {
        return this.ServiceService.getDms(parseInt(id));
    }

    @Post()
    create(@Body() CreateServiceDto: CreateServiceDto) {
    return this.ServiceService.create(CreateServiceDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateServiceDto) {
         return this.ServiceService.update(parseInt(id), data);
    }

    @Put(':id/dms')
    async saveDms(@Param('id') id: string, @Body() data: any) {
        return this.ServiceService.saveDms(parseInt(id), data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.ServiceService.delete(parseInt(id));
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: string) {
        return this.ServiceService.toggle(parseInt(id));
    }

    @Post('dms/upload')
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: (_req, _file, cb) => {
            const dir = join(process.cwd(), 'uploads', 'dms', 'prescribed');
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
          },
          filename: (_req, file, cb) => {
            const uniqueName = Date.now() + extname(file.originalname);
            cb(null, uniqueName);
          },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
      })
    )
    async uploadPrescribedFormat(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File upload failed');
        }
        const relativePath = `uploads/dms/prescribed/${file.filename}`;
        return {
            fileName: file.originalname,
            storedName: file.filename,
            filePath: relativePath,
        };
    }
}
