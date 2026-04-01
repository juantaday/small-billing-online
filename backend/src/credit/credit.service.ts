import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethodType,
  Prisma,
  SaleStatus,
} from '@prisma/client';
import {
  CreateCreditPaymentDto,
  CreditDto,
  CreditWithRelationsDto,
} from '@small-billing/shared';
import { PrismaService } from '../prisma/prisma.service';


function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

@Injectable()
export class CreditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllOpenCredits(): Promise<CreditWithRelationsDto[]> {
    const credits = await this.prisma.credit.findMany({
      where: { isPaid: false },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return credits.map((credit) => ({
      id: credit.id,
      saleId: credit.saleId,
      totalAmount: toNumber(credit.totalAmount),
      paidAmount: toNumber(credit.paidAmount),
      balance: toNumber(credit.balance),
      dueDate: credit.dueDate || undefined,
      paidDate: credit.paidDate || undefined,
      isPaid: credit.isPaid,
      createdAt: credit.createdAt,
      updatedAt: credit.updatedAt,
      payments: credit.payments.map((payment) => ({
        id: payment.id,
        creditId: payment.creditId,
        amount: toNumber(payment.amount),
        paymentType: payment.paymentType as any,
        paymentDate: payment.paymentDate,
        bankId: payment.bankId || undefined,
        bankAccount: payment.bankAccount || undefined,
        transferReference: payment.transferReference || undefined,
        cardType: payment.cardType as any,
        voucherNumber: payment.voucherNumber || undefined,
        notes: payment.notes || undefined,
        createdAt: payment.createdAt,
      })),
    }));
  }

  async findOneBySaleId(saleId: string): Promise<CreditWithRelationsDto> {
    const credit = await this.prisma.credit.findUnique({
      where: { saleId },
      include: {
        payments: {
          orderBy: { paymentDate: 'asc' },
        },
      },
    });

    if (!credit) {
      throw new NotFoundException(`No existe crédito para la venta ${saleId}`);
    }

    return {
      id: credit.id,
      saleId: credit.saleId,
      totalAmount: toNumber(credit.totalAmount),
      paidAmount: toNumber(credit.paidAmount),
      balance: toNumber(credit.balance),
      dueDate: credit.dueDate || undefined,
      paidDate: credit.paidDate || undefined,
      isPaid: credit.isPaid,
      createdAt: credit.createdAt,
      updatedAt: credit.updatedAt,
      payments: credit.payments.map((payment) => ({
        id: payment.id,
        creditId: payment.creditId,
        amount: toNumber(payment.amount),
        paymentType: payment.paymentType as any,
        paymentDate: payment.paymentDate,
        bankId: payment.bankId || undefined,
        bankAccount: payment.bankAccount || undefined,
        transferReference: payment.transferReference || undefined,
        cardType: payment.cardType as any,
        voucherNumber: payment.voucherNumber || undefined,
        notes: payment.notes || undefined,
        createdAt: payment.createdAt,
      })),
    };
  }

  async registerPayment(data: CreateCreditPaymentDto): Promise<CreditDto> {
    if (data.amount <= 0) {
      throw new BadRequestException('El abono debe ser mayor a cero');
    }

    const credit = await this.prisma.credit.findUnique({
      where: { id: data.creditId },
      include: { sale: true },
    });

    if (!credit) {
      throw new NotFoundException('Crédito no encontrado');
    }

    if (credit.isPaid) {
      throw new BadRequestException('El crédito ya está pagado');
    }

    const currentBalance = toNumber(credit.balance);

    if (data.amount > currentBalance) {
      throw new BadRequestException('El abono no puede exceder el saldo pendiente');
    }

    if (data.paymentType === PaymentMethodType.TRANSFER && !data.transferReference) {
      throw new BadRequestException('Transferencia requiere número de referencia');
    }

    if (data.paymentType === PaymentMethodType.CARD && !data.voucherNumber) {
      throw new BadRequestException('Tarjeta requiere número de voucher');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.creditPayment.create({
        data: {
          creditId: data.creditId,
          amount: Number(data.amount.toFixed(2)),
          paymentType: data.paymentType as PaymentMethodType,
          bankId: data.bankId,
          bankAccount: data.bankAccount,
          transferReference: data.transferReference,
          cardType: data.cardType as any,
          voucherNumber: data.voucherNumber,
          notes: data.notes,
        },
      });

      const paidAmount = Number((toNumber(credit.paidAmount) + data.amount).toFixed(2));
      const balance = Number((toNumber(credit.totalAmount) - paidAmount).toFixed(2));
      const isPaid = balance <= 0;

      const updatedCredit = await tx.credit.update({
        where: { id: credit.id },
        data: {
          paidAmount,
          balance,
          isPaid,
          paidDate: isPaid ? new Date() : null,
        },
      });

      await tx.sale.update({
        where: { id: credit.saleId },
        data: {
          status: isPaid ? SaleStatus.COMPLETED : SaleStatus.PARTIAL_PAYMENT,
        },
      });

      return updatedCredit;
    });

    return {
      id: updated.id,
      saleId: updated.saleId,
      totalAmount: toNumber(updated.totalAmount),
      paidAmount: toNumber(updated.paidAmount),
      balance: toNumber(updated.balance),
      dueDate: updated.dueDate || undefined,
      paidDate: updated.paidDate || undefined,
      isPaid: updated.isPaid,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
