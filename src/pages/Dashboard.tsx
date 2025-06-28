import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  Users,
  Truck,
  FileText,
  Clock
} from 'lucide-react';
import { apiService } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/constants';
import { Product, Sale } from '../types';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color 
}) => {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center mt-1 text-sm ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {trend.value}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: apiService.getDashboardMetrics,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: apiService.getProducts,
  });

  const { data: recentSales } = useQuery({
    queryKey: ['sales'],
    queryFn: apiService.getSales,
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  const lowStockProducts: Product[] = products?.filter((product: Product) => product.currentStock < 10) || [];
  const recentSalesData: Sale[] = recentSales?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your business today.</p>
        </div>
        <div className="text-sm text-gray-500 mt-2 sm:mt-0">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Sales"
          value={formatCurrency(metrics?.todaySales || 0)}
          icon={TrendingUp}
          trend={{ direction: 'up', value: '+12%' }}
          color="bg-green-500"
        />
        <MetricCard
          title="Today's Purchases"
          value={formatCurrency(metrics?.todayPurchases || 0)}
          icon={TrendingDown}
          color="bg-blue-500"
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics?.lowStockItems || 0}
          icon={AlertTriangle}
          color="bg-amber-500"
        />
        <MetricCard
          title="Total Products"
          value={metrics?.totalProducts || 0}
          icon={Package}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Customers"
          value={metrics?.totalCustomers || 0}
          icon={Users}
          color="bg-indigo-500"
        />
        <MetricCard
          title="Total Suppliers"
          value={metrics?.totalSuppliers || 0}
          icon={Truck}
          color="bg-cyan-500"
        />
        <MetricCard
          title="Pending Orders"
          value={metrics?.pendingOrders || 0}
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader 
            title="Low Stock Alert" 
            subtitle={`${lowStockProducts.length} items need attention`}
          />
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All products are well stocked!</p>
            ) : (
              lowStockProducts.slice(0, 5).map((product: Product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-600">
                      {product.currentStock} left
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader 
            title="Recent Sales" 
            subtitle="Latest transactions"
          />
          <div className="space-y-3">
            {recentSalesData.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent sales found.</p>
            ) : (
              recentSalesData.map((sale: Sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-gray-900">{sale.customerName}</p>
                    <p className="text-sm text-gray-600">{sale.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(sale.total)}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      sale.status === 'paid' ? 'bg-green-100 text-green-800' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sale.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};