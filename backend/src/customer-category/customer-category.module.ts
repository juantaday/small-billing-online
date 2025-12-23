import { Module } from '@nestjs/common';
import { CustomerCategoryController } from './customer-category.controller';
import { CustomerCategoryService } from './customer-category.service';

@Module({
  controllers: [CustomerCategoryController],
  providers: [CustomerCategoryService],
  exports: [CustomerCategoryService],
})
export class CustomerCategoryModule {}
