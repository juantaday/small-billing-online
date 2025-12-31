# Arquitectura de Logging - Mejores Prácticas

## 🎯 Regla de Oro

**Los controladores NO necesitan logging manual porque ya está automatizado.**

## 📋 Capas de Logging

### 1️⃣ **Interceptor HTTP (Automático)**
`LoggingInterceptor` captura automáticamente:
- ✅ Todas las peticiones HTTP (GET, POST, PUT, DELETE)
- ✅ URL completa
- ✅ Método HTTP
- ✅ Código de respuesta (200, 404, 500, etc.)
- ✅ Tiempo de respuesta en milisegundos
- ✅ User-Agent e IP del cliente

**Ejemplo de log generado:**
```json
{
  "timestamp": "2025-12-31T10:30:45.123Z",
  "level": "LOG",
  "context": "HTTP",
  "message": {
    "method": "POST",
    "url": "/api/products",
    "statusCode": 201,
    "responseTime": "156ms",
    "ip": "192.168.1.100"
  }
}
```

### 2️⃣ **Filtro de Excepciones (Automático)**
`AllExceptionsFilter` captura automáticamente:
- ✅ Todos los errores no manejados
- ✅ Errores HTTP de NestJS
- ✅ Errores de Prisma con detalles
- ✅ Stack trace completo
- ✅ Información del request (body, params, query, user)

**Ejemplo de log de error:**
```json
{
  "timestamp": "2025-12-31T10:30:45.123Z",
  "level": "ERROR",
  "context": "POST /api/products",
  "message": {
    "message": "Validation failed",
    "stack": "Error: Validation failed\n    at ProductService.create...",
    "statusCode": 400,
    "code": "P2002",
    "additionalInfo": {
      "body": { "name": "Producto duplicado" },
      "userId": "123"
    }
  }
}
```

### 3️⃣ **Servicios (Manual y Estratégico)**
Los servicios SÍ necesitan logging en:

#### ✅ **Operaciones importantes (inicio y fin)**
```typescript
async create(data: CreateProductDto): Promise<ProductDto> {
  this.logger.log(`Creando producto: ${data.name}`, 'ProductService');
  
  const product = await prisma.product.create({ data });
  
  this.logger.log(`Producto creado exitosamente: ${product.id}`, 'ProductService');
  return product;
}
```

#### ✅ **Errores con contexto detallado**
```typescript
async create(data: CreateProductDto): Promise<ProductDto> {
  try {
    this.logger.log(`Creando producto: ${data.name}`, 'ProductService');
    const product = await prisma.product.create({ data });
    this.logger.log(`Producto creado: ${product.id}`, 'ProductService');
    return product;
  } catch (error) {
    // Loggear con contexto específico
    this.logger.logDatabaseOperation('CREATE', 'Product', data, error);
    throw error; // El filtro global lo manejará y agregará más contexto
  }
}
```

#### ✅ **Operaciones de base de datos críticas**
```typescript
await prisma.product.create({ data });
this.logger.logDatabaseOperation('CREATE', 'Product', { name: data.name });
```

#### ✅ **Eventos de autenticación**
```typescript
this.logger.logAuthEvent('LOGIN', user.id, user.email, true);
this.logger.logAuthEvent('LOGIN', undefined, email, false, 'Contraseña incorrecta');
```

#### ✅ **Advertencias de negocio**
```typescript
if (presentation.stock < presentation.minStock) {
  this.logger.warn(
    `Stock bajo: ${presentation.name} - Actual: ${presentation.stock} - Mínimo: ${presentation.minStock}`,
    'PresentationService'
  );
}
```

## ❌ ¿Qué NO hacer?

### NO loggear en controladores
```typescript
// ❌ INCORRECTO
@Controller('products')
export class ProductController {
  @Post()
  async create(@Body() data: CreateProductDto) {
    this.logger.log('Recibida petición POST /products'); // ❌ Innecesario
    return this.productService.create(data);
  }
}
```
**¿Por qué?** El `LoggingInterceptor` ya lo hace automáticamente.

### NO duplicar logs de errores
```typescript
// ❌ INCORRECTO
async create(data: CreateProductDto) {
  try {
    return await prisma.product.create({ data });
  } catch (error) {
    this.logger.error(error); // ❌ 
    this.logger.logError(error, 'ProductService'); // ❌ Duplicado
    throw error; // El filtro global ya loggea todo
  }
}
```

### NO loggear información sensible
```typescript
// ❌ INCORRECTO
this.logger.log(`Password: ${user.password}`, 'AuthService');
this.logger.log(`Token: ${token}`, 'AuthService');
this.logger.log(`Credit card: ${card}`, 'PaymentService');
```

## ✅ Patrón Recomendado en Servicios

