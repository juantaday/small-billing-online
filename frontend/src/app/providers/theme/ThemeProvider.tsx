/**
 * App: Theme Provider
 * Provider global de tema (light/dark)
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Agregar clase temporal para deshabilitar transiciones durante el cambio
    root.classList.add('changing-theme');
    
    // Cambiar el tema
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
    
    // Remover la clase después de que el cambio se complete
    // Usar setTimeout para asegurar que el navegador aplique los cambios
    const timeoutId = setTimeout(() => {
      root.classList.remove('changing-theme');
    }, 50); // 50ms es suficiente para que se apliquen los estilos
    
    return () => clearTimeout(timeoutId);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
