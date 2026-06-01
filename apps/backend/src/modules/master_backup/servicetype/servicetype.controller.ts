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
import { ServicetypeService } from './servicetype.service';
import { CreateServicetypeDto, UpdateServiceTypeDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../../common/public.decorator';

@Public()
@Controller('master/servicetype')
export class ServicetypeController {
    constructor(private ServicetypeService: ServicetypeService) {}
    
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

        return this.ServicetypeService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ServicetypeService.findOne(parseInt(id));
    }

    @Post()
    create(@Body() CreateServicetypeDto: CreateServicetypeDto) {
    return this.ServicetypeService.create(CreateServicetypeDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateServiceTypeDto) {
         return this.ServicetypeService.update(parseInt(id), data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.ServicetypeService.delete(parseInt(id));
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: string) {
        return this.ServicetypeService.toggle(parseInt(id));
    }
}
