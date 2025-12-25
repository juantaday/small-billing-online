# 🌐 Shared API - Cliente HTTP Centralizado

## 📍 Ubicación Única

```
src/shared/api/               ← ÚNICA fuente de verdad
├── base-client.ts           ← Cliente HTTP base
└── index.ts                 ← Exports públicos
```

**❌ NO existe `src/api/`** - Fue eliminado para evitar confusión

## 🎯 Propósito

Proveer un **cliente HTTP base reutilizable** para todas las entidades de la aplicación.

## 📦 Exports

```typescript
// Cliente base para extender
export { BaseApiClient } from './base-client';

// Instancia global (opcional)
export { apiClient } from './index';
```

## 🔧 Uso en Entities

### Patrón Recomendado: Extender BaseApiClient

```typescript
// entities/customer/api/customer-api.ts
import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';

class CustomerApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<CustomerDto[]> {
    return this.get<CustomerDto[]>('/customers');
  }

  async create(data: CreateCustomerDto): Promise<CustomerDto> {
    return this.post<CustomerDto>('/customers', data);
  }
}

export const customerApi = new CustomerApi();
```

### Alternativa: Usar Instancia Global (No recomendado)

```typescript
// Solo para casos simples
import { apiClient } from '@/shared/api';

const customers = await apiClient.get('/customers');
```

**⚠️ Recomendación**: Siempre crear una clase API específica por entidad.

## 🔌 API del BaseApiClient

### Métodos Disponibles

#### `get<T>(endpoint, options?)`
```typescript
await this.get<CustomerDto[]>('/customers');
await this.get<CustomerDto>('/customers/123');
await this.get<CustomerDto[]>('/customers', { 
  params: { page: 1, limit: 10 } 
});
```

#### `post<T>(endpoint, body?, options?)`
```typescript
await this.post<CustomerDto>('/customers', {
  firstName: 'Juan',
  lastName: 'Pérez'
});
```

#### `put<T>(endpoint, body?, options?)`
```typescript
await this.put<CustomerDto>('/customers/123', {
  firstName: 'Juan Actualizado'
});
```

#### `patch<T>(endpoint, body?, options?)`
```typescript
await this.patch<CustomerDto>('/customers/123', {
  firstName: 'Juan'
});
```

#### `deleteBase<T>(endpoint, options?)`
```typescript
await this.deleteBase<void>('/customers/123');
```

**Nota**: Se llama `deleteBase` para no sobrescribir `delete` de JavaScript.

## 🔐 Autenticación Automática

El cliente **agrega automáticamente** el token de autenticación:

```typescript
private getHeaders(customHeaders?: HeadersInit): HeadersInit {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
```

No necesitas agregar headers de autenticación manualmente.

## 🌍 Configuración de URL Base

La URL base viene de `@/shared/config`:

```typescript
// shared/config/index.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.PROD 
    ? 'https://small-billing-online.onrender.com'
    : 'http://localhost:3001',
};
```

## 🏗️ Estructura Completa

```
Configuración:
shared/config/index.ts
    ↓
Cliente Base:
shared/api/base-client.ts
    ↓
Entities API:
entities/customer/api/customer-api.ts
entities/product/api/product-api.ts
entities/category/api/category-api.ts
    ↓
Features:
features/customer-management/model/use-customers.ts
    ↓
Pages:
pages/customers/ui/CustomersPage.tsx
```

## ✅ Ventajas de Esta Centralización

### 1. **Sin Duplicación**
- ❌ Antes: `src/api/apiClient.ts` + `src/shared/api/base-client.ts`
- ✅ Ahora: Solo `src/shared/api/base-client.ts`

### 2. **Imports Claros**
```typescript
// ✅ ÚNICO import posible
import { BaseApiClient } from '@/shared/api';

// ❌ Ya no existe
import { apiClient } from '@/api/apiClient';
```

### 3. **Configuración Centralizada**
- Token de auth: Automático en todos los requests
- Base URL: Desde `API_CONFIG`
- Headers: Consistentes en toda la app

### 4. **Type Safety**
```typescript
// Tipado completo en todas las requests
async getAll(): Promise<CustomerDto[]> {
  return this.get<CustomerDto[]>('/customers');
}
```

### 5. **Fácil Testing**
```typescript
// Mock del cliente para tests
class MockCustomerApi extends BaseApiClient {
  async getAll(): Promise<CustomerDto[]> {
    return [{ id: '1', ... }];
  }
}
```

## 🔄 Migración de Código Viejo

Si encuentras código usando el cliente viejo:

### ❌ Antes (viejo)
```typescript
import { apiClient } from '@/api/apiClient';

const customers = await apiClient.get('/customers');
```

### ✅ Después (nuevo)
```typescript
import { customerApi } from '@/entities/customer';

const customers = await customerApi.getAll();
```

## 📝 Checklist de Centralización

- ✅ Cliente HTTP único en `shared/api/`
- ✅ Carpeta vieja `src/api/` eliminada
- ✅ Todas las entities extienden `BaseApiClient`
- ✅ Configuración desde `API_CONFIG`
- ✅ Autenticación automática
- ✅ Imports con alias `@/shared/api`

## 🚫 Reglas de Uso

### ✅ HACER

```typescript
// 1. Crear API por entidad
class ProductApi extends BaseApiClient {
  async getAll() { return this.get('/products'); }
}

// 2. Exportar instancia única
export const productApi = new ProductApi();

// 3. Usar en features
import { productApi } from '@/entities/product';
```

### ❌ NO HACER

```typescript
// 1. NO crear múltiples instancias
const api1 = new BaseApiClient(url);
const api2 = new BaseApiClient(url);

// 2. NO hacer fetch directo
const response = await fetch('/customers');

// 3. NO duplicar lógica de HTTP
function myCustomFetch() { /* ... */ }
```

## 🎯 Resumen

| Aspecto | Solución |
|---------|----------|
| **Ubicación** | `src/shared/api/` únicamente |
| **Cliente Base** | `BaseApiClient` |
| **Uso** | Extender en cada entity |
| **Configuración** | `API_CONFIG` de `shared/config` |
| **Auth** | Automático desde localStorage |
| **Imports** | `@/shared/api` |

**Todo centralizado, sin ambigüedades, sin duplicación.**
