import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Products } from './pages/Products';
import { Categories } from './pages/CategoriesPage';
import Customers from './pages/Customers';
import CustomerCategoriesPage from './pages/CustomerCategoriesPage';
import { MainLayout } from './components/Layout/MainLayout';
import { Cart } from './components/Cart/Cart';
import { Dashboard } from './pages/Dashboard';


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
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
            <Route path="/categories" element={<MainLayout><Categories /></MainLayout>} />
            <Route path="/orders" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/reports" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/customers" element={<MainLayout><Customers /></MainLayout>} />
            <Route path="/customer-categories" element={<MainLayout><CustomerCategoriesPage /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Dashboard /></MainLayout>} />
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