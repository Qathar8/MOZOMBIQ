import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Sales } from './pages/Sales';
import { Expenses } from './pages/Expenses';
import { StockTransfers } from './pages/StockTransfers';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Shops } from './pages/Shops';
import { ActivityLogs } from './pages/ActivityLogs';
import { Settings } from './pages/Settings';

const AppContent: React.FC = () => {
  const { currentPage, isAuthenticated, currentUser, hasPermission } = useApp();
  const { toasts, removeToast } = useToast();

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    // Check permissions for each page
    switch (currentPage) {
      case 'dashboard':
        return hasPermission('dashboard') ? <Dashboard /> : <UnauthorizedPage />;
      case 'products':
        return hasPermission('products') ? <Products /> : <UnauthorizedPage />;
      case 'sales':
        return hasPermission('sales') ? <Sales /> : <UnauthorizedPage />;
      case 'expenses':
        return hasPermission('expenses') ? <Expenses /> : <UnauthorizedPage />;
      case 'transfers':
        return hasPermission('transfers') ? <StockTransfers /> : <UnauthorizedPage />;
      case 'reports':
        return hasPermission('reports') ? <Reports /> : <UnauthorizedPage />;
      case 'users':
        return currentUser?.role === 'owner' ? <Users /> : <UnauthorizedPage />;
      case 'shops':
        return currentUser?.role === 'owner' ? <Shops /> : <UnauthorizedPage />;
      case 'activity':
        return currentUser?.role === 'owner' ? <ActivityLogs /> : <UnauthorizedPage />;
      case 'settings':
        return hasPermission('settings') ? <Settings /> : <UnauthorizedPage />;
      default:
        return <Dashboard />;
    }
  };

  const UnauthorizedPage = () => (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
      <p className="text-gray-600">Não tem permissão para aceder a esta página.</p>
    </div>
  );

  return (
    <>
      <Layout>
        {renderPage()}
      </Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;