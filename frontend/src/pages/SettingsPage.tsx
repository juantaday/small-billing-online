import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, RefreshCw } from 'lucide-react';
import {
  Card,
  Input,
  Loading,
  Modal,
  SpinnerLoading,
  Button,
} from '@/shared/ui';
import { useToastContext } from '@/app/providers/toast/ToastProvider';
import {
  CreateDocumentTypeDto,
  CreateBusinessDetailsDto,
  CreateTerminalDto,
  CreateTerminalSettingsDto,
  CreateWarehouseDto,
  BusinessDetailsDto,
  BusinessTypeDto,
  BusinessTypeGroup,
  DocumentTypeDto,
  LogoSize,
  TerminalDto,
  TerminalSettingsDto,
  UpdateBusinessDetailsDto,
  UpdateDocumentTypeDto,
  UpdateTerminalDto,
  UpdateTerminalSettingsDto,
  UpdateWarehouseDto,
  WarehouseDto,
} from '@small-billing/shared';
import { businessTypeApi } from '@/entities/business-type';
import { businessDetailsApi } from '@/entities/business-details';
import { documentTypeApi } from '@/entities/document-type';
import { warehouseApi } from '@/entities/warehouse';
import { terminalApi } from '@/entities/terminal';
import { terminalSettingsApi } from '@/entities/terminal-settings';
import { deviceApi } from '@/entities/device';
import { getDevice } from '@/shared/device.util';
import { API_CONFIG } from '@/shared/config';

type SectionKey = 'business' | 'document-types' | 'warehouses' | 'terminals' | 'printer-settings' | 'sequences';

type DocumentTypeForm = CreateDocumentTypeDto & { id?: number };
type WarehouseForm = CreateWarehouseDto & { id?: number };
type TerminalForm = CreateTerminalDto & { id?: number };
type TerminalSettingsForm = CreateTerminalSettingsDto & {
  id?: string;
  enabled: boolean;
};
type SequenceForm = {
  id?: string;
  documentTypeId: number;
  lastSequential: number;
};

type BusinessDetailsForm = CreateBusinessDetailsDto & { id?: string };

type TerminalSettingRow = TerminalSettingsDto & {
  terminal?: TerminalDto & { warehouse?: WarehouseDto };
  documentType?: DocumentTypeDto;
};

const defaultDocumentTypeForm = (): DocumentTypeForm => ({
  documentName: '',
  itemsAutoGenerate: 0,
  indefinite: false,
  documentCategoryId: 1,
  idGroupNumeration: 1,
  codSRI: '',
  active: true,
});

const defaultWarehouseForm = (): WarehouseForm => ({
  name: '',
  establishmentCode: '',
  active: true,
});

const defaultTerminalForm = (warehouseId?: number): TerminalForm => ({
  code: '',
  name: '',
  warehouseId: warehouseId || 0,
  deviceToken: '',
  emissionPoint: '',
  active: true,
});

const defaultTerminalSettingsForm = (terminalId?: number, documentTypeId?: number): TerminalSettingsForm => ({
  terminalId: terminalId || 0,
  documentTypeId: documentTypeId || 1,
  namePrinter: '',
  characterLine: 40,
  withLogo: LogoSize.SMALL,
  maxItems: 100,
  linesPerTransaction: 0,
  enabled: true,
});

const defaultSequenceForm = (): SequenceForm => ({
  documentTypeId: 1,
  lastSequential: 0,
});

const defaultBusinessDetailsForm = (): BusinessDetailsForm => ({
  ruc: '',
  legalName: '',
  commercialName: '',
  tradeName: '',
  phone: '',
  address: '',
  legalNatureId: 0,
  taxRegimeId: 0,
  specialDesignationId: undefined,
});

function padSequential(value: number): string {
  return String(Math.max(1, value)).padStart(9, '0');
}

const sectionLabels: Record<SectionKey, string> = {
  business: 'Negocio',
  'document-types': 'Tipos de documento',
  warehouses: 'Bodegas',
  terminals: 'Terminales',
  'printer-settings': 'Impresoras y límites',
  sequences: 'Secuenciales',
};

