/**
 * Hook para inicializar el dispositivo POS UNA sola vez al cargar la app
 * Evita duplicar dispositivos por múltiples llamadas
 * 
 * USO:
 * En el App.tsx o en el layout principal:
 * const { deviceToken, error } = useDeviceInitialization();
 */

import { useEffect, useRef, useState } from 'react';
import { ensureDeviceToken, registerDevice, getDevice, getOrCreateDeviceToken } from '../device.util';
import { logger } from '../lib';

interface DeviceInitStatus {
  deviceToken: string | null;
  terminalId: number | null;
  isInitialized: boolean;
  error: Error | null;
  isLoading: boolean;
}

const initPromiseRef = { current: null as Promise<DeviceInitStatus> | null };
const resultRef = { current: null as DeviceInitStatus | null };

/**
 * Hook que garantiza inicialización UNA sola vez
 */
export function useDeviceInitialization(): DeviceInitStatus {
  const [status, setStatus] = useState<DeviceInitStatus>({
    deviceToken: null,
    terminalId: null,
    isInitialized: false,
    error: null,
    isLoading: true,
  });

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeDevice = async (): Promise<DeviceInitStatus> => {
      let resolvedToken: string | null = null;
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

        console.log('[Device] Iniciando inicialización de dispositivo...');

        // 1. Asegurar token (genera si no existe)
        const deviceToken = await ensureDeviceToken(apiUrl, {
          deviceName: 'POS_' + (new Date().toISOString().split('T')[0]),
        });
        resolvedToken = deviceToken;

        if (!deviceToken) {
          throw new Error('No se pudo obtener device token');
        }

        console.log('[Device] Token obtenido:', deviceToken.substring(0, 16) + '...');

        // 2. Registrar dispositivo en backend (si falla por red, no bloqueamos el POS)
        let registered: any = null;
        try {
          registered = await registerDevice(apiUrl, 'POS_Terminal');
          console.log('[Device] Dispositivo registrado:', registered?.id);
        } catch (registerError) {
          console.warn('[Device] No se pudo registrar en este momento. Se reintentara al facturar.', registerError);
        }

        // 3. Obtener información del dispositivo (si backend no responde, continuamos con token local)
        const deviceInfo = await getDevice(apiUrl);

        const result: DeviceInitStatus = {
          deviceToken,
          terminalId: deviceInfo?.terminalId || null,
          isInitialized: true,
          error: null,
          isLoading: false,
        };

        console.log('[Device] Inicialización completada:', {
          terminalId: result.terminalId,
          deviceId: deviceInfo?.id,
        });

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[Device] Error durante inicialización:', err);

        const fallbackToken = resolvedToken || getOrCreateDeviceToken() || null;
        if (fallbackToken) {
          const degradedResult: DeviceInitStatus = {
            deviceToken: fallbackToken,
            terminalId: null,
            isInitialized: true,
            error: err,
            isLoading: false,
          };

          logger.warn('Device initialization degraded mode (token local disponible)', {
            error: err.message,
          });
          return degradedResult;
        }

        const errorResult: DeviceInitStatus = {
          deviceToken: null,
          terminalId: null,
          isInitialized: false,
          error: err,
          isLoading: false,
        };

        logger.error('Device initialization failed', err);
        return errorResult;
      }
    };

    // Si ya hay una promesa en progreso, reutilizarla
    if (!initPromiseRef.current) {
      initPromiseRef.current = initializeDevice().then((result) => {
        resultRef.current = result;
        return result;
      });
    }

    // Esperar el resultado
    initPromiseRef.current.then((result) => {
      setStatus(result);
    });
  }, []);

  return status;
}

/**
 * Función auxiliar para reinicializar el dispositivo (ej: al desloguear)
 */
export function resetDeviceInitialization(): void {
  initPromiseRef.current = null;
  resultRef.current = null;
}
