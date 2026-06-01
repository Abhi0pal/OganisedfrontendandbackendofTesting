import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FormBuilderService } from './form-builder.service';
import { SkipResourceCheck } from '../../../common/skip-resource-check.decorator';

// ✅ OLD DTOs
import { AddPageDto, UpdatePageDto, SavePageCategoriesDto, CreateFormMappingDto } from './dto';

// ✅ NEW DTOs
import { CreateBuilderFieldDto } from './dto/create-builder-field.dto';
import { UpdateBuilderFieldDto } from './dto/update-builder-field.dto';
import { ReorderBuilderFieldsDto } from './dto/reorder-builder-fields.dto';
import { SaveFieldOptionsDto } from './dto/save-field-options.dto';
import { CreateAddMoreGroupDto } from './dto/create-addmore-group.dto';
import { ListAddMoreGroupsQueryDto } from './dto/list-addmore-groups.dto';
import { SetAddMoreColumnsDto } from './dto/set-addmore-columns.dto';
import { CreateRuleDto, UpdateRuleDto } from './dto/form-rule.dto';
import { UpdateAddMoreGroupDto } from './dto/update-addmore-group.dto';

@Controller('master/form-builder')
export class FormBuilderController {
  constructor(private readonly service: FormBuilderService) { }

  // =========================================================
  // ✅ OLD ENDPOINTS
  // =========================================================
  @Get('departments/:departmentId/services')
  getDepartmentServices(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return this.service.getServicesWithFormsAndPages(departmentId);
  }

  @Get('investor/apply-services')
  @SkipResourceCheck()
  getInvestorApplyServices(
    @Req() req: any,
    @Query('tenantId') tenantId?: string,
    @Query('projectId') projectId?: string,
  ) {
    const resolvedTenantId =
      Number(req?.user?.tenant_id ?? 0) ||
      (tenantId ? Number(tenantId) : undefined);
    const resolvedProjectId =
      Number(req?.user?.project_id ?? 0) ||
      (projectId ? Number(projectId) : undefined);

    return this.service.getInvestorApplyServices(
      resolvedTenantId,
      resolvedProjectId,
    );
  }

  @Get('services/:serviceId/forms/preview-code')
  previewFormCode(
    @Param('serviceId') serviceId: string,
    @Query('formTypeId', ParseIntPipe) formTypeId: number,
  ) {
    return this.service.previewFormCode(serviceId, formTypeId);
  }

  @Post('services/:serviceId/forms')
  createFormMapping(@Param('serviceId') serviceId: string, @Body() dto: CreateFormMappingDto) {
    return this.service.createFormMapping(serviceId, dto);
  }

  @Delete('services/:serviceId/forms/:formTypeId')
  deleteFormMapping(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId', ParseIntPipe) formTypeId: number,
    @Query('mappingId') mappingId?: string,
  ) {
    return this.service.softDeleteFormMapping(serviceId, formTypeId, mappingId ? Number(mappingId) : undefined);
  }

  @Get('services/:serviceId/forms/:formTypeId/pages')
  getPages(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId', ParseIntPipe) formTypeId: number,
    @Query('tenantId') tenantId?: string,
    @Query('projectId') projectId?: string,
    @Query('roleId') roleId?: string,
    @Query('mappingId') mappingId?: string,
  ) {
    return this.service.getPages(
      serviceId, 
      formTypeId, 
      tenantId ? Number(tenantId) : undefined,
      projectId ? Number(projectId) : undefined,
      roleId ? Number(roleId) : undefined,
      mappingId ? Number(mappingId) : undefined
    );
  }

  @Post('services/:serviceId/forms/:formTypeId/pages')
  addPage(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId', ParseIntPipe) formTypeId: number,
    @Body() dto: AddPageDto,
  ) {
    return this.service.addPage(serviceId, formTypeId, dto);
  }

  @Patch('pages/:pageId')
  updatePage(@Param('pageId', ParseIntPipe) pageId: number, @Body() dto: UpdatePageDto) {
    return this.service.updatePage(pageId, dto);
  }

  @Delete('pages/:pageId')
  deletePage(@Param('pageId', ParseIntPipe) pageId: number) {
    return this.service.softDeletePage(pageId);
  }

  @Get('pages/:pageId/categories')
  getPageCategories(@Param('pageId', ParseIntPipe) pageId: number) {
    return this.service.getPageCategories(pageId);
  }

  @Put('pages/:pageId/categories')
  savePageCategories(@Param('pageId', ParseIntPipe) pageId: number, @Body() dto: SavePageCategoriesDto) {
    return this.service.savePageCategories(pageId, dto);
  }

  // =========================================================
  // ✅ NEW: meta for builder header + preview
  // =========================================================
  @Get('services/:serviceId/forms/:formTypeId/meta')
  getBuilderMeta(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId', ParseIntPipe) formTypeId: number,
    @Query('mappingId') mappingId?: string,
  ) {
    return this.service.getBuilderMeta(serviceId, formTypeId, mappingId ? Number(mappingId) : undefined);
  }

  // =========================================================
  // ✅ NEW: Preview definition (Generate Form)
  // =========================================================
  @Get('services/:serviceId/forms/:formTypeId/preview')
  getPreviewDefinition(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId', ParseIntPipe) formTypeId: number,
    @Query('locale') locale?: string,
  ) {
    return this.service.getPreviewDefinition(serviceId, formTypeId, locale);
  }

