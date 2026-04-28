# Plan Técnico: Módulo de Facturación Electrónica Ecuador (SRI)
> Documento de dirección para el agente técnico. Seguir este plan al pie de la letra.

---

## Principio de Diseño Fundamental

> **El ecosistema SRI no depende de ningún proyecto. Los proyectos dependen del ecosistema SRI.**

```
                    ┌─────────────────────────────┐
                    │         @sri/core            │
                    │  Enums, interfaces, estados  │
                    │   Entidades propias de SRI   │
                    │   SIN dependencias externas  │
                    └─────────────┬───────────────┘
                                  │  dependen de
          ┌───────────────────────┼────────────────────────┐
          ▼                       ▼                        ▼
   @sri/xml-generator     @sri/signer               @sri/client
          │                       │                        │
          └───────────────────────┼────────────────────────┘
                                  │  orquesta
                          @sri/nest-module
                                  │
                    ┌─────────────┴──────────────┐
                    ▼                            ▼
             App A (backend actual)        App B (futuro)
             con su propio shared-*        con su propio shared-*
```

**Regla de oro:** Ningún paquete `@sri/*` importa nada de `shared-models`,
`shared-dtos`, `shared-entities` ni de ningún proyecto específico. Jamás.

---

## Convenciones de Código — Obligatorias en Todo el Proyecto

### Idioma
- **Todo el código en inglés**: nombres de variables, funciones, clases, archivos, interfaces, enums.
- **Comentarios en español**, únicamente donde aporten valor real.

### Regla de comentarios

```typescript
// ✅ Correcto — función simple: una línea descriptiva, sin más
// Envío de comprobante al SRI
async sendVoucher(xml: string): Promise<ISriResponse> { ... }

// ✅ Correcto — complejidad media/alta: comentario en el bloque que lo necesita
async buildAccessKey(params: IAccessKeyParams): string {
  // La clave de acceso se construye concatenando 49 dígitos en orden estricto
  // definido por el SRI. El dígito verificador usa módulo 11 con pesos 2-7.
  const rawKey = [
    params.date,           // ddmmaaaa
    params.voucherType,    // 2 dígitos
    params.ruc,            // 13 dígitos
    params.environment,    // 1 dígito
    params.series,         // 6 dígitos
    params.sequential,     // 8 dígitos
    params.numericCode,    // 8 dígitos
    params.emissionType,   // 1 dígito
  ].join('');

  return rawKey + this.calculateVerifierDigit(rawKey);
}

// ❌ Incorrecto — comentario obvio que no aporta nada
// Retorna el nombre
getName(): string { return this.name; }

// ❌ Incorrecto — comentario en inglés
// Send the XML to SRI reception endpoint
```

### Resumen de la regla
| Complejidad | Comentario |
|---|---|
| Getter, setter, asignación simple | Ninguno |
| Función/método sencillo | Una línea encima describiendo el propósito |
| Algoritmo, flujo condicional complejo, cálculo tributario | Bloque explicando el porqué, no el qué |

---

## Paquetes del Monorepo

```
sri-facturacion/
  ├── packages/
  │   ├── core/                        → @sri/core
  │   ├── xml-generator/               → @sri/xml-generator
  │   ├── signer/                      → @sri/signer
  │   ├── client/                      → @sri/client
  │   ├── persistence-adapter/         → @sri/persistence-adapter
  │   └── nest-module/                 → @sri/nest-module
  ├── apps/
  │   ├── invoice-worker/              ← Fase 2
  │   └── invoice-api/                 ← Fase 3 (microservicio standalone)
  └── tools/
      └── sri-sandbox/                 ← Pruebas manuales contra ambiente SRI
```

---

## Capas — Orden de Construcción

### Capa 0 — `@sri/core` ← Empezar aquí

**Sin dependencias externas absolutamente.**
`package.json` con `dependencies: {}` vacío. Si se necesita importar algo externo aquí,
es señal de que el diseño está mal — detener y replantear.

