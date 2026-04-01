import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaModule } from '../prisma/prisma.module';  
import { ProductImageService } from './product-image.service';
import { LoggerModule } from 'src/common/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [ProductController],
  providers: [ProductService, ProductImageService],
  exports: [ProductService, ProductImageService],
})
export class ProductModule {}
