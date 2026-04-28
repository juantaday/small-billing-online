import { EmissionType } from '../enums/emission-type.enum';
import { Environment } from '../enums/environment.enum';
import { VoucherType } from '../enums/voucher-type.enum';

export interface IIssuer {
  ruc: string;
  businessName: string;
  tradeName?: string;
  address: string;
  establishmentCode: string;
  emissionPoint: string;
  accountingRequired?: boolean;
  specialContributor?: string;
}

export interface IRecipient {
  name: string;
  identificationType: string;
  identificationNumber: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface IElectronicVoucher {
  accessKey?: string;
  issueDate: string;
  voucherType: VoucherType;
  environment: Environment;
  emissionType: EmissionType;
  sequential: string;
  issuer: IIssuer;
  currency?: string;
}
