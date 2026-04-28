import forge from 'node-forge';
import { loadP12 } from './p12-loader';

const CANONICALIZATION_ALGORITHM = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
const SIGNATURE_ALGORITHM = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
const DIGEST_ALGORITHM = 'http://www.w3.org/2001/04/xmlenc#sha256';
const XADES_NS = 'http://uri.etsi.org/01903/v1.3.2#';

function toBase64(data: string): string {
  return Buffer.from(data, 'binary').toString('base64');
}

function normalizePem(pem: string): string {
  return pem.replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '');
}

function compactXml(xml: string): string {
  return xml.replace(/>\s+</g, '><').trim();
}

function digestBase64(content: string): string {
  const digest = forge.md.sha256.create();
  digest.update(content, 'utf8');
  return toBase64(digest.digest().getBytes());
}

function getCertificateDigestBase64(certificatePem: string): string {
  const cert = forge.pki.certificateFromPem(certificatePem);
  const asn1 = forge.pki.certificateToAsn1(cert);
  const der = forge.asn1.toDer(asn1).getBytes();
  const digest = forge.md.sha256.create();
  digest.update(der);
  return toBase64(digest.digest().getBytes());
}

function formatIssuerName(certificatePem: string): string {
  const cert = forge.pki.certificateFromPem(certificatePem);
  return cert.issuer.attributes
    .map((attr) => `${attr.shortName || attr.name}=${attr.value}`)
    .join(',');
}

function buildSignedProperties(
  signatureId: string,
  signedPropertiesId: string,
  certificatePem: string,
): string {
  const signingTime = new Date().toISOString();
  const certDigest = getCertificateDigestBase64(certificatePem);
  const issuerName = formatIssuerName(certificatePem);
  const serialNumber = forge.pki.certificateFromPem(certificatePem).serialNumber;

  return compactXml([
    `<xades:SignedProperties Id="${signedPropertiesId}" xmlns:xades="${XADES_NS}">`,
    '<xades:SignedSignatureProperties>',
    `<xades:SigningTime>${signingTime}</xades:SigningTime>`,
    '<xades:SigningCertificate>',
    '<xades:Cert>',
    '<xades:CertDigest>',
    `<ds:DigestMethod Algorithm="${DIGEST_ALGORITHM}" xmlns:ds="http://www.w3.org/2000/09/xmldsig#"/>`,
    `<ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certDigest}</ds:DigestValue>`,
    '</xades:CertDigest>',
    '<xades:IssuerSerial>',
    `<ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${issuerName}</ds:X509IssuerName>`,
    `<ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${serialNumber}</ds:X509SerialNumber>`,
    '</xades:IssuerSerial>',
    '</xades:Cert>',
    '</xades:SigningCertificate>',
    '</xades:SignedSignatureProperties>',
    '<xades:SignedDataObjectProperties>',
    `<xades:DataObjectFormat ObjectReference="#${signatureId}-Reference">`,
    '<xades:Description>Comprobante electronico SRI</xades:Description>',
    '<xades:MimeType>text/xml</xades:MimeType>',
    '</xades:DataObjectFormat>',
    '</xades:SignedDataObjectProperties>',
    '</xades:SignedProperties>',
  ].join(''));
}

function buildSignedInfo(
  documentDigest: string,
  signedPropertiesDigest: string,
  signatureId: string,
  signedPropertiesId: string,
): string {
  return compactXml([
    '<ds:SignedInfo>',
    `<ds:CanonicalizationMethod Algorithm="${CANONICALIZATION_ALGORITHM}"/>`,
    `<ds:SignatureMethod Algorithm="${SIGNATURE_ALGORITHM}"/>`,
    `<ds:Reference Id="${signatureId}-Reference" URI="">`,
    '<ds:Transforms>',
    '<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>',
    `<ds:Transform Algorithm="${CANONICALIZATION_ALGORITHM}"/>`,
    '</ds:Transforms>',
    `<ds:DigestMethod Algorithm="${DIGEST_ALGORITHM}"/>`,
    `<ds:DigestValue>${documentDigest}</ds:DigestValue>`,
    '</ds:Reference>',
    `<ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropertiesId}">`,
    `<ds:DigestMethod Algorithm="${DIGEST_ALGORITHM}"/>`,
    `<ds:DigestValue>${signedPropertiesDigest}</ds:DigestValue>`,
    '</ds:Reference>',
    '</ds:SignedInfo>',
  ].join(''));
}

export function signXml(xml: string, certificate: Buffer, password: string): string {
  const { privateKeyPem, certificatePem } = loadP12(certificate, password);
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const certificateBase64 = normalizePem(certificatePem);

  const signatureId = `Signature-${Date.now()}`;
  const signedPropertiesId = `${signatureId}-SignedProperties`;

  // Se genera XAdES-BES con SignedProperties y QualifyingProperties segun SRI.
  const signedPropertiesXml = buildSignedProperties(signatureId, signedPropertiesId, certificatePem);
  const signedPropertiesDigest = digestBase64(signedPropertiesXml);

  const documentDigest = digestBase64(compactXml(xml));
  const signedInfo = buildSignedInfo(
    documentDigest,
    signedPropertiesDigest,
    signatureId,
    signedPropertiesId,
  );

  const signatureHash = forge.md.sha256.create();
  signatureHash.update(signedInfo, 'utf8');
  const signatureValue = toBase64(privateKey.sign(signatureHash));

  const signatureXml = compactXml([
    `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${signatureId}">`,
    signedInfo,
    `<ds:SignatureValue>${signatureValue}</ds:SignatureValue>`,
    '<ds:KeyInfo>',
    '<ds:X509Data>',
    `<ds:X509Certificate>${certificateBase64}</ds:X509Certificate>`,
    '</ds:X509Data>',
    '</ds:KeyInfo>',
    '<ds:Object>',
    `<xades:QualifyingProperties xmlns:xades="${XADES_NS}" Target="#${signatureId}">`,
    signedPropertiesXml,
    '</xades:QualifyingProperties>',
    '</ds:Object>',
    '</ds:Signature>',
  ].join(''));

  if (xml.includes('</factura>')) {
    return xml.replace('</factura>', `${signatureXml}</factura>`);
  }

  if (xml.includes('</notaCredito>')) {
    return xml.replace('</notaCredito>', `${signatureXml}</notaCredito>`);
  }

  if (xml.includes('</comprobanteRetencion>')) {
    return xml.replace('</comprobanteRetencion>', `${signatureXml}</comprobanteRetencion>`);
  }

  return xml + signatureXml;
}
