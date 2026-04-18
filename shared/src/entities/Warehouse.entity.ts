/**
 * DTOs para entidad Warehouse (Bodega/Sucursal)
 */

export interface WarehouseDto {
  id: number;
  name: string;
  establishmentCode: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWarehouseDto {
  name: string;
  establishmentCode: string;
  active?: boolean;
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {
  id: number;
}
