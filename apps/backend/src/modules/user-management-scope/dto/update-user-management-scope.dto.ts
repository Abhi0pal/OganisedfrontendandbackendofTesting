import { PartialType } from '@nestjs/mapped-types';
import { CreateUserManagementScopeDto } from './create-user-management-scope.dto';

export class UpdateUserManagementScopeDto extends PartialType(CreateUserManagementScopeDto) {}