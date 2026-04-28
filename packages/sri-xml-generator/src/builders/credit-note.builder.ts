import { create } from 'xmlbuilder2';
import { ICreditNote, ICreditNoteItem, ITaxTotal } from '@sri/core';

export function buildCreditNoteXml(data: ICreditNote): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('notaCredito', { id: 'comprobante', version: '1.1.0' });

  const infoTributaria = doc.ele('infoTributaria');
  infoTributaria.ele('ambiente').txt(data.environment);
  infoTributaria.ele('tipoEmision').txt(data.emissionType);
  infoTributaria.ele('razonSocial').txt(data.issuer.businessName);
  infoTributaria.ele('nombreComercial').txt(data.issuer.tradeName || data.issuer.businessName);
  infoTributaria.ele('ruc').txt(data.issuer.ruc);
  if (data.accessKey) {
    infoTributaria.ele('claveAcceso').txt(data.accessKey);
  }
  infoTributaria.ele('codDoc').txt(data.voucherType);
  infoTributaria.ele('estab').txt(data.issuer.establishmentCode);
  infoTributaria.ele('ptoEmi').txt(data.issuer.emissionPoint);
  infoTributaria.ele('secuencial').txt(data.sequential);
  infoTributaria.ele('dirMatriz').txt(data.issuer.address);

  const infoNotaCredito = doc.ele('infoNotaCredito');
  infoNotaCredito.ele('fechaEmision').txt(data.issueDate);
  infoNotaCredito.ele('dirEstablecimiento').txt(data.issuer.address);
  infoNotaCredito.ele('tipoIdentificacionComprador').txt(data.recipient.identificationType);
  infoNotaCredito.ele('razonSocialComprador').txt(data.recipient.name);
  infoNotaCredito.ele('identificacionComprador').txt(data.recipient.identificationNumber);
  infoNotaCredito.ele('codDocModificado').txt('01');
  infoNotaCredito.ele('numDocModificado').txt(data.modifiedDocumentNumber);
  infoNotaCredito.ele('fechaEmisionDocSustento').txt(data.modifiedDocumentDate);
  infoNotaCredito.ele('totalSinImpuestos').txt(data.totalWithoutTaxes.toFixed(2));
  infoNotaCredito.ele('valorModificacion').txt(data.valueToModify.toFixed(2));
  infoNotaCredito.ele('moneda').txt(data.currency || 'DOLAR');

  const totalWithTaxes = infoNotaCredito.ele('totalConImpuestos');
  data.totalTaxes.forEach((tax: ITaxTotal) => {
    const total = totalWithTaxes.ele('totalImpuesto');
    total.ele('codigo').txt(tax.code);
    total.ele('codigoPorcentaje').txt(tax.percentageCode);
    total.ele('baseImponible').txt(tax.taxableBase.toFixed(2));
    total.ele('valor').txt(tax.value.toFixed(2));
  });

  const details = doc.ele('detalles');
  data.items.forEach((item: ICreditNoteItem) => {
    const detail = details.ele('detalle');
    detail.ele('descripcion').txt(item.description);
    detail.ele('cantidad').txt(item.quantity.toFixed(2));
    detail.ele('precioUnitario').txt(item.unitPrice.toFixed(2));
    detail.ele('descuento').txt((item.discount ?? 0).toFixed(2));
    detail.ele('precioTotalSinImpuesto').txt(item.totalWithoutTaxes.toFixed(2));
  });

  const reason = doc.ele('infoAdicional').ele('campoAdicional', { nombre: 'Motivo' });
  reason.txt(data.reason);

  return doc.end({ prettyPrint: true });
}
