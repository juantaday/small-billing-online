import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { DashboardNew } from './pages/DashboardNew';
import { Products } from './pages/Products';
import { Categories } from './pages/CategoriesPage';
import { MainLayout } from './components/Layout/MainLayout';
import { Cart } from './components/Cart/Cart';

function App() {
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
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
        />
        
        {/* Rutas protegidas con Layout */}
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<MainLayout><DashboardNew /></MainLayout>} />
            <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
            <Route path="/categories" element={<MainLayout><Categories /></MainLayout>} />
            <Route path="/orders" element={<MainLayout><DashboardNew /></MainLayout>} />
            <Route path="/reports" element={<MainLayout><DashboardNew /></MainLayout>} />
            <Route path="/customers" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><DashboardNew /></MainLayout>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
      
      {/* Carrito flotante (solo si está autenticado) */}
      {isAuthenticated && <Cart />}
    </>
  );
}

export default App;