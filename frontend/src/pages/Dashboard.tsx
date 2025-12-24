import { Package, ShoppingBag, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '../components/UI/Card';

const stats = [
  {
    title: 'Ventas Hoy',
    value: '$1,245.50',
    change: '+12.5%',
    icon: DollarSign,
    color: 'bg-green-500'
  },
  {
    title: 'Órdenes',
    value: '156',
    change: '+8.2%',
    icon: ShoppingBag,
    color: 'bg-blue-500'
  },
  {
    title: 'Productos',
    value: '48',
    change: '+2',
    icon: Package,
    color: 'bg-purple-500'
  },
  {
    title: 'Clientes',
    value: '892',
    change: '+45',
    icon: Users,
    color: 'bg-orange-500'
  }
];

const recentOrders = [
  { id: '#1234', customer: 'Juan Pérez', total: '$45.99', status: 'Completado', time: '10:30 AM' },
  { id: '#1235', customer: 'María García', total: '$32.50', status: 'En proceso', time: '10:25 AM' },
  { id: '#1236', customer: 'Carlos López', total: '$67.99', status: 'Completado', time: '10:15 AM' },
  { id: '#1237', customer: 'Ana Martínez', total: '$28.00', status: 'Pendiente', time: '10:05 AM' },
];

const topProducts = [
  { name: 'Original Burger', sold: 45, revenue: '$404.55' },
  { name: 'Pollo Crujiente', sold: 38, revenue: '$493.62' },
  { name: 'Papas Fritas', sold: 67, revenue: '$267.33' },
  { name: 'Alitas Picantes', sold: 29, revenue: '$318.71' },
];

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Bienvenido al panel de control
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Órdenes Recientes y Productos Populares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Órdenes Recientes */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Órdenes Recientes
          </h2>
          <div className="space-y-4">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {order.id} - {order.customer}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {order.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {order.total}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'Completado' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : order.status === 'En proceso'
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Productos Populares */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Productos Más Vendidos
          </h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center font-bold text-red-600 dark:text-red-400">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.sold} vendidos
                    </p>
                  </div>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {product.revenue}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};