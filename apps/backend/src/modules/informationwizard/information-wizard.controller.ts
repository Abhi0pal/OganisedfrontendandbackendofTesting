import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InformationWizardService } from './information-wizard.service';
import { CreateInformationWizardDto, UpdateInformationWizardDto } from './dto';
import { Public } from '../../common/public.decorator';

@Public()
@Controller('information-wizard')
export class InformationWizardController {
  constructor(private informationWizardService: InformationWizardService) {}

  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string
  ) {
    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (search) {
      filters.search = search;
    }

    return this.informationWizardService.findAll(filters);
  }

  @Get('public')
  async findAllPublic() {
    return this.informationWizardService.findAllPublic();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.informationWizardService.findOne(parseInt(id));
  }

  @Post()
  create(@Body() dto: CreateInformationWizardDto) {
    return this.informationWizardService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInformationWizardDto) {
    return this.informationWizardService.update(parseInt(id), dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.informationWizardService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.informationWizardService.toggle(parseInt(id));
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/services',
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/pdf|jpeg|jpg|png/)) {
          return cb(
            new BadRequestException('Only PDF / JPG / PNG files allowed'),
            false
          );
        }
        cb(null, true);
      },
    })
  )
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File upload failed');
    }

    return {
      filePath: `/uploads/services/${file.filename}`,
    };
  }
}
