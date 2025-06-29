import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen bg-gray-50">
      <Sidebar />
      <Topbar />
      <main className="ml-64 pt-16 h-full overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};