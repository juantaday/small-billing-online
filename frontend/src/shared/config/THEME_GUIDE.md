# 🎨 Guía del Sistema de Colores y Estilos

## Descripción General

Este proyecto utiliza un **sistema de diseño centralizado** basado en Tailwind CSS con colores semánticos y tokens de diseño reutilizables.

## 📁 Archivos Principales

### 1. `tailwind.config.js`
Define la paleta de colores extendida de Tailwind.

### 2. `theme.config.ts`
Contiene los design tokens y helpers para usar en componentes React.

### 3. `index.css`
Variables CSS, utilidades personalizadas y estilos globales.

---

## 🎨 Paleta de Colores

### Colores Principales (Brand)

| Color | Uso | Clases Tailwind |
|-------|-----|-----------------|
| **Primary (Rojo)** | Color principal de marca | `bg-primary-600`, `text-primary-600` |
| **Secondary (Naranja)** | Color secundario/acento | `bg-secondary-600`, `text-secondary-600` |

### Colores Semánticos

| Color | Uso | Clases Tailwind | Clase Utility |
|-------|-----|-----------------|---------------|
| **Success (Verde)** | Estados exitosos, confirmaciones | `bg-success-500`, `text-success-600` | `.badge-success` |
| **Info (Azul)** | Información, estados en proceso | `bg-info-500`, `text-info-600` | `.badge-info` |
| **Warning (Amarillo)** | Advertencias, estados pendientes | `bg-warning-500`, `text-warning-600` | `.badge-warning` |
| **Danger (Rojo)** | Errores, acciones destructivas | `bg-danger-500`, `text-danger-600` | `.badge-danger` |

### Colores Especiales

| Color | Uso | Clases Tailwind |
|-------|-----|-----------------|
| **Accent (Púrpura)** | Features especiales, destacados | `bg-accent-600`, `text-accent-600` |
| **Social (Rosa)** | Redes sociales, interacciones | `bg-social-600`, `text-social-600` |

---

## 🎨 Gradientes Predefinidos

### En CSS
```css
.bg-gradient-brand              /* Diagonal rojo-naranja */
.bg-gradient-brand-horizontal   /* Horizontal rojo-naranja */
.bg-gradient-background         /* Fondo suave con dark mode */
```

### En Tailwind
```tsx
className="bg-gradient-to-br from-primary-600 to-secondary-600"
className="bg-gradient-to-r from-primary-600 to-secondary-600"
```

---

## 🧩 Componentes y Utilidades

### Clases de Superficie
```css
.surface-card       /* Card con borde y dark mode */
.interactive-hover  /* Hover suave para elementos interactivos */
```

### Clases de Texto
```css
.text-muted        /* Texto secundario/atenuado */
```

### Badges/Tags
```tsx
// Usando clases de utilidad
<span className="badge-success">Completado</span>
<span className="badge-info">En proceso</span>
<span className="badge-warning">Pendiente</span>
<span className="badge-danger">Cancelado</span>
<span className="badge-primary">Nuevo</span>
```

---

## 📚 Uso en Componentes

### Opción 1: Usando Tailwind directo (Recomendado)
```tsx
// ✅ Usar colores de la paleta extendida
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Guardar
</button>

<div className="badge-success">
  Éxito
</div>
```

### Opción 2: Usando theme.config.ts
```tsx
import { colors, gradients, buttonVariants } from '@/shared/config';

// En componentes que requieren lógica dinámica
<div className={colors.primary.DEFAULT}>...</div>
<div className={gradients.primary}>...</div>
```

### Opción 3: Usando clases de utilidad personalizadas
```tsx
<button className="interactive-hover">Hover suave</button>
<div className="surface-card">Card con estilos</div>
<span className="badge-success">Estado</span>
```

---

## 🌓 Dark Mode

Todos los colores tienen soporte automático para dark mode usando el prefijo `dark:`:

```tsx
// ✅ Auto dark mode
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-white">Texto</p>
</div>

// ✅ Badges con dark mode incluido
<span className="badge-success">Ya tiene dark mode</span>
```

---

## 🔄 Transiciones

Las transiciones están configuradas globalmente:
- **200ms** para backgrounds, borders y colores
- **Ease-in-out** por defecto

Para personalizarlas:
```tsx
<div className="transition-all duration-300">Transición lenta</div>
<div className="transition-colors">Solo colores</div>
```

---

## 📝 Ejemplos Comunes

### Botón Principal
```tsx
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
  Acción Principal
</button>
```

### Card con Hover
```tsx
<div className="surface-card p-6 interactive-hover">
  <h3 className="text-gray-900 dark:text-white">Título</h3>
  <p className="text-muted">Descripción</p>
</div>
```

### Badge de Estado
```tsx
{status === 'completed' && <span className="badge-success">Completado</span>}
{status === 'pending' && <span className="badge-warning">Pendiente</span>}
{status === 'error' && <span className="badge-danger">Error</span>}
```

### Gradiente de Marca
```tsx
<div className="bg-gradient-brand p-4 text-white rounded-lg">
  Contenido destacado
</div>
```

---

## ⚡ Mejores Prácticas

### ✅ HACER
- Usar colores semánticos: `primary`, `success`, `danger`, etc.
- Usar clases de utilidad personalizadas: `.badge-success`, `.interactive-hover`
- Usar gradientes predefinidos: `.bg-gradient-brand`
- Incluir `dark:` para modo oscuro

### ❌ EVITAR
- Hardcodear colores: `bg-red-600` (usar `bg-primary-600`)
- Crear estilos inline para colores
- Ignorar dark mode
- Crear gradientes personalizados sin definirlos en config

---

## 🔧 Cómo Cambiar el Tema

### 1. Cambiar color principal
Edita `tailwind.config.js`:
```js
primary: {
  600: '#tu-color-aqui',
  // ...resto de tonos
}
```

### 2. Cambiar gradiente de marca
Edita `index.css`:
```css
.bg-gradient-brand {
  @apply bg-gradient-to-br from-primary-600 to-secondary-600;
}
```

### 3. Todos los componentes se actualizan automáticamente ✨

---

## 📦 Import Rápido

```tsx
// Importar todo el sistema de tema
import { theme, colors, gradients, ui, badgeVariants } from '@/shared/config';

// Usar en componentes
const MyComponent = () => (
  <div className={colors.primary.DEFAULT}>
    Contenido
  </div>
);
```

---

## 🎯 Resumen

✅ **Paleta completa**: 8 colores semánticos (primary, secondary, success, info, warning, danger, accent, social)  
✅ **Dark mode**: Soporte automático en todas las clases  
✅ **Gradientes**: 3 gradientes predefinidos  
✅ **Utilidades**: Clases custom para badges, cards, hovers  
✅ **Centralizado**: Un solo lugar para cambiar todo el tema  
✅ **TypeScript**: Tipos completos en `theme.config.ts`

---

**Última actualización**: 2 de enero de 2026
