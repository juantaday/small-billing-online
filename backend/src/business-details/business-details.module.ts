import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BusinessDetailsController } from './business-details.controller';
import { BusinessDetailsService } from './business-details.service';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessDetailsController],
  providers: [BusinessDetailsService],
  exports: [BusinessDetailsService],
})
export class BusinessDetailsModule {}
