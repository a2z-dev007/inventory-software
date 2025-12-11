import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
// @ts-ignore
import { saveAs } from 'file-saver';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';
import Select from 'react-select';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { apiService } from '../services/api';
import { ValidationModal } from '../components/modals/ValidationModal';
import { LoadingModal } from '../components/modals/LoadingModal';

const reportTypeOptions = [
  // { value: 'sales', label: 'Sales Report' },
  { value: 'purchases', label: 'Purchases Report' },
  { value: 'purchase-orders', label: 'Purchase Orders Report' },
  { value: 'purchase-returns', label: 'Purchase Returns Report' },
  { value: 'supplier-report', label: 'Report by Supplier' },
  { value: 'client-report', label: 'Report by Client' },
  // { value: 'products', label: 'Inventory Report' },
  // { value: 'customers', label: 'Clients Report' },
  // { value: 'vendors', label: 'Suppliers Report' },
];

const dateRangeOptions = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export const Reports = () => {
  const [reportType, setReportType] = useState('purchases');
  const [dateRange, setDateRange] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Modal states
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    type: 'error' | 'warning' | 'success' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });

  // Load suppliers and clients when needed
  useEffect(() => {
    if (reportType === 'supplier-report') {
      loadSuppliers();
    } else if (reportType === 'client-report') {
      loadClients();
    }
  }, [reportType]);

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await apiService.getSuppliersForReports();
      const supplierOptions = response.vendors?.map((supplier: any) => ({
        value: supplier.name, // Use name for filtering
        label: supplier.name,
        id: supplier._id,
      })) || [];
      setSuppliers(supplierOptions);
      
      if (supplierOptions.length === 0) {
        showValidationModal('info', 'No Suppliers Found', 'No suppliers are available. Please add suppliers first to generate supplier reports.');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showValidationModal('error', 'Failed to Load Suppliers', 'Unable to load suppliers. Please check your connection and try again.');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const response = await apiService.getCustomersForReports();
      const clientOptions = response.customers?.map((client: any) => ({
        value: client.name, // Use name for filtering
        label: client.name,
        id: client._id,
      })) || [];
      setClients(clientOptions);
      
      if (clientOptions.length === 0) {
        showValidationModal('info', 'No Clients Found', 'No clients are available. Please add clients first to generate client reports.');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      showValidationModal('error', 'Failed to Load Clients', 'Unable to load clients. Please check your connection and try again.');
    } finally {
      setLoadingClients(false);
    }
  };

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

  const showValidationModal = (type: 'error' | 'warning' | 'success' | 'info', title: string, message: string) => {
    setValidationModal({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const closeValidationModal = () => {
    setValidationModal(prev => ({ ...prev, isOpen: false }));
  };

  const validateInputs = (): boolean => {
    if (!reportType) {
      showValidationModal('error', 'Report Type Required', 'Please select a report type to continue.');
      return false;
    }

    if (dateRange === 'custom') {
      if (!startDate || !endDate) {
        showValidationModal('error', 'Date Range Required', 'Please select both start and end dates for custom date range.');
        return false;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        showValidationModal('error', 'Invalid Date Range', 'Start date cannot be later than end date.');
        return false;
      }

      const today = new Date();
      if (start > today) {
        showValidationModal('warning', 'Future Date Selected', 'Start date is in the future. This may result in no data being found.');
      }
    }

    // Validate supplier/client selection for new report types
    if (reportType === 'supplier-report' && !selectedSupplier) {
      showValidationModal('error', 'Supplier Required', 'Please select a supplier to generate the supplier report.');
      return false;
    }

    if (reportType === 'client-report' && !selectedClient) {
      showValidationModal('error', 'Client Required', 'Please select a client to generate the client report.');
      return false;
    }

    return true;
  };

  const downloadExcel = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      const { startDate: sDate, endDate: eDate } =
        dateRange === 'custom' ? { startDate, endDate } : calculateDateRange();

      let exportData: any[] = [];
      let fileName = '';

      if (reportType === 'purchases') {
        // Get all purchases with detailed item breakdown
        const purchasesRes = await apiService.getPurchases({
          startDate: sDate,
          endDate: eDate,
          all: true
        });

        // Create detailed purchases report with better organization
        exportData = [];
        let totalAmount = 0;
        let totalActiveItems = 0;
        let totalCancelledItems = 0;
        let totalReturnedItems = 0;

        purchasesRes.purchases?.forEach((purchase: any) => {
          purchase.items?.forEach((item: any) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            const isActive = !item.isCancelled && !item.isReturn;
            
            if (isActive) {
              totalAmount += itemTotal;
              totalActiveItems++;
            } else if (item.isCancelled) {
              totalCancelledItems++;
            } else if (item.isReturn) {
              totalReturnedItems++;
            }

            exportData.push({
              'S.No': exportData.length + 1,
              'Date': new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString(),
              'DB Number': purchase.ref_num || '',
              'Receipt No': purchase.receiptNumber || '',
              
              // Supplier & Client Information
              'Supplier': purchase.vendor?.name || purchase.vendor || '',
              'Client': purchase.customerName || purchase.customer?.name || purchase.customer || 'N/A',
              'Client Address': purchase.customerAddress || 'N/A',
              
              // Item Details
              'Product': item.productName || item.product?.name || item.name || '',
              'Qty': item.quantity || 0,
              'Unit': item.unitType || '',
              'Rate (₹)': item.unitPrice || 0,
              'Amount (₹)': itemTotal,
              
              // Status
              'Status': item.isCancelled ? 'CANCELLED' : item.isReturn ? 'RETURNED' : 'DELIVERED',
              
              // Additional Info
              'Received By': purchase.receivedBy || '',
              'Remarks': purchase.remarks || item.remarks || '',
              'Created By': purchase.createdBy?.name || ''
            });
          });
        });

        // Add summary row
        if (exportData.length > 0) {
          exportData.push({
            'S.No': '',
            'Date': '',
            'DB Number': '',
            'Receipt No': '',
            'Supplier': '=== OVERALL SUMMARY ===',
            'Client': `Total Active: ${totalActiveItems}`,
            'Client Address': `Cancelled: ${totalCancelledItems}`,
            'Product': `Returned: ${totalReturnedItems}`,
            'Qty': '',
            'Unit': '',
            'Rate (₹)': 'TOTAL:',
            'Amount (₹)': totalAmount,
            'Status': '',
            'Received By': '',
            'Remarks': `Report Period: ${new Date(sDate).toLocaleDateString()} to ${new Date(eDate).toLocaleDateString()}`,
            'Created By': ''
          });
        }

        fileName = `All_Purchases_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (reportType === 'supplier-report') {
        // Get data filtered by supplier - exact format as screenshot
        const supplierName = selectedSupplier.label;
        const supplierId = selectedSupplier.value;
        
        // Fetch purchases data filtered by supplier
        const purchasesRes = await apiService.getPurchases({
          vendor: supplierId,
          startDate: sDate,
          endDate: eDate,
          all: true
        });

        // Create supplier report matching exact screenshot format
        exportData = [];
        
        // Group purchases by purchase order to match screenshot format
        purchasesRes.purchases?.forEach((purchase: any) => {
          let deliveredCount = 0;
          let cancelledCount = 0;
          let returnedCount = 0;
          let subtotal = 0;
          let remarks: string[] = [];

          // First, add header information for this purchase
          exportData.push({
            'A': 'Date',
            'B': new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('en-GB'),
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'DB Number',
            'B': purchase.ref_num || '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Receipt No',
            'B': purchase.receiptNumber || '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Client',
            'B': purchase.customerName || purchase.customer?.name || purchase.customer || 'N/A',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Client Address',
            'B': purchase.customerAddress || 'N/A',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Supplier',
            'B': supplierName,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });

          // Empty row
          exportData.push({
            'A': '',
            'B': '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });

          // Items header
          exportData.push({
            'A': 'S.No',
            'B': 'Product',
            'C': 'Qty',
            'D': 'Unit',
            'E': 'Rate (₹)',
            'F': 'Amount (₹)',
            'G': 'Status',
            'H': ''
          });

          // Items data
          purchase.items?.forEach((item: any, index: number) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            const status = item.isCancelled ? 'CANCELLED' : item.isReturn ? 'RETURNED' : 'DELIVERED';
            
            if (status === 'DELIVERED') deliveredCount++;
            else if (status === 'CANCELLED') cancelledCount++;
            else if (status === 'RETURNED') returnedCount++;
            
            if (status === 'DELIVERED') subtotal += itemTotal;
            
            if (item.isCancelled && item.productName) {
              remarks.push(`${item.productName} cancelled`);
            }

            exportData.push({
              'A': index + 1,
              'B': item.productName || item.product?.name || item.name || '',
              'C': item.quantity || 0,
              'D': item.unitType || '',
              'E': item.unitPrice || 0,
              'F': itemTotal,
              'G': status,
              'H': ''
            });
          });

          // Empty row
          exportData.push({
            'A': '',
            'B': '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });

          // Summary section
          exportData.push({
            'A': 'Delivered',
            'B': deliveredCount,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Cancelled',
            'B': cancelledCount,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Returned',
            'B': returnedCount,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Subtotal',
            'B': subtotal,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          if (remarks.length > 0) {
            exportData.push({
              'A': 'Remarks',
              'B': remarks.join(', '),
              'C': '',
              'D': '',
              'E': '',
              'F': '',
              'G': '',
              'H': ''
            });
          }

          // Double empty row between purchases
          exportData.push({
            'A': '',
            'B': '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': '',
            'B': '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
        });

        fileName = `Supplier_Report_${supplierName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (reportType === 'client-report') {
        // Get data filtered by client - exact format as screenshot
        const clientName = selectedClient.label;
        const clientId = selectedClient.value;
        
        // Fetch all purchases data and filter by client
        const purchasesRes = await apiService.getPurchases({
          all: true,
          startDate: sDate,
          endDate: eDate
        });

        // Create client report matching exact screenshot format
        exportData = [];
        
        // Filter and group purchases by client
        const clientPurchases = purchasesRes.purchases?.filter((purchase: any) => {
          return purchase.customer?._id === clientId || 
                 purchase.customer?.id === clientId ||
                 purchase.customer === clientId ||
                 purchase.customerName === clientName;
        });

        clientPurchases?.forEach((purchase: any) => {
          let deliveredCount = 0;
          let cancelledCount = 0;
          let returnedCount = 0;
          let subtotal = 0;
          let remarks: string[] = [];

          // First, add header information for this purchase
          exportData.push({
            'A': 'Date',
            'B': new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('en-GB'),
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'DB Number',
            'B': purchase.ref_num || '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Receipt No',
            'B': purchase.receiptNumber || '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Client',
            'B': clientName,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Client Address',
            'B': purchase.customerAddress || 'N/A',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Supplier',
            'B': purchase.vendor?.name || purchase.vendor || 'N/A',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });

          // Empty row
          exportData.push({
            'A': '',
            'B': '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });

          // Items header
          exportData.push({
            'A': 'S.No',
            'B': 'Product',
            'C': 'Qty',
            'D': 'Unit',
            'E': 'Rate (₹)',
            'F': 'Amount (₹)',
            'G': 'Status',
            'H': ''
          });

          // Items data
          purchase.items?.forEach((item: any, index: number) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            const status = item.isCancelled ? 'CANCELLED' : item.isReturn ? 'RETURNED' : 'DELIVERED';
            
            if (status === 'DELIVERED') deliveredCount++;
            else if (status === 'CANCELLED') cancelledCount++;
            else if (status === 'RETURNED') returnedCount++;
            
            if (status === 'DELIVERED') subtotal += itemTotal;
            
            if (item.isCancelled && item.productName) {
              remarks.push(`${item.productName} cancelled`);
            }

            exportData.push({
              'A': index + 1,
              'B': item.productName || item.product?.name || item.name || '',
              'C': item.quantity || 0,
              'D': item.unitType || '',
              'E': item.unitPrice || 0,
              'F': itemTotal,
              'G': status,
              'H': ''
            });
          });

          // Empty row
          exportData.push({
            'A': '',
            'B': '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });

          // Summary section
          exportData.push({
            'A': 'Delivered',
            'B': deliveredCount,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Cancelled',
            'B': cancelledCount,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Returned',
            'B': returnedCount,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': 'Subtotal',
            'B': subtotal,
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          if (remarks.length > 0) {
            exportData.push({
              'A': 'Remarks',
              'B': remarks.join(', '),
              'C': '',
              'D': '',
              'E': '',
              'F': '',
              'G': '',
              'H': ''
            });
          }

          // Double empty row between purchases
          exportData.push({
            'A': '',
            'B': '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
          
          exportData.push({
            'A': '',
            'B': '',
            'C': '',
            'D': '',
            'E': '',
            'F': '',
            'G': '',
            'H': ''
          });
        });

        fileName = `Client_Report_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        // Original report logic
        const res = await apiService.exportToExcel({
          moduleName: reportType,
          startDate: sDate,
          endDate: eDate,
        });

        const reportData = res.data || {};

        // Map report type to data key
        const dataKeyMap: Record<string, string> = {
          'purchase-orders': 'purchaseOrders',
          'purchase-returns': 'purchaseReturns',
          purchases: 'purchases',
          sales: 'sales',
          products: 'topProducts',
          vendors: 'topVendors',
          customers: 'topCustomers',
        };

        const dataKey = dataKeyMap[reportType];
        exportData = reportData[dataKey] || [];
        fileName = `${reportType}_report_${Date.now()}.xlsx`;
      }

      if (!exportData.length) {
        showValidationModal('info', 'No Data Found', 'No data was found for the selected criteria. Please try adjusting your filters or date range.');
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

      saveAs(blob, fileName);
      
      // Show success message with data count
      const recordCount = exportData.length;
      const reportTypeLabel = reportTypeOptions.find(opt => opt.value === reportType)?.label || 'Report';
      showValidationModal('success', 'Export Successful', `Your detailed ${reportTypeLabel.toLowerCase()} has been downloaded successfully as "${fileName}" with ${recordCount} individual item records.`);
    } catch (err) {
      console.error(err);
      showValidationModal('error', 'Export Failed', 'Failed to export report. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="my-6">
      <Card>
        <CardHeader
          title="Reports & Analytics"
          subtitle="Generate comprehensive business reports"
          action={
            <Button
              icon={loading ? undefined : Download}
              onClick={downloadExcel}
              disabled={loading || (reportType === 'supplier-report' && !selectedSupplier) || (reportType === 'client-report' && !selectedClient)}
              className="flex items-center gap-2 gradient-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                'Export Excel'
              )}
            </Button>
          }
        />

        {/* Filters */}
        <div className="space-y-6 px-6 pb-6">
          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <Select
                options={reportTypeOptions}
                value={reportTypeOptions.find((opt) => opt.value === reportType)}
                onChange={(option) => {
                  setReportType(option?.value || 'purchases');
                  // Reset selections when changing report type
                  setSelectedSupplier(null);
                  setSelectedClient(null);
                }}
                classNamePrefix="react-select"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <Select
                options={dateRangeOptions}
                value={dateRangeOptions.find((opt) => opt.value === dateRange)}
                onChange={(option) => setDateRange(option?.value || '30days')}
                classNamePrefix="react-select"
                className="text-sm"
              />
            </div>
          </div>

          {/* Supplier/Client Selection */}
          {(reportType === 'supplier-report' || reportType === 'client-report') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-900">
                  {reportType === 'supplier-report' ? 'Supplier Selection Required' : 'Client Selection Required'}
                </h3>
              </div>
              
              {reportType === 'supplier-report' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Supplier
                  </label>
                  <Select
                    options={suppliers}
                    value={selectedSupplier}
                    onChange={setSelectedSupplier}
                    placeholder="Choose a supplier..."
                    isLoading={loadingSuppliers}
                    classNamePrefix="react-select"
                    className="text-sm"
                    isClearable
                    noOptionsMessage={() => loadingSuppliers ? "Loading suppliers..." : "No suppliers found"}
                  />
                  {!loadingSuppliers && suppliers.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No suppliers available. Please add suppliers first.</p>
                  )}
                </div>
              )}

              {reportType === 'client-report' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Client
                  </label>
                  <Select
                    options={clients}
                    value={selectedClient}
                    onChange={setSelectedClient}
                    placeholder="Choose a client..."
                    isLoading={loadingClients}
                    classNamePrefix="react-select"
                    className="text-sm"
                    isClearable
                    noOptionsMessage={() => loadingClients ? "Loading clients..." : "No clients found"}
                  />
                  {!loadingClients && clients.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No clients available. Please add clients first.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Custom Date Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

        
        </div>
      </Card>

      {/* Modals */}
      <LoadingModal 
        isOpen={loading}
        title="Generating Report"
        message="Please wait while we prepare your Excel report. This may take a few moments..."
      />

      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={closeValidationModal}
        type={validationModal.type}
        title={validationModal.title}
        message={validationModal.message}
      />
    </div>
  );
};


