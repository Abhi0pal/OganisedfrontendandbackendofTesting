export class CreateBlockDto {
  name: string;
  districtId: number;
  stateId: number;
  unitCategory?: string;
  districtCode?: string;
  lgCodeDistrictId?: number;
  isActive?: boolean;
}
