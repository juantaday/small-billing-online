# 🖼️ Sistema de Gestión de Imágenes de Productos

## 📋 Descripción

Sistema profesional y escalable para gestionar imágenes de productos con las siguientes características:

- ✅ **Separación de responsabilidades**: Las imágenes se gestionan después de crear el producto
- ✅ **Upload de imágenes** con preview y validación
- ✅ **Drag & Drop** para reordenar imágenes
- ✅ **Imagen primaria**: Establecer la imagen principal del producto
- ✅ **Múltiples imágenes** por producto
- ✅ **UI profesional** con feedback visual

## 🎯 Flujo de Trabajo

### 1. Crear Producto (Wizard)
El administrador primero crea el producto con:
- Información básica (nombre, categoría, etc.)
- Impuestos
- Presentaciones
- Presentaciones por defecto

**No se incluyen imágenes en esta etapa** para mantener el wizard simple y rápido.

### 2. Gestionar Imágenes (Modal)
Después de crear el producto, desde la lista:
1. Click en el botón **🖼️ Gestionar Imágenes**
2. Se abre un modal especializado con:
   - Área de upload de imágenes
   - Lista de imágenes con preview
   - Drag & Drop para reordenar
   - Botón para establecer imagen primaria
   - Botón para eliminar imágenes

## 🏗️ Arquitectura Frontend

### Componentes Creados

```
frontend/src/
├── entities/product/api/
│   └── useProductImages.ts          # Hook para operaciones CRUD de imágenes
├── features/product-management/ui/
│   └── ProductImageManager.tsx      # Modal gestor de imágenes
├── shared/ui/
│   ├── ImageUpload.tsx              # Componente de upload con preview
│   └── Modal.tsx                    # Modal reutilizable
└── pages/
    └── ProductManagementPage.tsx    # Página con botón "Gestionar Imágenes"
```

### Hook: `useProductImages`

```typescript
const {
  images,              // Array de imágenes
  loading,             // Estado de carga
  error,               // Errores
  fetchImages,         // Cargar imágenes del producto
  createImage,         // Crear nueva imagen
  updateImage,         // Actualizar imagen
  deleteImage,         // Eliminar imagen
  setPrimaryImage,     // Establecer como primaria
  reorderImages,       // Reordenar imágenes
} = useProductImages(productId);
```

### Componente: `ProductImageManager`

```typescript
<ProductImageManager
  isOpen={isOpen}
  onClose={onClose}
  productId={product.id}
  productName={product.name}
/>
```

**Características:**
- Upload de imágenes con validación (tamaño, formato)
- Preview antes de subir
- Drag & Drop para reordenar (usa `@dnd-kit`)
- Establecer imagen primaria (estrella ⭐)
- Eliminar imágenes con confirmación
- Responsive y dark mode

## 🔧 Configuración del Backend

### Endpoints Requeridos

Debes implementar los siguientes endpoints en tu API de NestJS:

#### 1. **GET** `/products/:productId/images`
Obtener todas las imágenes de un producto.

```typescript
// Response
[
  {
    id: 'clx...',
    productId: 'clx...',
    imageUrl: 'https://...',
    altText: 'Descripción',
    isPrimary: true,
    displayOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z'
  }
]
```

#### 2. **POST** `/products/:productId/images`
Crear una nueva imagen para un producto.

```typescript
// Body
{
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

// Response
{
  id: 'clx...',
  productId: 'clx...',
  imageUrl: 'https://...',
  altText: 'Descripción',
  isPrimary: false,
  displayOrder: 1,
  createdAt: '2024-01-01T00:00:00.000Z'
}
```

**Lógica del backend:**
- Si `isPrimary: true`, poner todas las demás imágenes del producto como `isPrimary: false`
- Si es la primera imagen del producto, establecerla automáticamente como primaria

#### 3. **PATCH** `/products/:productId/images/:imageId`
Actualizar una imagen existente.

```typescript
// Body
{
  imageUrl?: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}
```

#### 4. **DELETE** `/products/:productId/images/:imageId`
Eliminar una imagen.

**Lógica del backend:**
- Si se elimina la imagen primaria y hay otras imágenes, establecer automáticamente otra como primaria (la primera por displayOrder)

#### 5. **PATCH** `/products/:productId/images/:imageId/primary`
Establecer una imagen como primaria.

**Lógica del backend:**
- Poner todas las demás imágenes del producto como `isPrimary: false`
- Establecer la imagen especificada como `isPrimary: true`

#### 6. **PATCH** `/products/:productId/images/reorder`
Reordenar todas las imágenes de un producto.

```typescript
// Body
{
  order: [
    { imageId: 'clx...', displayOrder: 0 },
    { imageId: 'clx...', displayOrder: 1 },
    { imageId: 'clx...', displayOrder: 2 }
  ]
}
```

### Servicio de Upload de Imágenes

#### Opción 1: Cloudinary (Recomendado)

```bash
npm install cloudinary
```

```typescript
// backend/src/common/services/cloudinary.service.ts
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'products',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      ).end(file.buffer);
    });
  }
}
```

#### Opción 2: AWS S3

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

#### Opción 3: Azure Blob Storage

```bash
npm install @azure/storage-blob
```

### Ejemplo de Controlador (NestJS)

