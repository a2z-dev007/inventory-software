# Frontend Integration Test Guide

## Updated Reports Page Integration

The Reports page has been updated to use the new dedicated Reports APIs. Here's what was changed and how to test it:

## ✅ Changes Made

### 1. API Routes Added
- `REPORTS_API_SALES: '/reports-api/sales'`
- `REPORTS_API_PURCHASES: '/reports-api/purchases'`
- `REPORTS_API_SUPPLIERS: '/reports-api/suppliers'`
- `REPORTS_API_CUSTOMERS: '/reports-api/customers'`
- `REPORTS_API_CLIENT: (customerName) => '/reports-api/client/{customerName}'`
- `REPORTS_API_SUPPLIER: (vendorName) => '/reports-api/supplier/{vendorName}'`

### 2. API Service Methods Added
- `getSalesReport()` - Get sales data with filtering
- `getPurchasesReport()` - Get purchases data with filtering
- `getSuppliersForReports()` - Get all suppliers for dropdown
- `getCustomersForReports()` - Get all customers for dropdown
- `getClientReport()` - Get client-specific detailed report
- `getSupplierReport()` - Get supplier-specific detailed report

### 3. Reports Page Updates
- ✅ **Sales Report** - Now enabled and uses new API
- ✅ **Purchases Report** - Updated to use new API
- ✅ **Supplier Report** - Enhanced with summary statistics
- ✅ **Client Report** - Enhanced with summary statistics
- ✅ **Better Error Handling** - More informative messages
- ✅ **Export Improvements** - Shows record count in success message

## 🧪 Testing Instructions

### Prerequisites
1. Make sure backend server is running on port 8080
2. Make sure frontend is running on port 5173
3. Ensure you have some test data (sales, purchases, customers, suppliers)

### Test Cases

#### 1. Test Sales Report
```
1. Go to http://localhost:5173/reports
2. Select "Sales Report" from dropdown
3. Choose date range (e.g., "Last 30 Days")
4. Click "Export Excel"
5. ✅ Should download Excel file with sales data
6. ✅ Check file contains: Client, DB, Item, QTY, Amount, Date, Total, Invoice Number, Status
```

#### 2. Test Purchases Report
```
1. Select "Purchases Report" from dropdown
2. Choose date range
3. Click "Export Excel"
4. ✅ Should download Excel file with purchases data
5. ✅ Check file contains: Supplier, DB, Item, QTY, Amount, Client name, Date, Total, Receipt Number
```

#### 3. Test Supplier-Specific Report
```
1. Select "Report by Supplier" from dropdown
2. ✅ Should show supplier selection dropdown
3. Select a supplier from the list
4. Choose date range
5. Click "Export Excel"
6. ✅ Should download Excel with supplier-specific data
7. ✅ First row should be summary with totals
8. ✅ All records should be for selected supplier only
```

#### 4. Test Client-Specific Report
```
1. Select "Report by Client" from dropdown
2. ✅ Should show client selection dropdown
3. Select a client from the list
4. Choose date range
5. Click "Export Excel"
6. ✅ Should download Excel with client-specific data
7. ✅ First row should be summary with totals
8. ✅ All records should be for selected client only
```

#### 5. Test Custom Date Range
```
1. Select any report type
2. Choose "Custom Range" from date dropdown
3. ✅ Should show start/end date inputs
4. Select custom dates
5. Click "Export Excel"
6. ✅ Should export data only within selected date range
```

#### 6. Test Error Handling
```
1. Try exporting without selecting required supplier/client
2. ✅ Should show validation error
3. Try with future dates
4. ✅ Should show warning about future dates
5. Try with invalid date range (start > end)
6. ✅ Should show error about invalid range
```

## 📊 Expected Excel File Structure

### Sales Report Columns:
- Client
- DB (Reference Number)
- Item (Product names, comma-separated)
- QTY (Total quantity)
- Amount (Total amount)
- Supplier name
- Date
- Total
- Invoice Number
- Status

### Purchases Report Columns:
- Supplier
- DB (Reference Number)
- Item (Product names, comma-separated)
- QTY (Total quantity)
- Amount (Total amount)
- Client name
- Date
- Total
- Receipt Number

### Supplier/Client Reports:
- Same columns as above
- **First row contains summary statistics**
- All subsequent rows are filtered data

## 🔍 Debugging Tips

### If Export Fails:
1. Check browser console for errors
2. Check network tab for API calls
3. Verify backend is running and accessible
4. Check if authentication token is valid

### If No Data in Export:
1. Verify date range includes actual data
2. Check if filters are too restrictive
3. Ensure test data exists in database
4. Try with "all=true" parameter

### If Dropdowns Empty:
1. Check if suppliers/customers exist in database
2. Verify API endpoints are accessible
3. Check console for loading errors

## 🚀 API Endpoints Being Used

The frontend now calls these new backend endpoints:

```
GET /api/reports-api/sales?startDate=...&endDate=...&all=true
GET /api/reports-api/purchases?startDate=...&endDate=...&all=true
GET /api/reports-api/suppliers
GET /api/reports-api/customers
GET /api/reports-api/client/ClientName?startDate=...&endDate=...&all=true
GET /api/reports-api/supplier/SupplierName?startDate=...&endDate=...&all=true
```

## ✅ Success Criteria

The integration is successful if:
- ✅ All report types can be exported without errors
- ✅ Excel files contain expected data structure
- ✅ Date filtering works correctly
- ✅ Supplier/Client filtering works correctly
- ✅ Summary statistics appear in specific reports
- ✅ Error messages are helpful and informative
- ✅ No console errors during normal operation

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure backend CORS is configured for frontend URL
2. **Authentication Errors**: Check if user is logged in and token is valid
3. **Network Errors**: Verify backend is running on correct port
4. **Empty Exports**: Check if data exists for selected criteria
5. **Date Format Issues**: Ensure dates are in ISO format

### Backend Health Check:
```bash
curl http://localhost:8080/health
```

### Test New API Endpoints:
```bash
# Test sales report API
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:8080/api/reports-api/sales?all=true"

# Test suppliers for reports
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:8080/api/reports-api/suppliers"
```

This integration provides a much more robust and feature-rich reporting system while maintaining backward compatibility with existing functionality.