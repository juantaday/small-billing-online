export type ProductTaxGroup = 'IVA' | 'ICE' | 'IRBPNR';

export interface ProductTaxSelectionDto {
  taxValueCode: string;
  taxValueDescription: string;
  percentage: number;
  appliedRate?: number;
  isDefaultVat?: boolean;
}

export interface ProductTaxDefaultDto {
  id: string;
  taxGroup: ProductTaxGroup;
  taxValueCode: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigureProductTaxDefaultDto {
  taxGroup: ProductTaxGroup;
  taxValueCode: string;
  active?: boolean;
}