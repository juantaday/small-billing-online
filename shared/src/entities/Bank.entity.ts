/**
 * DTOs para entidad Bank (Bancos)
 */

export interface BankDto {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBankDto {
  code: string;
  name: string;
  active?: boolean;
}

export interface UpdateBankDto {
  code?: string;
  name?: string;
  active?: boolean;
}
