# Sistema de Manejo de Errores - Arquitectura Profesional

## 🎯 Implementación Completada

Se ha implementado un sistema **centralizado, escalable y profesional** para el manejo de errores tanto en el backend (NestJS) como en el frontend (React).

---

## 🔧 Backend - NestJS

### 1. **Custom Exceptions** (`backend/src/common/exceptions/app.exceptions.ts`)

Excepciones tipadas con códigos de error claros:

```typescript
- AppException (base)
- NotFoundException
- BadRequestException
- ConflictException
- ValidationException
- DatabaseException
- etc.
```

**Beneficios:**
- Códigos de error consistentes
- Mensajes técnicos para logs
- Mensajes user-friendly para el cliente
- Metadatos adicionales (details)

### 2. **Global Exception Filter** (`backend/src/common/filters/global-exception.filter.ts`)

Interceptor centralizado que:
- ✅ Captura **todas** las excepciones de la app
- ✅ Transforma errores de Prisma a respuestas HTTP
- ✅ Maneja errores de NestJS
- ✅ Logs estructurados según severidad (error/warn/log)
- ✅ Respuestas consistentes con formato estándar

**Formato de respuesta:**
```json
{
  "statusCode": 404,
  "code": "RECORD_NOT_FOUND",
  "message": "Record to update not found",
  "userMessage": "No se encontró el registro solicitado",
  "timestamp": "2025-12-31T22:30:00.000Z",
  "path": "/products/abc123",
  "details": {...}
}
```

### 3. **Prisma Error Handling**

Mapeo automático de errores de Prisma:
- `P2002` → Duplicate entry (409 Conflict)
- `P2025` → Record not found (404 Not Found)
- `P2003` → Foreign key violation (400 Bad Request)
- `P2014` → Relation violation (400 Bad Request)

### 4. **Logs Estructurados**

- **500+**: `logger.error()` con stack trace
- **400-499**: `logger.warn()` con contexto
- Incluye: method, url, body, query, params, statusCode, code

---

## 🎨 Frontend - React

### 1. **Toast Notifications System** (`frontend/src/shared/ui/toast/`)

Sistema de notificaciones moderno:
- ✅ 4 variantes: `success`, `error`, `warning`, `info`
- ✅ Auto-dismiss configurable
- ✅ Animaciones suaves
- ✅ Dark mode support
- ✅ Stack de múltiples toasts
- ✅ Close manual

**Uso:**
```typescript
const toast = useToastContext();

toast.success('Producto eliminado', 'Operación exitosa');
toast.error('Error', 'No se pudo completar la operación');
toast.warning('Advertencia', 'Stock bajo');
toast.info('Info', 'Cambios guardados');
```

### 2. **ConfirmDialog Mejorado**

- ✅ Muestra errores **inline** en el modal (no lo cierra)
- ✅ Estado de loading durante operación
- ✅ Previene cerrar mientras procesa
- ✅ Extrae `userMessage` del backend
- ✅ Fallback a mensajes genéricos

### 3. **Manejo de Errores en Páginas**

Patrón implementado en `ProductManagementPage`:

```typescript
const handleConfirmDelete = async () => {
  setIsDeleting(true);
  try {
    await deleteProduct(id);
    
    // Cerrar modal
    setIsDeleteDialogOpen(false);
    
    // Toast de éxito
    toast.success('Producto eliminado', 'Operación exitosa');
  } catch (error: any) {
    // Error se muestra inline en el modal
    // Log para debugging
    console.error('Error:', error);
    
    // Re-lanzar para que ConfirmDialog lo capture
    throw error;
  } finally {
    setIsDeleting(false);
  }
};
```

---

## 🔄 Flujo Completo

### Escenario: Eliminar producto que no existe

1. **Frontend**: Usuario hace clic en "Eliminar"
2. **API Call**: `DELETE /products/invalid-id`
3. **Backend**: 
   - Product.service lanza error
   - GlobalExceptionFilter lo captura
   - Transforma a respuesta HTTP 404
   - Log warn con contexto
4. **Frontend**:
   - Error capturado en `catch`
   - ConfirmDialog muestra mensaje inline
   - Usuario puede reintentar o cancelar

### Escenario: Eliminación exitosa

1. **Frontend**: Usuario confirma
2. **API Call**: `DELETE /products/abc123`
3. **Backend**:
   - Soft delete exitoso
   - Log de operación
   - Respuesta 200 OK
4. **Frontend**:
   - Modal se cierra
   - Toast verde de éxito
   - Lista se refresca

---

## 📊 Mejores Prácticas Implementadas

### ✅ Separación de Concerns
- **Logs técnicos**: Para devs/ops
- **Mensajes de usuario**: User-friendly
- **Codes**: Para debugging y métricas

### ✅ Centralización
- Un solo punto de manejo (GlobalExceptionFilter)
- Consistencia en toda la app
- Fácil de mantener y extender

### ✅ Experiencia de Usuario
- Errores claros y accionables
- No usar `alert()` (antipatrón)
- Feedback visual inmediato
- Permite reintentar sin cerrar modal

### ✅ Debugging
- Stack traces en logs
- Contexto completo de requests
- Códigos de error únicos
- Prisma error codes mapeados

### ✅ Escalabilidad
- Fácil agregar nuevas excepciones
- Toasts reutilizables globalmente
- Patrón consistente en toda la app

---

## 🎓 Cómo usar en nuevas features

### Backend - Lanzar excepciones:

```typescript
// En cualquier service
if (!user) {
  throw new NotFoundException('User', userId);
}

if (email exists) {
  throw new ConflictException(
    'Email already exists',
    'Este email ya está registrado'
  );
}

throw new ValidationException(
  'Invalid data',
  'Los datos no son válidos',
  { field: 'email', reason: 'invalid format' }
);
```

### Frontend - Usar toasts:

```typescript
const toast = useToastContext();

try {
  await saveData();
  toast.success('Guardado', 'Datos guardados correctamente');
} catch (error) {
  toast.error('Error', error.response?.data?.userMessage);
}
```

---

## 🚀 Resultado Final

- ✅ Sistema centralizado y escalable
- ✅ Logs claros y estructurados
- ✅ Mensajes user-friendly
- ✅ Experiencia profesional
- ✅ Fácil de mantener y extender
- ✅ Preparado para proyectos grandes

Este es el estándar de la industria para aplicaciones enterprise! 🎉