```typescript
// backend/src/product/product.controller.ts
@Controller('products')
export class ProductController {
  constructor(
    private readonly productImageService: ProductImageService,
    private readonly uploadService: UploadService
  ) {}

  // Obtener imágenes
  @Get(':productId/images')
  async getImages(@Param('productId') productId: string) {
    return this.productImageService.findByProductId(productId);
  }

  // Subir imagen
  @Post(':productId/images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateProductImageDto
  ) {
    // Upload a cloud storage
    const imageUrl = await this.uploadService.uploadImage(file);
    
    return this.productImageService.create({
      ...dto,
      productId,
      imageUrl,
    });
  }

  // Establecer como primaria
  @Patch(':productId/images/:imageId/primary')
  async setPrimary(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string
  ) {
    return this.productImageService.setPrimary(productId, imageId);
  }

  // Eliminar
  @Delete(':productId/images/:imageId')
  async deleteImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string
  ) {
    return this.productImageService.delete(imageId);
  }

  // Reordenar
  @Patch(':productId/images/reorder')
  async reorderImages(
    @Param('productId') productId: string,
    @Body() dto: ReorderImagesDto
  ) {
    return this.productImageService.reorder(productId, dto.order);
  }
}
```

### Ejemplo de Servicio (NestJS)

```typescript
// backend/src/product/product-image.service.ts
@Injectable()
export class ProductImageService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProductId(productId: string) {
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async create(data: CreateProductImageDto & { productId: string; imageUrl: string }) {
    // Verificar si es la primera imagen
    const count = await this.prisma.productImage.count({
      where: { productId: data.productId },
    });

    // Si es la primera, hacerla primaria automáticamente
    const isPrimary = count === 0 ? true : (data.isPrimary || false);

    // Si se marca como primaria, desmarcar las demás
    if (isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productId: data.productId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.productImage.create({
      data: {
        ...data,
        isPrimary,
        displayOrder: data.displayOrder ?? count,
      },
    });
  }

  async setPrimary(productId: string, imageId: string) {
    // Desmarcar todas como primarias
    await this.prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });

    // Marcar la seleccionada como primaria
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  async delete(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    // Si era primaria, establecer otra como primaria
    if (image.isPrimary) {
      const nextImage = await this.prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { displayOrder: 'asc' },
      });

      if (nextImage) {
        await this.prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return { success: true };
  }

  async reorder(productId: string, order: { imageId: string; displayOrder: number }[]) {
    await this.prisma.$transaction(
      order.map((item) =>
        this.prisma.productImage.update({
          where: { id: item.imageId },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    return { success: true };
  }
}
```

## 📦 Dependencias Adicionales

### Frontend

```bash
# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Ya deberías tener instaladas:
# @headlessui/react (para Modal)
# lucide-react (iconos)
# clsx (clases condicionales)
```

### Backend

```bash
# Upload de archivos
npm install @nestjs/platform-express multer
npm install -D @types/multer

# Cloud storage (elegir uno)
npm install cloudinary  # Cloudinary
# O
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage  # AWS S3
# O
npm install @azure/storage-blob  # Azure
```

## 🎨 Características del UI

### 1. **ImageUpload Component**
- Área de drag & drop
- Preview de la imagen antes de subir
- Validación de tamaño (máx. 5MB por defecto)
- Validación de formato (JPG, PNG, WEBP)
- Feedback visual de errores
- Loading state durante el upload

### 2. **ProductImageManager Modal**
- **Upload Section**: Subir nuevas imágenes
- **Image List**: 
  - Preview de todas las imágenes
  - Indicador visual de imagen primaria (⭐)
  - Drag handles para reordenar
  - Botón "Primaria" para establecer como principal
  - Botón "Eliminar" para borrar imágenes
- **Drag & Drop**: Cambiar orden arrastrando
- **Confirmación**: Dialog antes de eliminar imágenes

### 3. **Botón en Tabla**
- Icono de imagen (🖼️)
- Color púrpura para diferenciarlo
- Tooltip "Gestionar Imágenes"

## 🚀 Ventajas de este Enfoque

### ✅ **Separación de Responsabilidades**
- El wizard de creación es más rápido y simple
- La gestión de imágenes es independiente y especializada
- Código más mantenible

### ✅ **Escalabilidad**
- Fácil agregar más funcionalidades (editar alt text, aplicar filtros, etc.)
- Se puede extender el sistema de upload (múltiples archivos, compresión automática)
- Preparado para implementar CDN y optimización de imágenes

### ✅ **UX Profesional**
- El usuario no está obligado a subir imágenes al crear el producto
- Puede gestionar las imágenes de manera cómoda después
- Drag & Drop intuitivo para reordenar
- Feedback visual claro

### ✅ **Performance**
- Las imágenes se cargan solo cuando se abre el modal
- El listado de productos es más rápido (no carga todas las imágenes)
- Se puede implementar lazy loading fácilmente

## 📝 TODO Backend

1. ✅ Crear módulo `product-image` en NestJS
2. ✅ Implementar endpoints CRUD
3. ✅ Configurar servicio de upload (Cloudinary/S3/Azure)
4. ✅ Agregar validaciones (tamaño, formato)
5. ✅ Implementar lógica de imagen primaria
6. ✅ Crear DTOs y validaciones
7. ✅ Agregar tests unitarios

## 🎯 Próximas Mejoras

- [ ] Compresión automática de imágenes
- [ ] Múltiples uploads simultáneos
- [ ] Editor de imágenes (crop, resize)
- [ ] Lazy loading en la tabla de productos
- [ ] Cache de imágenes
- [ ] WebP automático para mejor performance
- [ ] Thumbnails automáticos

## 📚 Referencias

- [Prisma Schema](../backend/prisma/schema.prisma)
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
