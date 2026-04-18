import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCw, Link2, RotateCw, Ban } from 'lucide-react';
import { DeviceDto, TerminalDto } from '@small-billing/shared';
import { deviceApi } from '@/entities/device';
import { terminalApi } from '@/entities/terminal';
import { Button, Card, Input } from '@/shared/ui';
import { useToastContext } from '@/app/providers/toast/ToastProvider';

export function SecurityDevicesPage() {
  const { success, error } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [terminals, setTerminals] = useState<TerminalDto[]>([]);
  const [selectedTerminalId, setSelectedTerminalId] = useState<number | null>(null);
  const [pairingCode, setPairingCode] = useState('');
  const [revokeReason, setRevokeReason] = useState('Token comprometido o equipo reemplazado');

  const activeTerminals = useMemo(() => terminals.filter((terminal) => terminal.active), [terminals]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deviceRows, terminalRows] = await Promise.all([deviceApi.getAll(), terminalApi.getAll()]);
      setDevices(deviceRows);
      setTerminals(terminalRows);
      if (!selectedTerminalId && terminalRows.length > 0) {
        setSelectedTerminalId(terminalRows[0].id);
      }
    } catch (loadError) {
      console.error(loadError);
      error('Error', 'No se pudo cargar la gestión de dispositivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleBind = async () => {
    if (!selectedTerminalId) {
      error('Terminal requerida', 'Selecciona una terminal para vincular.');
      return;
    }
    if (!pairingCode.trim()) {
      error('Código requerido', 'Ingresa el código temporal de pairing.');
      return;
    }

    try {
      await deviceApi.bindTerminal({
        terminalId: selectedTerminalId,
        pairingCode: pairingCode.trim(),
      });
      success('Vinculado', 'El equipo quedó asociado a la terminal seleccionada.');
      setPairingCode('');
      await loadData();
    } catch (bindError) {
      console.error(bindError);
      error('No se pudo vincular', bindError instanceof Error ? bindError.message : 'Error de binding.');
    }
  };

  const handleRotate = async (deviceId: string) => {
    try {
      const result = await deviceApi.rotateToken(deviceId);
      success('Token rotado', `Nuevo token emitido. Últimos 4: ${result.tokenLast4}. Guarda el token en el equipo.`);
    } catch (rotateError) {
      console.error(rotateError);
      error('Error', 'No se pudo rotar el token.');
    }
  };

  const handleRevoke = async (deviceId: string) => {
    try {
      await deviceApi.revoke(deviceId, { reason: revokeReason.trim() || undefined });
      success('Token revocado', 'El equipo quedó bloqueado y no podrá operar.');
      await loadData();
    } catch (revokeError) {
      console.error(revokeError);
      error('Error', 'No se pudo revocar el token.');
    }
  };

  const handleRegeneratePairing = async (deviceId: string) => {
    try {
      const result = await deviceApi.regeneratePairing(deviceId);
      success(
        'Nuevo pairing',
        `Código ${result.pairingCode} válido hasta ${new Date(result.pairingCodeExpiresAt).toLocaleString()}`,
      );
      await loadData();
    } catch (pairingError) {
      console.error(pairingError);
      error('Error', 'No se pudo regenerar el código de pairing.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-6">Cargando gestión de seguridad de dispositivos...</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" /> Seguridad de Dispositivos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Reemplazo seguro de equipos manteniendo continuidad del terminal y secuencias.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void loadData()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Recargar
        </Button>
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Vincular equipo por challenge temporal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Terminal destino</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              value={selectedTerminalId || ''}
              onChange={(event) => setSelectedTerminalId(Number(event.target.value))}
            >
              {activeTerminals.map((terminal) => (
                <option key={terminal.id} value={terminal.id}>
                  {terminal.code} - {terminal.name || 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Código pairing</label>
            <Input
              value={pairingCode}
              onChange={(event) => setPairingCode(event.target.value)}
              placeholder="Ej: 482193"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void handleBind()}>
              <Link2 className="w-4 h-4 mr-2" /> Vincular Equipo
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Terminal</th>
                <th className="px-4 py-3">Riesgo</th>
                <th className="px-4 py-3">Pairing</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-t border-gray-100 dark:border-gray-800 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{device.deviceName || 'Equipo sin nombre'}</div>
                    <div className="text-xs text-gray-500">Token ****{device.tokenLast4 || '----'}</div>
                    <div className="text-xs text-gray-500">Versión {device.tokenVersion}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700">{device.status}</span>
                  </td>
                  <td className="px-4 py-3">{device.terminalId ? `ID ${device.terminalId}` : 'Sin terminal'}</td>
                  <td className="px-4 py-3">{device.riskScore ?? 0}/100</td>
                  <td className="px-4 py-3">
                    {device.pairingCode ? (
                      <div>
                        <div className="font-semibold">{device.pairingCode}</div>
                        <div className="text-xs text-gray-500">
                          {device.pairingCodeExpiresAt
                            ? new Date(device.pairingCodeExpiresAt).toLocaleString()
                            : 'Sin expiración'}
                        </div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 space-y-2 min-w-[300px]">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void handleRegeneratePairing(device.id)}>
                        <Link2 className="w-4 h-4 mr-1" /> Pairing
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void handleRotate(device.id)}>
                        <RotateCw className="w-4 h-4 mr-1" /> Rotar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void handleRevoke(device.id)}>
                        <Ban className="w-4 h-4 mr-1" /> Revocar
                      </Button>
                    </div>
                    <Input
                      value={revokeReason}
                      onChange={(event) => setRevokeReason(event.target.value)}
                      placeholder="Motivo de revocación"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
