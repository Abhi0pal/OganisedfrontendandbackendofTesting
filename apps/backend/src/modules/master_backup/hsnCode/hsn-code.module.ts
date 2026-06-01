import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { HsnCodeService } from './hsn-code.service';
import { HsnCodeController } from './hsn-code.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HsnCodeController],
  providers: [HsnCodeService],
  exports: [HsnCodeService],
})
export class HsnCodeModule {}
