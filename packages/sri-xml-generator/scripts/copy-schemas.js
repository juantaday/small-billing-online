const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src/schemas');
const distDir = path.resolve(__dirname, '../dist/schemas');

if (!fs.existsSync(srcDir)) {
  console.error('Schemas source directory not found:', srcDir);
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });
const files = fs.readdirSync(srcDir).filter((file) => file.endsWith('.xsd'));

files.forEach((file) => {
  const from = path.join(srcDir, file);
  const to = path.join(distDir, file);
  fs.copyFileSync(from, to);
});

console.log(`Copied ${files.length} XSD file(s) to dist/schemas.`);
