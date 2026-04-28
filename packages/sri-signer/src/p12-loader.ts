import forge from 'node-forge';

export interface P12Material {
  privateKeyPem: string;
  certificatePem: string;
}

export function loadP12(buffer: Buffer, password: string): P12Material {
  const binary = buffer.toString('binary');
  const asn1 = forge.asn1.fromDer(binary);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  if (!keyBag || !keyBag.key) {
    throw new Error('Private key not found in certificate');
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag || !certBag.cert) {
    throw new Error('Certificate not found in certificate');
  }

  return {
    privateKeyPem: forge.pki.privateKeyToPem(keyBag.key),
    certificatePem: forge.pki.certificateToPem(certBag.cert),
  };
}
