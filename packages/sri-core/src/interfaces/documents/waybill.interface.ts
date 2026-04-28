import { IElectronicVoucher, IRecipient } from '../electronic-voucher.interface';

export interface IWaybillItem {
  code?: string;
  description: string;
  quantity: number;
}

export interface IWaybill extends IElectronicVoucher {
  recipient: IRecipient;
  startDate: string;
  endDate: string;
  originAddress: string;
  destinationAddress: string;
  carrierName: string;
  carrierId: string;
  items: IWaybillItem[];
}
