import { Environment } from '@sri/core';
import { QueueOptions } from 'bullmq';

export interface ElectronicBillingConfig {
  environment: Environment;
  certificatePath: string;
  certificatePassword: string;
  dbConnectionString: string;
  queueName?: string;
  queueOptions?: QueueOptions;
  storagePath?: string;
}

export const ELECTRONIC_BILLING_CONFIG = 'ELECTRONIC_BILLING_CONFIG';
