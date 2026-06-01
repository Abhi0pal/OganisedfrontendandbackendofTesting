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
import { FieldService } from './field.service';
import { CreateFieldDto, UpdateFieldDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { SkipResourceCheck } from '../../../common/skip-resource-check.decorator';

@Controller('master/fields')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class FieldController {
    constructor(private fieldService: FieldService) { }

    @Post('bulk')
    async bulkCreate(@Body() data: { fields: CreateFieldDto[] }) {
        console.log('Bulk create received:', JSON.stringify(data, null, 2));
        return this.fieldService.bulkCreate(data.fields || []);
    }

    @Post()
    async create(@Body() data: CreateFieldDto) {
        return this.fieldService.create(data);
    }

    // Allow any authenticated user to fetch field definitions for form rendering
    @SkipResourceCheck()
    @Get()
    async findAll(
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
    ) {
        const filters: any = {};

        if (isActive !== undefined) {
            filters.is_active = isActive === 'true';
        }

        if (search) {
            filters.search = search;
        }

        return this.fieldService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        return this.fieldService.findOne(id);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() data: UpdateFieldDto) {
        return this.fieldService.update(id, data);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.fieldService.delete(id);
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: number) {
        return this.fieldService.toggle(id);
    }
}
