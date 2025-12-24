import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  console.log('🌱 Seeding database...');

  // 1. Customer Categories
  console.log('Creating customer categories...');
  const categories = await Promise.all([
    prisma.customerCategory.upsert({
      where: { name: 'Usuario Final' },
      update: {},
      create: {
        name: 'Usuario Final',
        discountPercentage: 0,
        pointsMultiplier: 1,
        ticketThreshold: 10, // 1 ticket por cada $10
        color: '#6B7280',
        active: true,
      },
    }),
    prisma.customerCategory.upsert({
      where: { name: 'Cliente VIP' },
      update: {},
      create: {
        name: 'Cliente VIP',
        discountPercentage: 10,
        pointsMultiplier: 2,
        ticketThreshold: 5, // 1 ticket por cada $5
        color: '#F59E0B',
        active: true,
      },
    }),
    prisma.customerCategory.upsert({
      where: { name: 'Empresas' },
      update: {},
      create: {
        name: 'Empresas',
        discountPercentage: 15,
        pointsMultiplier: 1.5,
        ticketThreshold: 3, // 1 ticket por cada $3
        color: '#3B82F6',
        active: true,
      },
    }),
    prisma.customerCategory.upsert({
      where: { name: 'Reventa/Distribuidor' },
      update: {},
      create: {
        name: 'Reventa/Distribuidor',
        discountPercentage: 20,
        pointsMultiplier: 1.2,
        ticketThreshold: 2, // 1 ticket por cada $2
        color: '#8B5CF6',
        active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} customer categories`);

  // 2. Product Categories
  console.log('Creating product categories...');
  const productCategories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Hamburguesas' },
      update: {},
      create: {
        name: 'Hamburguesas',
        icon: '🍔',
        color: '#EF4444',
        displayOrder: 1,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Pollo Frito' },
      update: {},
      create: {
        name: 'Pollo Frito',
        icon: '🍗',
        color: '#F59E0B',
        displayOrder: 2,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Acompañamientos' },
      update: {},
      create: {
        name: 'Acompañamientos',
        icon: '🍟',
        color: '#FBBF24',
        displayOrder: 3,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Bebidas' },
      update: {},
      create: {
        name: 'Bebidas',
        icon: '🥤',
        color: '#3B82F6',
        displayOrder: 4,
        active: true,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Postres' },
      update: {},
      create: {
        name: 'Postres',
        icon: '🍰',
        color: '#EC4899',
        displayOrder: 5,
        active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${productCategories.length} product categories`);

  // 3. Products & Presentations
  console.log('Creating products...');

  // Hamburguesa Original
  const burger = await prisma.product.create({
    data: {
      name: 'Hamburguesa Original',
      slug: 'hamburguesa-original',
      shortDescription: 'Hamburguesa clásica con carne 100% de res',
      categoryId: productCategories[0].id,
      featured: true,
      active: true,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
            altText: 'Hamburguesa Original',
            isPrimary: true,
            displayOrder: 1,
          },
        ],
      },
      presentations: {
        create: [
          {
            name: 'Unidad',
            quantity: 1,
            barcode: '7891234567001',
            costPrice: 5.50,
            lastCostPrice: 5.40,
            averageCostPrice: 5.45,
            salePrice: 8.99,
            stock: 100,
            minStock: 20,
            maxStock: 200,
            active: true,
          },
          {
            name: 'x6 Unidades',
            quantity: 6,
            barcode: '7891234567002',
            costPrice: 30.00,
            lastCostPrice: 29.50,
            averageCostPrice: 29.75,
            salePrice: 48.00,
            stock: 20,
            minStock: 5,
            maxStock: 50,
            active: true,
          },
          {
            name: 'Docena',
            quantity: 12,
            barcode: '7891234567003',
            costPrice: 55.00,
            lastCostPrice: 54.00,
            averageCostPrice: 54.50,
            salePrice: 89.99,
            stock: 10,
            minStock: 2,
            maxStock: 30,
            active: true,
          },
        ],
      },
    },
  });

  // Pollo Crujiente
  const chicken = await prisma.product.create({
    data: {
      name: 'Pollo Crujiente',
      slug: 'pollo-crujiente',
      shortDescription: 'Deliciosas piezas de pollo frito crujiente',
      categoryId: productCategories[1].id,
      featured: true,
      active: true,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800',
            altText: 'Pollo Crujiente',
            isPrimary: true,
            displayOrder: 1,
          },
        ],
      },
      presentations: {
        create: [
          {
            name: '3 Piezas',
            quantity: 3,
            barcode: '7891234567011',
            costPrice: 7.00,
            salePrice: 12.99,
            stock: 50,
            minStock: 10,
            active: true,
          },
          {
            name: '6 Piezas',
            quantity: 6,
            barcode: '7891234567012',
            costPrice: 13.00,
            salePrice: 23.99,
            stock: 30,
            minStock: 5,
            active: true,
          },
          {
            name: 'Balde (12 piezas)',
            quantity: 12,
            barcode: '7891234567013',
            costPrice: 24.00,
            salePrice: 44.99,
            stock: 15,
            minStock: 3,
            active: true,
          },
        ],
      },
    },
  });

  // Papas Fritas
  const fries = await prisma.product.create({
    data: {
      name: 'Papas Fritas',
      slug: 'papas-fritas',
      shortDescription: 'Papas doradas y crujientes',
      categoryId: productCategories[2].id,
      active: true,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800',
            altText: 'Papas Fritas',
            isPrimary: true,
            displayOrder: 1,
          },
        ],
      },
      presentations: {
        create: [
          {
            name: 'Personal',
            quantity: 1,
            barcode: '7891234567021',
            costPrice: 1.50,
            salePrice: 2.99,
            stock: 200,
            minStock: 50,
            active: true,
          },
          {
            name: 'Mediana',
            quantity: 1,
            barcode: '7891234567022',
            costPrice: 2.00,
            salePrice: 3.99,
            stock: 150,
            minStock: 40,
            active: true,
          },
          {
            name: 'Grande',
            quantity: 1,
            barcode: '7891234567023',
            costPrice: 2.50,
            salePrice: 4.99,
            stock: 100,
            minStock: 30,
            active: true,
          },
        ],
      },
    },
  });

  console.log(`✅ Created 3 products with presentations`);

  // 4. Payment Methods
  console.log('Creating payment methods...');
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.upsert({
      where: { code: 'CASH' },
      update: {},
      create: {
        name: 'Efectivo',
        code: 'CASH',
        icon: '💵',
        requiresReference: false,
        allowsChange: true,
        active: true,
      },
    }),
    prisma.paymentMethod.upsert({
      where: { code: 'CARD' },
      update: {},
      create: {
        name: 'Tarjeta de Débito/Crédito',
        code: 'CARD',
        requiresReference: true,
        allowsChange: false,
        active: true,
      },
    }),
    prisma.paymentMethod.upsert({
      where: { code: 'PICHINCHA' },
      update: {},
      create: {
        name: 'Banco Pichincha',
        code: 'PICHINCHA',
        icon: '🏦',
        requiresReference: true,
        allowsChange: false,
        active: true,
      },
    }),
    prisma.paymentMethod.upsert({
      where: { code: 'TRANSFER' },
      update: {},
      create: {
        name: 'Transferencia Bancaria',
        code: 'TRANSFER',
        icon: '🔄',
        requiresReference: true,
        allowsChange: false,
        active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${paymentMethods.length} payment methods`);

}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
