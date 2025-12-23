import { Module } from '@nestjs/common';
import { PeopleModule } from './people/people.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { PresentationModule } from './presentation/presentation.module';
import { CustomerCategoryModule } from './customer-category/customer-category.module';
import { CustomerModule } from './customer/customer.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { RewardModule } from './reward/reward.module';

@Module({
  imports: [
    PeopleModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    PresentationModule,
    CustomerCategoryModule,
    CustomerModule,
    PaymentMethodModule,
    RewardModule,
  ],
})
export class AppModule {}