import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TAX_VALUE_CODE = '4';

async function main() {
  console.log(`Starting backfill for product_taxes with tax_value_code=${TAX_VALUE_CODE}...`);

  const taxValue = await prisma.taxValue.findUnique({
    where: { code: TAX_VALUE_CODE },
    select: { code: true, description: true, active: true, percentage: true },
  });

  if (!taxValue) {
    throw new Error(`TaxValue with code ${TAX_VALUE_CODE} does not exist.`);
  }

  const products = await prisma.product.findMany({
    select: { id: true },
  });

  if (products.length === 0) {
    console.log('No products found. Nothing to backfill.');
    return;
  }

  const percentNumber = Number(taxValue.percentage.toString());
  const appliedRate = percentNumber > 1 ? percentNumber / 100 : percentNumber;

  const result = await prisma.productTax.createMany({
    data: products.map((product) => ({
      productId: product.id,
      taxValueCode: TAX_VALUE_CODE,
      appliedRate,
      isDefaultVat: true,
      active: true,
    })),
    skipDuplicates: true,
  });

  console.log(`Backfill completed. Inserted ${result.count} product_taxes rows.`);
  console.log(`Total products scanned: ${products.length}.`);
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
