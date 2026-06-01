import { Body, Controller, Post } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { Public } from '../../common/public.decorator';

@Public()
@Controller('api/test-case')
export class TestCaseController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('generate')
  async generate(@Body() body: any) {
    return this.geminiService.generate(body);
  }
}
