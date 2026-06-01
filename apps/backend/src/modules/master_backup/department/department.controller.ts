import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Public()
@Controller('departments')
//@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Resource('MASTER_DEPARTMENTS_READ')
  @Get()
  findAll() {
    return this.departmentService.findAll();
  }

  @Resource('MASTER_DEPARTMENTS_READ')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.findOne(id);
  }

  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.remove(id);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.toggleStatus(id);
  }
}
