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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';

import { Public } from '../../../common/public.decorator';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';


@Public()
@Controller('master/service')
export class ServiceController {

  constructor(private readonly serviceService: ServiceService) { }



  // ================= GET ALL =================

  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('departmentIds') departmentIds?: string,
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

    return this.serviceService.findAll(filters);

  }



  // ================= GET ONE =================

  @Get('service-id/:serviceId')
  async findByServiceId(@Param('serviceId') serviceId: string) {

    return this.serviceService.findByServiceId(serviceId);

  }

  @Get(':id')
  async findOne(@Param('id') id: string) {

    return this.serviceService.findOne(Number(id));

  }



  // ================= CREATE =================

  @Post()
  async create(@Body() dto: CreateServiceDto) {

    return this.serviceService.create(dto);

  }



  // ================= UPDATE =================

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto
  ) {

    return this.serviceService.update(Number(id), dto);

  }



  // ================= DELETE =================

  @Delete(':id')
  async delete(@Param('id') id: string) {

    return this.serviceService.delete(Number(id));

  }



  // ================= TOGGLE ACTIVE =================

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {

    return this.serviceService.toggle(Number(id));

  }



  // ================= DMS by service_id (string, e.g. "12222.0") =================
  // MUST be declared before :id/dms so NestJS doesn't match "dms" as :id

  // ================= DMS by service_id (string, e.g. "12222.0") =================
  // MUST be declared before :id/dms so NestJS doesn't match "dms" as :id

  @Get('dms/by-service-id')
  async getDmsByServiceId(@Query('serviceId') serviceId: string) {
    return this.serviceService.getDmsByServiceId(serviceId);
  }

  @Put('dms/by-service-id')
  async saveDmsByServiceId(
    @Query('serviceId') serviceId: string,
    @Body() data: any,
  ) {
    return this.serviceService.saveDmsByServiceId(serviceId, data);
  }

  // ================= DMS =================

  @Get(':id/dms')
  async getDms(@Param('id') id: string) {

    return this.serviceService.getDms(Number(id));

  }


  @Put(':id/dms')
  async saveDms(
    @Param('id') id: string,
    @Body() data: any
  ) {

    return this.serviceService.saveDms(Number(id), data);

  }



  // ================= FILE UPLOAD =================

  @Post('dms/upload')

  @UseInterceptors(

    FileInterceptor('file', {

      storage: diskStorage({

        destination: (_req, _file, cb) => {

          const dir = join(

            process.cwd(),

            'uploads',

            'dms',

            'prescribed'

          );

          if (!existsSync(dir)) {

            mkdirSync(dir, { recursive: true });

          }

          cb(null, dir);

        },

        filename: (_req, file, cb) => {

          const uniqueName =

            Date.now() + extname(file.originalname);

          cb(null, uniqueName);

        },

      }),

      limits: {

        fileSize: 10 * 1024 * 1024,

      },

    }),

  )

  async uploadPrescribedFormat(

    @UploadedFile() file: Express.Multer.File,

  ) {

    if (!file) {

      throw new BadRequestException(

        'File upload failed',

      );

    }

    const relativePath =

      `uploads/dms/prescribed/${file.filename}`;

    return {

      fileName: file.originalname,

      storedName: file.filename,

      filePath: relativePath,

    };

  }

}
