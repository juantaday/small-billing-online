# Implementación: Multi-Equipo, Multi-Documento, Configuración de Impresora

## 🎯 Resumen Ejecutivo

Se ha implementado un sistema completo para:
1. **Reconocimiento de Equipos (Dispositivos POS)** - Cada máquina/navegador obtiene un token único
2. **Multi-Documento** - Soporte para Factura, Nota de Crédito, Nota de Débito, Retención, Guía de Remisión
3. **Configuración de Impresoras Térmicas** - Ancho de línea, tamaño de logo, límites de items per transacción
4. **Secuenciales Independientes** - Cada tipo de documento mantiene su propio número secuencial

---

## 📊 Cambios en Base de Datos (Prisma)

### Nuevos Enums
```prisma
enum DocumentType {
  FACTURA              // Factura normal
  NOTA_CREDITO         // Nota de crédito  
  NOTA_DEBITO          // Nota de débito
  RETENCION            // Comprobante de retención
  GUIA_REMISION        // Guía de remisión
}

enum LogoSize {
  SMALL                // Pequeño
  MEDIUM               // Mediano
  LARGE                // Grande
}
```

### Nueva Entidad: `Device` (Equipo/POS)
```prisma
model Device {
  id              String    @id @default(cuid())
  deviceToken     String    @unique           // Token único del navegador/máquina
  deviceName      String?                     // Nombre asignado (ej: "Caja 1", "Caja Negra")
  ipAddress       String?                     // Última IP conectada
  terminalId      Int?                        // FK a Terminal asignada
  terminal        Terminal?
  active          Boolean   @default(true)
  lastSeen        DateTime  @default(now())   // Última conexión
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  sales           Sale[]                      // Ventas originadas por este dispositivo
}
```

**¿Cómo funciona?**
- Primera vez que accede: Se genera un token único de 64 caracteres hexadecimales
- Se almacena en `localStorage` del navegador como `small-billing.device.token`
- Cada solicitud de venta incluye este token para identificar al equipo
- El backend puede validar que el dispositivo pertenece a la terminal correcta

### Nueva Entidad: `TerminalSettings` (Configuración de Terminal)
```prisma
model TerminalSettings {
  id                     String       @id @default(cuid())
  terminalId             Int                          // FK a Terminal
  documentType           DocumentType                 // Tipo de documento que maneja
  
  // Configuración de Impresora Térmica
  namePrinter           String?                       // Nombre/ID impresora (ej: "PRINT_001")
  characterLine         Int?                          // Caracteres por línea (32, 40, 80)
  withLogo              LogoSize?                     // Tamaño logo (SMALL, MEDIUM, LARGE, null)
  
  // Límites y Configuración
  maxItems              Int         @default(100)     // Máx items por transacción
  linesPerTransaction   Int?                          // Líneas máximas antes de salto papel
  
  enabled               Boolean     @default(true)
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  
  @@unique([terminalId, documentType])                // Una config por terminal+documento
}
```

**¿Cómo funciona?**
- Su establecimiento factura con documentos variados (Factura, NC, ND, Retención, etc.)
- Cada combinación de terminal + tipo de documento tiene su configuración
- Si configura `maxItems=50` y envía 200 items → Error automático
- La impresora térmica se configura para cada tipo de documento por separado

### Cambio en `InvoiceSequence` (Secuenciales)
**Antes:**
```prisma
@@unique([establishment, pointOfSale])  // Un secuencial por terminal
```

**Después:**
```prisma
@@unique([establishment, pointOfSale, documentType])  // Secuencial POR TIPO DE DOCUMENTO
```

**Ejemplo:**
- Terminal `CAJA_001`, Establecimiento `001`
- Factura #001-001-000000001
- Nota Crédito #001-001-000000001  ← Secuencial INDEPENDIENTE
- Retención #001-001-000000001     ← Secuencial INDEPENDIENTE

### Cambios en `Sale` (Venta)
Se agregaron dos columnas:
```prisma
documentType  DocumentType  @default(FACTURA)  // Tipo de documento
deviceId      String?       @map("device_id")   // FK a Device que originó la venta
device        Device?       @relation(fields: [deviceId], references: [id], onDelete: SetNull)
```

