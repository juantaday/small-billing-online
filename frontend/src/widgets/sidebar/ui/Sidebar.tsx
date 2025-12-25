/**
 * Widget: Sidebar
 * Navegación lateral
 */

import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  FolderOpen,
  ChevronLeft,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import { ROUTES } from '@/shared/config';
import { cn } from '@/shared/lib';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Productos', href: ROUTES.PRODUCTS, icon: ShoppingBag },
  { name: 'Categorías', href: ROUTES.CATEGORIES, icon: Package },
  { name: 'Clientes', href: ROUTES.CUSTOMERS, icon: Users },
  { name: 'Categorías Cliente', href: ROUTES.CUSTOMER_CATEGORIES, icon: FolderOpen },
  { name: 'Órdenes', href: ROUTES.ORDERS, icon: FileText },
  { name: 'Reportes', href: ROUTES.REPORTS, icon: BarChart3 },
  { name: 'Configuración', href: ROUTES.SETTINGS, icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transition-transform duration-300 ease-in-out',
          'flex flex-col w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo y botón de cierre */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              Small Billing
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  'font-medium text-sm',
                  isActive
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-4 text-white">
            <h3 className="font-semibold text-sm mb-1">¿Necesitas ayuda?</h3>
            <p className="text-xs opacity-90 mb-2">Contacta a soporte técnico</p>
            <button className="w-full bg-white text-red-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Contactar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
