import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Users,
  Truck,
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
            <div className={`flex items-center mt-1 text-sm ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
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

  // Remove extra queries for products and sales
  // const { data: productsData } = useQuery({
  //   queryKey: ['products'],
  //   queryFn: () => apiService.getProducts(),
  // });
  // const products: Product[] = Array.isArray(productsData?.products) ? productsData.products : Array.isArray(productsData) ? productsData : [];
  // const { data: recentSales } = useQuery({
  //   queryKey: ['sales'],
  //   queryFn: () => apiService.getSales(),
  // });
  // const recentSalesData: Sale[] = Array.isArray(recentSales?.sales) ? recentSales.sales.slice(0, 5) : Array.isArray(recentSales) ? recentSales.slice(0, 5) : [];

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  console.log("metrics", metrics)
  // Use metrics.lowStockProducts for low stock count, and metrics.recentSales for recent sales
  // If you want to show a list of low stock products, you may need to adjust the backend to return them
  // For now, just show the count

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your business today.</p>
        </div>
        {/* <div className="text-sm text-gray-500 mt-2 sm:mt-0">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div> */}
      </div>

      {/* Metrics Grid */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={formatCurrency(metrics?.totalSales || 0)}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <MetricCard
          title="Total Purchases"
          value={formatCurrency(metrics?.totalPurchases || 0)}
          icon={TrendingDown}
          color="bg-blue-500"
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics?.lowStockProducts || 0}
          icon={AlertTriangle}
          color="bg-amber-500"
        />
        <MetricCard
          title="Total Products"
          value={metrics?.totalProducts || 0}
          icon={Package}
          color="bg-purple-500"
        />
      </div> */}

      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Customers"
          value={metrics?.totalCustomers || 0}
          icon={Users}
          color="bg-indigo-500"
        />
        <MetricCard
          title="Total Vendors"
          value={metrics?.totalVendors || 0}
          icon={Truck}
          color="bg-cyan-500"
        />
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        {/* <Card>
          <CardHeader
            title="Low Stock Alert"
            subtitle={`${metrics?.lowStockProducts || 0} items need attention`}
          />
          <div className="space-y-3">
            {metrics?.lowStockProducts === 0 ? (
              <p className="text-gray-500 text-center py-4">All products are well stocked!</p>
            ) : (
              <div>
                {metrics?.data?.lowStockProducts?.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                    {
                      product.image ? (
                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg mr-4" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
                      )
                    }
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-600">{product.stock}</p>
                      <p className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-600">Low Stock</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card> */}

        {/* Recent Sales */}
        {/* <Card>
          <CardHeader
            title="Recent Sales"
            subtitle="Latest transactions"
          />
          <div className="space-y-3">
            {metrics?.recentSales?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent sales found.</p>
            ) : (
              metrics?.recentSales?.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-gray-900">{sale.customerName}</p>
                    <p className="text-sm text-gray-600">{sale.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(sale.total)}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${sale.status === 'paid' ? 'bg-green-100 text-green-800' :
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
        </Card> */}
      </div>

      {/* Top Products Section */}
      {/* <Card>
        <CardHeader
          title="Top Products"
          subtitle="Best selling products"
        />
        <div className="overflow-x-auto">
          {metrics?.topProducts?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No top products found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {metrics?.topProducts?.map((product: any) => (
                  <tr key={product.id}>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-700">{product.sku}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">{product.salesCount}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">{formatCurrency(product.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card> */}
    </div>
  );
};