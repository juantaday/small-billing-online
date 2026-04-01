import { Module } from '@nestjs/common';
import { CustomerCategoryController } from './customer-category.controller';
import { CustomerCategoryService } from './customer-category.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerCategoryController],
  providers: [CustomerCategoryService],
  exports: [CustomerCategoryService],
})
export class CustomerCategoryModule {}