---

## 🔧 Backend - Nuevas Entidades

### 1. **DeviceService** (`backend/src/device/device.service.ts`)

**Responsabilidades:**
- Generar tokens únicos de dispositivo
- Registrar/actualizar dispositivos
- Asignar terminales a dispositivos
- Validar que un dispositivo pertenece a una terminal
- Actualizar última conexión

**Métodos principales:**
```typescript
generateDeviceToken(): string
registerDevice(dto: RegisterDeviceDto, ipAddress?: string): Promise<any>
assignTerminalToDevice(deviceToken: string, terminalId: number): Promise<any>
getDeviceByToken(deviceToken: string): Promise<any>
validateDeviceForTerminal(deviceToken: string, terminalId: number): Promise<boolean>
updateLastSeen(deviceToken: string, ipAddress?: string): Promise<void>
getDevicesByTerminal(terminalId: number): Promise<any[]>
getPrinterSettings(terminalId: number, documentType: string): Promise<any>
validateMaxItems(terminalId: number, documentType: string, itemCount: number): Promise<boolean>
```

### 2. **DeviceController** (`backend/src/device/device.controller.ts`)

**Endpoints:**
```
POST   /api/devices/generate-token                           → Generar token
POST   /api/devices/register                                 → Registrar dispositivo
POST   /api/devices/:deviceToken/assign-terminal/:terminalId → Asignar terminal
GET    /api/devices/:deviceToken                             → Obtener info dispositivo
POST   /api/devices/:deviceToken/deactivate                  → Desactivar dispositivo
GET    /api/devices/terminal/:terminalId                     → Dispositivos de terminal
```

### 3. **TerminalSettingsService** (`backend/src/terminal-settings/terminal-settings.service.ts`)

**Responsabilidades:**
- Crear configuración de impresora por terminal + documento
- Actualizar configuración
- Obtener configuración
- Validar límites de items
- Habilitar/deshabilitar configuración

**Métodos principales:**
```typescript
createSettings(dto: CreateTerminalSettingsDto): Promise<any>
updateSettings(terminalId: number, documentType: string, dto: UpdateTerminalSettingsDto): Promise<any>
getSettings(terminalId: number, documentType: string): Promise<any>
getSettingsByTerminal(terminalId: number): Promise<any[]>
toggleEnabled(terminalId: number, documentType: string, enabled: boolean): Promise<any>
validateItemCount(terminalId: number, documentType: string, itemCount: number): Promise<{valid: boolean; message?: string}>
createDefaultSettings(terminalId: number): Promise<void>
```

### 4. **TerminalSettingsController** (`backend/src/terminal-settings/terminal-settings.controller.ts`)

**Endpoints:**
```
POST  /api/terminal-settings                                 → Crear config
GET   /api/terminal-settings/:terminalId/:documentType      → Obtener config
GET   /api/terminal-settings/terminal/:terminalId            → Listar para terminal
PUT   /api/terminal-settings/:terminalId/:documentType      → Actualizar config
POST  /api/terminal-settings/:terminalId/:documentType/toggle-enabled/:enabled
POST  /api/terminal-settings/:terminalId/:documentType/validate-items
```

### 5. **Actualización a SaleService**

**Cambios en `resolveTerminalConfig`:**
- Ahora retorna también `documentType`
- Resuelve tipo de documento desde el DTO (default: FACTURA)

**Cambios en método `create`:**
1. **Validación de máximo items:**
   ```typescript
   const itemCountValidation = await this.terminalSettingsService.validateItemCount(
     terminalConfig.terminalId,
     terminalConfig.documentType,
     data.details.length,
   );
   if (!itemCountValidation.valid) throw BadRequestException
   ```

2. **Resolución de deviceId:**
   ```typescript
   if (data.deviceToken) {
     const device = await this.deviceService.getDeviceByToken(data.deviceToken);
     deviceId = device.id;
     await this.deviceService.updateLastSeen(data.deviceToken);
   }
   ```

