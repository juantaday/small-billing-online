import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductImageService } from './product-image.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductImageService],
  exports: [ProductService, ProductImageService],
})
export class ProductModule {}
