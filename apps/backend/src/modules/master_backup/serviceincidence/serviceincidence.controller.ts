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
import { ServiceincidenceService } from './serviceincidence.service';
import { CreateServiceIncidenceDto, UpdateServiceIncidenceDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';

@Public()
@Controller('master/serviceincidence')
export class ServiceincidenceController {
    constructor(private ServiceincidenceService: ServiceincidenceService) {}
    
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

        return this.ServiceincidenceService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ServiceincidenceService.findOne(parseInt(id));
    }

    @Post()
    create(@Body() CreateServiceIncidenceDto: CreateServiceIncidenceDto) {
    return this.ServiceincidenceService.create(CreateServiceIncidenceDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateServiceIncidenceDto) {
         return this.ServiceincidenceService.update(parseInt(id), data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.ServiceincidenceService.delete(parseInt(id));
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: string) {
        return this.ServiceincidenceService.toggle(parseInt(id));
    }
}
