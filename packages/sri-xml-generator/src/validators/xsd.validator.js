"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateXmlStructure = validateXmlStructure;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const libxmljs2_1 = __importDefault(require("libxmljs2"));
function resolveSchemaPath(xml) {
    const rootMatch = xml.match(/<([A-Za-z0-9:_-]+)[\s>]/);
    const root = rootMatch?.[1]?.replace(/^.*:/, '') || '';
    const schemaMap = {
        factura: 'factura_v1.1.0.xsd',
        comprobanteRetencion: 'comprobanteRetencion_v1.0.0.xsd',
        notaCredito: 'notaCredito_v1.1.0.xsd',
    };
    const schemaFile = schemaMap[root];
    if (!schemaFile) {
        throw new Error(`Schema not found for root element: ${root}`);
    }
    return path_1.default.resolve(__dirname, '../schemas', schemaFile);
}
async function validateXmlStructure(xml) {
    const schemaPath = resolveSchemaPath(xml);
    try {
        const schemaContent = fs_1.default.readFileSync(schemaPath, 'utf8');
        const xmlDoc = libxmljs2_1.default.parseXml(xml);
        const xsdDoc = libxmljs2_1.default.parseXml(schemaContent);
        const valid = xmlDoc.validate(xsdDoc);
        const errors = xmlDoc.validationErrors.map((error) => error.message.trim());
        return {
            valid,
            errors,
        };
    }
    catch (error) {
        return {
            valid: false,
            errors: [error instanceof Error ? error.message : 'XSD validation error'],
        };
    }
}
