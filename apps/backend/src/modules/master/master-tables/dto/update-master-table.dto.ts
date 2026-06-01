import { CreateMasterTableDto } from './create-master-table.dto';

// Manual PartialType implementation to avoid @nestjs/mapped-types dependency
export class UpdateMasterTableDto implements Partial<CreateMasterTableDto> {
    master_name?: string;
    master_code?: string;
    description?: string;
    table_name?: string;
    schema_name?: string;
    value_column?: string;
    label_column?: string;
    secondary_label?: string;
    label_template?: string;
    is_active_column?: string;
    is_active_value?: string;
    default_filter?: any;
    default_order_by?: string;
    parent_master_id?: number;
    parent_column?: string;
    api_endpoint?: string;
    is_active?: boolean;
}
