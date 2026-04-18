import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceSequenceController } from './invoice-sequence.controller';
import { InvoiceSequenceService } from './invoice-sequence.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceSequenceController],
  providers: [InvoiceSequenceService],
  exports: [InvoiceSequenceService],
})
export class InvoiceSequenceModule {}