### Opción 1: Sin try-catch (más simple)
Cuando no necesitas lógica especial de error:
```typescript
async findOne(id: string): Promise<Product> {
  this.logger.log(`Buscando producto: ${id}`, 'ProductService');
  
  const product = await prisma.product.findUnique({ where: { id } });
  
  if (!product) {
    this.logger.warn(`Producto no encontrado: ${id}`, 'ProductService');
    throw new NotFoundException('Producto no encontrado');
  }
  
  return product;
}
```
**El filtro global capturará y loggeará el NotFoundException automáticamente.**

### Opción 2: Con try-catch (para contexto específico)
Cuando necesitas agregar contexto adicional:
```typescript
async create(data: CreateProductDto): Promise<Product> {
  try {
    this.logger.log(`Creando producto: ${data.name}`, 'ProductService');
    
    const product = await prisma.product.create({ data });
    
    this.logger.log(`Producto creado: ${product.id}`, 'ProductService');
    this.logger.logDatabaseOperation('CREATE', 'Product', data);
    
    return product;
  } catch (error) {
    // Solo si necesitas contexto específico
    this.logger.logDatabaseOperation('CREATE', 'Product', data, error);
    
    // Transformar errores de Prisma en errores de negocio
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Producto "${data.name}" ya existe`);
      }
    }
    
    throw error; // El filtro global agregará más contexto
  }
}
```

## 🎭 Flujo Completo de un Error

```
1. Usuario hace POST /api/products con nombre duplicado
   ↓
2. LoggingInterceptor captura el request (inicio)
   LOG: POST /api/products - IP: 192.168.1.100
   ↓
3. ProductController.create() llama al servicio
   (sin logging, solo pasa el control)
   ↓
4. ProductService.create() intenta crear
   LOG: "Creando producto: Laptop HP"
   ↓
5. Prisma lanza PrismaClientKnownRequestError (P2002)
   ↓
6. Catch en el servicio:
   LOG Database: "CREATE Product - ERROR: P2002"
   ↓
7. Servicio transforma a ConflictException
   throw new ConflictException('Producto "Laptop HP" ya existe')
   ↓
8. AllExceptionsFilter captura la excepción
   ERROR: {
     statusCode: 409,
     message: 'Producto "Laptop HP" ya existe',
     stack: '...',
     context: 'POST /api/products',
     body: { name: "Laptop HP" },
     userId: "123"
   }
   ↓
9. LoggingInterceptor captura el final
   WARN: POST /api/products - 409 - 45ms
   ↓
10. Cliente recibe respuesta estructurada
```

## 📊 Resultado: Logs Generados

```json
// 1. Inicio del request
{
  "timestamp": "2025-12-31T10:30:45.000Z",
  "level": "LOG",
  "context": "HTTP",
  "message": "POST /api/products"
}

// 2. Servicio: inicio de operación
{
  "timestamp": "2025-12-31T10:30:45.012Z",
  "level": "LOG",
  "context": "ProductService",
  "message": "Creando producto: Laptop HP"
}

// 3. Servicio: error de DB
{
  "timestamp": "2025-12-31T10:30:45.034Z",
  "level": "ERROR",
  "context": "Database-Product",
  "message": {
    "operation": "CREATE",
    "model": "Product",
    "error": { "code": "P2002", "message": "Unique constraint failed" }
  }
}

// 4. Filtro: error transformado
{
  "timestamp": "2025-12-31T10:30:45.035Z",
  "level": "ERROR",
  "context": "POST /api/products",
  "message": {
    "message": "Producto \"Laptop HP\" ya existe",
    "statusCode": 409,
    "code": "P2002",
    "stack": "Error: ...",
    "additionalInfo": {
      "body": { "name": "Laptop HP" },
      "userId": "123"
    }
  }
}

// 5. Interceptor: fin del request
{
  "timestamp": "2025-12-31T10:30:45.045Z",
  "level": "WARN",
  "context": "HTTP",
  "message": {
    "method": "POST",
    "url": "/api/products",
    "statusCode": 409,
    "responseTime": "45ms"
  }
}
```

## 🎯 Resumen

| Capa | Logging | Responsabilidad |
|------|---------|----------------|
| **Controlador** | ❌ No manual | Ya cubierto por interceptor |
| **Servicio** | ✅ Sí estratégico | Lógica de negocio, operaciones críticas |
| **Interceptor** | ✅ Automático | Todas las peticiones HTTP |
| **Filtro** | ✅ Automático | Todas las excepciones |

## 💡 Objetivo Final

**Capturar errores a mayor detalle** sin duplicar información:
- ✅ Request completo (automático)
- ✅ Operaciones de negocio (manual en servicios)
- ✅ Errores con contexto (try-catch en servicios)
- ✅ Stack trace completo (automático)
- ✅ Response final (automático)

Todo esto se guarda en archivos JSON para análisis posterior.
