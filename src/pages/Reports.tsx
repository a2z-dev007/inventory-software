import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { Download } from 'lucide-react';
// import { Button } from '@/components/ui/button'; // Use your UI button
import Select from 'react-select';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { apiService } from '../services/api';
// import { Card, CardHeader } from '@/components/ui/card';

const reportTypeOptions = [
  { value: 'sales', label: 'Sales Report' },
  { value: 'purchases', label: 'Purchases Report' },
  { value: 'purchase-orders', label: 'Purchase Orders Report' },
  { value: 'products', label: 'Inventory Report' },
  { value: 'customers', label: 'Clients Report' },
  { value: 'vendors', label: 'Suppliers Report' },
];

const dateRangeOptions = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  const calculateDateRange = () => {
    const end = new Date();
    let start = new Date();
    if (dateRange === '7days') start.setDate(end.getDate() - 7);
    else if (dateRange === '30days') start.setDate(end.getDate() - 30);
    else if (dateRange === '90days') start.setDate(end.getDate() - 90);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };
  const handleShowReport = async () => {
    if (!reportType) return alert('Please select a report type');
    if (dateRange === 'custom' && (!startDate || !endDate))
      return alert('Please select a valid date range');

    setLoading(true);

    try {
      const { startDate: sDate, endDate: eDate } =
        dateRange === 'custom' ? { startDate, endDate } : calculateDateRange();

      const res = await apiService.exportToExcel({
        moduleName: reportType,
        startDate: sDate,
        endDate: eDate,
      });

      const dataKeyMap = {
        'purchase-orders': 'purchaseOrders',
        purchases: 'purchases',
        sales: 'sales',
        products: 'topProducts',
        vendors: 'topVendors',
        customers: 'topCustomers',
      };

      const extractedData = res.data?.[dataKeyMap[reportType]] || [];

      if (!extractedData.length) {
        alert('No data found for the selected criteria.');
        setReportData([]);
        return;
      }

      setReportData(extractedData);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    if (!reportType) {
      alert('Please select a report type');
      return;
    }

    if (dateRange === 'custom' && (!startDate || !endDate)) {
      alert('Please select a valid date range');
      return;
    }

    setLoading(true);

    try {
      const { startDate: sDate, endDate: eDate } =
        dateRange === 'custom' ? { startDate, endDate } : calculateDateRange();

      const res = await apiService.exportToExcel({
        moduleName: reportType,
        startDate: sDate,
        endDate: eDate,
      });

      const reportData = res.data || {};

      // Map report type to data key
      const dataKeyMap = {
        'purchase-orders': 'purchaseOrders',
        purchases: 'purchases',
        sales: 'sales',
        products: 'topProducts',
        vendors: 'topVendors',
        customers: 'topCustomers',
      };

      const dataKey = dataKeyMap[reportType];
      const exportData = reportData[dataKey] || [];

      if (!exportData.length) {
        alert('No data found for the selected criteria.');
        return;
      }

      // Generate Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      const blob = new Blob([excelBuffer], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      saveAs(blob, `${reportType}_report_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Reports & Analytics"
          subtitle="Generate comprehensive business reports"
          action={
            <Button
              icon={Download}
              onClick={downloadExcel}
              disabled={loading}
              className="flex items-center gap-2 gradient-btn"
            >
              {loading ? 'Exporting...' : 'Export Excel'}
            </Button>
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-4 pb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <Select
              options={reportTypeOptions}
              value={reportTypeOptions.find((opt) => opt.value === reportType)}
              onChange={(option) => setReportType(option?.value || 'sales')}
              classNamePrefix="react-select"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <Select
              options={dateRangeOptions}
              value={dateRangeOptions.find((opt) => opt.value === dateRange)}
              onChange={(option) => setDateRange(option?.value || '30days')}
              classNamePrefix="react-select"
            />
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
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
    </div>
  );
};


