# Sistema de Logging

## Descripción General

El sistema de logging está implementado utilizando un servicio personalizado que extiende la interfaz `LoggerService` de NestJS, proporcionando funcionalidades avanzadas para el registro de eventos, errores y operaciones de la aplicación.

## Características Principales

### 1. **Rotación Automática de Archivos**
- Los archivos de log se rotan automáticamente cuando superan los **10MB**
- Se mantienen logs de los últimos **7 días**
- Los archivos antiguos se eliminan automáticamente

### 2. **Niveles de Log**

#### `log()` - Información General
```typescript
this.logger.log('Mensaje informativo', 'Context');
```
- Se muestra en consola
- NO se guarda en archivo (para evitar saturación)

#### `error()` - Errores
```typescript
this.logger.error('Mensaje de error', 'Stack trace', 'Context');
```
- Se muestra en consola con color rojo
- **SÍ se guarda en archivo**

#### `warn()` - Advertencias
```typescript
this.logger.warn('Mensaje de advertencia', 'Context');
```
- Se muestra en consola con color amarillo
- **SÍ se guarda en archivo**

#### `debug()` - Debugging
```typescript
this.logger.debug('Mensaje de debug', 'Context');
```
- Solo se muestra en modo desarrollo
- NO se guarda en archivo

#### `verbose()` - Detallado
```typescript
this.logger.verbose('Mensaje verbose', 'Context');
```
- Solo se muestra en modo desarrollo
- NO se guarda en archivo

### 3. **Métodos Especializados**

#### `logError()` - Errores Detallados
```typescript
this.logger.logError(error, 'AuthService', { userId: '123' });
```
Registra información completa del error:
- Mensaje de error
- Stack trace
- Código de estado HTTP
- Metadata de Prisma (si aplica)
- Información adicional personalizada

#### `logDatabaseOperation()` - Operaciones de Base de Datos
```typescript
this.logger.logDatabaseOperation('CREATE', 'Product', { name: 'Producto X' });
```
Registra operaciones CRUD:
- Tipo de operación (CREATE, READ, UPDATE, DELETE)
- Modelo afectado
- Datos involucrados
- Errores (si los hay)

#### `logHttpRequest()` - Requests HTTP
```typescript
this.logger.logHttpRequest('POST', '/api/products', 201, 156, userAgent, ip);
```
Registra automáticamente (vía interceptor):
- Método HTTP
- URL
- Código de respuesta
- Tiempo de respuesta
- User Agent
- IP del cliente

#### `logAuthEvent()` - Eventos de Autenticación
```typescript
this.logger.logAuthEvent('LOGIN', userId, email, true);
this.logger.logAuthEvent('LOGIN', undefined, email, false, 'Contraseña incorrecta');
```
Registra eventos de autenticación:
- Tipo de evento (LOGIN, LOGOUT, REGISTER)
- ID de usuario
- Email
- Éxito/Fallo
- Razón (en caso de fallo)

## Configuración

### Archivo de Configuración
Los logs se guardan en la carpeta `logs/` en la raíz del proyecto.

### Variables de Entorno
```bash
NODE_ENV=development  # Habilita logs debug y verbose
NODE_ENV=production   # Solo logs importantes
```

## Estructura de Archivos de Log

### Nombre de Archivo
```
YYYY-MM-DD.log
Ejemplo: 2025-12-31.log
```

### Formato de Entrada
```json
{
  "timestamp": "2025-12-31T10:30:45.123Z",
  "level": "ERROR",
  "context": "ProductService",
  "message": "Error al crear producto",
  "trace": "Error: Validation failed\n    at ProductService.create..."
}
```

## Integración en Servicios

### Ejemplo: ProductService
```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class ProductService {
  constructor(private readonly logger: LoggerService) {}

  async create(data: CreateProductDto): Promise<Product> {
    try {
      this.logger.log(`Creando producto: ${data.name}`, 'ProductService');
      
      const product = await prisma.product.create({ data });
      
      this.logger.log(`Producto creado: ${product.id}`, 'ProductService');
      this.logger.logDatabaseOperation('CREATE', 'Product', data);
      
      return product;
    } catch (error) {
      this.logger.logError(error, 'ProductService', { data });
      throw error;
    }
  }
}
```

