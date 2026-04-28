import { VoucherType, IInvoice, ICreditNote, IWithholding } from '@sri/core';
import { buildCreditNoteXml } from './builders/credit-note.builder';
import { buildInvoiceXml } from './builders/invoice.builder';
import { buildWithholdingXml } from './builders/withholding.builder';

export { buildCreditNoteXml } from './builders/credit-note.builder';
export { buildInvoiceXml } from './builders/invoice.builder';
export { buildWithholdingXml } from './builders/withholding.builder';
export { buildAccessKey, calculateVerifierDigit } from './utils/access-key.generator';
export { validateXmlStructure } from './validators/xsd.validator';

export function buildXml(data: IInvoice | ICreditNote | IWithholding): string {
  switch (data.voucherType) {
    case VoucherType.CREDIT_NOTE:
      return buildCreditNoteXml(data as ICreditNote);
    case VoucherType.WITHHOLDING:
      return buildWithholdingXml(data as IWithholding);
    default:
      return buildInvoiceXml(data as IInvoice);
  }
}
