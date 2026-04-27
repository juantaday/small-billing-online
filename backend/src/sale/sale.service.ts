import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  Prisma,
} from '@prisma/client';
import {
  CreateSaleDto,
  IdentityType,
  PaymentMethodType,
  PersonType,
  SaleDto,
  SaleStatus,
  SaleWithRelationsDto,
  UpdateSaleDto,
} from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { DeviceService } from '../device/device.service';
import { TerminalSettingsService } from '../terminal-settings/terminal-settings.service';


const DEFAULT_TERMINAL_CODE = 'CAJA_001';
const CONSUMER_FINAL_RUC = '9999999999999';
const CONSUMER_FINAL_CATEGORY_NAME = 'Usuario Final';

function hashDeviceToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function buildIncludedTaxBreakdown(
  grossAmount: number,
  productTaxes: Array<{
    taxValueCode: string;
    appliedRate: Prisma.Decimal | number;
    taxValue: { code: string; description: string };
  }>,
): {
  baseWithoutTaxes: number;
  taxes: Array<{
    taxCode: string;
    taxDescription: string;
    taxPercentage: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
} {
  let runningTotal = round2(grossAmount);
  const taxes: Array<{
    taxCode: string;
    taxDescription: string;
    taxPercentage: number;
    taxableAmount: number;
    taxAmount: number;
  }> = [];

  for (const productTax of productTaxes) {
    const rate = toNumber(productTax.appliedRate);
    if (rate <= 0) continue;

    const taxableAmount = round2(runningTotal / (rate + 1));
    const taxAmount = round2(runningTotal - taxableAmount);

    taxes.push({
      taxCode: productTax.taxValue.code,
      taxDescription: productTax.taxValue.description,
      taxPercentage: round2(rate * 100),
      taxableAmount,
      taxAmount,
    });

    runningTotal = taxableAmount;
  }

  return {
    baseWithoutTaxes: runningTotal,
    taxes,
  };
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly deviceService: DeviceService,
    private readonly terminalSettingsService: TerminalSettingsService,
  ) {}

  private async resolveTerminalConfig(data: CreateSaleDto): Promise<{
    terminalId: number;
    establishment: string;
    pointOfSale: string;
    documentTypeId: number;
  }> {
    const requestedTerminalId = Number.isInteger(data.terminalId) ? data.terminalId : undefined;
    const requestedTerminalCode = data.terminalCode?.trim();
    const requestedDeviceToken = data.deviceToken?.trim();
    const envTerminalCode = process.env.POS_TERMINAL_CODE?.trim();
    const effectiveTerminalCode = requestedTerminalCode || envTerminalCode || DEFAULT_TERMINAL_CODE;
    const requestedDocumentTypeId = Number.isInteger(data.documentTypeId)
      ? data.documentTypeId
      : 1;
    const documentType = await this.prisma.documentType.findFirst({
      where: {
        id: requestedDocumentTypeId,
        active: true,
      },
      select: { id: true },
    });

    if (!documentType) {
      throw new BadRequestException(
        `Tipo de documento con ID ${requestedDocumentTypeId} no existe o está inactivo.`,
      );
    }

    const byDevice = requestedDeviceToken
      ? await this.prisma.device.findUnique({
          where: { deviceToken: hashDeviceToken(requestedDeviceToken) },
          include: {
            terminal: {
              select: {
                id: true,
                code: true,
                active: true,
                emissionPoint: true,
                warehouse: {
                  select: {
                    establishmentCode: true,
                    active: true,
                  },
                },
              },
            },
          },
        })
      : null;

    const byId =
      requestedTerminalId !== undefined
        ? await this.prisma.terminal.findUnique({
            where: { id: requestedTerminalId },
            select: {
              id: true,
              code: true,
              active: true,
              emissionPoint: true,
              warehouse: {
                select: {
                  establishmentCode: true,
                  active: true,
                },
              },
            },
          })
        : null;

      const byCode = !byDevice && !byId
      ? await this.prisma.terminal.findUnique({
          where: { code: effectiveTerminalCode },
          select: {
            id: true,
            code: true,
            active: true,
            emissionPoint: true,
            warehouse: {
              select: {
                establishmentCode: true,
                active: true,
              },
            },
          },
        })
      : null;

    const terminal = byDevice?.terminal || byId || byCode;

    if (terminal && terminal.active && terminal.warehouse.active) {
      return {
        terminalId: terminal.id,
        establishment: terminal.warehouse.establishmentCode,
        pointOfSale: terminal.emissionPoint,
        documentTypeId: documentType.id,
      };
    }

    if (byDevice?.terminal && (!byDevice.terminal.active || !byDevice.terminal.warehouse.active)) {
      throw new BadRequestException(
        `El dispositivo está vinculado a la terminal ${byDevice.terminal.code}, pero esa terminal o su bodega están inactivas. Actívalas antes de facturar.`,
      );
    }

    if (requestedTerminalId !== undefined || requestedTerminalCode || requestedDeviceToken || envTerminalCode) {
      const invalidTerminalRef =
        requestedTerminalId !== undefined
          ? `ID ${requestedTerminalId}`
          : requestedDeviceToken
            ? `del dispositivo ${requestedDeviceToken.slice(-6)}`
          : `código ${effectiveTerminalCode}`;

      throw new BadRequestException(
        `Terminal ${invalidTerminalRef} no existe o está inactiva. Configura una terminal activa y vincula el dispositivo correcto.`,
      );
    }

    const activeTerminals = await this.prisma.terminal.findMany({
      where: {
        active: true,
        warehouse: {
          active: true,
        },
      },
      select: {
        id: true,
        code: true,
        active: true,
        emissionPoint: true,
        warehouse: {
          select: {
            establishmentCode: true,
            active: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    if (activeTerminals.length === 1) {
      return {
        terminalId: activeTerminals[0].id,
        establishment: activeTerminals[0].warehouse.establishmentCode,
        pointOfSale: activeTerminals[0].emissionPoint,
        documentTypeId: documentType.id,
      };
    }

    if (activeTerminals.length === 0) {
      throw new BadRequestException(
        'No hay terminales activas configuradas. Crea una bodega y una terminal (ej: CAJA_001 con punto de emisión 001).',
      );
    }

    throw new BadRequestException(
      'Existen múltiples terminales activas. Debes enviar terminalId o terminalCode en la venta para identificar desde qué equipo se emite la factura.',
    );
  }

  private async ensureFinalConsumerCustomer(): Promise<string> {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        active: true,
        people: {
          rucCi: CONSUMER_FINAL_RUC,
        },
      },
      select: { id: true },
    });

    if (existingCustomer) {
      return existingCustomer.id;
    }

    const category =
      (await this.prisma.customerCategory.findFirst({
        where: {
          active: true,
          name: CONSUMER_FINAL_CATEGORY_NAME,
        },
        select: { id: true },
      })) ||
      (await this.prisma.customerCategory.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })) ||
      (await this.prisma.customerCategory.create({
        data: {
          name: CONSUMER_FINAL_CATEGORY_NAME,
          discountPercentage: 0,
          pointsMultiplier: 1,
          ticketThreshold: 10,
          color: '#6B7280',
          active: true,
        },
        select: { id: true },
      }));

    const people = await this.prisma.people.upsert({
      where: { rucCi: CONSUMER_FINAL_RUC },
      update: {
        firstName: 'Consumidor',
        lastName: 'Final',
        personType: PersonType.NATURAL,
        identityType: IdentityType.RUC,
      },
      create: {
        firstName: 'Consumidor',
        lastName: 'Final',
        rucCi: CONSUMER_FINAL_RUC,
        mainEmail: null,
        phone: null,
        address: null,
        personType: PersonType.NATURAL,
        identityType: IdentityType.RUC,
      },
      select: {
        id: true,
        customer: {
          select: {
            id: true,
            active: true,
          },
        },
      },
    });

    if (people.customer?.id) {
      if (!people.customer.active) {
        await this.prisma.customer.update({
          where: { id: people.customer.id },
          data: { active: true },
        });
      }

      return people.customer.id;
    }

    const createdCustomer = await this.prisma.customer.create({
      data: {
        peopleId: people.id,
        customerCategoryId: category.id,
        totalPurchases: 0,
        loyaltyPoints: 0,
        lastPurchaseDate: null,
        preferredPaymentMethod: null,
        active: true,
      },
      select: { id: true },
    });

    return createdCustomer.id;
  }

  private async resolveCustomerId(data: CreateSaleDto): Promise<string> {
    const requestedRucCi = data.customerRucCi?.trim();

    if (!data.customerId && !requestedRucCi) {
      throw new BadRequestException('Debes enviar customerId o customerRucCi');
    }

    if (requestedRucCi === CONSUMER_FINAL_RUC) {
      return this.ensureFinalConsumerCustomer();
    }

    if (data.customerId) {
      const byId = await this.prisma.customer.findUnique({
        where: { id: data.customerId },
        include: { people: true },
      });

      if (byId?.active) {
        return byId.id;
      }
    }

    if (requestedRucCi) {
      const byRuc = await this.prisma.customer.findFirst({
        where: {
          active: true,
          people: {
            rucCi: requestedRucCi,
          },
        },
        select: { id: true },
      });

      if (byRuc) {
        return byRuc.id;
      }
    }

    throw new NotFoundException('Cliente no encontrado o inactivo');
  }

  async findAll(): Promise<SaleWithRelationsDto[]> {
    const sales = await this.prisma.sale.findMany({
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
      terminalId: sale.terminalId,
      documentTypeId: sale.documentTypeId,
      deviceId: sale.deviceId,
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
    const sale = await this.prisma.sale.findUnique({
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
      terminalId: sale.terminalId,
      documentTypeId: sale.documentTypeId,
      deviceId: sale.deviceId,
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

    if (!data.deviceToken) {
      throw new BadRequestException('Debes enviar deviceToken para registrar la venta');
    }

    const customerId = await this.resolveCustomerId(data);

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user || !user.active) {
      throw new NotFoundException('Usuario no encontrado o inactivo');
    }

    const terminalConfig = await this.resolveTerminalConfig(data);

    // Validar configuración de máximo de items
    const itemCountValidation = await this.terminalSettingsService.validateItemCount(
      terminalConfig.terminalId,
      terminalConfig.documentTypeId,
      data.details.length,
    );

    if (!itemCountValidation.valid) {
      throw new BadRequestException(itemCountValidation.message || 'Número de items excede el máximo permitido');
    }

    const presentationIds = [...new Set(data.details.map((item) => item.presentationId))];

    const presentations = await this.prisma.presentation.findMany({
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
    let grossTotal = 0;
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
      const lineGrossTotal = round2(unitPrice * detail.quantity);
      const { baseWithoutTaxes, taxes } = buildIncludedTaxBreakdown(
        lineGrossTotal,
        presentation.product.productTaxes,
      );

      subtotal = round2(subtotal + baseWithoutTaxes);
      grossTotal = round2(grossTotal + lineGrossTotal);
      taxAmount = round2(
        taxAmount + taxes.reduce((sum, lineTax) => round2(sum + lineTax.taxAmount), 0),
      );

      detailsToCreate.push({
        presentationId: presentation.id,
        productName: presentation.product.name,
        presentationName: presentation.presentationType.name,
        quantity: detail.quantity,
        unitPrice,
        subtotal: lineGrossTotal,
      });

      taxesToCreate.push(
        ...taxes.map((lineTax) => ({
          presentationId: presentation.id,
          taxCode: lineTax.taxCode,
          taxDescription: lineTax.taxDescription,
          taxPercentage: lineTax.taxPercentage,
          taxableAmount: lineTax.taxableAmount,
          taxAmount: lineTax.taxAmount,
        })),
      );
    }

    subtotal = Number(subtotal.toFixed(2));
    taxAmount = Number(taxAmount.toFixed(2));
    grossTotal = Number(grossTotal.toFixed(2));

    const discount = Number((data.discount || 0).toFixed(2));
    const total = Number((grossTotal - discount).toFixed(2));

    if (total <= 0) {
      throw new BadRequestException('El total de la venta debe ser mayor a cero');
    }

    const normalizedPayments = data.payments.map((payment) => {
      const amount = round2(Number(payment.amount || 0));
      const cashReceived =
        payment.cashReceived !== undefined && payment.cashReceived !== null
          ? round2(Number(payment.cashReceived))
          : undefined;
      const parsedChange =
        payment.change !== undefined && payment.change !== null
          ? round2(Number(payment.change))
          : undefined;

      let normalizedAmount = amount;
      let normalizedChange = parsedChange;

      if (payment.paymentType === PaymentMethodType.CASH && cashReceived !== undefined) {
        if (normalizedChange === undefined) {
          normalizedChange = round2(Math.max(0, cashReceived - normalizedAmount));
        }

        // Compatibilidad con frontend: si amount llega como recibido, se normaliza al neto.
        if (normalizedChange > 0 && normalizedAmount === cashReceived) {
          normalizedAmount = round2(cashReceived - normalizedChange);
        }
      }

      return {
        ...payment,
        amount: normalizedAmount,
        cashReceived,
        change: normalizedChange,
      };
    });

    const paymentTotal = round2(
      normalizedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    );
    const changeTotal = round2(
      normalizedPayments.reduce((sum, payment) => sum + Number(payment.change || 0), 0),
    );
    const receivedTotal = round2(
      normalizedPayments.reduce(
        (sum, payment) =>
          sum +
          (payment.paymentType === PaymentMethodType.CASH
            ? Number(payment.cashReceived ?? 0)
            : Number(payment.amount || 0)),
        0,
      ),
    );

    this.logger.info(receivedTotal, 'Total de pagos');
    this.logger.info(paymentTotal, 'Total de pagos netos');
    this.logger.info(changeTotal, 'Total de cambio');
    this.logger.info(total, 'Total de la venta');

    if (paymentTotal !== total) {
      this.logger.error(
        `La suma neta de pagos (${paymentTotal}) debe ser igual al total (${total})`,
      );
      throw new BadRequestException(
        `La suma neta de pagos (${paymentTotal}) debe ser igual al total (${total})`,
      );
    }

    let creditAmount = 0;

    for (const payment of normalizedPayments) {
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

    const createdSale = await this.prisma.$transaction(async (tx) => {
      const generatedInvoiceRows = await tx.$queryRaw<Array<{ invoice_number: string }>>`
        SELECT public.generate_sale_invoice_number(
          ${terminalConfig.terminalId}::integer,
          ${terminalConfig.documentTypeId}::integer
        ) AS invoice_number
      `;

      const invoiceNumber = generatedInvoiceRows[0]?.invoice_number;
      if (!invoiceNumber) {
        throw new BadRequestException('No se pudo generar la numeración del documento');
      }

      // Obtener ID del dispositivo (requerido)
      const device = await this.deviceService.getDeviceByToken(data.deviceToken);
      const deviceId = device.id;
      // Actualizar última conexión del dispositivo
      await this.deviceService.updateLastSeen(data.deviceToken);

      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId,
          userId: data.userId,
          terminalId: terminalConfig.terminalId,
          documentTypeId: terminalConfig.documentTypeId,
          deviceId,
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
            create: normalizedPayments.map((payment) => {
              const change =
                payment.paymentType === PaymentMethodType.CASH && payment.cashReceived !== undefined
                  ? Number((payment.cashReceived - payment.amount).toFixed(2))
                  : undefined;

              return {
                paymentType: payment.paymentType,
                amount: round2(Number(payment.amount)),
                cashReceived: payment.cashReceived,
                change: payment.change !== undefined ? round2(Number(payment.change)) : change,
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

      const productIdsToUpdate = Array.from(baseDiscountByProduct.keys());
      const currentStocks = await tx.productStock.findMany({
        where: { productId: { in: productIdsToUpdate } },
        select: {
          productId: true,
          stock: true,
        },
      });
      const stockByProductId = new Map(currentStocks.map((row) => [row.productId, row.stock]));

      for (const [productId, discountInBaseUnits] of baseDiscountByProduct.entries()) {
        const stockBefore = stockByProductId.get(productId) ?? 0;
        const stockAfter = stockBefore - discountInBaseUnits;

        await tx.productStock.update({
          where: { productId },
          data: {
            stock: {
              decrement: discountInBaseUnits,
            },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId,
            userId: data.userId,
            presentationId: null,
            movementType: 'OUT',
            source: 'SALE',
            quantityInPresentation: discountInBaseUnits,
            factorToBase: 1,
            deltaBaseUnits: -discountInBaseUnits,
            stockBefore,
            stockAfter,
            note: `Salida por venta ${invoiceNumber}`,
          },
        });
      }

      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalPurchases: {
            increment: total,
          },
          lastPurchaseDate: new Date(),
        },
      });

      return sale;
    }, {
      maxWait: 15000,
      timeout: 15000,
    });

    return {
      id: createdSale.id,
      invoiceNumber: createdSale.invoiceNumber,
      customerId: createdSale.customerId,
      userId: createdSale.userId,
      terminalId: createdSale.terminalId || undefined,
      documentTypeId: createdSale.documentTypeId,
      deviceId: createdSale.deviceId,
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
      const sale = await this.prisma.sale.update({
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
        terminalId: sale.terminalId || undefined,
        deviceId: sale.deviceId || undefined,
        documentTypeId: sale.documentTypeId,
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
