import { IElectronicVoucher, IRecipient } from '../electronic-voucher.interface';

export interface ITaxTotal {
  code: string;
  percentageCode: string;
  rate: number;
  taxableBase: number;
  value: number;
}

export interface IInvoiceTotals {
  totalWithoutTaxes: number;
  totalDiscount: number;
  totalTaxes: ITaxTotal[];
  tip?: number;
  total: number;
}

export interface IInvoiceItemTax {
  code: string;
  percentageCode: string;
  rate: number;
  taxableBase: number;
  value: number;
}

export interface IInvoiceItem {
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalWithoutTaxes: number;
  taxes?: IInvoiceItemTax[];
}

export interface IPayment {
  method: string;
  total: number;
  term?: number;
  timeUnit?: string;
}

export interface IInvoice extends IElectronicVoucher {
  recipient: IRecipient;
  totals: IInvoiceTotals;
  items: IInvoiceItem[];
  payments?: IPayment[];
  additionalInfo?: Record<string, string>;
}
