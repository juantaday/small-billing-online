/**
 * Widget: Sidebar
 * Navegación lateral
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  FolderOpen,
  ChevronLeft,
  ShoppingBag,
  FileText,
  ShoppingCartIcon,
  PackagePlus,
  ChevronDown,
  Settings,
  ShieldCheck,
  Building,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { ROUTES } from '@/shared/config';
import { cn } from '@/shared/lib';
import { useAuth } from '@/features/auth';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavigationGroup {
  key: string;
  title: string;
  items: NavigationItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationGroups: NavigationGroup[] = [
  {
    key: 'sales',
    title: 'Ventas',
    items: [
      { name: 'Menú (Ventas)', href: ROUTES.PRODUCTS, icon: ShoppingBag },
      { name: 'Órdenes', href: ROUTES.ORDERS, icon: FileText },
    ],
  },
  {
    key: 'products',
    title: 'Productos',
    items: [
      { name: 'Gestión Productos', href: ROUTES.PRODUCT_MANAGEMENT, icon: PackagePlus },
      { name: 'Categorías', href: ROUTES.CATEGORIES, icon: Package },
      { name: 'Tipos Presentación', href: ROUTES.PRESENTATION_TYPES, icon: Package },
    ],
  },
  {
    key: 'customers',
    title: 'Clientes',
    items: [
      { name: 'Clientes', href: ROUTES.CUSTOMERS, icon: Users },
      { name: 'Categorías Cliente', href: ROUTES.CUSTOMER_CATEGORIES, icon: FolderOpen },
    ],
  },
  {
    key: 'system',
    title: 'Sistema',
    items: [
      { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
      { name: 'Configuración Negocio', href: ROUTES.SETTINGS_BUSINESS, icon: Building },
      { name: 'Config. Secuenciales', href: ROUTES.SETTINGS_SYSTEM, icon: FileSpreadsheet },
      { name: 'Facturación / Impresoras', href: ROUTES.SETTINGS_PRINTERS, icon: Printer },
      { name: 'Seguridad Equipos', href: ROUTES.SECURITY_DEVICES, icon: ShieldCheck },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { canAccess } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    sales: true,
    products: true,
    customers: true,
    system: true,
  });

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(item.href)),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCartIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                QuickBite
              </span>
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                POS System
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-3">
          {visibleGroups.map((group) => (
            <div key={group.key} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <span>{group.title}</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform',
                    expandedGroups[group.key] ? 'rotate-0' : '-rotate-90',
                  )}
                />
              </button>

              {expandedGroups[group.key] && (
                <div className="space-y-1">
                  {group.items.map((item) => {
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
                            ? 'badge-primary'
                            : 'text-gray-700 dark:text-gray-300 interactive-hover',
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
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-brand-horizontal rounded-lg p-4 text-white">
            <h3 className="font-semibold text-sm mb-1">¿Necesitas ayuda?</h3>
            <p className="text-xs opacity-90 mb-2">Contacta a soporte técnico</p>
            <button className="w-full bg-white text-primary-600 text-xs font-medium py-2 rounded-lg interactive-hover transition-colors">
              Contactar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
