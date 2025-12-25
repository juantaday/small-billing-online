/**
 * Page: Login
 * Página de inicio de sesión
 */

import { Link } from 'react-router-dom';
import { LoginForm } from '@/features/auth';
import { ROUTES } from '@/shared/config';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">SB</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bienvenido
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Inicia sesión en Small Billing
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Regístrate aquí
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}
