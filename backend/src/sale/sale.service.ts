import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethodType,
  Prisma,
  PrismaClient,
  SaleStatus,
} from '@prisma/client';
import {
  CreateSaleDto,
  SaleDto,
  SaleWithRelationsDto,
  UpdateSaleDto,
} from '@small-billing/shared';

const prisma = new PrismaClient();

const DEFAULT_ESTABLISHMENT = '001';
const DEFAULT_POINT_OF_SALE = '001';

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

function resolveFactorToBase(
  presentationId: string,
  map: Map<string, { id: string; quantity: number; presentationInferenceId: string | null }>,
  cache: Map<string, number>,
  visited: Set<string> = new Set(),
): number {
  const cached = cache.get(presentationId);
  if (cached !== undefined) return cached;

  const node = map.get(presentationId);
  if (!node) return 1;

  if (visited.has(presentationId)) {
    throw new BadRequestException('Existe una referencia circular en presentaciones');
  }

  visited.add(presentationId);

  const isBase = !node.presentationInferenceId || node.presentationInferenceId === node.id;
  const factor = isBase
    ? node.quantity
    : node.quantity * resolveFactorToBase(node.presentationInferenceId, map, cache, visited);

  visited.delete(presentationId);
  cache.set(presentationId, factor);
  return factor;
}

