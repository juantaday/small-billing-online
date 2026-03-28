/**
 * Shared Utils
 * Utilidades reutilizables en toda la aplicación
 */

import clsx, { ClassValue } from 'clsx';
import { API_CONFIG } from '@/shared/config';

/**
 * Combina clases CSS de manera segura
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formatea una fecha
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return new Intl.DateTimeFormat('es-ES').format(dateObj);
  }
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Normaliza URLs de imágenes para soportar rutas relativas y migraciones de host.
 */
export function resolveImageUrl(imageUrl?: string): string {
  const fallback = 'https://via.placeholder.com/400x300?text=No+Image';
  if (!imageUrl) return fallback;

  // Evita pedir imágenes locales legacy que suelen no existir en producción.
  if (
    imageUrl.includes('/uploads/products/') ||
    imageUrl.startsWith('http://localhost:3000/uploads/') ||
    imageUrl.startsWith('http://localhost:3001/uploads/')
  ) {
    return fallback;
  }

  if (imageUrl.startsWith('/')) {
    return `${API_CONFIG.BASE_URL}${imageUrl}`;
  }

  return imageUrl;
}
