export class CreateActPolicyNotificationAmendmentDto {
  level?: string;
  name: string;
  brief?: string;
  englishfilePath?: string;
  hindifilePath?: string;
  isActive?: boolean;
  start_date?: Date | string;
  end_date?: Date | string;
}