export function SettingsPage({ section: initialSection = 'business' }: { section?: 'business' | 'system' | 'printers' }) {
  const { success, error } = useToastContext();

  const [activeSection, setActiveSection] = useState<SectionKey>(
    initialSection === 'business' ? 'business' :
    initialSection === 'system' ? 'document-types' : 'printer-settings'
  );

  // Update active section when props change
  useEffect(() => {
    setActiveSection(
      initialSection === 'business' ? 'business' :
      initialSection === 'system' ? 'document-types' : 'printer-settings'
    );
  }, [initialSection]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [terminals, setTerminals] = useState<TerminalDto[]>([]);
  const [terminalSettings, setTerminalSettings] = useState<TerminalSettingRow[]>([]);
  const [currentTerminalId, setCurrentTerminalId] = useState<number | undefined>(undefined);
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeDto[]>([]);
  const [businessDetails, setBusinessDetails] = useState<BusinessDetailsDto | null>(null);

  const [documentTypeForm, setDocumentTypeForm] = useState<DocumentTypeForm>(defaultDocumentTypeForm());
  const [warehouseForm, setWarehouseForm] = useState<WarehouseForm>(defaultWarehouseForm());
  const [terminalForm, setTerminalForm] = useState<TerminalForm>(defaultTerminalForm());
  const [terminalSettingsForm, setTerminalSettingsForm] = useState<TerminalSettingsForm>(defaultTerminalSettingsForm());
  const [sequenceForm, setSequenceForm] = useState<SequenceForm>(defaultSequenceForm());
  const [businessDetailsForm, setBusinessDetailsForm] = useState<BusinessDetailsForm>(defaultBusinessDetailsForm());
  const [documentTypePreviewTerminalId, setDocumentTypePreviewTerminalId] = useState<number | undefined>(
    undefined,
  );

  const [isDocumentTypeModalOpen, setIsDocumentTypeModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [isTerminalSettingsModalOpen, setIsTerminalSettingsModalOpen] = useState(false);
  const [isSequenceModalOpen, setIsSequenceModalOpen] = useState(false);

  const warehouseById = useMemo(() => new Map(warehouses.map((item) => [item.id, item])), [warehouses]);
  const terminalById = useMemo(() => new Map(terminals.map((item) => [item.id, item])), [terminals]);
  const documentTypeById = useMemo(
    () => new Map(documentTypes.map((item) => [item.id, item])),
    [documentTypes],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        documentTypesData,
        warehousesData,
        terminalsData,
        deviceData,
        businessTypesData,
        businessDetailsData,
      ] = await Promise.all([
        documentTypeApi.getAll(),
        warehouseApi.getAll(),
        terminalApi.getAll(),
        getDevice(API_CONFIG.BASE_URL).catch(() => null),
        businessTypeApi.getAll().catch(() => []),
        businessDetailsApi.getCurrent().catch(() => null),
      ]);

      const devicesData = await deviceApi.getAll().catch(() => []);

      const terminalSettingsData = await Promise.all(
        terminalsData.map(async (terminal) => {
          try {
            return await terminalSettingsApi.getAllByTerminal(terminal.id);
          } catch {
            return [] as TerminalSettingRow[];
          }
        }),
      );

      setDocumentTypes(documentTypesData);
      setWarehouses(warehousesData);
      setTerminals(terminalsData);
      setTerminalSettings(terminalSettingsData.flat() as TerminalSettingRow[]);
      setBusinessTypes(businessTypesData);
      setBusinessDetails(businessDetailsData);

      const resolvedTerminalId =
        typeof deviceData?.terminalId === 'number'
          ? deviceData.terminalId
          : typeof deviceData?.terminal?.id === 'number'
            ? deviceData.terminal.id
            : undefined;

      const pairedTerminalIds = Array.from(
        new Set(
          devicesData
            .filter((device) => device.active && device.status === 'PAIRED' && typeof device.terminalId === 'number')
            .map((device) => device.terminalId as number),
        ),
      );

      const fallbackTerminalId = pairedTerminalIds.length === 1 ? pairedTerminalIds[0] : undefined;
      setCurrentTerminalId(resolvedTerminalId ?? fallbackTerminalId);

      const legalNatureDefault = businessTypesData.find(
        (item) => item.group === BusinessTypeGroup.LEGAL_NATURE && item.active,
      )?.id;
      const taxRegimeDefault = businessTypesData.find(
        (item) => item.group === BusinessTypeGroup.TAX_REGIME && item.active,
      )?.id;

      if (businessDetailsData) {
        setBusinessDetailsForm({
          id: businessDetailsData.id,
          ruc: businessDetailsData.ruc,
          legalName: businessDetailsData.legalName,
          commercialName: businessDetailsData.commercialName || '',
          tradeName: businessDetailsData.tradeName || '',
          phone: businessDetailsData.phone || '',
          address: businessDetailsData.address || '',
          legalNatureId: businessDetailsData.legalNatureId,
          taxRegimeId: businessDetailsData.taxRegimeId,
          specialDesignationId: businessDetailsData.specialDesignationId || undefined,
        });
      } else {
        setBusinessDetailsForm({
          ...defaultBusinessDetailsForm(),
          legalNatureId: legalNatureDefault || 0,
          taxRegimeId: taxRegimeDefault || 0,
        });
      }
    } catch (loadError) {
      console.error('Error cargando configuración', loadError);
      error('Error de carga', 'No se pudieron cargar los catálogos de configuración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [reloadTick]);

  const resolveSequenceForm = (documentTypeId: number): SequenceForm => {
    const existingSetting =
      currentTerminalId !== undefined
        ? terminalSettings.find(
            (item) =>
              item.terminalId === currentTerminalId &&
              item.documentTypeId === documentTypeId,
          )
        : undefined;

    return {
      id: existingSetting?.id,
      documentTypeId,
      lastSequential: existingSetting?.lastSequential || 0,
    };
  };

  const refreshData = async () => {
    setReloadTick((value) => value + 1);
  };

  const openDocumentTypeModal = (item?: DocumentTypeDto) => {
    setDocumentTypeForm(
      item
        ? {
            id: item.id,
            documentName: item.documentName,
            itemsAutoGenerate: item.itemsAutoGenerate,
            indefinite: item.indefinite,
            documentCategoryId: item.documentCategoryId,
            idGroupNumeration: item.idGroupNumeration,
            codSRI: item.codSRI || '',
            active: item.active,
          }
        : defaultDocumentTypeForm(),
    );
      setDocumentTypePreviewTerminalId(terminals[0]?.id);
    setIsDocumentTypeModalOpen(true);
  };

  const openWarehouseModal = (item?: WarehouseDto) => {
    setWarehouseForm(
      item
        ? {
            id: item.id,
            name: item.name,
            establishmentCode: item.establishmentCode,
            active: item.active,
          }
        : defaultWarehouseForm(),
    );
    setIsWarehouseModalOpen(true);
  };

  const openTerminalModal = (item?: TerminalDto) => {
    setTerminalForm(
      item
        ? {
            id: item.id,
            code: item.code,
            name: item.name || '',
            warehouseId: item.warehouseId,
            // Never preload masked token (e.g. ****4802) in edit mode.
            // If user wants to rebind, they must type a real token or pairing code.
            deviceToken: '',
            emissionPoint: item.emissionPoint,
            active: item.active,
          }
        : defaultTerminalForm(warehouses[0]?.id),
    );
    setIsTerminalModalOpen(true);
  };

  const openTerminalSettingsModal = (item?: TerminalSettingRow) => {
    setTerminalSettingsForm(
      item
        ? {
            id: item.id,
            terminalId: item.terminalId,
            documentTypeId: item.documentTypeId,
            namePrinter: item.namePrinter || '',
            characterLine: item.characterLine || 40,
            withLogo: (item.withLogo || LogoSize.SMALL) as LogoSize,
            maxItems: item.maxItems,
            linesPerTransaction: item.linesPerTransaction || 0,
            enabled: item.enabled,
          }
        : defaultTerminalSettingsForm(terminals[0]?.id, documentTypes[0]?.id),
    );
    setIsTerminalSettingsModalOpen(true);
  };

  const openSequenceModal = (item?: TerminalSettingRow) => {
    if (item) {
      setSequenceForm({
        id: item.id,
        documentTypeId: item.documentTypeId,
        lastSequential: item.lastSequential || 0,
      });
    } else {
      const defaultDocumentTypeId = documentTypes[0]?.id || 1;
      setSequenceForm(resolveSequenceForm(defaultDocumentTypeId));
    }

    setIsSequenceModalOpen(true);
  };

  const buildInvoicePreview = (
    terminalId: number | undefined,
    documentTypeId: number | undefined,
    nextSequential: number,
  ): string => {
    if (!terminalId || !documentTypeId) {
      return 'Selecciona terminal y tipo de documento';
    }

    const terminal = terminalById.get(terminalId);
    if (!terminal) {
      return 'Terminal no encontrada';
    }

    const warehouse = warehouseById.get(terminal.warehouseId);
    if (!warehouse) {
      return 'Bodega de terminal no encontrada';
    }

    return `${warehouse.establishmentCode}-${terminal.emissionPoint}-${padSequential(nextSequential)}`;
  };

  const selectedSequenceTerminal =
    currentTerminalId !== undefined
      ? terminalById.get(currentTerminalId)
      : undefined;
  const selectedSequenceWarehouse = selectedSequenceTerminal
    ? warehouseById.get(selectedSequenceTerminal.warehouseId)
    : undefined;

  const sequencePreview = useMemo(() => {
    const current = Number(sequenceForm.lastSequential || 0);
    return buildInvoicePreview(
      currentTerminalId,
      sequenceForm.documentTypeId,
      current + 1,
    );
  }, [
    currentTerminalId,
    sequenceForm.documentTypeId,
    sequenceForm.lastSequential,
    terminalById,
    warehouseById,
  ]);

  const documentTypePreview = useMemo(() => {
    const documentTypeId = documentTypeForm.id;

    if (!documentTypeId) {
      return buildInvoicePreview(documentTypePreviewTerminalId, documentTypes[0]?.id, 1);
    }

    const terminal =
      documentTypePreviewTerminalId !== undefined
        ? terminalById.get(documentTypePreviewTerminalId)
        : undefined;
    const warehouse = terminal ? warehouseById.get(terminal.warehouseId) : undefined;

    const existingSequence = terminal && warehouse
      ? terminalSettings.find(
          (sequence) =>
            sequence.documentTypeId === documentTypeId &&
            sequence.terminalId === terminal.id,
        )
      : undefined;

    const nextSequential = (existingSequence?.lastSequential || 0) + 1;

    return buildInvoicePreview(documentTypePreviewTerminalId, documentTypeId, nextSequential);
  }, [
    buildInvoicePreview,
    documentTypeForm.id,
    documentTypePreviewTerminalId,
    documentTypes,
    terminalSettings,
    terminalById,
    warehouseById,
  ]);

  const legalNatureOptions = businessTypes.filter(
    (item) => item.group === BusinessTypeGroup.LEGAL_NATURE && item.active,
  );
  const taxRegimeOptions = businessTypes.filter(
    (item) => item.group === BusinessTypeGroup.TAX_REGIME && item.active,
  );
  const specialDesignationOptions = businessTypes.filter(
    (item) => item.group === BusinessTypeGroup.SPECIAL_DESIGNATION && item.active,
  );

  const saveDocumentType = async () => {
    try {
      setSaving(true);
      const payload = {
        documentName: documentTypeForm.documentName.trim(),
        itemsAutoGenerate: Number(documentTypeForm.itemsAutoGenerate || 0),
        indefinite: Boolean(documentTypeForm.indefinite),
        documentCategoryId: Number(documentTypeForm.documentCategoryId || 1),
        idGroupNumeration: Number(documentTypeForm.idGroupNumeration || 1),
        codSRI: documentTypeForm.codSRI?.trim() || null,
        active: Boolean(documentTypeForm.active),
      } satisfies CreateDocumentTypeDto;

      if (documentTypeForm.id) {
        await documentTypeApi.update(documentTypeForm.id, { ...payload, id: documentTypeForm.id } satisfies UpdateDocumentTypeDto);
        success('Actualizado', 'Tipo de documento actualizado correctamente.');
      } else {
        await documentTypeApi.create(payload);
        success('Creado', 'Tipo de documento creado correctamente.');
      }

      setIsDocumentTypeModalOpen(false);
      await refreshData();
    } catch (saveError) {
      console.error('Error guardando tipo de documento', saveError);
      error('Error', 'No se pudo guardar el tipo de documento.');
    } finally {
      setSaving(false);
    }
  };

  const saveWarehouse = async () => {
    try {
      setSaving(true);
      const payload = {
        name: warehouseForm.name.trim(),
        establishmentCode: warehouseForm.establishmentCode.trim(),
        active: Boolean(warehouseForm.active),
      } satisfies CreateWarehouseDto;

      if (warehouseForm.id) {
        await warehouseApi.update(warehouseForm.id, { ...payload, id: warehouseForm.id } satisfies UpdateWarehouseDto);
        success('Actualizada', 'Bodega actualizada correctamente.');
      } else {
        await warehouseApi.create(payload);
        success('Creada', 'Bodega creada correctamente.');
      }

      setIsWarehouseModalOpen(false);
      await refreshData();
    } catch (saveError) {
      console.error('Error guardando bodega', saveError);
      error('Error', 'No se pudo guardar la bodega.');
    } finally {
      setSaving(false);
    }
  };

  const saveTerminal = async () => {
    if (!terminalForm.warehouseId) {
      error('Bodega requerida', 'Debes seleccionar una bodega para la terminal.');
      return;
    }

    const rawDeviceCredential = terminalForm.deviceToken?.trim() || '';

    if (!terminalForm.id && !rawDeviceCredential) {
      error('Equipo requerido', 'Debes ingresar token o código pairing del equipo para asociarlo a la terminal.');
      return;
    }

    const isPairingCode = /^\d{6}$/.test(rawDeviceCredential);

    try {
      setSaving(true);
      const payload = {
        code: terminalForm.code.trim(),
        name: terminalForm.name?.trim() || null,
        warehouseId: Number(terminalForm.warehouseId),
        deviceToken: isPairingCode ? undefined : rawDeviceCredential,
        pairingCode: isPairingCode ? rawDeviceCredential : undefined,
        emissionPoint: terminalForm.emissionPoint.trim(),
        active: Boolean(terminalForm.active),
      } satisfies CreateTerminalDto;

      if (terminalForm.id) {
        await terminalApi.update(terminalForm.id, { ...payload, id: terminalForm.id } satisfies UpdateTerminalDto);
        success('Actualizada', 'Terminal actualizada correctamente.');
      } else {
        await terminalApi.create(payload);
        success('Creada', 'Terminal creada correctamente.');
      }

      setIsTerminalModalOpen(false);
      await refreshData();
    } catch (saveError) {
      console.error('Error guardando terminal', saveError);
      error('Error', 'No se pudo guardar la terminal.');
    } finally {
      setSaving(false);
    }
  };

  const saveTerminalSettings = async () => {
    if (!terminalSettingsForm.terminalId || !terminalSettingsForm.documentTypeId) {
      error('Datos incompletos', 'Selecciona terminal y tipo de documento.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        terminalId: Number(terminalSettingsForm.terminalId),
        documentTypeId: Number(terminalSettingsForm.documentTypeId),
        namePrinter: terminalSettingsForm.namePrinter?.trim() || undefined,
        characterLine: terminalSettingsForm.characterLine ? Number(terminalSettingsForm.characterLine) : undefined,
        withLogo: terminalSettingsForm.withLogo || undefined,
        maxItems: Number(terminalSettingsForm.maxItems || 0),
        linesPerTransaction: terminalSettingsForm.linesPerTransaction ? Number(terminalSettingsForm.linesPerTransaction) : undefined,
      } satisfies CreateTerminalSettingsDto;

      if (terminalSettingsForm.id) {
        await terminalSettingsApi.update(payload.terminalId, payload.documentTypeId, {
          namePrinter: payload.namePrinter || undefined,
          characterLine: payload.characterLine || undefined,
          withLogo: payload.withLogo || undefined,
          maxItems: payload.maxItems,
          linesPerTransaction: payload.linesPerTransaction || undefined,
          enabled: Boolean(terminalSettingsForm.enabled),
        } satisfies UpdateTerminalSettingsDto);
        success('Actualizada', 'Configuración de impresora actualizada correctamente.');
      } else {
        await terminalSettingsApi.create(payload);
        success('Creada', 'Configuración de impresora creada correctamente.');
      }

      setIsTerminalSettingsModalOpen(false);
      await refreshData();
    } catch (saveError) {
      console.error('Error guardando configuración', saveError);
      error('Error', 'No se pudo guardar la configuración de impresora.');
    } finally {
      setSaving(false);
    }
  };

  const saveSequence = async () => {
    if (!currentTerminalId || !sequenceForm.documentTypeId) {
      error('Equipo no configurado', 'Este equipo no tiene terminal asignada o falta tipo de documento.');
      return;
    }

    const terminal = terminalById.get(currentTerminalId);
    const warehouse = terminal ? warehouseById.get(terminal.warehouseId) : undefined;

    if (!terminal || !warehouse) {
      error('Datos inválidos', 'No se pudo resolver la relación terminal-bodega para el secuencial.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        terminalId: currentTerminalId,
        documentTypeId: Number(sequenceForm.documentTypeId),
        lastSequential: Number(sequenceForm.lastSequential || 0),
      };

      if (sequenceForm.id) {
        await terminalSettingsApi.update(currentTerminalId, payload.documentTypeId, {
          lastSequential: payload.lastSequential,
        });
        success('Actualizada', 'Secuencial actualizado correctamente.');
      } else {
        await terminalSettingsApi.create({
          terminalId: currentTerminalId,
          documentTypeId: payload.documentTypeId,
          maxItems: 100,
          lastSequential: payload.lastSequential,
        });
        success('Creada', 'Secuencial creado correctamente.');
      }

      setIsSequenceModalOpen(false);
      await refreshData();
    } catch (saveError) {
      console.error('Error guardando secuencial', saveError);
      error('Error', 'No se pudo guardar el secuencial.');
    } finally {
      setSaving(false);
    }
  };

  const saveBusinessDetails = async () => {
    if (!businessDetailsForm.ruc.trim()) {
      error('RUC requerido', 'Ingresa el RUC del negocio.');
      return;
    }

    if (!businessDetailsForm.legalName.trim()) {
      error('Razón social requerida', 'Ingresa la razón social del negocio.');
      return;
    }

    if (!businessDetailsForm.legalNatureId || !businessDetailsForm.taxRegimeId) {
      error('Tipos requeridos', 'Selecciona naturaleza legal y régimen tributario.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ruc: businessDetailsForm.ruc.trim(),
        legalName: businessDetailsForm.legalName.trim(),
        commercialName: businessDetailsForm.commercialName?.trim() || null,
        tradeName: businessDetailsForm.tradeName?.trim() || null,
        phone: businessDetailsForm.phone?.trim() || null,
        address: businessDetailsForm.address?.trim() || null,
        legalNatureId: Number(businessDetailsForm.legalNatureId),
        taxRegimeId: Number(businessDetailsForm.taxRegimeId),
        specialDesignationId: businessDetailsForm.specialDesignationId || null,
      } satisfies CreateBusinessDetailsDto;

      if (businessDetailsForm.id) {
        await businessDetailsApi.update(businessDetailsForm.id, {
          id: businessDetailsForm.id,
          ...payload,
        } satisfies UpdateBusinessDetailsDto);
        success('Actualizado', 'Datos del negocio actualizados correctamente.');
      } else {
        const created = await businessDetailsApi.create(payload);
        setBusinessDetailsForm((prev) => ({ ...prev, id: created.id }));
        success('Creado', 'Datos del negocio guardados correctamente.');
      }

      await refreshData();
    } catch (saveError) {
      console.error('Error guardando datos del negocio', saveError);
      error('Error', 'No se pudo guardar la configuración del negocio.');
    } finally {
      setSaving(false);
    }
  };

  const loadingContent = <Loading fullscreen message="Cargando configuración..." />;

  if (loading) {
    return loadingContent;
  }

  const getAllowedSections = (): SectionKey[] => {
    if (initialSection === 'business') return ['business', 'warehouses'];
    if (initialSection === 'system') return ['document-types', 'terminals', 'sequences'];
    return ['printer-settings'];
  };

  const allowedSections = getAllowedSections();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {initialSection === 'business' ? 'Configuración del Negocio' :
             initialSection === 'system' ? 'Configuración del Sistema' : 'Configuración de Impresoras'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona {initialSection === 'business' ? 'los datos de tu negocio y bodegas.' :
                       initialSection === 'system' ? 'tipos de documento, terminales y secuenciales.' :
                       'las impresoras y límites de impresión en tu equipo local.'}
          </p>
        </div>

        <button
          onClick={() => void refreshData()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          Refrescar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {allowedSections.map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeSection === section
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
            ].join(' ')}
          >
            {sectionLabels[section]}
          </button>
        ))}
      </div>

      {activeSection === 'business' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Negocio</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configura los datos del negocio y su clasificación SRI para facturación electrónica.
              </p>
            </div>

            <Button onClick={() => void saveBusinessDetails()} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RUC"
              value={businessDetailsForm.ruc}
              onChange={(event) => setBusinessDetailsForm((prev) => ({ ...prev, ruc: event.target.value }))}
            />
            <Input
              label="Razón social"
              value={businessDetailsForm.legalName}
              onChange={(event) => setBusinessDetailsForm((prev) => ({ ...prev, legalName: event.target.value }))}
            />
            <Input
              label="Nombre comercial"
              value={businessDetailsForm.commercialName || ''}
              onChange={(event) => setBusinessDetailsForm((prev) => ({ ...prev, commercialName: event.target.value }))}
            />
            <Input
              label="Nombre de fantasía"
              value={businessDetailsForm.tradeName || ''}
              onChange={(event) => setBusinessDetailsForm((prev) => ({ ...prev, tradeName: event.target.value }))}
            />
            <Input
              label="Teléfono"
              value={businessDetailsForm.phone || ''}
              onChange={(event) => setBusinessDetailsForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <Input
              label="Dirección"
              value={businessDetailsForm.address || ''}
              onChange={(event) => setBusinessDetailsForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Naturaleza legal
              </label>
              <select
                value={businessDetailsForm.legalNatureId || ''}
                onChange={(event) =>
                  setBusinessDetailsForm((prev) => ({ ...prev, legalNatureId: Number(event.target.value) }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="" disabled>
                  Selecciona naturaleza legal
                </option>
                {legalNatureOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Régimen tributario
              </label>
              <select
                value={businessDetailsForm.taxRegimeId || ''}
                onChange={(event) =>
                  setBusinessDetailsForm((prev) => ({ ...prev, taxRegimeId: Number(event.target.value) }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="" disabled>
                  Selecciona régimen tributario
                </option>
                {taxRegimeOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Designación especial (opcional)
              </label>
              <select
                value={businessDetailsForm.specialDesignationId || ''}
                onChange={(event) =>
                  setBusinessDetailsForm((prev) => ({
                    ...prev,
                    specialDesignationId: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Sin designación especial</option>
                {specialDesignationOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {businessDetails && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-sm">
              <p className="text-gray-600 dark:text-gray-300">
                Última actualización: {new Date(businessDetails.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </Card>
      )}

      {activeSection === 'document-types' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tipos de documento</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define nombre, código SRI, categoría y cantidad sugerida de ítems.
              </p>
            </div>

            <Button onClick={() => openDocumentTypeModal()}>
              <Plus className="w-4 h-4" />
              Nuevo tipo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documentTypes.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.documentName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {item.codSRI ? `SRI ${item.codSRI}` : 'Documento interno'}
                    </p>
                  </div>
                  <button
                    onClick={() => openDocumentTypeModal(item)}
                    className="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    title="Editar tipo de documento"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Items auto</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.itemsAutoGenerate}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Grupo</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.idGroupNumeration}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Categoría</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.documentCategoryId}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Estado</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.active ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {documentTypes.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              No hay tipos de documento cargados.
            </div>
          )}
        </Card>
      )}

      {activeSection === 'warehouses' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bodegas</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Usa la bodega para definir el código de establecimiento SRI.
              </p>
            </div>

            <Button onClick={() => openWarehouseModal()}>
              <Plus className="w-4 h-4" />
              Nueva bodega
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {warehouses.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Establecimiento {item.establishmentCode}
                    </p>
                  </div>
                  <button
                    onClick={() => openWarehouseModal(item)}
                    className="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  Estado: {item.active ? 'Activa' : 'Inactiva'}
                </p>
              </Card>
            ))}
          </div>

          {warehouses.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              No hay bodegas cargadas.
            </div>
          )}
        </Card>
      )}

      {activeSection === 'terminals' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Terminales</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define código, nombre, bodega y punto de emisión de cada terminal.
              </p>
            </div>

            <Button onClick={() => openTerminalModal()}>
              <Plus className="w-4 h-4" />
              Nueva terminal
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {terminals.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.code}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {item.name || 'Sin nombre visible'}
                    </p>
                  </div>
                  <button
                    onClick={() => openTerminalModal(item)}
                    className="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Bodega</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {warehouseById.get(item.warehouseId)?.name || `ID ${item.warehouseId}`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Establecimiento</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {warehouseById.get(item.warehouseId)?.establishmentCode || '-'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Punto emisión</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.emissionPoint}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Equipo</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.deviceToken ? `${item.deviceToken.slice(0, 12)}...` : item.deviceId}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-gray-500 dark:text-gray-400">Estado</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.active ? 'Activa' : 'Inactiva'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {terminals.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              No hay terminales cargadas.
            </div>
          )}
        </Card>
      )}

      {activeSection === 'printer-settings' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Impresoras y límites</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vincula terminal + documento con impresora, tamaño de línea y cantidad máxima.
              </p>
            </div>

            <Button onClick={() => openTerminalSettingsModal()}>
              <Plus className="w-4 h-4" />
              Nuevo ajuste
            </Button>
          </div>

          <div className="space-y-3">
            {terminalSettings.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {terminalById.get(item.terminalId)?.code || `Terminal ${item.terminalId}`}
                    {' · '}
                    {item.documentType?.documentName || documentTypeById.get(item.documentTypeId)?.documentName || `Documento ${item.documentTypeId}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Impresora: {item.namePrinter || 'sin asignar'} | Líneas: {item.characterLine || 0} | Máx items: {item.maxItems}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={[
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    item.enabled ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600',
                  ].join(' ')}>
                    {item.enabled ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                  <button
                    onClick={() => openTerminalSettingsModal(item)}
                    className="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {terminalSettings.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              No hay configuraciones de impresora.
            </div>
          )}
        </Card>
      )}

      {activeSection === 'sequences' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Secuenciales</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                El establecimiento viene de la bodega y el punto de emisión viene de la terminal.
                Aquí solo se ajusta el contador por tipo de documento.
              </p>
            </div>

            <Button onClick={() => openSequenceModal()}>
              <Plus className="w-4 h-4" />
              Nuevo secuencial
            </Button>
          </div>

          {currentTerminalId && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Terminal bloqueada para este equipo: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedSequenceTerminal?.code}</span>
              {' '}({selectedSequenceWarehouse?.establishmentCode}-{selectedSequenceTerminal?.emissionPoint})
            </p>
          )}

          {!currentTerminalId && (
            <p className="text-sm text-danger-600 dark:text-danger-400">
              Este equipo no tiene terminal asignada. Vincúlalo en Seguridad de dispositivos para gestionar secuencias.
            </p>
          )}

          <div className="space-y-3">
            {terminalSettings
              .filter((item) => currentTerminalId !== undefined && item.terminalId === currentTerminalId)
              .map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedSequenceWarehouse?.establishmentCode || '---'}-{selectedSequenceTerminal?.emissionPoint || '---'} · {item.documentType?.documentName || `Documento ${item.documentTypeId}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Último secuencial: {String(item.lastSequential).padStart(9, '0')}
                  </p>
                </div>

                <button
                  onClick={() => openSequenceModal(item)}
                  className="rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 self-start lg:self-auto"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {terminalSettings.filter((item) => currentTerminalId !== undefined && item.terminalId === currentTerminalId).length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              No hay secuenciales registrados aún.
            </div>
          )}
        </Card>
      )}

      <Modal
        isOpen={isDocumentTypeModalOpen}
        onClose={() => setIsDocumentTypeModalOpen(false)}
        title={documentTypeForm.id ? 'Editar tipo de documento' : 'Nuevo tipo de documento'}
        size="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del documento"
            value={documentTypeForm.documentName}
            onChange={(event) => setDocumentTypeForm((prev) => ({ ...prev, documentName: event.target.value }))}
          />
          <Input
            label="Código SRI"
            value={documentTypeForm.codSRI || ''}
            onChange={(event) => setDocumentTypeForm((prev) => ({ ...prev, codSRI: event.target.value }))}
          />
          <Input
            label="Ítems auto generados"
            type="number"
            min="0"
            value={documentTypeForm.itemsAutoGenerate}
            onChange={(event) =>
              setDocumentTypeForm((prev) => ({ ...prev, itemsAutoGenerate: Number(event.target.value) }))
            }
          />
          <Input
            label="Categoría de documento"
            type="number"
            min="1"
            value={documentTypeForm.documentCategoryId}
            onChange={(event) =>
              setDocumentTypeForm((prev) => ({ ...prev, documentCategoryId: Number(event.target.value) }))
            }
          />
          <Input
            label="Grupo de numeración"
            type="number"
            min="1"
            value={documentTypeForm.idGroupNumeration}
            onChange={(event) =>
              setDocumentTypeForm((prev) => ({ ...prev, idGroupNumeration: Number(event.target.value) }))
            }
          />
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Indefinido</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">No limita la naturaleza del documento</p>
            </div>
            <input
              type="checkbox"
              checked={documentTypeForm.indefinite}
              onChange={(event) =>
                setDocumentTypeForm((prev) => ({ ...prev, indefinite: event.target.checked }))
              }
            />
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Activo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Disponible para ventas y configuración</p>
            </div>
            <input
              type="checkbox"
              checked={documentTypeForm.active}
              onChange={(event) => setDocumentTypeForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
          </div>
          <div className="rounded-lg border border-primary-100 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-900/20 p-4 md:col-span-2 space-y-3">
            <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">
              Vista previa de numeración
            </p>
            <p className="text-sm text-primary-700 dark:text-primary-300">
              La numeración se arma como: establecimiento (bodega) + punto de emisión (terminal) + secuencia del tipo de documento.
            </p>
            <div>
              <label className="block text-sm font-medium text-primary-800 dark:text-primary-200 mb-1">Terminal para ejemplo</label>
              <select
                value={documentTypePreviewTerminalId || ''}
                onChange={(event) => setDocumentTypePreviewTerminalId(Number(event.target.value) || undefined)}
                className="w-full rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
              >
                {terminals.length === 0 && <option value="">Sin terminales</option>}
                {terminals.map((terminal) => {
                  const warehouse = warehouseById.get(terminal.warehouseId);
                  return (
                    <option key={terminal.id} value={terminal.id}>
                      {terminal.code} ({warehouse?.establishmentCode || '---'}-{terminal.emissionPoint})
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="text-lg font-bold text-primary-900 dark:text-primary-100">{documentTypePreview}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsDocumentTypeModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void saveDocumentType()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        title={warehouseForm.id ? 'Editar bodega' : 'Nueva bodega'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de bodega"
            value={warehouseForm.name}
            onChange={(event) => setWarehouseForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Código de establecimiento"
            value={warehouseForm.establishmentCode}
            onChange={(event) => setWarehouseForm((prev) => ({ ...prev, establishmentCode: event.target.value }))}
            placeholder="001"
          />
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Activa</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">La bodega estará disponible para terminales</p>
            </div>
            <input
              type="checkbox"
              checked={warehouseForm.active}
              onChange={(event) => setWarehouseForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsWarehouseModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void saveWarehouse()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isTerminalModalOpen}
        onClose={() => setIsTerminalModalOpen(false)}
        title={terminalForm.id ? 'Editar terminal' : 'Nueva terminal'}
        size="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código de terminal"
            value={terminalForm.code}
            onChange={(event) => setTerminalForm((prev) => ({ ...prev, code: event.target.value }))}
            placeholder="CAJA_001"
          />
          <Input
            label="Nombre visible"
            value={terminalForm.name || ''}
            onChange={(event) => setTerminalForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Caja Principal"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bodega</label>
            <select
              value={terminalForm.warehouseId}
              onChange={(event) =>
                setTerminalForm((prev) => ({ ...prev, warehouseId: Number(event.target.value) }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
            >
              <option value={0}>Seleccione una bodega</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.establishmentCode})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Punto de emisión"
            value={terminalForm.emissionPoint}
            onChange={(event) => setTerminalForm((prev) => ({ ...prev, emissionPoint: event.target.value }))}
            placeholder="001"
          />
          <Input
            label="Token o código pairing"
            value={terminalForm.deviceToken}
            onChange={(event) => setTerminalForm((prev) => ({ ...prev, deviceToken: event.target.value }))}
            placeholder={
              terminalForm.id
                ? 'Opcional: ingresa token real o pairing para cambiar equipo vinculado'
                : 'Token backend o código pairing (6 dígitos)'
            }
          />
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between md:col-span-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Activa</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Puede usarse en ventas y configuración</p>
            </div>
            <input
              type="checkbox"
              checked={terminalForm.active}
              onChange={(event) => setTerminalForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsTerminalModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void saveTerminal()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isTerminalSettingsModalOpen}
        onClose={() => setIsTerminalSettingsModalOpen(false)}
        title={terminalSettingsForm.id ? 'Editar ajuste de impresora' : 'Nuevo ajuste de impresora'}
        size="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terminal</label>
            <select
              value={terminalSettingsForm.terminalId}
              onChange={(event) =>
                setTerminalSettingsForm((prev) => ({ ...prev, terminalId: Number(event.target.value) }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
            >
              <option value={0}>Seleccione una terminal</option>
              {terminals.map((terminal) => (
                <option key={terminal.id} value={terminal.id}>
                  {terminal.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de documento</label>
            <select
              value={terminalSettingsForm.documentTypeId}
              onChange={(event) =>
                setTerminalSettingsForm((prev) => ({ ...prev, documentTypeId: Number(event.target.value) }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
            >
              <option value={0}>Seleccione un tipo</option>
              {documentTypes.map((documentType) => (
                <option key={documentType.id} value={documentType.id}>
                  {documentType.documentName}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Nombre de impresora"
            value={terminalSettingsForm.namePrinter || ''}
            onChange={(event) =>
              setTerminalSettingsForm((prev) => ({ ...prev, namePrinter: event.target.value }))
            }
            placeholder="STAR_TSP100"
          />
          <Input
            label="Caracteres por línea"
            type="number"
            min="1"
            value={terminalSettingsForm.characterLine || 0}
            onChange={(event) =>
              setTerminalSettingsForm((prev) => ({ ...prev, characterLine: Number(event.target.value) }))
            }
          />
          <Input
            label="Máx items"
            type="number"
            min="0"
            value={terminalSettingsForm.maxItems}
            onChange={(event) =>
              setTerminalSettingsForm((prev) => ({ ...prev, maxItems: Number(event.target.value) }))
            }
          />
          <Input
            label="Líneas por transacción"
            type="number"
            min="0"
            value={terminalSettingsForm.linesPerTransaction || 0}
            onChange={(event) =>
              setTerminalSettingsForm((prev) => ({ ...prev, linesPerTransaction: Number(event.target.value) }))
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo</label>
            <select
              value={terminalSettingsForm.withLogo || LogoSize.SMALL}
              onChange={(event) =>
                setTerminalSettingsForm((prev) => ({ ...prev, withLogo: event.target.value as LogoSize }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
            >
              <option value={LogoSize.SMALL}>SMALL</option>
              <option value={LogoSize.MEDIUM}>MEDIUM</option>
              <option value={LogoSize.LARGE}>LARGE</option>
            </select>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Habilitado</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Permite usar esta combinación</p>
            </div>
            <input
              type="checkbox"
              checked={terminalSettingsForm.enabled}
              onChange={(event) => setTerminalSettingsForm((prev) => ({ ...prev, enabled: event.target.checked }))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsTerminalSettingsModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void saveTerminalSettings()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isSequenceModalOpen}
        onClose={() => setIsSequenceModalOpen(false)}
        title={sequenceForm.id ? 'Editar secuencial' : 'Nuevo secuencial'}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terminal (equipo actual)</label>
            <Input
              value={selectedSequenceTerminal ? `${selectedSequenceTerminal.code} (${selectedSequenceWarehouse?.establishmentCode}-${selectedSequenceTerminal.emissionPoint})` : 'Sin terminal asignada'}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de documento</label>
            <select
              value={sequenceForm.documentTypeId}
              onChange={(event) => {
                const nextDocumentTypeId = Number(event.target.value);
                setSequenceForm(resolveSequenceForm(nextDocumentTypeId));
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
            >
              {documentTypes.map((documentType) => (
                <option key={documentType.id} value={documentType.id}>
                  {documentType.documentName}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Establecimiento (bodega)"
            value={selectedSequenceWarehouse?.establishmentCode || ''}
            disabled
          />
          <Input
            label="Punto de emisión (terminal)"
            value={selectedSequenceTerminal?.emissionPoint || ''}
            disabled
          />
          <Input
            label="Último secuencial"
            type="number"
            min="0"
            value={sequenceForm.lastSequential}
            onChange={(event) =>
              setSequenceForm((prev) => ({ ...prev, lastSequential: Number(event.target.value) }))
            }
          />
          <div className="rounded-lg border border-primary-100 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-900/20 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">Próximo número generado</p>
            <p className="text-lg font-bold text-primary-900 dark:text-primary-100 mt-1">{sequencePreview}</p>
            <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
              Formato: establecimiento (bodega) + punto de emisión (terminal) + secuencia del tipo de documento.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsSequenceModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void saveSequence()} disabled={saving || !currentTerminalId}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>

      {saving && (
        <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-6 shadow-xl">
            <SpinnerLoading size="md" message="Guardando configuración..." className="min-h-0" />
          </div>
        </div>
      )}
    </div>
  );
}
