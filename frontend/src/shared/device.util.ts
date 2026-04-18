/**
 * Utilidad para gestionar el token de dispositivo en el cliente POS
 * El token identifica de forma única el dispositivo/máquina que está haciendo la venta
 */

const DEVICE_TOKEN_KEY = 'small-billing.device.token';
const DEVICE_NAME_KEY = 'small-billing.device.name';

interface EnsureDeviceTokenOptions {
  deviceName?: string;
  fingerprintSignal?: string;
  riskSignals?: string[];
}

/**
 * Obtener token del dispositivo almacenado localmente.
 */
export function getOrCreateDeviceToken(): string {
  return localStorage.getItem(DEVICE_TOKEN_KEY) || '';
}

/**
 * Asegurar que el equipo tenga token emitido por backend.
 */
export async function ensureDeviceToken(
  apiUrl: string,
  options?: EnsureDeviceTokenOptions,
): Promise<string> {
  const existingToken = getOrCreateDeviceToken();
  if (existingToken) {
    return existingToken;
  }

  const response = await fetch(`${apiUrl}/api/devices/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deviceName: options?.deviceName || getDeviceName() || undefined,
      fingerprintSignal: options?.fingerprintSignal,
      riskSignals: options?.riskSignals,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error enrolling device: ${response.status}`);
  }

  const payload = await response.json();
  const issuedToken = payload?.deviceToken;
  if (!issuedToken) {
    throw new Error('Respuesta inválida de enrollment: no se recibió token de equipo');
  }

  localStorage.setItem(DEVICE_TOKEN_KEY, issuedToken);
  if (options?.deviceName) {
    setDeviceName(options.deviceName);
  }

  return issuedToken;
}

/**
 * Obtener el nombre del dispositivo
 */
export function getDeviceName(): string | null {
  return localStorage.getItem(DEVICE_NAME_KEY);
}

/**
 * Establecer el nombre del dispositivo
 */
export function setDeviceName(name: string): void {
  localStorage.setItem(DEVICE_NAME_KEY, name);
}

/**
 * Limpiar el token del dispositivo (para resetear la identificación)
 */
export function clearDeviceToken(): void {
  localStorage.removeItem(DEVICE_TOKEN_KEY);
  localStorage.removeItem(DEVICE_NAME_KEY);
}

/**
 * Registrar el dispositivo en el backend
 */
export async function registerDevice(apiUrl: string, deviceName?: string): Promise<any> {
  const deviceToken = await ensureDeviceToken(apiUrl, {
    deviceName,
  });

  try {
    const response = await fetch(`${apiUrl}/api/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceToken,
        deviceName: deviceName || getDeviceName() || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (deviceName) {
      setDeviceName(deviceName);
    }

    return data;
  } catch (error) {
    console.error('Error registering device:', error);
    throw error;
  }
}

/**
 * Asignar una terminal al dispositivo
 */
export async function assignTerminalToDevice(
  apiUrl: string,
  terminalId: number,
): Promise<any> {
  const deviceToken = await ensureDeviceToken(apiUrl);

  try {
    const response = await fetch(
      `${apiUrl}/api/devices/${deviceToken}/assign-terminal/${terminalId}`,
      {
        method: 'POST',
      },
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error assigning terminal:', error);
    throw error;
  }
}

/**
 * Obtener información del dispositivo desde el backend
 */
export async function getDevice(apiUrl: string): Promise<any> {
  const deviceToken = await ensureDeviceToken(apiUrl);

  try {
    const response = await fetch(`${apiUrl}/api/devices/${deviceToken}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }

      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting device info:', error);
    throw error;
  }
}
