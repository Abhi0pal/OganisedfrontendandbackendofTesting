import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { NicCodeService } from './nic-code.service';
import { NicCodeController } from './nic-code.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NicCodeController],
  providers: [NicCodeService],
  exports: [NicCodeService],
})
export class NicCodeModule {}
