/**
 * Shared API - Public API
 * Exportación centralizada del cliente HTTP y configuración
 */

export { BaseApiClient } from './base-client';

// Instancia única del cliente para casos que lo necesiten
import { BaseApiClient } from './base-client';
import { API_CONFIG } from '../config';

/**
 * Cliente API global (opcional, la mayoría de entities crean su propia instancia)
 */
export const apiClient = new BaseApiClient(API_CONFIG.BASE_URL);
