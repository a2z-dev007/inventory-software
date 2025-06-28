# Postman Collection for Inventory Management API

This directory contains the complete Postman collection for testing the Inventory Management System API.

## 📁 Files

- `Inventory-Management-API.postman_collection.json` - Complete Postman collection with all endpoints

## 🚀 Quick Start

### 1. Import Collection

1. Open Postman
2. Click "Import" button
3. Select the `Inventory-Management-API.postman_collection.json` file
4. Click "Import"

### 2. Set Environment Variables

The collection uses the following variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `base_url` | API base URL | `http://localhost:5000` |
| `auth_token` | JWT authentication token | Auto-set after login |
| `user_id` | Current user ID | Auto-set after login |
| `product_id` | Product ID for testing | Auto-set after creating product |
| `vendor_id` | Vendor ID for testing | Auto-set after creating vendor |
| `customer_id` | Customer ID for testing | Auto-set after creating customer |
| `purchase_order_id` | Purchase Order ID | Auto-set after creating PO |
| `sale_id` | Sale ID for testing | Auto-set after creating sale |
| `purchase_id` | Purchase ID for testing | Auto-set after creating purchase |

### 3. Authentication Flow

1. **Login First**: Run the "Authentication > Login" request
2. **Token Auto-Save**: The JWT token is automatically saved to `auth_token` variable
3. **Authenticated Requests**: All other requests use the saved token automatically

## 📋 Collection Structure

### 🏥 Health Check
- **GET** `/health` - Server health check

### 🔐 Authentication
- **POST** `/api/auth/login` - User login
- **GET** `/api/auth/me` - Get current user
- **POST** `/api/auth/refresh` - Refresh token
- **PUT** `/api/auth/change-password` - Change password
- **POST** `/api/auth/logout` - User logout

### 👥 Users (Admin/Manager Only)
- **GET** `/api/users` - Get all users with pagination
- **GET** `/api/users/{id}` - Get user by ID
- **POST** `/api/users` - Create new user (Admin only)
- **PUT** `/api/users/{id}` - Update user (Admin only)
- **PATCH** `/api/users/{id}/toggle-status` - Toggle user status (Admin only)
- **GET** `/api/users/stats` - Get user statistics
- **DELETE** `/api/users/{id}` - Delete user (Admin only)

### 📦 Products
- **GET** `/api/products` - Get all products with filters
- **GET** `/api/products/{id}` - Get product by ID
- **POST** `/api/products` - Create new product (Admin/Manager)
- **PUT** `/api/products/{id}` - Update product (Admin/Manager)
- **PATCH** `/api/products/{id}/stock` - Update product stock (Admin/Manager)
- **GET** `/api/products/categories` - Get product categories
- **GET** `/api/products/low-stock` - Get low stock products
- **PATCH** `/api/products/bulk-update` - Bulk update products (Admin/Manager)
- **DELETE** `/api/products/{id}` - Delete product (Admin only)

### 🏢 Vendors
- **GET** `/api/vendors` - Get all vendors
- **GET** `/api/vendors/{id}` - Get vendor by ID
- **POST** `/api/vendors` - Create new vendor (Admin/Manager)
- **PUT** `/api/vendors/{id}` - Update vendor (Admin/Manager)
- **DELETE** `/api/vendors/{id}` - Delete vendor (Admin only)

### 👤 Customers
- **GET** `/api/customers` - Get all customers
- **GET** `/api/customers/{id}` - Get customer by ID
- **POST** `/api/customers` - Create new customer
- **PUT** `/api/customers/{id}` - Update customer
- **DELETE** `/api/customers/{id}` - Delete customer (Admin only)

### 📋 Purchase Orders
- **GET** `/api/purchase-orders` - Get all purchase orders
- **GET** `/api/purchase-orders/{id}` - Get purchase order by ID
- **POST** `/api/purchase-orders` - Create new purchase order (Admin/Manager)
- **PUT** `/api/purchase-orders/{id}` - Update purchase order (Admin/Manager)
- **PATCH** `/api/purchase-orders/{id}/status` - Update PO status (Admin/Manager)
- **DELETE** `/api/purchase-orders/{id}` - Delete purchase order (Admin only)

