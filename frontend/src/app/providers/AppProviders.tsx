/**
 * App: Providers
 * Configuración de providers globales
 */

import { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { CartProvider } from '@/features/cart';
import { ThemeProvider } from './theme';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
