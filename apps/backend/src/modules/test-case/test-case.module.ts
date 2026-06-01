import { Module } from '@nestjs/common';
import { TestCaseController } from './test-case.controller';
import { GeminiService } from './gemini.service';

@Module({
  controllers: [TestCaseController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class TestCaseModule {}
