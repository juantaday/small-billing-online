"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInvoiceXml = buildInvoiceXml;
const xmlbuilder2_1 = require("xmlbuilder2");
function addTaxTotals(parent, taxes) {
    const totalWithTaxes = parent.ele('totalConImpuestos');
    taxes.forEach((tax) => {
        const total = totalWithTaxes.ele('totalImpuesto');
        total.ele('codigo').txt(tax.code);
        total.ele('codigoPorcentaje').txt(tax.percentageCode);
        total.ele('baseImponible').txt(tax.taxableBase.toFixed(2));
        total.ele('valor').txt(tax.value.toFixed(2));
    });
}
function buildInvoiceXml(data) {
    const doc = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
        .ele('factura', { id: 'comprobante', version: '2.1.0' });
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
    const infoFactura = doc.ele('infoFactura');
    infoFactura.ele('fechaEmision').txt(data.issueDate);
    infoFactura.ele('dirEstablecimiento').txt(data.issuer.address);
    if (data.issuer.specialContributor) {
        infoFactura.ele('contribuyenteEspecial').txt(data.issuer.specialContributor);
    }
    infoFactura
        .ele('obligadoContabilidad')
        .txt(data.issuer.accountingRequired ? 'SI' : 'NO');
    infoFactura.ele('tipoIdentificacionComprador').txt(data.recipient.identificationType);
    infoFactura.ele('razonSocialComprador').txt(data.recipient.name);
    infoFactura.ele('identificacionComprador').txt(data.recipient.identificationNumber);
    infoFactura.ele('totalSinImpuestos').txt(data.totals.totalWithoutTaxes.toFixed(2));
    infoFactura.ele('totalDescuento').txt(data.totals.totalDiscount.toFixed(2));
    addTaxTotals(infoFactura, data.totals.totalTaxes);
    infoFactura.ele('propina').txt((data.totals.tip ?? 0).toFixed(2));
    infoFactura.ele('importeTotal').txt(data.totals.total.toFixed(2));
    infoFactura.ele('moneda').txt(data.currency || 'DOLAR');
    const details = doc.ele('detalles');
    data.items.forEach((item) => {
        const detail = details.ele('detalle');
        detail.ele('codigoPrincipal').txt(item.code);
        detail.ele('descripcion').txt(item.description);
        detail.ele('cantidad').txt(item.quantity.toFixed(2));
        detail.ele('precioUnitario').txt(item.unitPrice.toFixed(2));
        detail.ele('descuento').txt((item.discount ?? 0).toFixed(2));
        detail.ele('precioTotalSinImpuesto').txt(item.totalWithoutTaxes.toFixed(2));
        if (item.taxes && item.taxes.length > 0) {
            const taxes = detail.ele('impuestos');
            item.taxes.forEach((tax) => {
                const taxNode = taxes.ele('impuesto');
                taxNode.ele('codigo').txt(tax.code);
                taxNode.ele('codigoPorcentaje').txt(tax.percentageCode);
                taxNode.ele('tarifa').txt(tax.rate.toFixed(2));
                taxNode.ele('baseImponible').txt(tax.taxableBase.toFixed(2));
                taxNode.ele('valor').txt(tax.value.toFixed(2));
            });
        }
    });
    if (data.payments && data.payments.length > 0) {
        const payments = doc.ele('pagos');
        data.payments.forEach((payment) => {
            const paymentNode = payments.ele('pago');
            paymentNode.ele('formaPago').txt(payment.method);
            paymentNode.ele('total').txt(payment.total.toFixed(2));
            if (payment.term !== undefined) {
                paymentNode.ele('plazo').txt(String(payment.term));
            }
            if (payment.timeUnit) {
                paymentNode.ele('unidadTiempo').txt(payment.timeUnit);
            }
        });
    }
    if (data.additionalInfo && Object.keys(data.additionalInfo).length > 0) {
        const additional = doc.ele('infoAdicional');
        Object.entries(data.additionalInfo).forEach(([key, value]) => {
            additional.ele('campoAdicional', { nombre: key }).txt(value);
        });
    }
    return doc.end({ prettyPrint: true });
}
