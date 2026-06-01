import { 
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards 
} from '@nestjs/common';
import { StateService } from './state.service';
import { CreateStateDto, UpdateStateDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';
import { Public } from '../../../common/public.decorator';

@Controller('master/states')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class StateController {
  constructor(private stateService: StateService) { }

  @Post()
  async create(@Body() data: CreateStateDto) {
    return this.stateService.create(data);
  }

  @Public()
  @Get()
  async findAll(@Query('isActive') isActive?: string, @Query('search') search?: string, @Query('countryId') countryId?: string) {
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (search) {
      filters.search = search;
    }
    if (countryId) {
      filters.countryId = parseInt(countryId);
    }

    return this.stateService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stateService.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateStateDto) {
    return this.stateService.update(parseInt(id), data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.stateService.delete(parseInt(id));
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    return this.stateService.toggle(parseInt(id));
  }
}
