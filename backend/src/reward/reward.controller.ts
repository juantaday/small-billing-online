import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { RewardService } from './reward.service';
import {
  CreateRewardDto,
  RewardDto,
  UpdateRewardDto,
  RewardWithRelationsDto,
} from '@small-billing/shared';

@Controller('rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Get()
  async findAll(): Promise<RewardWithRelationsDto[]> {
    return this.rewardService.findAll();
  }

  @Get('available')
  async findAvailable(): Promise<RewardWithRelationsDto[]> {
    return this.rewardService.findAvailable();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RewardWithRelationsDto> {
    return this.rewardService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateRewardDto): Promise<RewardDto> {
    return this.rewardService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateRewardDto,
  ): Promise<RewardDto> {
    return this.rewardService.update(id, data);
  }

  @Put(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ): Promise<RewardDto> {
    return this.rewardService.updateStock(id, quantity);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<RewardDto> {
    return this.rewardService.delete(id);
  }
}
