# 📦 Estructura de Entidades Compartidas (Shared)

Este paquete centraliza todos los tipos TypeScript (DTOs, Enums) que se comparten entre **Frontend** y **Backend**.

## 📂 Estructura

```
shared/src/
├── entities/           # DTOs (Data Transfer Objects)
│   ├── People.entity.ts
│   ├── User.entity.ts
│   ├── Customer.entity.ts
│   ├── CustomerCategory.entity.ts
│   ├── Category.entity.ts
│   ├── Product.entity.ts
│   ├── ProductImage.entity.ts
│   ├── Presentation.entity.ts
│   ├── PaymentMethod.entity.ts
│   ├── Reward.entity.ts
│   └── LoyaltyTransaction.entity.ts
│
├── enums/              # Enumeraciones
│   ├── PersonType.enum.ts
│   ├── IdentityType.enum.ts
│   ├── Gender.enum.ts
│   ├── LoyaltyTransactionType.enum.ts
│   └── RewardType.enum.ts
│
└── index.ts            # Exporta todo
```

## 🎯 Patrón de DTOs

Cada entidad tiene 3 tipos de DTOs:

### 1️⃣ **CreateDto** - Para crear nuevos registros
```typescript
export interface CreateProductDto {
  categoryId: string;
  name: string;
  slug: string;
  // ... campos requeridos
}
```

### 2️⃣ **Dto** - Respuesta completa de la API
```typescript
export interface ProductDto extends CreateProductDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3️⃣ **UpdateDto** - Para actualizar registros
```typescript
export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
}
```

### 4️⃣ **WithRelationsDto** - Con relaciones pobladas (opcional)
```typescript
export interface ProductWithRelationsDto extends ProductDto {
  category?: CategoryDto;
  images?: ProductImageDto[];
  presentations?: PresentationDto[];
}
```

## 📊 Entidades Creadas

### 🛒 **Sistema de Productos**
- ✅ `Category` - Categorías de productos
- ✅ `Product` - Productos
- ✅ `ProductImage` - Imágenes de productos
- ✅ `Presentation` - Presentaciones/empaques con precios y stock

### 👥 **Sistema de Clientes**
- ✅ `Customer` - Clientes comerciales
- ✅ `CustomerCategory` - Categorías de clientes (VIP, Distribuidor, etc.)

### 🏆 **Sistema de Lealtad**
- ✅ `Reward` - Premios canjeables
- ✅ `LoyaltyTransaction` - Historial de puntos

### 💳 **Sistema de Pagos**
- ✅ `PaymentMethod` - Métodos de pago

## 🔧 Uso en Backend (NestJS)

```typescript
import { CreateProductDto, ProductDto } from '@small-billing/shared';

@Controller('products')
export class ProductsController {
  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductDto> {
    // ...
  }
}
```

## 🎨 Uso en Frontend (React)

```typescript
import { ProductDto, CategoryDto } from '@small-billing/shared';

function ProductCard({ product }: { product: ProductDto }) {
  // ...
}
```

## ✨ Ventajas

1. **Tipado fuerte** en frontend y backend
2. **Single source of truth** - Una sola definición
3. **Refactoring seguro** - Cambios propagados automáticamente
4. **Autocomplete** en VS Code
5. **Validación en tiempo de desarrollo**

## 🚀 Próximos pasos

Cuando implementes **Órdenes/Ventas**, agrega:
- `Order.entity.ts`
- `OrderItem.entity.ts`
- `OrderStatus.enum.ts`
