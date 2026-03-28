/**
 * Theme Configuration
 * Sistema centralizado de design tokens para la aplicación
 * 
 * Este archivo contiene todas las configuraciones de colores, espaciados,
 * y estilos que se usan en toda la aplicación de manera consistente.
 */

// ============================================================
// COLORES SEMÁNTICOS
// ============================================================

export const colors = {
  // Color principal (Brand) - Rojo
  primary: {
    light: 'bg-primary-50 dark:bg-primary-900/20',
    DEFAULT: 'bg-primary-600',
    dark: 'bg-primary-700',
    text: 'text-primary-600 dark:text-primary-400',
    border: 'border-primary-600 dark:border-primary-400',
    hover: 'hover:bg-primary-700',
  },
  
  // Color secundario - Naranja
  secondary: {
    light: 'bg-secondary-50 dark:bg-secondary-900/20',
    DEFAULT: 'bg-secondary-600',
    dark: 'bg-secondary-700',
    text: 'text-secondary-600 dark:text-secondary-400',
    border: 'border-secondary-600 dark:border-secondary-400',
    hover: 'hover:bg-secondary-700',
  },

  // Estados semánticos
  success: {
    light: 'bg-success-50 dark:bg-success-900/20',
    DEFAULT: 'bg-success-500',
    dark: 'bg-success-600',
    text: 'text-success-600 dark:text-success-400',
    border: 'border-success-200 dark:border-success-800',
  },

  info: {
    light: 'bg-info-50 dark:bg-info-900/20',
    DEFAULT: 'bg-info-500',
    dark: 'bg-info-600',
    text: 'text-info-600 dark:text-info-400',
    border: 'border-info-200 dark:border-info-800',
  },

  warning: {
    light: 'bg-warning-50 dark:bg-warning-900/20',
    DEFAULT: 'bg-warning-500',
    dark: 'bg-warning-600',
    text: 'text-warning-600 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-800',
  },

  danger: {
    light: 'bg-danger-50 dark:bg-danger-900/20',
    DEFAULT: 'bg-danger-500',
    dark: 'bg-danger-600',
    text: 'text-danger-600 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-800',
  },

  // Color de acento - Púrpura
  accent: {
    light: 'bg-accent-50 dark:bg-accent-900/20',
    DEFAULT: 'bg-accent-600',
    dark: 'bg-accent-700',
    text: 'text-accent-600 dark:text-accent-400',
    border: 'border-accent-600 dark:border-accent-400',
  },

  // Color social - Rosa
  social: {
    light: 'bg-social-50 dark:bg-social-900/20',
    DEFAULT: 'bg-social-600',
    text: 'text-social-600 dark:text-social-400',
    hover: 'hover:bg-social-600 hover:text-white',
  },
};

// ============================================================
// GRADIENTES
// ============================================================

export const gradients = {
  primary: 'bg-gradient-to-br from-primary-600 to-secondary-600',
  primaryHorizontal: 'bg-gradient-to-r from-primary-600 to-secondary-600',
  background: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800',
};

// ============================================================
// COLORES DE UI
// ============================================================

export const ui = {
  // Backgrounds
  background: {
    DEFAULT: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  },

  // Superficies (Cards, Paneles)
  surface: {
    DEFAULT: 'bg-white dark:bg-gray-800',
    border: 'border border-gray-200 dark:border-gray-700',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
  },

  // Textos
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
    inverse: 'text-white dark:text-gray-900',
  },

  // Bordes
  border: {
    DEFAULT: 'border-gray-200 dark:border-gray-700',
    light: 'border-gray-100 dark:border-gray-800',
    focus: 'focus:ring-primary-500 focus:border-primary-500',
  },

  // Overlays
  overlay: 'bg-gray-900/50 dark:bg-gray-950/70',
};

// ============================================================
// ESTADOS DE COMPONENTES
// ============================================================

export const states = {
  active: {
    light: colors.primary.light,
    text: colors.primary.text,
  },
  inactive: {
    DEFAULT: ui.text.secondary,
    hover: ui.background.hover,
  },
  disabled: {
    opacity: 'opacity-50',
    cursor: 'cursor-not-allowed',
  },
};

// ============================================================
// VARIANTES DE BOTONES
// ============================================================

export const buttonVariants = {
  primary: `${colors.primary.DEFAULT} ${colors.primary.hover} text-white`,
  secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
  ghost: `bg-transparent ${ui.background.hover} text-gray-700 dark:text-gray-300`,
  danger: `${colors.danger.light} hover:bg-danger-200 ${colors.danger.text}`,
  outline: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
};

// ============================================================
// VARIANTES DE BADGES/TAGS
// ============================================================

export const badgeVariants = {
  success: `${colors.success.light} ${colors.success.text}`,
  info: `${colors.info.light} ${colors.info.text}`,
  warning: `${colors.warning.light} ${colors.warning.text}`,
  danger: `${colors.danger.light} ${colors.danger.text}`,
  primary: `${colors.primary.light} ${colors.primary.text}`,
  accent: `${colors.accent.light} ${colors.accent.text}`,
};

// ============================================================
// TRANSICIONES Y ANIMACIONES
// ============================================================

export const transitions = {
  // Solo para elementos interactivos (hover, focus, click)
  base: 'transition-all duration-150 ease-out',
  fast: 'transition-all duration-100 ease-out',
  slow: 'transition-all duration-300 ease-out',
  colors: 'transition-colors duration-150 ease-out',
  transform: 'transition-transform duration-200 ease-out',
  
  // NOTA: NO aplicar transiciones a cambios de tema.
  // El cambio light/dark debe ser instantáneo para evitar efectos visuales feos.
};

// ============================================================
// SOMBRAS
// ============================================================

export const shadows = {
  sm: 'shadow-sm',
  DEFAULT: 'shadow-md',
  lg: 'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50',
  xl: 'shadow-xl',
};

// ============================================================
// HELPER: Combinar clases
// ============================================================

/**
 * Une las clases de forma segura eliminando duplicados
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================
// EXPORTS POR DEFECTO
// ============================================================

export const theme = {
  colors,
  gradients,
  ui,
  states,
  buttonVariants,
  badgeVariants,
  transitions,
  shadows,
};

export default theme;
