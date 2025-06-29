import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  ArrowLeftRight,
  FileText,
  Settings,
  Users,
  Store,
  Activity,
  Building
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const navigation = [
  { name: 'Dashboard', page: 'dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { name: 'Products', page: 'products', icon: Package, permission: 'products' },
  { name: 'Sales', page: 'sales', icon: ShoppingCart, permission: 'sales' },
  { name: 'Expenses', page: 'expenses', icon: Receipt, permission: 'expenses' },
  { name: 'Transfers', page: 'transfers', icon: ArrowLeftRight, permission: 'transfers' },
  { name: 'Reports', page: 'reports', icon: FileText, permission: 'reports' },
  { name: 'Users', page: 'users', icon: Users, permission: 'users', ownerOnly: true },
  { name: 'Shops', page: 'shops', icon: Building, permission: 'shops', ownerOnly: true },
  { name: 'Activity', page: 'activity', icon: Activity, permission: 'activity', ownerOnly: true },
  { name: 'Settings', page: 'settings', icon: Settings, permission: 'settings' }
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, settings, currentUser, hasPermission, isDarkMode } = useApp();

  const filteredNavigation = navigation.filter(item => {
    if (item.ownerOnly && currentUser?.role !== 'owner') return false;
    return hasPermission(item.permission);
  });

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-lg h-full w-64 fixed left-0 top-0 z-40 border-r transition-colors`}>
      <div className={`flex items-center justify-center h-16 px-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <Store className="w-8 h-8 text-blue-600 mr-2" />
        <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {settings.businessName}
        </span>
      </div>
      
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            
            return (
              <li key={item.name}>
                <button
                  onClick={() => setCurrentPage(item.page)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Role Badge */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentUser?.role === 'owner' ? 'Owner' : 
               currentUser?.role === 'manager' ? 'Manager' : 'Cashier'}
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {currentUser?.name}
          </p>
        </div>
      </div>
    </div>
  );
};