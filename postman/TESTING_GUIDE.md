# API Testing Guide

This guide provides comprehensive instructions for testing the Inventory Management API using the provided Postman collection.

## 🎯 Testing Objectives

- Verify all API endpoints work correctly
- Test authentication and authorization
- Validate data integrity and business logic
- Check error handling and edge cases
- Performance testing for response times

## 🧪 Test Scenarios

### 1. Authentication Flow

#### Test Case: Successful Login
\`\`\`
1. POST /api/auth/login
   Body: {"username": "admin", "password": "admin123"}
   Expected: 200 OK, JWT token returned
   Verify: Token is saved to collection variable
\`\`\`

#### Test Case: Invalid Credentials
\`\`\`
1. POST /api/auth/login
   Body: {"username": "admin", "password": "wrongpassword"}
   Expected: 401 Unauthorized
   Verify: Error message about invalid credentials
\`\`\`

#### Test Case: Get Current User
\`\`\`
1. GET /api/auth/me
   Headers: Authorization: Bearer {token}
   Expected: 200 OK, user information returned
   Verify: User data matches logged-in user
\`\`\`

### 2. User Management

#### Test Case: Create User (Admin Only)
\`\`\`
1. POST /api/users
   Headers: Authorization: Bearer {admin_token}
   Body: Valid user data
   Expected: 201 Created, user created
   Verify: User ID is saved to variable
\`\`\`

#### Test Case: Unauthorized User Creation
\`\`\`
1. POST /api/users
   Headers: Authorization: Bearer {staff_token}
   Expected: 403 Forbidden
   Verify: Access denied message
\`\`\`

### 3. Product Management

#### Test Case: Create Product
\`\`\`
1. POST /api/products
   Headers: Authorization: Bearer {manager_token}
   Body: Valid product data
   Expected: 201 Created, product created
   Verify: Product ID is saved, SKU is unique
\`\`\`

#### Test Case: Duplicate SKU
\`\`\`
1. POST /api/products
   Body: Product with existing SKU
   Expected: 400 Bad Request
   Verify: Error message about duplicate SKU
\`\`\`

#### Test Case: Update Stock
\`\`\`
1. PATCH /api/products/{id}/stock
   Body: {"quantity": 10, "type": "add", "reason": "Restock"}
   Expected: 200 OK, stock updated
   Verify: Stock quantity increased correctly
\`\`\`

### 4. Sales Flow

#### Test Case: Complete Sales Process
\`\`\`
1. Create customer
2. Create product
3. Create sale with valid items
4. Verify stock reduction
5. Update sale status to paid
\`\`\`

### 5. Purchase Order Flow

#### Test Case: Complete Purchase Order Process
\`\`\`
1. Create vendor
2. Create products
3. Create purchase order with items
4. Update PO status to approved
5. Create purchase receipt
6. Verify stock increase
\`\`\`

#### Test Case: PO Status Workflow
\`\`\`
1. Create PO (status: draft)
2. Update to pending
3. Update to approved (requires admin/manager)
4. Update to delivered
5. Verify status transitions are valid
\`\`\`

### 6. Reporting

#### Test Case: Dashboard Summary
\`\`\`
1. GET /api/reports/dashboard
   Expected: 200 OK, summary metrics
   Verify: All key metrics present (sales, purchases, inventory)
\`\`\`

#### Test Case: Sales Report with Date Range
\`\`\`
1. GET /api/reports/sales?startDate=2024-01-01&endDate=2024-12-31
   Expected: 200 OK, sales data for date range
   Verify: Data filtered correctly by date
\`\`\`

## 🔄 Test Execution Order

### Phase 1: Setup
1. Health check
2. Login as admin
3. Create test users (manager, staff)
4. Create test vendors
5. Create test customers

### Phase 2: Core Operations
1. Create products
2. Test stock operations
3. Create purchase orders
4. Create sales
5. Create purchases

### Phase 3: Advanced Features
1. Test bulk operations
2. Generate reports
3. Test search and filters
4. Test pagination

### Phase 4: Cleanup
1. Delete test data
2. Verify soft deletes
3. Test data integrity

## 📊 Performance Testing

### Response Time Benchmarks
- Authentication: < 500ms
- CRUD operations: < 1000ms
- Reports: < 2000ms
- Bulk operations: < 3000ms

### Load Testing Scenarios
\`\`\`
1. Concurrent user logins (10 users)
2. Bulk product creation (100 products)
3. Multiple sales transactions (50 concurrent)
4. Report generation under load
\`\`\`

## 🚨 Error Testing

### Validation Errors
\`\`\`
1. Missing required fields
2. Invalid data types
3. Out-of-range values
4. Invalid email formats
5. Duplicate unique fields
\`\`\`

### Authorization Errors
\`\`\`
1. No token provided
2. Invalid token
3. Expired token
4. Insufficient permissions
5. Deactivated user account
\`\`\`

### Business Logic Errors
\`\`\`
1. Insufficient stock for sale
2. Invalid product references
3. Negative quantities
4. Invalid status transitions
\`\`\`

## 📝 Test Data Templates

### User Data
\`\`\`json
{
  "username": "testuser001",
  "password": "password123",
  "name": "Test User",
  "email": "test@example.com",
  "role": "staff"
}
\`\`\`

### Product Data
\`\`\`json
{
  "name": "Test Product",
  "sku": "TEST-001",
  "purchaseRate": 100,
  "salesRate": 150,
  "currentStock": 50,
  "category": "Test Category",
  "vendor": "Test Vendor",
  "minStockLevel": 10
}
\`\`\`

### Sale Data
\`\`\`json
{
  "customerName": "Test Customer",
  "customerEmail": "customer@test.com",
  "items": [
    {
      "productId": "{{product_id}}",
      "productName": "Test Product",
      "quantity": 2,
      "unitPrice": 150,
      "total": 300
    }
  ],
  "subtotal": 300,
  "tax": 24,
  "total": 324,
  "paymentMethod": "cash"
}
\`\`\`

## ✅ Test Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected routes without token
- [ ] Access with expired token
- [ ] Refresh token functionality
- [ ] Change password
- [ ] Logout functionality

### User Management
- [ ] Create user (admin only)
- [ ] Get all users with pagination
- [ ] Get user by ID
- [ ] Update user information
- [ ] Toggle user status
- [ ] Delete user (soft delete)
- [ ] Role-based access control

### Product Management
- [ ] Create product with valid data
- [ ] Create product with duplicate SKU
- [ ] Get all products with filters
- [ ] Get product by ID
- [ ] Update product information
- [ ] Update stock (add/subtract/set)
- [ ] Get low stock products
- [ ] Bulk update products
- [ ] Delete product

### Vendor Management
- [ ] Create vendor
- [ ] Get all vendors
- [ ] Get vendor by ID
- [ ] Update vendor
- [ ] Delete vendor

### Customer Management
- [ ] Create customer
- [ ] Get all customers
- [ ] Get customer by ID
- [ ] Update customer
- [ ] Delete customer

### Purchase Orders
- [ ] Create purchase order
- [ ] Get all purchase orders
- [ ] Get PO by ID
- [ ] Update purchase order
- [ ] Update PO status
- [ ] Delete purchase order

### Sales
- [ ] Create sale
- [ ] Get all sales
- [ ] Get sale by ID
- [ ] Update sale
- [ ] Delete sale
- [ ] Stock reduction on sale

### Purchases
- [ ] Create purchase
- [ ] Get all purchases
- [ ] Get purchase by ID
- [ ] Update purchase
- [ ] Delete purchase
- [ ] Stock increase on purchase

### Reports
- [ ] Dashboard summary
- [ ] Sales report
- [ ] Purchase report
- [ ] Inventory report
- [ ] Profit & loss report
- [ ] Top products report
- [ ] Vendor performance report

## 🐛 Common Issues & Solutions

### Issue: Token Not Saved
**Solution**: Check test script in login request, ensure response is 200 OK

### Issue: 404 Not Found
**Solution**: Verify server is running, check base URL in environment

### Issue: 403 Forbidden
**Solution**: Check user role permissions, ensure proper authentication

### Issue: Validation Errors
**Solution**: Review request body format, check required fields

### Issue: Database Errors
**Solution**: Ensure MongoDB is running, check connection string

## 📈 Test Reporting

### Test Results Template
\`\`\`
Test Suite: Inventory Management API
Date: [Date]
Environment: [Development/Staging/Production]
Total Tests: [Number]
Passed: [Number]
Failed: [Number]
Success Rate: [Percentage]

Failed Tests:
- [Test Name]: [Error Description]
- [Test Name]: [Error Description]

Performance Metrics:
- Average Response Time: [Time]
- Slowest Endpoint: [Endpoint] ([Time])
- Fastest Endpoint: [Endpoint] ([Time])
\`\`\`

## 🔧 Automation Scripts

### Newman CLI Testing
\`\`\`bash
# Install Newman
npm install -g newman

# Run collection
newman run Inventory-Management-API.postman_collection.json \
  -e Development.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export test-results.html
\`\`\`

### CI/CD Integration
\`\`\`yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    newman run postman/Inventory-Management-API.postman_collection.json \
      -e postman/environments/Development.postman_environment.json \
      --reporters cli,junit \
      --reporter-junit-export test-results.xml
\`\`\`

---

**Happy Testing! 🧪✨**
