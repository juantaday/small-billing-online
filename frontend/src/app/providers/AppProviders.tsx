/**
 * App: Providers
 * Configuración de providers globales
 */

import { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { CartProvider } from '@/features/cart';
import { ThemeProvider } from './theme';
import { ToastProvider } from './toast';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
