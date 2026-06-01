// All api end points for user management scope module


import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { Public } from '../../common/public.decorator';
import { UserManagementScopeService } from './user-management-scope.service';
import {
  CreateUserManagementScopeDto,
  UpdateUserManagementScopeDto,
} from './dto';

@Controller('user-management-scopes')
export class UserManagementScopeController {
  constructor(
    private readonly service: UserManagementScopeService,
  ) {}

  @Public()
  @Post()
  async create(
    @Body() dto: CreateUserManagementScopeDto,
  ) {
    return this.service.create(dto);
  }

  @Public()
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(id);
  }

  @Public()
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserManagementScopeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Public()
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(id);
  }
}