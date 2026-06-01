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
import { ProjectStatusService } from './project-status.service';
import { CreateProjectStatusDto, UpdateProjectStatusDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/project-status')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class ProjectStatusController {
  constructor(private projectStatusService: ProjectStatusService) {}

  @Post()
  async create(@Body() data: CreateProjectStatusDto) {
    return this.projectStatusService.create(data);
  }

  @Public()
  @Get()
  async findAll(@Query('isActive') isActive?: string, @Query('search') search?: string) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (search) {
      filters.search = search;
    }

    return this.projectStatusService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectStatusService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateProjectStatusDto) {
    return this.projectStatusService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.projectStatusService.delete(parseInt(id, 10));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.projectStatusService.toggle(parseInt(id, 10));
  }
}
