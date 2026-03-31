/**
 * DTOs para entidad InvoiceSequence (Control de Secuenciales de Factura)
 */

export interface InvoiceSequenceDto {
  id: string;
  establishment: string;
  pointOfSale: string;
  lastSequential: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceSequenceDto {
  establishment: string;
  pointOfSale: string;
  lastSequential?: number;
}

export interface UpdateInvoiceSequenceDto {
  lastSequential: number;
}
