import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto ,  UpdateRoleDto} from './dto';
import { Resource } from '../../../common/resource.decorator';


@Controller('roles')
@Resource('MASTER_ROLES')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  // GET ALL
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  // GET ONE
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  // UPDATE
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, dto);
  }

  // DELETE 
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}