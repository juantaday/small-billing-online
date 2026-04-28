import { IElectronicVoucher, IRecipient } from '../electronic-voucher.interface';
import { ITaxTotal } from './invoice.interface';

export interface ICreditNoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalWithoutTaxes: number;
  taxes?: ITaxTotal[];
}

export interface ICreditNote extends IElectronicVoucher {
  recipient: IRecipient;
  modifiedDocumentNumber: string;
  modifiedDocumentDate: string;
  reason: string;
  totalWithoutTaxes: number;
  totalTaxes: ITaxTotal[];
  valueToModify: number;
  items: ICreditNoteItem[];
}
