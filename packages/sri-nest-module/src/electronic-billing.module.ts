import { DynamicModule, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { IVoucherRepository, TypeormVoucherRepository } from '@sri/persistence-adapter';
import { ElectronicBillingService, ELECTRONIC_BILLING_QUEUE } from './electronic-billing.service';
import { ELECTRONIC_BILLING_CONFIG, ElectronicBillingConfig } from './electronic-billing.config';

@Module({})
export class ElectronicBillingModule {
  static forRoot(config: ElectronicBillingConfig): DynamicModule {
    const repositoryProvider = {
      provide: 'SRI_VOUCHER_REPOSITORY',
      useFactory: (): IVoucherRepository => new TypeormVoucherRepository({
        connectionString: config.dbConnectionString,
      }),
    };

    const queueProvider = {
      provide: ELECTRONIC_BILLING_QUEUE,
      useFactory: (): Queue => new Queue(config.queueName || 'sri-billing', config.queueOptions),
    };

    return {
      module: ElectronicBillingModule,
      providers: [
        {
          provide: ELECTRONIC_BILLING_CONFIG,
          useValue: config,
        },
        repositoryProvider,
        queueProvider,
        {
          provide: ElectronicBillingService,
          useFactory: (
            repo: IVoucherRepository,
            queue: Queue,
            cfg: ElectronicBillingConfig,
          ) => new ElectronicBillingService(cfg, queue, repo),
          inject: ['SRI_VOUCHER_REPOSITORY', ELECTRONIC_BILLING_QUEUE, ELECTRONIC_BILLING_CONFIG],
        },
      ],
      exports: [ElectronicBillingService],
    };
  }
}
