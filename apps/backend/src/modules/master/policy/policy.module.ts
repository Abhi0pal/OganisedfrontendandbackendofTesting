import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';

@Module({
    imports: [PrismaModule],
    controllers: [PolicyController],
    providers: [PolicyService],
    exports: [PolicyService],
})
export class PolicyModule { }