```
packages/core/
  ├── src/
  │   ├── enums/
  │   │   ├── voucher-type.enum.ts
  │   │   │     INVOICE = '01'
  │   │   │     PURCHASE_SETTLEMENT = '03'
  │   │   │     CREDIT_NOTE = '04'
  │   │   │     DEBIT_NOTE = '05'
  │   │   │     WAYBILL = '06'
  │   │   │     WITHHOLDING = '07'
  │   │   ├── environment.enum.ts
  │   │   │     TESTING = '1'
  │   │   │     PRODUCTION = '2'
  │   │   ├── voucher-status.enum.ts
  │   │   │     DRAFT
  │   │   │     XML_GENERATED
  │   │   │     SIGNED
  │   │   │     SENT
  │   │   │     RECEIVED
  │   │   │     AUTHORIZED
  │   │   │     REJECTED
  │   │   │     ERROR_RETRYABLE
  │   │   │     ERROR_FINAL
  │   │   ├── emission-type.enum.ts
  │   │   │     NORMAL = '1'
  │   │   └── taxpayer-id-type.enum.ts
  │   │         RUC = '04'
  │   │         NATIONAL_ID = '05'
  │   │         PASSPORT = '06'
  │   │         FINAL_CONSUMER = '07'
  │   ├── interfaces/
  │   │   ├── documents/
  │   │   │   ├── invoice.interface.ts          ← IInvoice
  │   │   │   ├── credit-note.interface.ts      ← ICreditNote
  │   │   │   ├── withholding.interface.ts      ← IWithholding
  │   │   │   └── waybill.interface.ts          ← IWaybill
  │   │   ├── sri/
  │   │   │   ├── reception-response.interface.ts
  │   │   │   ├── authorization-response.interface.ts
  │   │   │   └── authorization.interface.ts
  │   │   └── electronic-voucher.interface.ts   ← IElectronicVoucher (base)
  │   ├── entities/
  │   │   ├── electronic-document.entity.ts
  │   │   ├── transmission-attempt.entity.ts
  │   │   ├── sri-authorization.entity.ts
  │   │   ├── document-event.entity.ts
  │   │   └── file-artifact.entity.ts
  │   ├── dtos/
  │   │   ├── create-invoice.dto.ts
  │   │   ├── authorization-response.dto.ts
  │   │   └── voucher-status.dto.ts
  │   └── index.ts
  ├── package.json                              ← name: "@sri/core", dependencies: {}
  └── tsconfig.json
```

---

### Capa 1 — `@sri/xml-generator`

Genera XML según esquemas XSD del SRI. **Solo lógica pura — sin red, sin BD.**

```
packages/xml-generator/
  ├── src/
  │   ├── builders/
  │   │   ├── invoice.builder.ts
  │   │   ├── credit-note.builder.ts
  │   │   └── withholding.builder.ts
  │   ├── validators/
  │   │   └── xsd.validator.ts
  │   ├── schemas/                       ← XSD oficiales del SRI incluidos en el paquete
  │   │   ├── factura_v1.1.0.xsd
  │   │   └── ...
  │   ├── utils/
  │   │   └── access-key.generator.ts   ← Algoritmo módulo 11 del SRI
  │   └── index.ts
  ├── package.json                       ← Depende solo de: @sri/core, xmlbuilder2
```

Exporta: `buildXml(data: IInvoice): string`

---

### Capa 2 — `@sri/signer`

Firma XAdES-BES. **Sin red, sin BD.**

```
packages/signer/
  ├── src/
  │   ├── xades-signer.ts
  │   ├── p12-loader.ts
  │   └── index.ts
  ├── package.json                       ← Depende solo de: @sri/core, node-forge
```

Exporta: `signXml(xml: string, certificate: Buffer, password: string): string`

El certificado y contraseña llegan como parámetros — este paquete nunca los almacena.

---

### Capa 3 — `@sri/client`

Comunicación SOAP con los web services del SRI.

