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
import { MasterTablesService } from './master-tables.service';
import { CreateMasterTableDto, UpdateMasterTableDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/master-tables')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class MasterTablesController {
    constructor(private masterTablesService: MasterTablesService) { }

    @Post()
    async create(@Body() data: CreateMasterTableDto) {
        return this.masterTablesService.create(data);
    }

    @Get()
    async findAll(
        @Query('is_active') isActive?: string,
        @Query('search') search?: string,
    ) {
        const filters: any = {};

        if (isActive !== undefined) {
            filters.is_active = isActive === 'true';
        }

        if (search) {
            filters.search = search;
        }

        return this.masterTablesService.findAll(filters);
    }

    /**
     * Get simplified list for dropdown in Field Master
     * This is public so dynamic forms can use it
     */
    @Public()
    @Get('dropdown')
    async getForDropdown() {
        return this.masterTablesService.getForDropdown();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.masterTablesService.findOne(parseInt(id));
    }

    @Get('code/:code')
    async findByCode(@Param('code') code: string) {
        return this.masterTablesService.findByCode(code);
    }

    /**
     * Get dropdown options from the actual master table
     * This is public so dynamic forms can fetch options
     */
    @Public()
    @Get(':code/options')
    async getOptions(
        @Param('code') code: string,
        @Query('parent') parentValue?: string,
    ) {
        return this.masterTablesService.getOptions(code, parentValue);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateMasterTableDto) {
        return this.masterTablesService.update(parseInt(id), data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.masterTablesService.delete(parseInt(id));
    }

    @Put(':id/toggle')
    async toggle(@Param('id') id: string) {
        return this.masterTablesService.toggle(parseInt(id));
    }
}
