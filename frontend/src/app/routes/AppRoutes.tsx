/**
 * App: Routes
 * Configuración de rutas de la aplicación
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import type { AppRole } from '@/features/auth';
import { MainLayout } from '../layouts/MainLayout';
import { ROUTES } from '@/shared/config';
import { CartWidget } from '@/widgets/cart-widget';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductManagementPage } from '@/pages/ProductManagementPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { OrdersPage } from '@/pages/OrdersPage';
import CustomerCategoriesPage from '@/pages/CustomerCategoriesPage';
import { PresentationTypesPage } from '@/pages/PresentationTypesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SecurityDevicesPage } from '@/pages/SecurityDevicesPage';
import { Register } from '@/pages/Register';

function PrivateRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.DASHBOARD} />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-900 dark:text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path={ROUTES.LOGIN}
          element={isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} /> : <LoginPage />}
        />
        <Route
          path={ROUTES.REGISTER}
          element={isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} /> : <Register />}
        />

        {/* Private Routes */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <PrivateRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.PRODUCTS}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager', 'Cajero', 'User', 'Customer']}>
              <MainLayout>
                <ProductsPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.PRODUCT_MANAGEMENT}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager']}>
              <MainLayout>
                <ProductManagementPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.CUSTOMERS}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager', 'Cajero']}>
              <MainLayout>
                <CustomersPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.CATEGORIES}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager']}>
              <MainLayout>
                <CategoriesPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.PRESENTATION_TYPES}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager']}>
              <MainLayout>
                <PresentationTypesPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.CUSTOMER_CATEGORIES}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager']}>
              <MainLayout>
                <CustomerCategoriesPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.ORDERS}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager', 'Cajero', 'User', 'Customer']}>
              <MainLayout>
                <OrdersPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS_BUSINESS}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager']}>
              <MainLayout>
                <SettingsPage section="business" />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS_SYSTEM}
          element={
            <PrivateRoute allowedRoles={['Admin']}>
              <MainLayout>
                <SettingsPage section="system" />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS_PRINTERS}
          element={
            <PrivateRoute allowedRoles={['Admin', 'SaleManager', 'Cajero', 'User']}>
              <MainLayout>
                <SettingsPage section="printers" />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.SECURITY_DEVICES}
          element={
            <PrivateRoute allowedRoles={['Admin', 'Security']}>
              <MainLayout>
                <SecurityDevicesPage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Redirect */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} />}
        />
      </Routes>

      {/* Global Cart Widget */}
      {isAuthenticated && <CartWidget />}
    </>
  );
}