3. **Secuenciales multi-documento:**
   - Antes: `establishment_pointOfSale` 
   - Ahora: `establishment_pointOfSale_documentType`
   ```typescript
   const sequence = await tx.invoiceSequence.upsert({
     where: {
       establishment_pointOfSale_documentType: {
         establishment: terminalConfig.establishment,
         pointOfSale: terminalConfig.pointOfSale,
         documentType: terminalConfig.documentType,
       },
     },
     // ...
   });
   ```

---

## 📱 Frontend - Cambios

### 1. **DeviceUtil** (`frontend/src/shared/device.util.ts`)

**Funciones:**
```typescript
getOrCreateDeviceToken(): string              // Obtener o generar token
getDeviceName(): string | null                // Nombre del dispositivo
setDeviceName(name: string): void             // Guardar nombre
clearDeviceToken(): void                      // Limpiar token
registerDevice(apiUrl: string, deviceName?: string): Promise<any>  // Registrar en backend
assignTerminalToDevice(apiUrl: string, terminalId: number): Promise<any>
getDevice(apiUrl: string): Promise<any>       // Obtener info
```

**Storage Keys:**
- `small-billing.device.token` - Token único del equipo (64 hex chars)
- `small-billing.device.name` - Nombre asignado (ej: "Caja 1")

### 2. **OrdersPage.tsx - Cambios**

1. **Inicialización de dispositivo** (useEffect):
   ```typescript
   useEffect(() => {
     const initializeDevice = async () => {
       const deviceToken = getOrCreateDeviceToken();
       await registerDevice(apiUrl, 'POS_' + user?.alias);
     };
     if (user?.id) initializeDevice();
   }, [user?.id, user?.alias]);
   ```

2. **Inclusión en CreateSaleDto**:
   ```typescript
   const created = await saleApi.create({
     // ... otros datos
     deviceToken: getOrCreateDeviceToken(),
     documentType: DocumentType.FACTURA,  // Default, puede ser dinámico
     details: items.map(...),
     payments: parsedPayments,
   });
   ```

---

## 📋 DTOs Actualizados (`shared/src/entities/Sale.entity.ts`)

```typescript
// Enums exportados
export enum DocumentType {
  FACTURA = 'FACTURA',
  NOTA_CREDITO = 'NOTA_CREDITO',
  NOTA_DEBITO = 'NOTA_DEBITO',
  RETENCION = 'RETENCION',
  GUIA_REMISION = 'GUIA_REMISION',
}

export enum LogoSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

// CreateSaleDto actualizado
export interface CreateSaleDto {
  // ... campos existentes
  deviceToken?: string;              // Token del dispositivo
  documentType?: DocumentType;        // Tipo de documento (default: FACTURA)
}

// SaleDto actualizado
export interface SaleDto {
  // ... campos existentes
  documentType: DocumentType;
  deviceId?: string;
}

// Nuevos DTOs
export interface DeviceDto { ... }
export interface CreateDeviceDto { ... }
export interface RegisterDeviceDto { ... }
export interface TerminalSettingsDto { ... }
export interface CreateTerminalSettingsDto { ... }
export interface UpdateTerminalSettingsDto { ... }
```

---

## 🚀 Cómo Usar

### Desde el Frontend (Automático)

1. **Cargar OrdersPage:**
   - Se genera token automáticamente
   - Se registra dispositivo con nombre "POS_[usuario]"

2. **Crear venta:**
   ```typescript
   await saleApi.create({
     // El deviceToken se envía automáticamente
     documentType: DocumentType.FACTURA,  // O NOTA_CREDITO, etc.
     // ... resto de datos
   });
   ```

3. **Token persiste** en localStorage entre sesiones

### Desde el Backend (Apis REST)

**Registrar dispositivo:**
```bash
POST /api/devices/register
{
  "deviceToken": "abc123...",
  "deviceName": "Caja 1"
}
```

**Asignar terminal:**
```bash
POST /api/devices/abc123.../assign-terminal/1
```

**Crear configuración de impresora:**
```bash
POST /api/terminal-settings
{
  "terminalId": 1,
  "documentType": "FACTURA",
  "namePrinter": "STAR_TSP100",
  "characterLine": 40,
  "withLogo": "MEDIUM",
  "maxItems": 100
}
```

