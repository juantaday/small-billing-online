/**
 * App: Layout
 * Layout principal con sidebar y header
 */

import { ReactNode, useState } from 'react';
import { Header } from '@/widgets/header';
import { Sidebar } from '@/widgets/sidebar';
import { Footer } from '@/widgets/footer';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300 min-w-0"> {/* ← añadir min-w-0 */}
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Contenido de la página */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden"> {/* ← añadir overflow-x-hidden */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}