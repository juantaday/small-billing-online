import { Module } from '@nestjs/common';
import { TerminalSettingsController } from './terminal-settings.controller';
import { TerminalSettingsService } from './terminal-settings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TerminalSettingsController],
  providers: [TerminalSettingsService],
  exports: [TerminalSettingsService],
})
export class TerminalSettingsModule {}
