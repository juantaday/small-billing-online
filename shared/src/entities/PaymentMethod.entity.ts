// DTO para crear método de pago
export interface CreatePaymentMethodDto {
  name: string;
  code: string;
  icon?: string;
  requiresReference?: boolean;
  allowsChange?: boolean;
  active?: boolean;
}

// DTO de respuesta
export interface PaymentMethodDto extends CreatePaymentMethodDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para actualizar
export interface UpdatePaymentMethodDto extends Partial<Omit<CreatePaymentMethodDto, 'code'>> {
  id: string;
}
