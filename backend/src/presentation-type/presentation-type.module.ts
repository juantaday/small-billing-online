import { Module } from '@nestjs/common';
import { PresentationTypeController } from './presentation-type.controller';
import { PresentationTypeService } from './presentation-type.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PresentationTypeController],
  providers: [PresentationTypeService],
  exports: [PresentationTypeService],
})
export class PresentationTypeModule {}
