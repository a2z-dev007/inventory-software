import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Download, Calendar, Filter } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import { apiService } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { SelectField } from '../components/forms/SelectField';

type ReportType = 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers';
type DateRange = '7days' | '30days' | '90days' | 'custom';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: apiService.getSales,
  });

  const { data: purchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: apiService.getPurchases,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: apiService.getProducts,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: apiService.getCustomers,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: apiService.getSuppliers,
  });

  const getDateRangeFilter = () => {
    const now = new Date();
    let start: Date;
    let end = endOfDay(now);

    if (dateRange === 'custom' && startDate && endDate) {
      start = startOfDay(new Date(startDate));
      end = endOfDay(new Date(endDate));
    } else {
      switch (dateRange) {
        case '7days':
          start = startOfDay(subDays(now, 7));
          break;
        case '30days':
          start = startOfDay(subDays(now, 30));
          break;
        case '90days':
          start = startOfDay(subDays(now, 90));
          break;
        default:
          start = startOfDay(subDays(now, 30));
      }
    }

    return { start, end };
  };

  const generateSalesReport = () => {
    const { start, end } = getDateRangeFilter();
    
    const filteredSales = sales?.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= start && saleDate <= end;
    }) || [];

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTax = filteredSales.reduce((sum, sale) => sum + sale.tax, 0);
    const averageSale = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

    const salesByCustomer = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.customerName]) {
        acc[sale.customerName] = { total: 0, orders: 0 };
      }
      acc[sale.customerName].total += sale.total;
      acc[sale.customerName].orders += 1;
      return acc;
    }, {} as Record<string, { total: number; orders: number }>);

    const statusBreakdown = filteredSales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      filteredSales,
      summary: {
        totalSales,
        totalTax,
        averageSale,
        totalOrders: filteredSales.length,
      },
      salesByCustomer,
      statusBreakdown,
    };
  };

  const generatePurchasesReport = () => {
    const { start, end } = getDateRangeFilter();
    
    const filteredPurchases = purchases?.filter(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate);
      return purchaseDate >= start && purchaseDate <= end;
    }) || [];

    const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
    const totalTax = filteredPurchases.reduce((sum, purchase) => sum + purchase.tax, 0);

    const purchasesBySupplier = filteredPurchases.reduce((acc, purchase) => {
      if (!acc[purchase.supplier]) {
        acc[purchase.supplier] = { total: 0, orders: 0 };
      }
      acc[purchase.supplier].total += purchase.total;
      acc[purchase.supplier].orders += 1;
      return acc;
    }, {} as Record<string, { total: number; orders: number }>);

    return {
      filteredPurchases,
      summary: {
        totalPurchases,
        totalTax,
        totalOrders: filteredPurchases.length,
      },
      purchasesBySupplier,
    };
  };

  const generateInventoryReport = () => {
    const lowStockProducts = products?.filter(product => product.currentStock < 10) || [];
    const totalStockValue = products?.reduce((sum, product) => 
      sum + (product.currentStock * product.purchaseRate), 0) || 0;
    
    const categorySummary = products?.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = { count: 0, value: 0, stock: 0 };
      }
      acc[product.category].count += 1;
      acc[product.category].value += product.currentStock * product.purchaseRate;
      acc[product.category].stock += product.currentStock;
      return acc;
    }, {} as Record<string, { count: number; value: number; stock: number }>) || {};

    return {
      products: products || [],
      lowStockProducts,
      summary: {
        totalProducts: products?.length || 0,
        totalStockValue,
        lowStockCount: lowStockProducts.length,
      },
      categorySummary,
    };
  };

  const generateCustomersReport = () => {
    const customerSales = customers?.map(customer => {
      const customerSalesData = sales?.filter(sale => sale.customerName === customer.name) || [];
      const totalSales = customerSalesData.reduce((sum, sale) => sum + sale.total, 0);
      const lastSale = customerSalesData.sort((a, b) => 
        new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())[0];
      
      return {
        ...customer,
        totalSales,
        totalOrders: customerSalesData.length,
        lastSale: lastSale?.saleDate,
      };
    }).sort((a, b) => b.totalSales - a.totalSales) || [];

    return {
      customers: customerSales,
      summary: {
        totalCustomers: customers?.length || 0,
        activeCustomers: customerSales.filter(c => c.totalOrders > 0).length,
        totalRevenue: customerSales.reduce((sum, c) => sum + c.totalSales, 0),
      },
    };
  };

  const generateSuppliersReport = () => {
    const supplierPurchases = suppliers?.map(supplier => {
      const supplierPurchasesData = purchases?.filter(purchase => purchase.supplier === supplier.name) || [];
      const totalPurchases = supplierPurchasesData.reduce((sum, purchase) => sum + purchase.total, 0);
      const lastPurchase = supplierPurchasesData.sort((a, b) => 
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0];
      
      return {
        ...supplier,
        totalPurchases,
        totalOrders: supplierPurchasesData.length,
        lastPurchase: lastPurchase?.purchaseDate,
      };
    }).sort((a, b) => b.totalPurchases - a.totalPurchases) || [];

    return {
      suppliers: supplierPurchases,
      summary: {
        totalSuppliers: suppliers?.length || 0,
        activeSuppliers: supplierPurchases.filter(s => s.totalOrders > 0).length,
        totalSpent: supplierPurchases.reduce((sum, s) => sum + s.totalPurchases, 0),
      },
    };
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    
    doc.setFontSize(20);
    doc.text(reportTitle, 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Date Range: ${format(getDateRangeFilter().start, 'MMM dd, yyyy')} - ${format(getDateRangeFilter().end, 'MMM dd, yyyy')}`, 20, 50);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 65);

    let yPos = 85;

    switch (reportType) {
      case 'sales': {
        const report = generateSalesReport();
        doc.text(`Total Sales: $${report.summary.totalSales.toFixed(2)}`, 20, yPos);
        doc.text(`Total Orders: ${report.summary.totalOrders}`, 20, yPos + 15);
        doc.text(`Average Sale: $${report.summary.averageSale.toFixed(2)}`, 20, yPos + 30);
        break;
      }
      case 'inventory': {
        const report = generateInventoryReport();
        doc.text(`Total Products: ${report.summary.totalProducts}`, 20, yPos);
        doc.text(`Total Stock Value: $${report.summary.totalStockValue.toFixed(2)}`, 20, yPos + 15);
        doc.text(`Low Stock Items: ${report.summary.lowStockCount}`, 20, yPos + 30);
        break;
      }
    }

    doc.save(`${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const renderReportContent = () => {
    switch (reportType) {
      case 'sales': {
        const report = generateSalesReport();
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${report.summary.totalSales.toLocaleString()}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {report.summary.totalOrders}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Average Sale</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${report.summary.averageSale.toLocaleString()}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Tax</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${report.summary.totalTax.toLocaleString()}
                  </p>
                </div>
              </Card>
            </div>

            {/* Sales by Customer */}
            <Card>
              <CardHeader title="Sales by Customer" />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(report.salesByCustomer).map(([customer, data]) => (
                      <tr key={customer}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{data.orders}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${data.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      }

      case 'inventory': {
        const report = generateInventoryReport();
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {report.summary.totalProducts}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Stock Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${report.summary.totalStockValue.toLocaleString()}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">
                    {report.summary.lowStockCount}
                  </p>
                </div>
              </Card>
            </div>

            {/* Low Stock Items */}
            <Card>
              <CardHeader title="Low Stock Alert" subtitle="Items with less than 10 units" />
              <div className="space-y-2">
                {report.lowStockProducts.map(product => (
                  <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sku}</p>
                    </div>
                    <span className="text-red-600 font-bold">{product.currentStock} left</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      }

      case 'customers': {
        const report = generateCustomersReport();
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {report.summary.totalCustomers}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-green-600">
                    {report.summary.activeCustomers}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${report.summary.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </Card>
            </div>

            {/* Customer Details */}
            <Card>
              <CardHeader title="Customer Performance" />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{customer.totalOrders}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${customer.totalSales.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {customer.lastSale ? new Date(customer.lastSale).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      }

      default:
        return <div>Select a report type to view data</div>;
    }
  };

  if (!sales || !purchases || !products) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Reports & Analytics"
          subtitle="Generate comprehensive business reports"
          action={
            <Button
              icon={Download}
              onClick={downloadReport}
            >
              Download PDF
            </Button>
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="sales">Sales Report</option>
              <option value="purchases">Purchases Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="customers">Customers Report</option>
              <option value="suppliers">Suppliers Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};