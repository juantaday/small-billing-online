import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateTerminalDto, TerminalDto, UpdateTerminalDto } from '@small-billing/shared';
import { TerminalService } from './terminal.service';

@Controller('terminals')
export class TerminalController {
  constructor(private readonly terminalService: TerminalService) {}

  @Get()
  async findAll(): Promise<TerminalDto[]> {
    return this.terminalService.findAll();
  }

  @Post()
  async create(@Body() data: CreateTerminalDto): Promise<TerminalDto> {
    return this.terminalService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateTerminalDto): Promise<TerminalDto> {
    return this.terminalService.update(Number(id), data);
  }
}
