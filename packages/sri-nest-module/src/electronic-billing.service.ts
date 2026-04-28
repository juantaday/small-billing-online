import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  Environment,
  FileArtifactType,
  IInvoice,
  VoucherStatus,
  VoucherStatusDto,
} from '@sri/core';
import { buildAccessKey } from '@sri/xml-generator';
import { buildXml } from '@sri/xml-generator';
import { signXml } from '@sri/signer';
import { IVoucherRepository } from '@sri/persistence-adapter';
import { ELECTRONIC_BILLING_CONFIG, ElectronicBillingConfig } from './electronic-billing.config';

export const ELECTRONIC_BILLING_QUEUE = 'ELECTRONIC_BILLING_QUEUE';

@Injectable()
export class ElectronicBillingService {
  constructor(
    @Inject(ELECTRONIC_BILLING_CONFIG)
    private readonly config: ElectronicBillingConfig,
    @Inject(ELECTRONIC_BILLING_QUEUE)
    private readonly queue: Queue,
    private readonly repository: IVoucherRepository,
  ) {}

  async issueInvoice(data: IInvoice): Promise<VoucherStatusDto> {
    await this.repository.initialize();
    const accessKey = data.accessKey || this.generateAccessKey(data);
    const existing = await this.repository.findByAccessKey(accessKey);
    if (existing) {
      return {
        accessKey,
        status: existing.status,
        updatedAt: new Date().toISOString(),
        reason: 'Documento ya registrado',
      };
    }
    const xml = buildXml({ ...data, accessKey });

    const certificateBuffer = await import('fs').then((fs) =>
      fs.readFileSync(this.config.certificatePath),
    );

    const signedXml = signXml(xml, certificateBuffer, this.config.certificatePassword);

    const document = await this.repository.createDocument({
      accessKey,
      voucherType: data.voucherType,
      status: VoucherStatus.SIGNED,
      environment: data.environment,
      emissionType: data.emissionType,
      issuerRuc: data.issuer.ruc,
      recipientId: data.recipient.identificationNumber,
      issuedAt: new Date(),
      signedAt: new Date(),
    });

    await this.repository.addEvent({
      documentId: document.id,
      status: VoucherStatus.SIGNED,
      reason: 'Documento firmado y encolado',
      createdAt: new Date(),
    });

    if (this.config.storagePath) {
      const storagePath = this.config.storagePath;
      const fileName = `${accessKey}-signed.xml`;
      const fullPath = await import('path').then((path) => path.join(storagePath, fileName));
      await import('fs').then((fs) => fs.writeFileSync(fullPath, signedXml, 'utf8'));
      await this.repository.addArtifact({
        documentId: document.id,
        type: FileArtifactType.SIGNED_XML,
        path: fullPath,
        createdAt: new Date(),
      });
    }

    await this.queue.add(
      'send-voucher',
      {
        accessKey,
        environment: this.config.environment,
        signedXml,
      },
      {
        attempts: 10,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    return {
      accessKey,
      status: VoucherStatus.SIGNED,
      updatedAt: new Date().toISOString(),
      reason: 'Documento encolado para envio al SRI',
    };
  }

  private generateAccessKey(data: IInvoice): string {
    const rawDate = data.issueDate.replace(/\D/g, '');
    const date = rawDate.length === 8 && rawDate.startsWith('20')
      ? `${rawDate.slice(6, 8)}${rawDate.slice(4, 6)}${rawDate.slice(0, 4)}`
      : rawDate;
    const series = `${data.issuer.establishmentCode}${data.issuer.emissionPoint}`;
    return buildAccessKey({
      date,
      voucherType: data.voucherType,
      ruc: data.issuer.ruc,
      environment: data.environment,
      series,
      sequential: data.sequential,
      numericCode: this.generateNumericCode(),
      emissionType: data.emissionType,
    });
  }

  private generateNumericCode(): string {
    const now = Date.now().toString();
    return now.slice(-8).padStart(8, '0');
  }
}