### Ejemplo: AuthService
```typescript
async login(data: LoginDto): Promise<LoginResponse> {
  this.logger.log(`Intento de login: ${data.email}`, 'AuthService');
  
  const user = await this.findUser(data.email);
  
  if (!user) {
    this.logger.logAuthEvent('LOGIN', undefined, data.email, false, 'Usuario no encontrado');
    throw new UnauthorizedException();
  }
  
  if (!await this.verifyPassword(data.password, user.password)) {
    this.logger.logAuthEvent('LOGIN', user.id, user.email, false, 'Contraseña incorrecta');
    throw new UnauthorizedException();
  }
  
  this.logger.logAuthEvent('LOGIN', user.id, user.email, true);
  this.logger.log(`Login exitoso: ${user.email}`, 'AuthService');
  
  return this.generateTokens(user);
}
```

## Interceptor de Logging HTTP

El interceptor `LoggingInterceptor` se aplica globalmente y registra automáticamente:
- Todas las peticiones HTTP
- Tiempo de respuesta
- Código de estado
- Errores que ocurran

### Configuración en main.ts
```typescript
const logger = app.get(LoggerService);
app.useLogger(logger);
app.useGlobalInterceptors(new LoggingInterceptor(logger));
```

## Filtro Global de Excepciones

El `AllExceptionsFilter` captura todas las excepciones y:
- Las registra con información detallada
- Maneja errores de Prisma de forma especial
- Retorna respuestas consistentes al cliente

## Mejores Prácticas

### 1. **Contexto Descriptivo**
```typescript
// ✅ Bueno
this.logger.log('Creando producto: Laptop HP', 'ProductService');

// ❌ Malo
this.logger.log('Creando', 'Service');
```

### 2. **Log en Puntos Clave**
- Inicio de operaciones importantes
- Finalización exitosa
- Errores y excepciones
- Eventos de autenticación
- Operaciones de base de datos

### 3. **Evitar Información Sensible**
```typescript
// ❌ NO hacer esto
this.logger.log(`Password: ${user.password}`, 'AuthService');

// ✅ Hacer esto
this.logger.log(`Usuario autenticado: ${user.email}`, 'AuthService');
```

### 4. **Usar el Método Apropiado**
- `log()`: Para información general
- `error()`: Para errores reales
- `warn()`: Para situaciones sospechosas pero no críticas
- `logError()`: Para errores con contexto completo
- `logDatabaseOperation()`: Para operaciones CRUD

## Monitoreo de Logs

### Ver logs en tiempo real
```bash
# Windows
Get-Content logs\2025-12-31.log -Wait -Tail 50

# Linux/Mac
tail -f logs/2025-12-31.log
```

### Buscar errores específicos
```bash
# Windows
Select-String -Path "logs\*.log" -Pattern "ERROR"

# Linux/Mac
grep -r "ERROR" logs/
```

### Análisis de logs
Los logs están en formato JSON, lo que permite:
- Parsing automático
- Integración con herramientas de análisis
- Búsqueda y filtrado avanzado

## Mantenimiento

### Limpieza Manual
Si necesitas limpiar logs manualmente:
```bash
# Eliminar logs de más de 7 días
# El sistema lo hace automáticamente, pero si necesitas hacerlo manualmente:

# Windows
Get-ChildItem logs\*.log | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item

# Linux/Mac
find logs/ -name "*.log" -mtime +7 -delete
```

### Cambiar Configuración
En [logger.service.ts](backend/src/common/logger/logger.service.ts):
```typescript
private readonly maxLogSize = 10 * 1024 * 1024; // Cambiar tamaño máximo
private readonly maxLogFiles = 7; // Cambiar días de retención
```

## Troubleshooting

### Los logs no se guardan
1. Verificar permisos de escritura en carpeta `logs/`
2. Verificar espacio en disco
3. Revisar consola para errores del logger

### Logs muy grandes
1. Reducir `maxLogSize`
2. Reducir `maxLogFiles`
3. Revisar si se están loggeando datos innecesarios

### Performance
El sistema está optimizado para:
- Escritura asíncrona (no bloquea la aplicación)
- Rotación automática sin downtime
- Limpieza automática de archivos antiguos
