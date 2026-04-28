import fs from 'fs';
import path from 'path';
import libxmljs from 'libxmljs2';

export interface XsdValidationResult {
  valid: boolean;
  errors: string[];
}

function resolveSchemaPath(xml: string): string {
  const rootMatch = xml.match(/<([A-Za-z0-9:_-]+)[\s>]/);
  const root = rootMatch?.[1]?.replace(/^.*:/, '') || '';

  const schemaMap: Record<string, string> = {
    factura: 'factura_v1.1.0.xsd',
    comprobanteRetencion: 'comprobanteRetencion_v1.0.0.xsd',
    notaCredito: 'notaCredito_v1.1.0.xsd',
  };

  const schemaFile = schemaMap[root];
  if (!schemaFile) {
    throw new Error(`Schema not found for root element: ${root}`);
  }

  const distPath = path.resolve(__dirname, '../schemas', schemaFile);
  const srcPath = path.resolve(__dirname, '../../src/schemas', schemaFile);
  return fs.existsSync(distPath) ? distPath : srcPath;
}

export async function validateXmlStructure(xml: string): Promise<{ valid: boolean; errors: string[] }> {
  const schemaPath = resolveSchemaPath(xml);
  const schemasDir = path.dirname(schemaPath);
  const originalCwd = process.cwd();

  try {
    // libxmljs2 resuelve imports XSD relativos al cwd — lo cambiamos temporalmente
    process.chdir(schemasDir);

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const xmlDoc = libxmljs.parseXml(xml);
    const xsdDoc = libxmljs.parseXml(schemaContent);
    const valid = xmlDoc.validate(xsdDoc);
    const errors = xmlDoc.validationErrors.map((e) => e.message.trim());

    return { valid, errors };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'XSD validation error'],
    };
  } finally {
    // Restaurar el directorio original siempre, incluso si hay error
    process.chdir(originalCwd);
  }
}