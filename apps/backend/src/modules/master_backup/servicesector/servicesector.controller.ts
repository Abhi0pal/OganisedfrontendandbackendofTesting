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
} from '@nestjs/common';
import { ServicesectorService } from './servicesector.service';
import { CreateServiceSectorDto, UpdateServiceSectorDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';

@Public()
@Controller('master/servicesector')
export class ServicesectorController {
    constructor(private ServicesectorService: ServicesectorService) {}
    
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

        return this.ServicesectorService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ServicesectorService.findOne(parseInt(id));
    }

    @Post()
    create(@Body() CreateServiceSectorDto: CreateServiceSectorDto) {
    return this.ServicesectorService.create(CreateServiceSectorDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateServiceSectorDto) {
         return this.ServicesectorService.update(parseInt(id), data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.ServicesectorService.delete(parseInt(id));
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: string) {
        return this.ServicesectorService.toggle(parseInt(id));
    }
}
