import React from 'react';
import { TrendingUp, TrendingDown, Package, AlertTriangle, DollarSign, Users, ShoppingBag, Building, Percent } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const Dashboard: React.FC = () => {
  const { getDashboardStats, currentShop, currentUser, settings, isDarkMode } = useApp();
  const stats = getDashboardStats();

  const StatCard: React.FC<{
    title: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down';
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, change, trend, icon: Icon, color }) => (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const SimpleChart: React.FC<{ data: Array<{ date: string; amount: number }> }> = ({ data }) => {
    const maxAmount = Math.max(...data.map(d => d.amount), 1);
    
    return (
      <div className="flex items-end space-x-2 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="bg-blue-500 rounded-t w-full min-h-1 transition-all hover:bg-blue-600 cursor-pointer"
              style={{
                height: `${maxAmount > 0 ? Math.max((item.amount / maxAmount) * 100, 2) : 10}%`
              }}
              title={`${item.date}: ${settings.currencySymbol} ${item.amount.toFixed(2)}`}
            />
            <span className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.date}</span>
          </div>
        ))}
      </div>
    );
  };

  const isOwner = currentUser?.role === 'owner';

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {isOwner ? 'Owner Dashboard' : 'Dashboard'}
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome back! Here's what's happening with your business today.
        </p>
        <p className="text-sm text-blue-600 mt-1">
          {isOwner ? 'Overview of all stores' : `Viewing: ${currentShop.name}`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Sales Today"
          value={`${settings.currencySymbol} ${stats.totalSalesToday.toFixed(2)}`}
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Expenses Today"
          value={`${settings.currencySymbol} ${stats.totalExpensesToday.toFixed(2)}`}
          change="-2.1%"
          trend="down"
          icon={TrendingDown}
          color="bg-red-500"
        />
        <StatCard
          title="Stock Value"
          value={`${settings.currencySymbol} ${stats.totalStockValue.toFixed(2)}`}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Stock Alerts"
          value={stats.lowStockAlerts.toString()}
          icon={AlertTriangle}
          color="bg-orange-500"
        />
      </div>

      {/* Owner-specific stats */}
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toString()}
            icon={Users}
            color="bg-purple-500"
          />
          <StatCard
            title="Active Shops"
            value={stats.totalShops.toString()}
            icon={Building}
            color="bg-indigo-500"
          />
          <StatCard
            title="Monthly Revenue"
            value={`${settings.currencySymbol} ${stats.monthlyRevenue.toFixed(2)}`}
            icon={TrendingUp}
            color="bg-green-600"
          />
          <StatCard
            title="Profit Margin"
            value={`${stats.profitMargin.toFixed(1)}%`}
            icon={Percent}
            color="bg-blue-600"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Daily Sales (Last 7 Days)
          </h3>
          <SimpleChart data={stats.dailySales} />
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Shop Performance
          </h3>
          <div className="space-y-4">
            {stats.shopPerformance.map((shop, index) => (
              <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {shop.shopName}
                  </span>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-600 font-medium">
                      Sales: {settings.currencySymbol} {shop.sales.toFixed(2)}
                    </span>
                    <span className="text-red-600 font-medium">
                      Expenses: {settings.currencySymbol} {shop.expenses.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${shop.sales > 0 ? Math.min((shop.sales / Math.max(...stats.shopPerformance.map(s => s.sales))) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Top Selling Products
          </h3>
          <div className="space-y-3">
            {stats.topProducts.map((product, index) => (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </span>
                </div>
                <span className="text-green-600 font-medium">
                  {settings.currencySymbol} {product.sales.toFixed(2)}
                </span>
              </div>
            ))}
            {stats.topProducts.length === 0 && (
              <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No sales data available
              </p>
            )}
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                New sale recorded: Premium Mozambique Coffee - {settings.currencySymbol} 450.00
              </span>
              <span className={`text-xs ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                2 min ago
              </span>
            </div>
            <div className={`flex items-center space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Stock transfer completed: Downtown Store → Matola Branch
              </span>
              <span className={`text-xs ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                1h ago
              </span>
            </div>
            <div className={`flex items-center space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Low stock alert: Artisan Chocolate (8 units remaining)
              </span>
              <span className={`text-xs ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                3h ago
              </span>
            </div>
            {isOwner && (
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  New user added: Carlos Machado (Cashier)
                </span>
                <span className={`text-xs ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  5h ago
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};