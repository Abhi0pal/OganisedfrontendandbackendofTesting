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
    ParseIntPipe,
} from '@nestjs/common';
import { PolicyService } from './policy.service';
import { CreatePolicyDto, UpdatePolicyDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/policies')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class PolicyController {
    constructor(private policyService: PolicyService) {}

    @Post()
    async create(@Body() data: CreatePolicyDto) {
        return this.policyService.create(data);
    }

    @Public()
    @Get()
    async findAll(
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
        @Query('departmentId') departmentId?: string,
    ) {
        const filters: any = {};

        if (isActive !== undefined) {
            filters.is_active = isActive === 'true';
        }

        if (search) {
            filters.search = search;
        }

        if (departmentId) {
            filters.department_id = parseInt(departmentId, 10);
        }

        return this.policyService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.policyService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: UpdatePolicyDto,
    ) {
        return this.policyService.update(id, data);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.policyService.delete(id);
    }

    @Put(':id/toggle')
    async toggle(@Param('id', ParseIntPipe) id: number) {
        return this.policyService.toggle(id);
    }
}
