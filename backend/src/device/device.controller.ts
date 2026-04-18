import { Controller, Post, Get, Body, Param, BadRequestException, Req } from '@nestjs/common';
import { DeviceService } from './device.service';
import {
  BindTerminalByPairingDto,
  DeviceEnrollmentRequestDto,
  RegisterDeviceDto,
  RevokeDeviceDto,
} from '@small-billing/shared';

/**
 * Endpoints para gestión de dispositivos POS
 */
@Controller('api/devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  /**
   * POST /api/devices/enroll
   * Provisionar un dispositivo nuevo con token emitido por backend.
   */
  @Post('enroll')
  async enrollDevice(@Body() dto: DeviceEnrollmentRequestDto, @Req() req: any): Promise<any> {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    return await this.deviceService.enrollDevice(dto, ipAddress);
  }

  /**
   * POST /api/devices/register
   * Registrar o actualizar un dispositivo
   * Body: { deviceToken, deviceName? }
   */
  @Post('register')
  async registerDevice(@Body() dto: RegisterDeviceDto, @Req() req: any): Promise<any> {
    if (!dto.deviceToken) {
      throw new BadRequestException('deviceToken es requerido');
    }

    // Extraer IP del cliente
    const ipAddress = req.ip || req.connection?.remoteAddress;

    return await this.deviceService.registerDevice(dto, ipAddress);
  }

  /**
   * GET /api/devices
   * Listado de dispositivos para gestión de seguridad.
   */
  @Get()
  async listDevices(): Promise<any[]> {
    return await this.deviceService.listDevices();
  }

  /**
   * POST /api/devices/bind-terminal
   * Vincula terminal con código de pairing temporal.
   */
  @Post('bind-terminal')
  async bindTerminal(@Body() dto: BindTerminalByPairingDto): Promise<any> {
    return await this.deviceService.bindTerminalByPairingCode(dto);
  }

  /**
   * POST /api/devices/:deviceId/rotate-token
   * Rota token del equipo y devuelve token nuevo una sola vez.
   */
  @Post(':deviceId/rotate-token')
  async rotateToken(@Param('deviceId') deviceId: string): Promise<any> {
    return await this.deviceService.rotateToken(deviceId);
  }

  /**
   * POST /api/devices/:deviceId/revoke
   * Revoca token del equipo y bloquea su uso.
   */
  @Post(':deviceId/revoke')
  async revokeDevice(@Param('deviceId') deviceId: string, @Body() dto: RevokeDeviceDto): Promise<any> {
    return await this.deviceService.revokeDevice(deviceId, dto);
  }

  /**
   * POST /api/devices/:deviceId/regenerate-pairing
   * Genera un nuevo código temporal de pairing.
   */
  @Post(':deviceId/regenerate-pairing')
  async regeneratePairing(@Param('deviceId') deviceId: string): Promise<any> {
    return await this.deviceService.regeneratePairingCode(deviceId);
  }

  /**
   * POST /api/devices/:deviceToken/assign-terminal/:terminalId
   * Asignar una terminal a un dispositivo
   */
  @Post(':deviceToken/assign-terminal/:terminalId')
  async assignTerminal(
    @Param('deviceToken') deviceToken: string,
    @Param('terminalId') terminalId: string,
  ): Promise<any> {
    const terminalIdNum = parseInt(terminalId, 10);

    if (isNaN(terminalIdNum)) {
      throw new BadRequestException('terminalId debe ser un número válido');
    }

    return await this.deviceService.assignTerminalToDevice(deviceToken, terminalIdNum);
  }

  /**
   * GET /api/devices/:deviceToken
   * Obtener información del dispositivo
   */
  @Get(':deviceToken')
  async getDevice(@Param('deviceToken') deviceToken: string): Promise<any> {
    return await this.deviceService.getDeviceByToken(deviceToken);
  }

  /**
   * PUT /api/devices/:deviceToken/deactivate
   * Desactivar un dispositivo
   */
  @Post(':deviceToken/deactivate')
  async deactivateDevice(@Param('deviceToken') deviceToken: string): Promise<{ message: string }> {
    await this.deviceService.deactivateDevice(deviceToken);
    return { message: 'Dispositivo desactivado exitosamente' };
  }

  /**
   * GET /api/devices/terminal/:terminalId
   * Obtener todos los dispositivos de una terminal
   */
  @Get('terminal/:terminalId')
  async getTerminalDevices(@Param('terminalId') terminalId: string): Promise<any[]> {
    const terminalIdNum = parseInt(terminalId, 10);

    if (isNaN(terminalIdNum)) {
      throw new BadRequestException('terminalId debe ser un número válido');
    }

    return await this.deviceService.getDevicesByTerminal(terminalIdNum);
  }
}
