import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import {CreateUserDto, UpdateUserDto } from './dto';
import {UserService } from './user.service';
import { Resource } from '../../../common/resource.decorator';

@Controller('users')
@Resource('MASTER_ROLES')
export class UserController{
    constructor(private readonly userService : UserService){}

    // CREATE
    @Post()
    create(@Body() dto : CreateUserDto){
        return this.userService.create(dto);
    }

    // GET ALL
    @Get()
    findAll(@Query() query: any){
        return this.userService.findAll(query);
    }

    // GET ONE
    @Get(':id')
    findOne(@Param('id',ParseIntPipe) id : number){
        return this.userService.findOne(id);
    }

    // UPDATE
    @Patch(':id')
    update(@Param('id',ParseIntPipe) id : number , @Body() dto :UpdateUserDto){
        return this.userService.update(id, dto);
    }

    // DELETE
    @Delete(':id')
    remove(@Param('id',ParseIntPipe) id : number){
        return this.userService.remove(id);
    }

}