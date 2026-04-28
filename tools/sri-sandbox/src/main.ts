import fs from 'fs';
import path from 'path';
import { signXml } from '@sri/signer';
import { validateXmlStructure } from '@sri/xml-generator';

interface Args {
  xmlPath: string;
  certPath?: string;
  certPassword?: string;
  outPath?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { xmlPath: '' };

  argv.forEach((value, index) => {
    switch (value) {
      case '--xml':
        args.xmlPath = argv[index + 1];
        break;
      case '--cert':
        args.certPath = argv[index + 1];
        break;
      case '--password':
        args.certPassword = argv[index + 1];
        break;
      case '--out':
        args.outPath = argv[index + 1];
        break;
      default:
        break;
    }
  });

  return args;
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.xmlPath) {
    throw new Error('Missing --xml path');
  }

  const xml = fs.readFileSync(args.xmlPath, 'utf8');
  const validation = await validateXmlStructure(xml);

  if (!validation.valid) {
    console.error('XSD validation failed:');
    validation.errors.forEach((error: string) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('XSD validation OK');

  if (!args.certPath || !args.certPassword) {
    console.log('No certificate provided, skipping signature');
    return;
  }

  // Firma XAdES-BES con certificado .p12 de pruebas.
  const certBuffer = fs.readFileSync(args.certPath);
  const signedXml = signXml(xml, certBuffer, args.certPassword);
  const outputPath = args.outPath
    ? args.outPath
    : path.resolve(process.cwd(), 'signed.xml');

  fs.writeFileSync(outputPath, signedXml, 'utf8');
  console.log(`Signed XML written to ${outputPath}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
