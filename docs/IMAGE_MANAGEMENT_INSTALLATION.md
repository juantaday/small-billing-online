# 🚀 Instalación del Sistema de Gestión de Imágenes

## 📦 Dependencias del Frontend

Ejecuta el siguiente comando en la carpeta `frontend`:

```bash
# Desde la raíz del proyecto
cd frontend

# Instalar dependencias para drag & drop
pnpm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Instalar headlessui para modales (si no está instalado)
pnpm install @headlessui/react
```

## 🔧 Configuración del Backend

### 1. Instalar dependencias para upload de archivos

```bash
# Desde la raíz del proyecto
cd backend

# Dependencias básicas de upload
pnpm install @nestjs/platform-express multer
pnpm install -D @types/multer
```

### 2. Elegir e instalar un proveedor de cloud storage:

#### Opción A: Cloudinary (Recomendado - Gratis hasta 25GB)
```bash
pnpm install cloudinary
```

**Variables de entorno (.env):**
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

#### Opción B: AWS S3
```bash
pnpm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

**Variables de entorno (.env):**
```env
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=tu_bucket_name
```

#### Opción C: Azure Blob Storage
```bash
pnpm install @azure/storage-blob
```

**Variables de entorno (.env):**
```env
AZURE_STORAGE_CONNECTION_STRING=tu_connection_string
AZURE_STORAGE_CONTAINER_NAME=products
```

## 📁 Estructura de Archivos Creados

### Frontend
```
frontend/src/
├── entities/product/api/
│   └── useProductImages.ts              ✅ Creado
├── features/product-management/ui/
│   └── ProductImageManager.tsx          ✅ Creado
├── shared/ui/
│   ├── ImageUpload.tsx                  ✅ Creado
│   ├── Modal.tsx                        ✅ Creado
│   └── index.ts                         ✅ Actualizado
└── pages/
    └── ProductManagementPage.tsx        ✅ Actualizado
```

### Backend (Por Implementar)
```
backend/src/
├── product/
│   ├── product-image.service.ts         ❌ Por crear
│   ├── product-image.controller.ts      ❌ Por crear
│   └── dto/
│       ├── create-product-image.dto.ts  ❌ Por crear
│       ├── update-product-image.dto.ts  ❌ Por crear
│       └── reorder-images.dto.ts        ❌ Por crear
└── common/services/
    └── upload.service.ts                ❌ Por crear
```

## 🛠️ Pasos de Implementación

### ✅ Frontend (Completado)
- [x] Hook `useProductImages`
- [x] Componente `ImageUpload`
- [x] Componente `Modal`
- [x] Componente `ProductImageManager`
- [x] Integración en `ProductManagementPage`

### 🔨 Backend (Pendiente)

#### 1. Crear el servicio de upload
```bash
cd backend
nest g service common/services/upload
```

#### 2. Crear módulo de imágenes de productos
```bash
nest g resource product-image --no-spec
```

#### 3. Implementar los endpoints (Ver documentación completa en `/docs/IMAGE_MANAGEMENT_SYSTEM.md`)

## 🎯 Próximos Pasos

1. **Instalar dependencias del frontend**
   ```bash
   cd frontend
   pnpm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @headlessui/react
   ```

2. **Instalar dependencias del backend**
   ```bash
   cd backend
   pnpm install @nestjs/platform-express multer cloudinary
   pnpm install -D @types/multer
   ```

3. **Configurar variables de entorno** (`.env`)

4. **Implementar los servicios del backend** (ver docs)

5. **Probar la funcionalidad completa**

## 📚 Documentación Completa

Lee la documentación completa en:
- [`/docs/IMAGE_MANAGEMENT_SYSTEM.md`](./IMAGE_MANAGEMENT_SYSTEM.md)

## ⚠️ Notas Importantes

### Frontend
- El componente `ProductImageManager` usa `@dnd-kit` para drag & drop
- Se requiere `@headlessui/react` para el Modal (Dialog)
- El hook `useProductImages` simula el upload por ahora (ver TODOs)

### Backend
- Debes implementar todos los endpoints listados en la documentación
- La lógica de imagen primaria es importante para UX
- Considera límites de tamaño y formato de archivos
- Implementa validaciones de seguridad

### Cloud Storage
- **Cloudinary**: Más fácil de configurar, plan gratuito generoso
- **AWS S3**: Más potente, requiere más configuración
- **Azure**: Buena opción si ya usas Azure

## 🐛 Troubleshooting

### Error: "Cannot find module '@headlessui/react'"
```bash
cd frontend
pnpm install @headlessui/react
```

### Error: "Cannot find module '@dnd-kit/core'"
```bash
cd frontend
pnpm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Error al subir imágenes
1. Verifica las variables de entorno del cloud storage
2. Revisa los límites de tamaño en el backend
3. Chequea los permisos del bucket/container

## ✅ Testing

### Probar el sistema:
1. Crea un producto desde el wizard
2. Click en "Gestionar Imágenes" (🖼️)
3. Sube una imagen
4. Arrastra para reordenar
5. Establece como primaria
6. Elimina una imagen

## 🎉 ¡Listo!

Una vez completada la implementación del backend, tendrás un sistema profesional de gestión de imágenes completamente funcional.
