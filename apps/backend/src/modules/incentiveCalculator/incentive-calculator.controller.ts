import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncentiveCalculatorService } from './incentive-calculator.service';
import { Public } from '../../common/public.decorator';

@Controller('incentive-calculator')
export class IncentiveCalculatorController {
  constructor(private incentiveCalculatorService: IncentiveCalculatorService) {}

  @Public()
  @Get('policy/:policyId/msme-year')
  async getMsmeYear(@Param('policyId') policyId: number) {
    return this.incentiveCalculatorService.getMsmeYearByPolicy(policyId);
  }

  @Public()
  @Get('policy/:policyId/map-financial-parameters')
  async getFinancialParameters(@Param('policyId') policyId: number) {
    return this.incentiveCalculatorService.getFinancialParametersByPolicy(policyId);
  }

  /**
   * Filter and calculate incentives for a single policy
   * URL Example: /incentive-calculator/calculate-single?policy_id=123&financial_parameters={"financial_parameter_1": 50000}
   */
@Public()
@Get('filter')
async filterIncentives(@Query() query: any) {
  // Check if it's a string AND not the broken "[object Object]" string
  if (typeof query.financial_parameters === 'string' && query.financial_parameters !== '[object Object]') {
    try {
      query.financial_parameters = JSON.parse(query.financial_parameters);
    } catch (e) {
      console.error("Failed to parse financial_parameters:", query.financial_parameters);
      query.financial_parameters = {}; 
    }
  } else if (query.financial_parameters === '[object Object]') {
    // This handles the specific error you're seeing
    query.financial_parameters = {}; 
  }

  return this.incentiveCalculatorService.filterICDetails(query);
}

  /**
   * Compare multiple policies
   * URL Example: /incentive-calculator/compare?policy_id_1=1&policy_id_2=2&financial_parameters={...}
   */
  @Public()
  @Get('compare')
  async compareIncentives(@Query() query: any) {
    // Parsing the JSON string if necessary
    if (typeof query.financial_parameters === 'string') {
      query.financial_parameters = JSON.parse(query.financial_parameters);
    }
    return this.incentiveCalculatorService.compareICDetails(query);
  }
}