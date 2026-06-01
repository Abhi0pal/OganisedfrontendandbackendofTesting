import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from "@nestjs/common";
import { UserRoleAssignmentService } from "./user-role-assignment.service";
import {
  CreateUserRoleAssignmentDto,
  UpdateUserRoleAssignmentDto,
} from "./dto";
import { Public } from "../../../common/public.decorator";

@Controller("user-role-assignments")
export class UserRoleAssignmentController {
  constructor(
    private readonly service: UserRoleAssignmentService,
  ) {}

  // ✅ CREATE
  @Public()
  @Post()
  async create(
    @Body() dto: CreateUserRoleAssignmentDto,
  ) {
    return this.service.create(dto);
  }

  // ✅ FIND ALL
  @Public()
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  // ✅ FIND ONE
  @Public()
  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.service.findOne(id);
  }

  // ✅ UPDATE
  @Public()
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleAssignmentDto,
  ) {
    return this.service.update(id, dto);
  }

  // ✅ DELETE
  @Public()
  @Delete(":id")
  async remove(
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.service.remove(id);
  }
}
