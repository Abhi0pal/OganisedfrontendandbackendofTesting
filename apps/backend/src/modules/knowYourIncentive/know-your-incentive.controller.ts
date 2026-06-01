import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { KnowYourIncentiveService } from './know-your-incentive.service';
import { Public } from '../../common/public.decorator';

@Controller('know-your-incentive')
export class KnowYourIncentiveController {
  constructor(private knowYourIncentiveService: KnowYourIncentiveService) {}
  
  // New endpoint to trigger when a policy is chosen
  @Public()
  @Get('policy/:policyId/msme-year')
  async getMsmeYear(@Param('policyId') policyId: number) {
    return this.knowYourIncentiveService.getMsmeYearByPolicy(policyId);
  }

  @Public()
  @Get('filter')
  async filterIncentives(@Query() query: any) {
    const results = await this.knowYourIncentiveService.getFilteredIncentives(query);
    
    // Mapping the data to match the frontend table requirements
    return results.map(item => ({
      id: item.id,
      policy_name: item.policy?.policy_name,
      incentive_name: item.incentiveType?.name,
      description: item.description,
      limitation: item.limitation,
      benefit_percent_amount: item.benefit_percent_amount,
      cap_limit: item.cap_limit
    }));
  }
}