"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadP12 = loadP12;
const node_forge_1 = __importDefault(require("node-forge"));
function loadP12(buffer, password) {
    const binary = buffer.toString('binary');
    const asn1 = node_forge_1.default.asn1.fromDer(binary);
    const p12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(asn1, password);
    const keyBags = p12.getBags({ bagType: node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    if (!keyBag || !keyBag.key) {
        throw new Error('Private key not found in certificate');
    }
    const certBags = p12.getBags({ bagType: node_forge_1.default.pki.oids.certBag });
    const certBag = certBags[node_forge_1.default.pki.oids.certBag]?.[0];
    if (!certBag || !certBag.cert) {
        throw new Error('Certificate not found in certificate');
    }
    return {
        privateKeyPem: node_forge_1.default.pki.privateKeyToPem(keyBag.key),
        certificatePem: node_forge_1.default.pki.certificateToPem(certBag.cert),
    };
}
