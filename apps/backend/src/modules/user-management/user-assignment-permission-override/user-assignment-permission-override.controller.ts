import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { UserAssignmentPermissionOverrideService } from './user-assignment-permission-override.service';
import { CreateUserAssignmentPermissionOverrideDto } from './dto/create-user-assignment-permission-override.dto';
import { UpdateUserAssignmentPermissionOverrideDto } from './dto/update-user-assignment-permission-override.dto';

import { Resource } from '../../../common/resource.decorator';
@Controller('user-assignment-permission-overrides')
@Resource('MASTER_ROLES')
export class UserAssignmentPermissionOverrideController {
  constructor(private readonly service: UserAssignmentPermissionOverrideService) {}

  @Post()
  create(
    @Body() dto: CreateUserAssignmentPermissionOverrideDto,
    @Req() req: any,
  ) {
    return this.service.create(dto, BigInt(req.user.id));
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAssignmentPermissionOverrideDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
