import { Module } from '@nestjs/common';
import { SaleController } from './sale.controller';
import { SaleService } from './sale.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DeviceModule } from '../device/device.module';
import { TerminalSettingsModule } from '../terminal-settings/terminal-settings.module';

@Module({
  imports: [PrismaModule, DeviceModule, TerminalSettingsModule],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
