import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SubSectorsService } from './sub-sectors.service';
import { SubSectorsController } from './sub-sectors.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SubSectorsController],
  providers: [SubSectorsService],
  exports: [SubSectorsService],
})
export class SubSectorsModule {}
