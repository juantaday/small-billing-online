import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PresentationController],
  providers: [PresentationService],
  exports: [PresentationService],
})
export class PresentationModule {}
