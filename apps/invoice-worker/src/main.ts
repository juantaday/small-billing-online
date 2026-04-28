import { Worker } from 'bullmq';
import { authorizeVoucher, sendVoucher } from '@sri/client';
import { Environment, VoucherStatus } from '@sri/core';
import { TypeormVoucherRepository } from '@sri/persistence-adapter';

const queueName = process.env.SRI_QUEUE_NAME || 'sri-billing';
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT || '6379');
const dbConnectionString = process.env.SRI_DB_URL || '';
const env = (process.env.SRI_ENV || 'TESTING') as keyof typeof Environment;

if (!dbConnectionString) {
  throw new Error('SRI_DB_URL is required');
}

const repository = new TypeormVoucherRepository({ connectionString: dbConnectionString });

const worker = new Worker(
  queueName,
  async (job) => {
    await repository.initialize();
    const { accessKey, signedXml, environment } = job.data as {
      accessKey: string;
      signedXml: string;
      environment?: Environment;
    };
    const targetEnv = environment || Environment[env];
    const document = await repository.findByAccessKey(accessKey);
    if (!document) {
      throw new Error('Documento no encontrado para el access key');
    }

    // Registro de intento de envio al SRI para trazabilidad completa.
    await repository.addTransmissionAttempt({
      documentId: document.id,
      status: VoucherStatus.SENT,
      attemptNumber: job.attemptsMade + 1,
      requestPayload: 'ENVIO SRI',
      startedAt: new Date(),
    });

    const reception = await sendVoucher(signedXml, targetEnv);
    const status = reception.status.toUpperCase();

    if (status === 'RECIBIDA') {
      await repository.updateDocumentStatus(accessKey, VoucherStatus.RECEIVED);
      await repository.addEvent({
        documentId: document.id,
        status: VoucherStatus.RECEIVED,
        reason: 'Recepcion exitosa',
        createdAt: new Date(),
      });

      const authorization = await authorizeVoucher(accessKey, targetEnv);
      const authStatus = authorization.status.toUpperCase();

      if (authStatus === 'AUTORIZADO' && authorization.authorizations.length > 0) {
        const auth = authorization.authorizations[0];
        await repository.addAuthorization({
          documentId: document.id,
          authorizationNumber: auth.number,
          authorizationDate: new Date(auth.date),
          authorizedXml: auth.xml,
          createdAt: new Date(),
        });
        await repository.updateDocumentStatus(accessKey, VoucherStatus.AUTHORIZED);
        await repository.addEvent({
          documentId: document.id,
          status: VoucherStatus.AUTHORIZED,
          reason: 'Comprobante autorizado',
          createdAt: new Date(),
        });
      } else if (authStatus === 'NO AUTORIZADO') {
        await repository.updateDocumentStatus(accessKey, VoucherStatus.REJECTED, 'No autorizado');
        await repository.addEvent({
          documentId: document.id,
          status: VoucherStatus.REJECTED,
          reason: 'No autorizado',
          createdAt: new Date(),
        });
      } else {
        await repository.updateDocumentStatus(accessKey, VoucherStatus.ERROR_RETRYABLE, 'Error en autorizacion');
      }
    } else if (status === 'DEVUELTA') {
      await repository.updateDocumentStatus(accessKey, VoucherStatus.REJECTED, 'Devuelta por SRI');
      await repository.addEvent({
        documentId: document.id,
        status: VoucherStatus.REJECTED,
        reason: 'Devuelta por SRI',
        createdAt: new Date(),
      });
    } else {
      await repository.updateDocumentStatus(accessKey, VoucherStatus.ERROR_RETRYABLE, reception.status);
      throw new Error(`Estado inesperado: ${reception.status}`);
    }
  },
  {
    connection: {
      host: redisHost,
      port: redisPort,
    },
  },
);

worker.on('failed', (job, error) => {
  // Se deja registro en logs del worker sin exponer datos sensibles.
  console.error(`Job ${job?.id} failed:`, error.message);
});
