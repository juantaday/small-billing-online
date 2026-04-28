"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWithholdingXml = buildWithholdingXml;
const xmlbuilder2_1 = require("xmlbuilder2");
function buildWithholdingXml(data) {
    const doc = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
        .ele('comprobanteRetencion', { id: 'comprobante', version: '2.0.0' });
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
    const infoCompRetencion = doc.ele('infoCompRetencion');
    infoCompRetencion.ele('fechaEmision').txt(data.issueDate);
    infoCompRetencion.ele('dirEstablecimiento').txt(data.issuer.address);
    infoCompRetencion.ele('tipoIdentificacionSujetoRetenido').txt(data.recipient.identificationType);
    infoCompRetencion.ele('razonSocialSujetoRetenido').txt(data.recipient.name);
    infoCompRetencion.ele('identificacionSujetoRetenido').txt(data.recipient.identificationNumber);
    infoCompRetencion.ele('periodoFiscal').txt(new Date(data.issueDate).getFullYear().toString());
    const impuestos = doc.ele('impuestos');
    data.items.forEach((item) => {
        const impuesto = impuestos.ele('impuesto');
        impuesto.ele('codigo').txt(item.taxCode);
        impuesto.ele('codigoRetencion').txt(item.percentageCode);
        impuesto.ele('baseImponible').txt(item.taxableBase.toFixed(2));
        impuesto.ele('porcentajeRetener').txt(item.rate.toFixed(2));
        impuesto.ele('valorRetenido').txt(item.value.toFixed(2));
        impuesto.ele('codDocSustento').txt(item.supportingDocumentType);
        impuesto.ele('numDocSustento').txt(item.supportingDocumentNumber);
        impuesto.ele('fechaEmisionDocSustento').txt(item.supportingDocumentDate);
    });
    return doc.end({ prettyPrint: true });
}