```
packages/client/
  ├── src/
  │   ├── reception.client.ts
  │   ├── authorization.client.ts
  │   ├── endpoints.ts                  ← URLs TESTING y PRODUCTION hardcodeadas aquí
  │   └── index.ts
  ├── package.json                      ← Depende solo de: @sri/core, axios
```

Exporta:
- `sendVoucher(signedXml: string, env: Environment): Promise<IReceptionResponse>`
- `authorizeVoucher(accessKey: string, env: Environment): Promise<IAuthorizationResponse>`

Maneja reintentos con backoff exponencial internamente. Nunca lanza excepciones sin tipar.

---

### Capa 4 — `@sri/persistence-adapter`

Contrato de persistencia + implementación TypeORM. Intercambiable.

```
packages/persistence-adapter/
  ├── src/
  │   ├── interfaces/
  │   │   └── voucher-repository.interface.ts
  │   ├── typeorm/
  │   │   └── typeorm-voucher.repository.ts
  │   └── index.ts
  ├── package.json                      ← Depende solo de: @sri/core, typeorm
```

**Tablas (entidades definidas en @sri/core):**

| Tabla | Propósito |
|---|---|
| `electronic_documents` | Registro principal, clave de acceso, estado actual |
| `transmission_attempts` | Historial de cada intento de envío al SRI |
| `sri_authorizations` | Número de autorización, fecha, XML autorizado |
| `document_events` | Log de transiciones de estado (auditoría completa) |
| `file_artifacts` | Rutas a XML firmado, XML autorizado, RIDE/PDF |

**BD separada obligatoria.** String de conexión propio, independiente de la BD del proyecto.
Clave de acceso con restricción UNIQUE a nivel de BD + validación en código.

---

### Capa 5 — `@sri/nest-module`

Módulo NestJS que orquesta todo. **El único paquete que importa el proyecto consumidor.**

```
packages/nest-module/
  ├── src/
  │   ├── electronic-billing.module.ts
  │   ├── electronic-billing.service.ts
  │   ├── electronic-billing.config.ts
  │   └── index.ts
  ├── package.json   ← Depende de: @sri/core + todos los packages anteriores + @nestjs/common
```

**Cómo lo importa cualquier proyecto NestJS:**
```typescript
import { ElectronicBillingModule } from '@sri/nest-module';
import { Environment } from '@sri/core';

@Module({
  imports: [
    ElectronicBillingModule.forRoot({
      environment: Environment.TESTING,
      certificatePath: process.env.SRI_CERT_PATH,
      certificatePassword: process.env.SRI_CERT_PASSWORD,
      dbConnectionString: process.env.SRI_DB_URL,
    }),
  ],
})
export class AppModule {}
```

El proyecto consumidor **no necesita conocer** los paquetes internos de `@sri/*`.
Solo importa `@sri/nest-module` y opcionalmente `@sri/core` para los tipos.

**Flujo que orquesta el servicio:**
```
1. Recibe IInvoice (o ICreditNote, IWithholding, etc.)
2. Genera XML           →  @sri/xml-generator
3. Firma XML            →  @sri/signer
4. Guarda (SIGNED)      →  @sri/persistence-adapter
5. Encola envío         →  invoice-worker  (async, no bloquea el request)
6. Retorna access key + estado al llamador inmediatamente
--- En background (worker) ---
7. Envía al SRI         →  @sri/client
8. Actualiza estado     →  @sri/persistence-adapter
9. Guarda artefactos    →  storage
```

---

### Capa 6 — `apps/invoice-worker` (Fase 2)

Worker BullMQ. Envíos y reintentos en background.

- Reintentos: 1s → 5s → 30s → 5min → 30min → `ERROR_FINAL`.
- Máximo de intentos configurable (default: 10).

---

### Capa 7 — `apps/invoice-api` (Fase 3)

API REST standalone. **Solo construir cuando haya 2+ proyectos consumidores reales.**

---

## Integración con el Proyecto Actual

El mapper siempre vive en el proyecto consumidor. Los paquetes `@sri/*` nunca conocen
el dominio de negocio de ninguna aplicación.

