"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateXmlStructure = exports.calculateVerifierDigit = exports.buildAccessKey = exports.buildWithholdingXml = exports.buildInvoiceXml = exports.buildCreditNoteXml = void 0;
exports.buildXml = buildXml;
const core_1 = require("@sri/core");
const credit_note_builder_1 = require("./builders/credit-note.builder");
const invoice_builder_1 = require("./builders/invoice.builder");
const withholding_builder_1 = require("./builders/withholding.builder");
var credit_note_builder_2 = require("./builders/credit-note.builder");
Object.defineProperty(exports, "buildCreditNoteXml", { enumerable: true, get: function () { return credit_note_builder_2.buildCreditNoteXml; } });
var invoice_builder_2 = require("./builders/invoice.builder");
Object.defineProperty(exports, "buildInvoiceXml", { enumerable: true, get: function () { return invoice_builder_2.buildInvoiceXml; } });
var withholding_builder_2 = require("./builders/withholding.builder");
Object.defineProperty(exports, "buildWithholdingXml", { enumerable: true, get: function () { return withholding_builder_2.buildWithholdingXml; } });
var access_key_generator_1 = require("./utils/access-key.generator");
Object.defineProperty(exports, "buildAccessKey", { enumerable: true, get: function () { return access_key_generator_1.buildAccessKey; } });
Object.defineProperty(exports, "calculateVerifierDigit", { enumerable: true, get: function () { return access_key_generator_1.calculateVerifierDigit; } });
var xsd_validator_1 = require("./validators/xsd.validator");
Object.defineProperty(exports, "validateXmlStructure", { enumerable: true, get: function () { return xsd_validator_1.validateXmlStructure; } });
function buildXml(data) {
    switch (data.voucherType) {
        case core_1.VoucherType.CREDIT_NOTE:
            return (0, credit_note_builder_1.buildCreditNoteXml)(data);
        case core_1.VoucherType.WITHHOLDING:
            return (0, withholding_builder_1.buildWithholdingXml)(data);
        default:
            return (0, invoice_builder_1.buildInvoiceXml)(data);
    }
}
