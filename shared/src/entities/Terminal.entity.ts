/**
 * DTOs para entidad Terminal (Punto de emisión por equipo)
 */

export interface TerminalDto {
  id: number;
  code: string; // Ej: CAJA_001
  name?: string | null; // Nombre visible para el usuario
  warehouseId: number;
  deviceId: string;
  deviceToken?: string;
  emissionPoint: string; // Ej: 001
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTerminalDto {
  code: string;
  name?: string | null;
  warehouseId: number;
  deviceToken?: string;
  pairingCode?: string;
  emissionPoint: string;
  active?: boolean;
}

export interface UpdateTerminalDto extends Partial<CreateTerminalDto> {
  id: number;
}