```typescript
// En el backend actual
import { IInvoice } from '@sri/core';
import { ElectronicBillingService } from '@sri/nest-module';
import { OrderEntity } from '@my-app/shared-entities'; // dominio propio de la app

@Injectable()
export class OrderBillingService {
  constructor(private readonly billing: ElectronicBillingService) {}

  // Facturación de una orden completada
  async billOrder(order: OrderEntity): Promise<void> {
    const invoiceData: IInvoice = this.mapOrderToInvoice(order);
    await this.billing.issueInvoice(invoiceData);
  }

  private mapOrderToInvoice(order: OrderEntity): IInvoice {
    // El mapeo del dominio propio hacia el contrato SRI
    // es responsabilidad exclusiva de esta aplicación
    return { ... };
  }
}
```

---

## Puntos Críticos — Implementar desde el Sprint 1

1. **Idempotencia** — Access key UNIQUE en BD. Mismo documento dos veces = error controlado.
2. **Reintentos con límite** — Backoff exponencial + `ERROR_FINAL` al agotar intentos.
3. **Trazabilidad** — Cada cambio de estado en `document_events` con timestamp y razón.
4. **Cifrado del certificado** — `.p12` y contraseña cifrados en reposo. Nunca en logs.
5. **Retención legal** — Comprobantes autorizados no se eliminan. Solo soft-delete.
6. **Ambientes separados** — Variables de entorno distintas. Nunca hardcodear fuera de `endpoints.ts`.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript (`strict: true`) |
| XML | `xmlbuilder2` |
| Firma XAdES-BES | `node-forge` |
| HTTP/SOAP | `axios` |
| BD SRI | PostgreSQL propio + TypeORM |
| Cola | BullMQ + Redis |
| PDF/RIDE | `pdfmake` |
| Storage | Sistema de archivos local → S3/MinIO en Fase 2 |

---

## Plan de Sprints

### Sprint 1 — Núcleo (Semana 1-2)
- [ ] `@sri/core`: enums, interfaces, entidades, DTOs
- [ ] `@sri/xml-generator`: builders + validación XSD + generador clave de acceso
- [ ] `@sri/signer`: firma XAdES-BES con certificado de pruebas
- [ ] Tests unitarios de las 3 capas (sin red ni BD)

### Sprint 2 — Integración y persistencia (Semana 2-3)
- [ ] `@sri/client`: recepción + autorización + reintentos
- [ ] `@sri/persistence-adapter`: entidades + repositorio + migraciones
- [ ] `@sri/nest-module`: módulo + servicio orquestador
- [ ] Prueba end-to-end contra ambiente PRUEBAS del SRI

### Sprint 3 — Robustez y producción (Semana 3-4)
- [ ] `invoice-worker`: cola BullMQ + reintentos automáticos
- [ ] Generación RIDE (PDF)
- [ ] Storage de artefactos
- [ ] Configuración ambiente PRODUCCION
- [ ] Auditoría, retención legal, alertas de error

---

## Lo que NO se debe hacer

- ❌ Ningún paquete `@sri/*` importa desde `shared-models`, `shared-dtos` ni `shared-entities`.
- ❌ No compartir la BD de SRI con la BD principal del proyecto.
- ❌ No enviar al SRI de forma síncrona en el request HTTP.
- ❌ No hardcodear URLs del SRI fuera del archivo `endpoints.ts`.
- ❌ No guardar el `.p12` ni su contraseña en texto plano en ningún lugar.
- ❌ No construir `invoice-api` hasta tener 2+ proyectos consumidores reales.
- ❌ No poner lógica de mapeo del dominio de negocio dentro de los paquetes `@sri/*`.
- ❌ No escribir código en español (variables, funciones, clases, archivos).
- ❌ No escribir comentarios en inglés.
- ❌ No comentar líneas obvias — solo complejidad media/alta merece comentario.

---

*Este documento es la fuente de verdad. Ante cualquier decisión de diseño, consultarlo primero.*
