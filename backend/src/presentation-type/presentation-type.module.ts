import { Module } from '@nestjs/common';
import { PresentationTypeController } from './presentation-type.controller';
import { PresentationTypeService } from './presentation-type.service';

@Module({
  controllers: [PresentationTypeController],
  providers: [PresentationTypeService],
  exports: [PresentationTypeService],
})
export class PresentationTypeModule {}
