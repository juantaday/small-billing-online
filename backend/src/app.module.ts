import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PeopleModule } from './people/people.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { PresentationModule } from './presentation/presentation.module';
import { CustomerCategoryModule } from './customer-category/customer-category.module';
import { CustomerModule } from './customer/customer.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { RewardModule } from './reward/reward.module';
import { PresentationTypeModule } from './presentation-type/presentation-type.module';
import { BankModule } from './bank/bank.module';
import { SaleModule } from './sale/sale.module';
import { CreditModule } from './credit/credit.module';
import { LoggerModule } from './common/logger/logger.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { DeviceModule } from './device/device.module';
import { TerminalSettingsModule } from './terminal-settings/terminal-settings.module';
import { DocumentTypeModule } from './document-type/document-type.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { TerminalModule } from './terminal/terminal.module';
import { InvoiceSequenceModule } from './invoice-sequence/invoice-sequence.module';

@Module({
  imports: [
    LoggerModule,
    PeopleModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    PresentationModule,
    CustomerCategoryModule,
    CustomerModule,
    PaymentMethodModule,
    BankModule,
    PresentationTypeModule,
    RewardModule,
    SaleModule,
    CreditModule,
    DeviceModule,
    TerminalSettingsModule,
    DocumentTypeModule,
    WarehouseModule,
    TerminalModule,
    InvoiceSequenceModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}