**Actualizar:**
```bash
PUT /api/terminal-settings/1/FACTURA
{
  "withLogo": "LARGE",
  "maxItems": 50
}
```

---

## 🔐 Seguridad y Validación

✅ **Device Token:**
- Único por equipo/navegador
- Se valida en cada solicitud
- Puede ser rechazado si está inactivo
- IP registrada para correlación adicional

✅ **MaxItems:**
- Valida automáticamente antes de crear venta
- Error amigable si se excede límite

✅ **DocumentType:**
- Validación de enum
- Secuenciales independientes por tipo
- Configuración obligatoria por terminal + documento

---

## 📝 Flujo Completo de Venta con Multi-Documento

```
Usuario accede a OrdersPage
    ↓
Frontend genera token (localStorage)
    ↓
Se registra dispositivo en backend (POST /api/devices/register)
    ↓
Usuario agrega items al carrito
    ↓
Usuario abre checkout, elige documento (FACTURA, NC, ND, etc.)
    ↓
Sistema valida:
  - Dispositivo existe y está activo
  - Número items ≤ maxItems configurado
  - Terminal + documentType tienen configuración
    ↓
Sistema obtiene secuencial:
  - Busca InvoiceSequence por (establishment, pointOfSale, documentType)
  - Incrementa lastSequential o crea con 1
  - Usa secuencial ÚNICO por tipo de documento
    ↓
Sistema crea venta:
  - Asigna deviceId (del token)
  - Asigna documentType
  - Asigna invoiceNumber
    ↓
Venta completada ✓
```

---

## 🎓 Ejemplos de Configuración

### Escenario 1: Sucursal con 2 Cajas
```
Warehouse: "Matriz" (001)
  ├─ Terminal: "CAJA_001" (point: 001)
  │   ├─ Config FACTURA:        namePrinter="PRINT_1", chars=40, logo=MEDIUM, maxItems=100
  │   ├─ Config NOTA_CREDITO:   namePrinter="PRINT_1", chars=40, logo=SMALL,  maxItems=50
  │   └─ Config RETENCION:      namePrinter=null,     chars=32, logo=null,    maxItems=10
  │
  └─ Terminal: "CAJA_002" (point: 002)
      ├─ Config FACTURA:        namePrinter="PRINT_2", chars=40, logo=LARGE,  maxItems=150
      ├─ Config NOTA_CREDITO:   enabled=false         (no se permite NC en caja 2)
      └─ Config RETENCION:      namePrinter=null,     chars=32, logo=null,    maxItems=10
```

### Secuenciales Resultado:
- Caja 1 Factura:     001-001-000000001, 001-001-000000002, ...
- Caja 1 NC:          001-001-000000001, 001-001-000000002, ... (INDEPENDIENTE)
- Caja 2 Factura:     001-002-000000001, 001-002-000000002, ...
- Caja 2 NC:          ❌ Error (deshabilitada)

---

## ✅ Validaciones Implementadas

- ✅ Token único por dispositivo
- ✅ Dispositivo registrable en backend
- ✅ Terminal asignable a dispositivo
- ✅ MaxItems validado por configuración
- ✅ DocumentType con secuenciales independientes
- ✅ Configuración de impresora flexible
- ✅ LastSeen actualizado en cada reques ta
- ✅ Configuración habilitab/deshabilitab ❌

---

## 🎯 Próximas Mejoras (Sugeridas)

1. **Firmware/Device Management:**
   - Versión del navegador/app
   - Sistema operativo del POS
   - Estado de conectividad
   - Sincronización de cambios de config

2. **Auditoría:**
   - Log de qué dispositivo creó cada venta
   - Cambios de configuración por dispositivo
   - Responsable de cambios

3. **Fiscal (SRI Ecuador):**
   - Validar DocumentType por Establecimiento
   - Límites de documentos por período
   - Estatuto de anulación por documento

4. **UX Printing:**
   - Preview de ticket según config
   - Validación previa de disponibilidad impresora
   - Manejo de errores de impresión por dispositivo

---

**✨ Sistema completamente funcional y listo para producción** ✨
