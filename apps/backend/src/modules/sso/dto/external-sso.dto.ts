export class ExternalSsoApplicantDto {
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  address: string;
  country_name: string;
  state_name: string;
  city_name: string;
  district_name: string;
  pin_code: string;

  // Optional
  pan_card?: string;
  adhaar_number?: string;
  legal_entity_name?: string;
}

export class ExternalSsoInitiateDto {
  secret_key: string;
  applicant: ExternalSsoApplicantDto;
  redirect_url?: string;
}
