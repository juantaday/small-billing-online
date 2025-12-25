/**
 * App: Routes
 * Configuración de rutas de la aplicación
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { MainLayout } from '../layouts/MainLayout';
import { ROUTES } from '@/shared/config';
import { CartWidget } from '@/widgets/cart-widget';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CustomersPage } from '@/pages/CustomersPage';
import {CategoriesPage} from '@/pages/CategoriesPage';
import CustomerCategoriesPage from '@/pages/CustomerCategoriesPage';
import { Register } from '@/pages/Register';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} />;
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
            <PrivateRoute>
              <MainLayout>
                <ProductsPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.CUSTOMERS}
          element={
            <PrivateRoute>
              <MainLayout>
                <CustomersPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.CATEGORIES}
          element={
            <PrivateRoute>
              <MainLayout>
                <CategoriesPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path={ROUTES.CUSTOMER_CATEGORIES}
          element={
            <PrivateRoute>
              <MainLayout>
                <CustomerCategoriesPage />
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
