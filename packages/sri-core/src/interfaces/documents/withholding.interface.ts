import { IElectronicVoucher, IRecipient } from '../electronic-voucher.interface';

export interface IWithholdingItem {
  taxCode: string;
  percentageCode: string;
  rate: number;
  taxableBase: number;
  value: number;
  supportingDocumentType: string;
  supportingDocumentNumber: string;
  supportingDocumentDate: string;
}

export interface IWithholding extends IElectronicVoucher {
  recipient: IRecipient;
  items: IWithholdingItem[];
}