  // =========================================================
  // ✅ NEW BUILDER ENDPOINTS
  // =========================================================
  @Get('pages/:pageId/categories/:categoryId/fields')
  getCategoryFields(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('serviceId') serviceId: string,
    @Query('formTypeId', ParseIntPipe) formTypeId: number,
    @Query('mappingId') mappingId?: string,
    @Query('locale') locale?: string,
  ) {
    return this.service.getBuilderFields(serviceId, formTypeId, pageId, categoryId, locale, mappingId ? Number(mappingId) : undefined);
  }

  // =========================================================
  // ✅ Master table options (supports cascading + search)
  // GET /master/form-builder/master-tables/:masterTableId/options?parentValue=...&q=...&take=...&includeInactive=...
  // =========================================================
  @Get('master-tables/:masterTableId/options')
  getMasterTableOptions(
    @Param('masterTableId', ParseIntPipe) masterTableId: number,
    @Query('parentValue') parentValue?: string | string[],
    @Query('q') q?: string,
    @Query('take') take?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.service.getMasterTableOptions(masterTableId, parentValue, {
      q,
      take: take ? Number(take) : undefined,
      includeInactive: includeInactive === '1' || includeInactive === 'true',
    });
  }

  @Get('fields')
  getServiceFormFields(@Query('serviceId') serviceId: string) {
    return this.service.getServiceFormFields(serviceId);
  }

  @Post('pages/:pageId/categories/:categoryId/fields')
  addCategoryField(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: CreateBuilderFieldDto,
  ) {
    return this.service.createBuilderField(pageId, categoryId, dto);
  }

  @Patch('fields/:builderFieldId')
  updateCategoryField(@Param('builderFieldId', ParseIntPipe) id: number, @Body() dto: UpdateBuilderFieldDto) {
    return this.service.updateBuilderField(id, dto);
  }

  @Delete('fields/:builderFieldId')
  deleteCategoryField(@Param('builderFieldId', ParseIntPipe) id: number) {
    return this.service.softDeleteBuilderField(id);
  }

  @Put('pages/:pageId/categories/:categoryId/fields/reorder')
  reorderCategoryFields(
    @Param('pageId', ParseIntPipe) pageId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: ReorderBuilderFieldsDto,
  ) {
    return this.service.reorderBuilderFields(pageId, categoryId, dto);
  }

  @Get('fields/:builderFieldId/options')
  getFieldOptions(@Param('builderFieldId', ParseIntPipe) builderFieldId: number) {
    return this.service.getFieldOptionConfig(builderFieldId);
  }

  @Put('fields/:builderFieldId/options')
  saveFieldOptions(@Param('builderFieldId', ParseIntPipe) builderFieldId: number, @Body() dto: SaveFieldOptionsDto) {
    return this.service.saveFieldOptionConfig(builderFieldId, dto);
  }

  @Post('addmore/groups')
  createAddMoreGroup(@Body() dto: CreateAddMoreGroupDto) {
    return this.service.createAddMoreGroup(dto);
  }

  @Get('addmore/groups')
  listAddMoreGroups(@Query() q: ListAddMoreGroupsQueryDto) {
    return this.service.listAddMoreGroups(q);
  }

  @Put('addmore/groups/:groupId/columns')
  setAddMoreColumns(@Param('groupId', ParseIntPipe) groupId: number, @Body() dto: SetAddMoreColumnsDto) {
    return this.service.setAddMoreColumns(groupId, dto);
  }

  @Delete('addmore/groups/:groupId')
  deleteAddMoreGroup(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.service.softDeleteAddMoreGroup(groupId);
  }

  // =========================================================
  // ✅ LOGIC RULE ENDPOINTS
  // =========================================================

  // Original Long Paths
  @Get('services/:serviceId/forms/:formTypeId/rules')
  getRules(@Param('serviceId') serviceId: string, @Param('formTypeId', ParseIntPipe) formTypeId: number) {
    return this.service.getRules(serviceId, formTypeId);
  }

  @Post('services/:serviceId/forms/:formTypeId/rules')
  createRule(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId', ParseIntPipe) formTypeId: number,
    @Body() dto: CreateRuleDto,
  ) {
    return this.service.createRule(serviceId, formTypeId, dto);
  }

  @Patch('rules/:ruleId')
  updateRule(@Param('ruleId', ParseIntPipe) ruleId: number, @Body() dto: UpdateRuleDto) {
    return this.service.updateRule(ruleId, dto);
  }

  @Delete('rules/:ruleId')
  deleteRule(@Param('ruleId', ParseIntPipe) ruleId: number) {
    return this.service.softDeleteRule(ruleId);
  }

  // =========================================================
  // ⚡ SHORTCUT ROUTES (Fixes 404 Error in Frontend Hooks)
  // =========================================================

  @Get('rules/:serviceId/:formTypeId')
  getRulesShort(
    @Param('serviceId') serviceId: string,
    @Param('formTypeId', ParseIntPipe) formTypeId: number
  ) {
    return this.service.getRules(serviceId, formTypeId);
  }

  @Post('rules')
  createRuleShort(@Body() body: any) {
    // LogicBuilderModal sends IDs in body, handle both snake_case and camelCase
    const service_id = body.service_id || body.serviceId;
    const form_id    = body.form_id    || body.formId;
    const { service_id: _, form_id: __, serviceId: ___, formId: ____, ...dto } = body;
    
    return this.service.createRule(service_id, Number(form_id), dto as CreateRuleDto);
  }

  @Patch('addmore/groups/:groupId')
  updateAddMoreGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: UpdateAddMoreGroupDto // We will create this DTO below
  ) {
    return this.service.updateAddMoreGroup(groupId, dto);
  }
}
