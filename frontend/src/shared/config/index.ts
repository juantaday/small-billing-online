/**
 * Shared Config
 * Configuración global de la aplicación
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.PROD 
    ? 'https://small-billing-online.onrender.com'
    : 'http://localhost:3001',
  TIMEOUT: 30000,
} as const;

export const APP_CONFIG = {
  NAME: 'Small Billing',
  VERSION: '1.0.0',
} as const;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  PRODUCT_MANAGEMENT: '/products/management',
  CATEGORIES: '/categories',
  CUSTOMERS: '/customers',
  CUSTOMER_CATEGORIES: '/customer-categories',
  ORDERS: '/orders',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  LOGIN: '/login',
  REGISTER: '/register',
} as const;

// Re-export theme configuration
export { theme, colors, gradients, ui, buttonVariants, badgeVariants, transitions, shadows, cn } from './theme.config';
