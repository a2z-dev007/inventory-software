import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  TrendingUp,
  Settings,
  Truck,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('admin' | 'manager' | 'staff')[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['admin', 'manager', 'staff'] },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: FileText, roles: ['admin', 'manager'] },
  { name: 'Purchases', href: '/purchases', icon: Receipt, roles: ['admin', 'manager'] },
  { name: 'Sales', href: '/sales', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'manager', 'staff'] },
  // { name: 'Reports', href: '/reports', icon: TrendingUp, roles: ['admin', 'manager'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export const Sidebar: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    hasAnyRole(item.roles)
  );

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <Package className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-lg font-bold text-gray-900">InventoryPro</span>
        </div>
        
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};