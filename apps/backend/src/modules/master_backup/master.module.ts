import { Module } from '@nestjs/common';
import { CountryModule } from './country/country.module';
import { DistrictModule } from './district/district.module';
import { StateModule } from './state/state.module';
import { BlockModule } from './block/block.module';
import { TehsilModule } from './tehsil/tehsil.module';
import { VillageModule } from './village/village.module';
import { DepartmentModule } from './department/department.module';
import { IssuerModule } from './issuer/issuer.module';
// import { DocumentTypeModule } from './documentType/document-type.module';
import { ServiceModule } from './service/service.module';
import { FormCategoryModule } from './formCategory/form-category.module';
import { FormTypeModule } from './formType/form-type.module';
import { ServicetypeModule } from './servicetype/servicetype.module';
import { ServicesectorModule } from './servicesector/servicesector.module';
import { ServiceincidenceModule } from './serviceincidence/serviceincidence.module';
import { DocumentCheckpointModule } from './documentCheckpoint/document-checkpoint.module';
import { DocumentMasterModule } from './document/document-master.module';
import { AnchorTypesModule } from './anchorTypes/anchor-types.module';
import { BeneficiaryTypesModule } from './beneficiaryTypes/beneficiary-types.module';
import { RegionCategoriesModule } from './regionCategories/region-categories.module';
import { FinancialParameterModule } from './financialParameter/financial-parameter.module';
import { IncentiveTypesModule } from './incentiveTypes/incentive-types.module';
import { LandCategoriesModule } from './landCategories/land-categories.module';
import { MappingRegionCategoriesModule } from './mappingRegionCategories/mapping-region-categories.module';
import { MsmeYearModule } from './msmeYear/msme-year.module';
import { OccurrencesModule } from './occurrences/occurrences.module';
import { SectorsModule } from './sectors/sectors.module';
import { SubSectorsModule } from './subSectors/sub-sectors.module';
import { UnitCategoriesModule } from './unitCategories/unit-categories.module';
import { UnitTypesModule } from './unitTypes/unit-types.module';
import { MasterTablesModule } from './master-tables/master-tables.module';
import { ActPolicyNotificationModule } from './actPolicyNotification/act-policy-notification.module';
import { NicCodeModule } from './nicCode/nic-code.module';
import { HsnCodeModule } from './hsnCode/hsn-code.module';
import { FormFieldModule } from './formField/form-field.module';
import { UnitOrganisationModule } from './unitOrganisation/unit-organisation.module';
import { UpclSupplyCategoryModule } from './upclSupplyCategory/upcl-supply-category.module';
import { UpclDivisionSubdivisionModule } from './upclDivisionSubdivision/upcl-division-subdivision.module';
import { UpclSupplySubcategoryModule } from './upclSupplySubcategory/upcl-supply-subcategory.module';
import { UpclVoltageModule } from './upclVoltage/upcl-voltage.module';
import { UjsDivisionModule } from './ujsDivision/ujs-division.module';
import { LabourFactoryTypeMasterModule } from './labourFactoryTypeMaster/labour-factory-type-master.module';
import { LabourFactorySec85Module } from './labourFactorySec85/labour-factory-sec85.module';
import { PollutionControlEquipmentModule } from './pollutionControlEquipment/pollution-control-equipment.module';
import { CurrentLanduseModule } from './currentLanduse/current-landuse.module';
import { FormBuilderModule } from './formBuilder/form-builder.module';
import { PollutionCategoriesModule } from './pollutionCategories/pollution-categories.module';
import { ProjectStatusModule } from './projectStatus/project-status.module';
import { LandAllotmentStageModule } from './landAllotmentStage/land-allotment-stage.module';
import { WorkflowJurisdictionLevelModule } from './workflowJurisdictionLevel/workflow-jurisdiction-level.module';
import { WorkflowAssignmentStrategyModule } from './workflowAssignmentStrategy/workflow-assignment-strategy.module';
import { WorkflowActionMasterModule } from './workflowActionMaster/workflow-action-master.module';

@Module({

  imports: [
    CountryModule,
    StateModule,
    DistrictModule,
    BlockModule,
    TehsilModule,
    VillageModule,
    DepartmentModule,
    IssuerModule,
    // DocumentTypeModule,
    FormCategoryModule,
    FormFieldModule,
    ServiceModule,
    FormTypeModule,
    ServicetypeModule,
    ServicesectorModule,
    ServiceincidenceModule,
    DocumentCheckpointModule,
    DocumentMasterModule,
    ActPolicyNotificationModule,
    AnchorTypesModule,
    BeneficiaryTypesModule,
    RegionCategoriesModule,
    FinancialParameterModule,
    IncentiveTypesModule,
    LandCategoriesModule,
    MappingRegionCategoriesModule,
    MsmeYearModule,
    OccurrencesModule,
    SectorsModule,
    SubSectorsModule,
    UnitCategoriesModule,
    UnitTypesModule,
    MasterTablesModule,
    NicCodeModule,
    HsnCodeModule,
    UnitOrganisationModule,
    UpclSupplyCategoryModule,
    UpclSupplySubcategoryModule,
    UpclDivisionSubdivisionModule,
    UpclVoltageModule,
    UjsDivisionModule,
    LabourFactoryTypeMasterModule,
    LabourFactorySec85Module,
    PollutionControlEquipmentModule,
    FormBuilderModule,
    PollutionCategoriesModule,
    CurrentLanduseModule,
    ProjectStatusModule,
    LandAllotmentStageModule,
    WorkflowJurisdictionLevelModule,
    WorkflowAssignmentStrategyModule,
    WorkflowActionMasterModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class MasterModule { }
