/**
 * Seed de Impuestos del SRI (Ecuador)
 * Datos oficiales del Servicio de Rentas Internas
 */

import { PrismaClient } from '@prisma/client';

export async function seedTaxes(prisma: PrismaClient) {
  console.log('🔢 Seeding taxes (SRI Ecuador)...');

  // 1. Crear tipos de impuestos principales
  const iva = await prisma.tax.upsert({
    where: { code: 2 },
    update: {},
    create: {
      code: 2,
      description: 'IVA - Impuesto al Valor Agregado',
      active: true,
    },
  });

  const ice = await prisma.tax.upsert({
    where: { code: 3 },
    update: {},
    create: {
      code: 3,
      description: 'ICE - Impuesto a los Consumos Especiales',
      active: true,
    },
  });

  const irbpnr = await prisma.tax.upsert({
    where: { code: 5 },
    update: {},
    create: {
      code: 5,
      description: 'IRBPNR - Impuesto Redimible Botellas Plásticas',
      active: true,
    },
  });

  console.log('✅ Tipos de impuestos creados');

  // 2. Crear valores de IVA
  const iva0 = await prisma.taxValue.upsert({
    where: { code: '0' },
    update: {},
    create: {
      code: '0',
      taxId: iva.id,
      percentage: 0,
      retentionPercentage: 0,
      taxType: 'V',
      description: 'IVA 0%',
      startDate: new Date('2000-01-01'),
      endDate: null,
      adminCode: 0,
      freePercentageMark: 'N',
      calculateWithQuantity: null,
      active: true,
    },
  });

  const iva15 = await prisma.taxValue.upsert({
    where: { code: '2' },
    update: {},
    create: {
      code: '2',
      taxId: iva.id,
      percentage: 15,
      retentionPercentage: 30,
      taxType: 'V',
      description: 'IVA 15%',
      startDate: new Date('2024-04-01'),
      endDate: null,
      adminCode: 2,
      freePercentageMark: 'N',
      calculateWithQuantity: null,
      active: true,
    },
  });

  const ivaNoObjeto = await prisma.taxValue.upsert({
    where: { code: '6' },
    update: {},
    create: {
      code: '6',
      taxId: iva.id,
      percentage: 0,
      retentionPercentage: 0,
      taxType: 'V',
      description: 'No objeto de IVA',
      startDate: new Date('2000-01-01'),
      endDate: null,
      adminCode: 6,
      freePercentageMark: 'N',
      calculateWithQuantity: null,
      active: true,
    },
  });

  const ivaExento = await prisma.taxValue.upsert({
    where: { code: '7' },
    update: {},
    create: {
      code: '7',
      taxId: iva.id,
      percentage: 0,
      retentionPercentage: 0,
      taxType: 'V',
      description: 'Exento de IVA',
      startDate: new Date('2000-01-01'),
      endDate: null,
      adminCode: 7,
      freePercentageMark: 'N',
      calculateWithQuantity: null,
      active: true,
    },
  });

  console.log('✅ Valores de IVA creados (0%, 15%, No Objeto, Exento)');

  // 3. Crear algunos valores comunes de ICE
  const ice10 = await prisma.taxValue.upsert({
    where: { code: '3072' },
    update: {},
    create: {
      code: '3072',
      taxId: ice.id,
      percentage: 10,
      retentionPercentage: 0,
      taxType: 'C',
      description: 'ICE 10%',
      startDate: new Date('2000-01-01'),
      endDate: null,
      adminCode: 3072,
      freePercentageMark: 'N',
      calculateWithQuantity: null,
      active: true,
    },
  });

  const ice75 = await prisma.taxValue.upsert({
    where: { code: '3073' },
    update: {},
    create: {
      code: '3073',
      taxId: ice.id,
      percentage: 75,
      retentionPercentage: 0,
      taxType: 'C',
      description: 'ICE 75% (Bebidas alcohólicas)',
      startDate: new Date('2000-01-01'),
      endDate: null,
      adminCode: 3073,
      freePercentageMark: 'N',
      calculateWithQuantity: null,
      active: true,
    },
  });

  console.log('✅ Valores de ICE creados (10%, 75%)');

  // 4. Crear valor de IRBPNR
  const irbpnr002 = await prisma.taxValue.upsert({
    where: { code: '5001' },
    update: {},
    create: {
      code: '5001',
      taxId: irbpnr.id,
      percentage: 0.02,
      retentionPercentage: 0,
      taxType: 'R',
      description: 'IRBPNR $0.02 por botella',
      startDate: new Date('2000-01-01'),
      endDate: null,
      adminCode: 5001,
      freePercentageMark: 'N',
      calculateWithQuantity: 'S',
      active: true,
    },
  });

  console.log('✅ Valores de IRBPNR creados');

  console.log('✨ Tax seed completed successfully!');
}

// Ejecutar si se corre directamente
if (require.main === module) {
  const prisma = new PrismaClient();
  seedTaxes(prisma)
    .catch((e) => {
      console.error('❌ Error seeding taxes:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
