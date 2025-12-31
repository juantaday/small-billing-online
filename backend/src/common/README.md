# Sistema de Logging y Manejo de Errores

## Estructura

```
backend/src/common/
├── logger/
│   ├── logger.module.ts    # Módulo global de logging
│   └── logger.service.ts   # Servicio de logging
└── filters/
    └── http-exception.filter.ts  # Filtro global de excepciones
```

## Características

### 1. **LoggerService**
Servicio centralizado para logging con las siguientes funcionalidades:

- **Logs en consola**: Todos los niveles (log, error, warn, debug, verbose)
- **Logs en archivo**: Solo errores y warnings se guardan en archivo
- **Logs diarios**: Un archivo por día en formato `YYYY-MM-DD.log`
- **Métodos especializados**:
  - `logError()`: Para errores detallados con stack trace
  - `logDatabaseOperation()`: Para operaciones de base de datos

### 2. **AllExceptionsFilter**
Filtro global que captura todas las excepciones y las maneja de forma centralizada:

- **Errores HTTP**: ConflictException, NotFoundException, BadRequestException, etc.
- **Errores de Prisma**: 
  - `P2002`: Restricción única violada
  - `P2003`: Clave foránea inválida
  - `P2025`: Registro no encontrado
  - `P2000`: Valor muy largo para columna
  - Y más...
- **Respuesta estandarizada**: Formato consistente para todos los errores
- **Logging automático**: Todos los errores se registran con contexto completo

## Uso en Servicios

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class MiServicio {
  constructor(private readonly logger: LoggerService) {}

  async crear(data: any) {
    try {
      this.logger.log('Creando registro', 'MiServicio');
      
      // Operación...
      
      this.logger.log('Registro creado exitosamente', 'MiServicio');
      return result;
    } catch (error) {
      this.logger.logError(error, 'MiServicio', { data });
      throw error; // El filtro global lo manejará
    }
  }
}
```

## Estructura de Logs

### Archivo de log (.log)
```json
{
  "timestamp": "2025-12-29T18:55:00.000Z",
  "level": "ERROR",
  "context": "ProductService",
  "message": {
    "message": "El valor proporcionado es muy largo para el campo",
    "stack": "...",
    "code": "P2000",
    "additionalInfo": { ... }
  },
  "trace": "..."
}
```

### Respuesta de error HTTP
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-29T18:55:00.000Z",
  "path": "/products",
  "method": "POST",
  "message": "El valor proporcionado es muy largo para el campo: shortDescription",
  "errorCode": "P2000"
}
```

## Configuración

El sistema está configurado globalmente en `app.module.ts`:

```typescript
@Module({
  imports: [
    LoggerModule, // Logging global
    // ...otros módulos
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter, // Filtro global
    },
  ],
})
export class AppModule {}
```

## Beneficios

1. **Manejo centralizado**: Un solo punto para todos los errores
2. **Logs estructurados**: Formato JSON para fácil parsing
3. **Debugging mejorado**: Stack traces completos y contexto adicional
4. **Respuestas consistentes**: Mismo formato para todos los errores
5. **Prisma-aware**: Traduce errores técnicos de Prisma a mensajes amigables
6. **Producción-ready**: Incluye información de debug solo en desarrollo