### 💰 Sales
- **GET** `/api/sales` - Get all sales
- **GET** `/api/sales/{id}` - Get sale by ID
- **POST** `/api/sales` - Create new sale
- **PUT** `/api/sales/{id}` - Update sale
- **DELETE** `/api/sales/{id}` - Delete sale (Admin only)

### 🛒 Purchases
- **GET** `/api/purchases` - Get all purchases
- **GET** `/api/purchases/{id}` - Get purchase by ID
- **POST** `/api/purchases` - Create new purchase (Admin/Manager)
- **PUT** `/api/purchases/{id}` - Update purchase (Admin/Manager)
- **DELETE** `/api/purchases/{id}` - Delete purchase (Admin only)

### 📊 Reports
- **GET** `/api/reports/dashboard` - Dashboard summary
- **GET** `/api/reports/sales` - Sales report
- **GET** `/api/reports/purchases` - Purchase report
- **GET** `/api/reports/inventory` - Inventory report
- **GET** `/api/reports/profit-loss` - Profit & Loss report
- **GET** `/api/reports/top-products` - Top products report
- **GET** `/api/reports/vendor-performance` - Vendor performance report

### 📚 Documentation
- **GET** `/api-docs` - Swagger API documentation

## 🔧 Usage Tips

### 1. Default Credentials
\`\`\`json
{
  "username": "admin",
  "password": "admin123"
}
\`\`\`

### 2. Testing Workflow
1. **Start Server**: Ensure your backend server is running on `http://localhost:5000`
2. **Login**: Run the login request first
3. **Create Test Data**: Create products, vendors, customers
4. **Test Operations**: Create purchase orders, sales, purchases
5. **View Reports**: Check various reports

### 3. Environment Setup
You can create different environments for:
- **Development**: `http://localhost:5000`
- **Staging**: `https://staging-api.yourapp.com`
- **Production**: `https://api.yourapp.com`

### 4. Automated Testing
The collection includes:
- **Pre-request Scripts**: Auto-set base URL
- **Test Scripts**: Response time validation, success field checks
- **Variable Management**: Auto-save IDs and tokens

### 5. Error Handling
- All requests include error response logging
- Failed requests show detailed error information in console
- Response time validation (< 5 seconds)

## 🔍 Query Parameters

### Pagination
\`\`\`
?page=1&limit=10&sortBy=createdAt&sortOrder=desc
\`\`\`

### Search & Filters
\`\`\`
?search=keyword&category=Electronics&vendor=Apple
\`\`\`

### Date Ranges
\`\`\`
?startDate=2024-01-01&endDate=2024-12-31
\`\`\`

## 📝 Request Examples

### Create Product
\`\`\`json
{
  "name": "iPhone 15 Pro",
  "sku": "APPLE-IP15P-001",
  "purchaseRate": 999,
  "salesRate": 1199,
  "currentStock": 50,
  "category": "Electronics",
  "vendor": "Apple Inc.",
  "description": "Latest iPhone model",
  "minStockLevel": 10
}
\`\`\`

### Create Sale
\`\`\`json
{
  "customerName": "Tech Solutions Corp",
  "customerEmail": "contact@techsolutions.com",
  "items": [
    {
      "productId": "product_id_here",
      "productName": "iPhone 15 Pro",
      "quantity": 2,
      "unitPrice": 1199,
      "total": 2398
    }
  ],
  "subtotal": 2398,
  "tax": 191.84,
  "total": 2589.84,
  "paymentMethod": "card"
}
\`\`\`

## 🚨 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Ensure you've logged in and token is set
   - Check if token has expired

2. **403 Forbidden**
   - Check user role permissions
   - Some endpoints require Admin/Manager roles

3. **404 Not Found**
   - Verify the endpoint URL
   - Check if server is running

4. **500 Internal Server Error**
   - Check server logs
   - Verify database connection

### Debug Tips
- Check Postman console for detailed logs
- Verify environment variables are set correctly
- Use the health check endpoint to verify server status

## 📞 Support

For issues with the API or Postman collection:
1. Check the server logs
2. Verify environment configuration
3. Review API documentation at `/api-docs`
4. Contact the development team

---

**Happy Testing! 🚀**