@Injectable()
export class SaleService {
  async findAll(): Promise<SaleWithRelationsDto[]> {
    const sales = await prisma.sale.findMany({
      orderBy: { saleDate: 'desc' },
      include: {
        details: true,
        payments: true,
        productTaxes: true,
      },
    });

    return sales.map((sale) => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerId: sale.customerId,
      userId: sale.userId,
      subtotal: toNumber(sale.subtotal),
      taxAmount: toNumber(sale.taxAmount),
      total: toNumber(sale.total),
      discount: toNumber(sale.discount),
      status: sale.status as any,
      saleDate: sale.saleDate,
      notes: sale.notes || undefined,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      details: sale.details.map((detail) => ({
        id: detail.id,
        saleId: detail.saleId,
        presentationId: detail.presentationId,
        productName: detail.productName,
        presentationName: detail.presentationName,
        quantity: detail.quantity,
        unitPrice: toNumber(detail.unitPrice),
        subtotal: toNumber(detail.subtotal),
        createdAt: detail.createdAt,
      })),
      payments: sale.payments.map((payment) => ({
        id: payment.id,
        saleId: payment.saleId,
        paymentType: payment.paymentType as any,
        amount: toNumber(payment.amount),
        cashReceived: payment.cashReceived ? toNumber(payment.cashReceived) : undefined,
        change: payment.change ? toNumber(payment.change) : undefined,
        bankId: payment.bankId || undefined,
        bankAccount: payment.bankAccount || undefined,
        transferReference: payment.transferReference || undefined,
        cardType: payment.cardType as any,
        voucherNumber: payment.voucherNumber || undefined,
        notes: payment.notes || undefined,
        createdAt: payment.createdAt,
      })),
      productTaxes: sale.productTaxes.map((tax) => ({
        id: tax.id,
        saleId: tax.saleId,
        presentationId: tax.presentationId,
        taxCode: tax.taxCode,
        taxDescription: tax.taxDescription,
        taxPercentage: toNumber(tax.taxPercentage),
        taxableAmount: toNumber(tax.taxableAmount),
        taxAmount: toNumber(tax.taxAmount),
        createdAt: tax.createdAt,
      })),
    }));
  }

  async findOne(id: string): Promise<SaleWithRelationsDto> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        details: true,
        payments: true,
        productTaxes: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerId: sale.customerId,
      userId: sale.userId,
      subtotal: toNumber(sale.subtotal),
      taxAmount: toNumber(sale.taxAmount),
      total: toNumber(sale.total),
      discount: toNumber(sale.discount),
      status: sale.status as any,
      saleDate: sale.saleDate,
      notes: sale.notes || undefined,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      details: sale.details.map((detail) => ({
        id: detail.id,
        saleId: detail.saleId,
        presentationId: detail.presentationId,
        productName: detail.productName,
        presentationName: detail.presentationName,
        quantity: detail.quantity,
        unitPrice: toNumber(detail.unitPrice),
        subtotal: toNumber(detail.subtotal),
        createdAt: detail.createdAt,
      })),
      payments: sale.payments.map((payment) => ({
        id: payment.id,
        saleId: payment.saleId,
        paymentType: payment.paymentType as any,
        amount: toNumber(payment.amount),
        cashReceived: payment.cashReceived ? toNumber(payment.cashReceived) : undefined,
        change: payment.change ? toNumber(payment.change) : undefined,
        bankId: payment.bankId || undefined,
        bankAccount: payment.bankAccount || undefined,
        transferReference: payment.transferReference || undefined,
        cardType: payment.cardType as any,
        voucherNumber: payment.voucherNumber || undefined,
        notes: payment.notes || undefined,
        createdAt: payment.createdAt,
      })),
      productTaxes: sale.productTaxes.map((tax) => ({
        id: tax.id,
        saleId: tax.saleId,
        presentationId: tax.presentationId,
        taxCode: tax.taxCode,
        taxDescription: tax.taxDescription,
        taxPercentage: toNumber(tax.taxPercentage),
        taxableAmount: toNumber(tax.taxableAmount),
        taxAmount: toNumber(tax.taxAmount),
        createdAt: tax.createdAt,
      })),
    };
  }

  async create(data: CreateSaleDto): Promise<SaleWithRelationsDto> {
    if (!data.details?.length) {
      throw new BadRequestException('La venta debe contener al menos un producto');
    }

    if (!data.payments?.length) {
      throw new BadRequestException('La venta debe contener al menos un método de pago');
    }

    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer || !customer.active) {
      throw new NotFoundException('Cliente no encontrado o inactivo');
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user || !user.active) {
      throw new NotFoundException('Usuario no encontrado o inactivo');
    }

    const presentationIds = [...new Set(data.details.map((item) => item.presentationId))];

    const presentations = await prisma.presentation.findMany({
      where: {
        id: { in: presentationIds },
        active: true,
      },
      include: {
        presentationType: true,
        product: {
          include: {
            productStock: true,
            productTaxes: {
              where: { active: true },
              include: {
                taxValue: {
                  include: { tax: true },
                },
              },
            },
          },
        },
      },
    });

    if (presentations.length !== presentationIds.length) {
      throw new BadRequestException('Uno o más productos/presentaciones no existen o están inactivos');
    }

    const presentationMap = new Map(presentations.map((presentation) => [presentation.id, presentation]));
    const baseFactorMap = new Map(
      presentations.map((presentation) => [
        presentation.id,
        {
          id: presentation.id,
          quantity: presentation.quantity,
          presentationInferenceId: presentation.presentationInferenceId,
        },
      ]),
    );
    const baseFactorCache = new Map<string, number>();

    let subtotal = 0;
    let taxAmount = 0;
    const detailsToCreate: Array<any> = [];
    const taxesToCreate: Array<any> = [];
    const baseDiscountByProduct = new Map<string, number>();

    for (const detail of data.details) {
      const presentation = presentationMap.get(detail.presentationId);
      if (!presentation) {
        throw new BadRequestException('Presentación no encontrada en la venta');
      }

      if (detail.quantity <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a cero');
      }

      const factorToBase = resolveFactorToBase(presentation.id, baseFactorMap, baseFactorCache);
      const requestedBaseUnits = detail.quantity * factorToBase;
      const availableBaseUnits = presentation.product.productStock?.stock ?? 0;

      if (requestedBaseUnits > availableBaseUnits) {
        throw new BadRequestException(`Stock insuficiente para ${presentation.product.name}`);
      }

      baseDiscountByProduct.set(
        presentation.productId,
        (baseDiscountByProduct.get(presentation.productId) || 0) + requestedBaseUnits,
      );

      const unitPrice = Number(detail.unitPrice ?? presentation.salePrice.toNumber());
      const lineSubtotal = Number((unitPrice * detail.quantity).toFixed(2));
      subtotal += lineSubtotal;

      detailsToCreate.push({
        presentationId: presentation.id,
        productName: presentation.product.name,
        presentationName: presentation.presentationType.name,
        quantity: detail.quantity,
        unitPrice,
        subtotal: lineSubtotal,
      });

      for (const productTax of presentation.product.productTaxes) {
        const configuredPercent = Number(productTax.appliedRate.toNumber());
        const lineTaxAmount = Number((lineSubtotal * configuredPercent).toFixed(2));
        const normalizedPercent = Number((configuredPercent * 100).toFixed(2));

        taxAmount += lineTaxAmount;

        taxesToCreate.push({
          presentationId: presentation.id,
          taxCode: productTax.taxValue.code,
          taxDescription: productTax.taxValue.description,
          taxPercentage: normalizedPercent,
          taxableAmount: lineSubtotal,
          taxAmount: lineTaxAmount,
        });
      }
    }

    subtotal = Number(subtotal.toFixed(2));
    taxAmount = Number(taxAmount.toFixed(2));

    const discount = Number((data.discount || 0).toFixed(2));
    const total = Number((subtotal + taxAmount - discount).toFixed(2));

    if (total <= 0) {
      throw new BadRequestException('El total de la venta debe ser mayor a cero');
    }

    const paymentTotal = Number(
      data.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0).toFixed(2),
    );

    if (paymentTotal !== total) {
      throw new BadRequestException(
        `La suma de métodos de pago (${paymentTotal}) debe ser igual al total (${total})`,
      );
    }

    let creditAmount = 0;

    for (const payment of data.payments) {
      if (payment.amount <= 0) {
        throw new BadRequestException('Cada método de pago debe tener monto mayor a cero');
      }

      if (payment.paymentType === PaymentMethodType.CASH) {
        if (payment.cashReceived === undefined || payment.cashReceived === null) {
          throw new BadRequestException('Efectivo requiere monto recibido');
        }
        if (payment.cashReceived < payment.amount) {
          throw new BadRequestException('El monto recibido en efectivo no puede ser menor al monto a cobrar');
        }
      }

      if (payment.paymentType === PaymentMethodType.TRANSFER) {
        if (!payment.bankId) {
          throw new BadRequestException('Transferencia requiere banco');
        }
        if (!payment.transferReference) {
          throw new BadRequestException('Transferencia requiere número de referencia');
        }
      }

      if (payment.paymentType === PaymentMethodType.CARD) {
        if (!payment.voucherNumber) {
          throw new BadRequestException('Tarjeta requiere número de voucher');
        }
      }

      if (payment.paymentType === PaymentMethodType.CREDIT) {
        creditAmount += Number(payment.amount);
      }
    }

    creditAmount = Number(creditAmount.toFixed(2));

    const saleStatus =
      creditAmount === 0
        ? SaleStatus.COMPLETED
        : creditAmount === total
          ? SaleStatus.CREDIT
          : SaleStatus.PARTIAL_PAYMENT;

    const createdSale = await prisma.$transaction(async (tx) => {
      const sequence = await tx.invoiceSequence.upsert({
        where: {
          establishment_pointOfSale: {
            establishment: DEFAULT_ESTABLISHMENT,
            pointOfSale: DEFAULT_POINT_OF_SALE,
          },
        },
        update: {
          lastSequential: {
            increment: 1,
          },
        },
        create: {
          establishment: DEFAULT_ESTABLISHMENT,
          pointOfSale: DEFAULT_POINT_OF_SALE,
          lastSequential: 1,
        },
      });

      const invoiceNumber = `${DEFAULT_ESTABLISHMENT}-${DEFAULT_POINT_OF_SALE}-${String(sequence.lastSequential).padStart(9, '0')}`;

      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          userId: data.userId,
          subtotal,
          taxAmount,
          total,
          discount,
          status: saleStatus,
          notes: data.notes,
          details: {
            create: detailsToCreate,
          },
          productTaxes: {
            create: taxesToCreate,
          },
          payments: {
            create: data.payments.map((payment) => {
              const change =
                payment.paymentType === PaymentMethodType.CASH && payment.cashReceived !== undefined
                  ? Number((payment.cashReceived - payment.amount).toFixed(2))
                  : undefined;

              return {
                paymentType: payment.paymentType,
                amount: Number(payment.amount.toFixed(2)),
                cashReceived: payment.cashReceived,
                change,
                bankId: payment.bankId,
                bankAccount: payment.bankAccount,
                transferReference: payment.transferReference,
                cardType: payment.cardType,
                voucherNumber: payment.voucherNumber,
                notes: payment.notes,
              };
            }),
          },
          credit:
            creditAmount > 0
              ? {
                  create: {
                    totalAmount: creditAmount,
                    paidAmount: 0,
                    balance: creditAmount,
                    isPaid: false,
                  },
                }
              : undefined,
        },
        include: {
          details: true,
          payments: true,
          productTaxes: true,
        },
      });

      for (const [productId, discountInBaseUnits] of baseDiscountByProduct.entries()) {
        await tx.productStock.update({
          where: { productId },
          data: {
            stock: {
              decrement: discountInBaseUnits,
            },
          },
        });
      }

      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          totalPurchases: {
            increment: total,
          },
          lastPurchaseDate: new Date(),
        },
      });

      return sale;
    });

    return {
      id: createdSale.id,
      invoiceNumber: createdSale.invoiceNumber,
      customerId: createdSale.customerId,
      userId: createdSale.userId,
      subtotal: toNumber(createdSale.subtotal),
      taxAmount: toNumber(createdSale.taxAmount),
      total: toNumber(createdSale.total),
      discount: toNumber(createdSale.discount),
      status: createdSale.status as any,
      saleDate: createdSale.saleDate,
      notes: createdSale.notes || undefined,
      createdAt: createdSale.createdAt,
      updatedAt: createdSale.updatedAt,
      details: createdSale.details.map((detail) => ({
        id: detail.id,
        saleId: detail.saleId,
        presentationId: detail.presentationId,
        productName: detail.productName,
        presentationName: detail.presentationName,
        quantity: detail.quantity,
        unitPrice: toNumber(detail.unitPrice),
        subtotal: toNumber(detail.subtotal),
        createdAt: detail.createdAt,
      })),
      payments: createdSale.payments.map((payment) => ({
        id: payment.id,
        saleId: payment.saleId,
        paymentType: payment.paymentType as any,
        amount: toNumber(payment.amount),
        cashReceived: payment.cashReceived ? toNumber(payment.cashReceived) : undefined,
        change: payment.change ? toNumber(payment.change) : undefined,
        bankId: payment.bankId || undefined,
        bankAccount: payment.bankAccount || undefined,
        transferReference: payment.transferReference || undefined,
        cardType: payment.cardType as any,
        voucherNumber: payment.voucherNumber || undefined,
        notes: payment.notes || undefined,
        createdAt: payment.createdAt,
      })),
      productTaxes: createdSale.productTaxes.map((tax) => ({
        id: tax.id,
        saleId: tax.saleId,
        presentationId: tax.presentationId,
        taxCode: tax.taxCode,
        taxDescription: tax.taxDescription,
        taxPercentage: toNumber(tax.taxPercentage),
        taxableAmount: toNumber(tax.taxableAmount),
        taxAmount: toNumber(tax.taxAmount),
        createdAt: tax.createdAt,
      })),
    };
  }

  async update(id: string, data: UpdateSaleDto): Promise<SaleDto> {
    try {
      const sale = await prisma.sale.update({
        where: { id },
        data: {
          status: data.status as SaleStatus | undefined,
          notes: data.notes,
        },
      });

      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerId: sale.customerId,
        userId: sale.userId,
        subtotal: toNumber(sale.subtotal),
        taxAmount: toNumber(sale.taxAmount),
        total: toNumber(sale.total),
        discount: toNumber(sale.discount),
        status: sale.status as any,
        saleDate: sale.saleDate,
        notes: sale.notes || undefined,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Venta con ID ${id} no encontrada`);
      }
      throw error;
    }
  }
}
