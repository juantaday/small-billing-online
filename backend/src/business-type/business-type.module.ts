import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BusinessTypeController } from './business-type.controller';
import { BusinessTypeService } from './business-type.service';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessTypeController],
  providers: [BusinessTypeService],
  exports: [BusinessTypeService],
})
export class BusinessTypeModule {}
