/**
 * Utilidad para gestionar el token de dispositivo en el cliente POS
 * 
 * ARQUITECTURA DE 3 CAPAS:
 * 1. Hardware Fingerprint: Identifica el equipo físico (GPU, CPU, Screen)
 * 2. Device Token: Emitido por servidor, único por equipo
 * 3. Terminal Assignment: Backend sabe automáticamente a qué terminal pertenece
 */

const DEVICE_TOKEN_KEY = 'small-billing.device.token';
const DEVICE_NAME_KEY = 'small-billing.device.name';
const HARDWARE_FINGERPRINT_KEY = 'small-billing.hardware.fingerprint';

interface EnsureDeviceTokenOptions {
  deviceName?: string;
  fingerprintSignal?: string;
  riskSignals?: string[];
}

/**
 * Generar hardware fingerprint INDEPENDIENTE del navegador
 * Basado SOLO en características físicas del equipo
 */
async function generateHardwareFingerprint(): Promise<string> {
  try {
    const components: string[] = [];

    // GPU - La característica más única del hardware
    const gpuInfo = await getStableGPUInfo();
    if (gpuInfo) {
      components.push(`gpu:${gpuInfo}`);
    }

    // CPU cores - Invariable en el equipo
    if (navigator.hardwareConcurrency) {
      components.push(`cpu:${navigator.hardwareConcurrency}`);
    }

    // Display - Normalmente fija en un equipo
    components.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`);
    components.push(`pixelRatio:${window.devicePixelRatio || 1}`);

    // Memory - Typically constant per device
    if ('deviceMemory' in navigator) {
      components.push(`memory:${(navigator as any).deviceMemory}`);
    }

    // Timezone - Invariable por ubicación física
    components.push(`timezone:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

    // Platform - Device OS
    components.push(`platform:${navigator.platform}`);

    // Canvas fingerprint (estable)
    const canvasFingerprint = getStableCanvasFingerprint();
    components.push(`canvas:${canvasFingerprint}`);

    return simpleHash(components.join('|')).substring(0, 32);
  } catch (error) {
    console.warn('Error generating hardware fingerprint:', error);
    return 'fallback-' + Date.now().toString(36);
  }
}

/**
 * GPU info estable entre navegadores
 */
async function getStableGPUInfo(): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || 
               canvas.getContext('experimental-webgl') as WebGLRenderingContextBase | null;
    
    if (!gl) return null;

    const vendor = gl.getParameter(gl.VENDOR);
    const renderer = gl.getParameter(gl.RENDERER);
    
    return `${vendor}|${renderer}`;
  } catch {
    return null;
  }
}

/**
 * Canvas fingerprint estable
 */
function getStableCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d')!;
    
    ctx.textBaseline = 'alphabetic';
    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('POS-Terminal-' + new Date().getFullYear(), 2, 20);
    
    const dataURL = canvas.toDataURL();
    return simpleHash(dataURL).substring(0, 12);
  } catch {
    return 'canvas-error';
  }
}

/**
 * Hash simple pero consistente
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Obtener hardware fingerprint del equipo (generado o en cache)
 */
export async function getHardwareFingerprint(): Promise<string> {
  try {
    const cached = localStorage.getItem(HARDWARE_FINGERPRINT_KEY);
    if (cached && cached !== 'fallback' && !cached.startsWith('fallback-')) {
      return cached;
    }

    const fresh = await generateHardwareFingerprint();
    localStorage.setItem(HARDWARE_FINGERPRINT_KEY, fresh);
    return fresh;
  } catch (error) {
    console.error('Error getting hardware fingerprint:', error);
    return 'unknown-' + Date.now().toString(36);
  }
}

/**
 * Obtener token del dispositivo almacenado localmente.
 * Retorna string vacío si no existe (importante para validación)
 */
export function getOrCreateDeviceToken(): string {
  const token = localStorage.getItem(DEVICE_TOKEN_KEY);
  // Validar que sea un token válido (no vacío, no corrupto)
  if (token && typeof token === 'string' && token.trim().length > 0) {
    return token.trim();
  }
  return '';
}

/**
 * Asegurar que el equipo tenga token emitido por backend.
 * Usa hardware fingerprint como identificador primario del equipo
 */
export async function ensureDeviceToken(
  apiUrl: string,
  options?: EnsureDeviceTokenOptions,
): Promise<string> {
  // 1. Verificar si ya existe token válido
  const existingToken = getOrCreateDeviceToken();
  if (existingToken && existingToken.length > 10) {
    console.log('[Device] Token existente reutilizado');
    return existingToken;
  }

  // 2. Generar hardware fingerprint (equipo físico)
  const hardwareFingerprint = await getHardwareFingerprint();
  console.log('[Device] Hardware fingerprint:', hardwareFingerprint.substring(0, 16) + '...');

  // 3. Enviar a backend para obtener token
  try {
    const response = await fetch(`${apiUrl}/api/devices/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hardwareFingerprint, // Backend usa esto como ID primario
        deviceName: options?.deviceName || getDeviceName() || 'POS_Terminal',
        fingerprintSignal: options?.fingerprintSignal,
        riskSignals: options?.riskSignals,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error enrolling device: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const issuedToken = payload?.deviceToken;
    
    if (!issuedToken || typeof issuedToken !== 'string' || issuedToken.length < 10) {
      throw new Error('Respuesta inválida: token no válido recibido del servidor');
    }

    // 4. Guardar token localmente
    localStorage.setItem(DEVICE_TOKEN_KEY, issuedToken);
    if (options?.deviceName) {
      setDeviceName(options.deviceName);
    }

    console.log('[Device] Nuevo token generado y almacenado');
    return issuedToken;
  } catch (error) {
    console.error('[Device] Error en ensureDeviceToken:', error);
    throw error;
  }
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
 * Registrar o actualizar el dispositivo en el backend
 * IMPORTANTE: Solo se llama UNA VEZ al iniciar la app
 */
export async function registerDevice(apiUrl: string, deviceName?: string): Promise<any> {
  const attempt = async (retry: boolean = true): Promise<any> => {
    try {
      const deviceToken = await ensureDeviceToken(apiUrl, { deviceName });
      
      const response = await fetch(`${apiUrl}/api/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceToken,
          deviceName: deviceName || getDeviceName() || 'POS_Terminal',
        }),
      });

      if (!response.ok) {
        if (response.status === 404 && retry) {
          console.warn('[Device] Token no reconocido, regenerando...');
          clearDeviceToken();
          return attempt(false); // Reintenta UNA sola vez
        }
        throw new Error(`Error registering device: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Device] Dispositivo registrado exitosamente', {
        deviceId: data?.id,
        terminalId: data?.terminalId,
      });
      
      if (deviceName) {
        setDeviceName(deviceName);
      }

      return data;
    } catch (error) {
      console.error('[Device] Error in registerDevice:', error);
      throw error;
    }
  };

  return attempt();
}

/**
 * Obtener información del dispositivo desde el servidor
 * Usado para validar que el dispositivo sigue siendo válido
 */
export async function getDevice(apiUrl: string): Promise<any> {
  try {
    const deviceToken = getOrCreateDeviceToken();
    
    if (!deviceToken) {
      console.log('[Device] No hay token disponible para consultar');
      return null;
    }

    const response = await fetch(`${apiUrl}/api/devices/${deviceToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      console.warn('[Device] Token no encontrado en servidor');
      return null;
    }

    if (!response.ok) {
      throw new Error(`Error fetching device: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Device] Device info retrieved', { terminalId: data?.terminalId });
    return data;
  } catch (error) {
    console.error('[Device] Error fetching device info:', error);
    return null;
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
