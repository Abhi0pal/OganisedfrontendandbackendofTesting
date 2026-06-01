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
import { VillageService } from './village.service';
import { CreateVillageDto, UpdateVillageDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('villages')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class VillageController {
  constructor(private readonly villageService: VillageService) {}

  @Get()

  findAll() {
    return this.villageService.findAll();
  }

  @Public()
  @Get(':id')

  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.villageService.findOne(id);
  }

  @Post()
  create(@Body() createVillageDto: CreateVillageDto) {
    return this.villageService.create(createVillageDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVillageDto: UpdateVillageDto,
  ) {
    return this.villageService.update(id, updateVillageDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.villageService.remove(id);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.villageService.toggleStatus(id);
  }
}
