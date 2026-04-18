import { ROUTES } from '@/shared/config';

export type AppRole = 'User' | 'Customer' | 'Admin' | 'SaleManager' | 'Cajero' | 'Security';

export const APP_ROLES: AppRole[] = [
  'User',
  'Customer',
  'Admin',
  'SaleManager',
  'Cajero',
  'Security',
];

export const DEFAULT_APP_ROLE: AppRole = 'Admin';

export const ROUTE_ACCESS: Record<string, AppRole[]> = {
  [ROUTES.DASHBOARD]: ['Admin', 'SaleManager', 'Cajero', 'User', 'Customer'],
  [ROUTES.PRODUCTS]: ['Admin', 'SaleManager', 'Cajero', 'User', 'Customer'],
  [ROUTES.ORDERS]: ['Admin', 'SaleManager', 'Cajero', 'User', 'Customer'],
  [ROUTES.PRODUCT_MANAGEMENT]: ['Admin', 'SaleManager'],
  [ROUTES.CATEGORIES]: ['Admin', 'SaleManager'],
  [ROUTES.PRESENTATION_TYPES]: ['Admin', 'SaleManager'],
  [ROUTES.CUSTOMERS]: ['Admin', 'SaleManager', 'Cajero'],
  [ROUTES.CUSTOMER_CATEGORIES]: ['Admin', 'SaleManager'],
  [ROUTES.REPORTS]: ['Admin', 'SaleManager'],
  [ROUTES.SETTINGS]: ['Admin'],
  [ROUTES.SECURITY_DEVICES]: ['Admin', 'Security'],
};

export function canAccessRoute(role: AppRole, route: string): boolean {
  const allowedRoles = ROUTE_ACCESS[route];
  if (!allowedRoles) {
    return false;
  }
  return allowedRoles.includes(role);
}
