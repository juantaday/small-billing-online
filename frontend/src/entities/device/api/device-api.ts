import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import {
  BindTerminalByPairingDto,
  DeviceDto,
  DeviceEnrollmentRequestDto,
  DeviceEnrollmentResponseDto,
  RegisterDeviceDto,
  RevokeDeviceDto,
  RotateDeviceTokenResponseDto,
} from '@small-billing/shared';

class DeviceApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<DeviceDto[]> {
    return this.get<DeviceDto[]>('/api/devices');
  }

  async enroll(data: DeviceEnrollmentRequestDto): Promise<DeviceEnrollmentResponseDto> {
    return this.post<DeviceEnrollmentResponseDto>('/api/devices/enroll', data);
  }

  async register(data: RegisterDeviceDto): Promise<DeviceDto> {
    return this.post<DeviceDto>('/api/devices/register', data);
  }

  async bindTerminal(data: BindTerminalByPairingDto): Promise<DeviceDto> {
    return this.post<DeviceDto>('/api/devices/bind-terminal', data);
  }

  async rotateToken(deviceId: string): Promise<RotateDeviceTokenResponseDto> {
    return this.post<RotateDeviceTokenResponseDto>(`/api/devices/${deviceId}/rotate-token`);
  }

  async revoke(deviceId: string, data: RevokeDeviceDto): Promise<DeviceDto> {
    return this.post<DeviceDto>(`/api/devices/${deviceId}/revoke`, data);
  }

  async regeneratePairing(deviceId: string): Promise<{ pairingCode: string; pairingCodeExpiresAt: Date }> {
    return this.post<{ pairingCode: string; pairingCodeExpiresAt: Date }>(
      `/api/devices/${deviceId}/regenerate-pairing`,
    );
  }
}

export const deviceApi = new DeviceApi();
