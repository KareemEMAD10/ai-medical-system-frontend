import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount] = useState(0);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* المحتوى الرئيسي - lg:mr-72 يطابق w-72 بتاع الـ Sidebar */}
      <div className="lg:mr-72 transition-all duration-300">
        <Header 
          toggleSidebar={toggleSidebar} 
          unreadCount={unreadCount}
          onNotificationClick={() => {}}
        />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;