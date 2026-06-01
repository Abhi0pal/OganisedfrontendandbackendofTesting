import { Module } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { IssuerController } from './issuer.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IssuerController],
  providers: [IssuerService],
  exports: [IssuerService],
})
export class IssuerModule {}
