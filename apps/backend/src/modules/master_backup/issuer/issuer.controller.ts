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
import { IssuerService } from './issuer.service';
import { CreateIssuerDto, UpdateIssuerDto } from './dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesResourcesGuard } from '../../../common/roles-resources.guard';
import { Resource } from '../../../common/resource.decorator';

@Controller('issuers')
@UseGuards(JwtGuard, RolesResourcesGuard)
@Resource('MASTER_ALL')
export class IssuerController {
  constructor(private readonly issuerService: IssuerService) { }

  @Resource('MASTER_ISSUERS_READ')
  @Get()
  findAll() {
    return this.issuerService.findAll();
  }

  @Resource('MASTER_ISSUERS_READ')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.issuerService.findOne(id);
  }

  @Post()
  create(@Body() createIssuerDto: CreateIssuerDto) {
    return this.issuerService.create(createIssuerDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIssuerDto: UpdateIssuerDto,
  ) {
    return this.issuerService.update(id, updateIssuerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuerService.remove(id);
  }

  @Patch(':id/toggle')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.issuerService.toggleStatus(id);
  }
}
