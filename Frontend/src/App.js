import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './pages/HomePage';
import CompaniesPage from './pages/CompaniesPage';
import FleetTasksPage from './pages/FleetTasksPage';
import DriversPage from './pages/DriversPage';
import VehiclesPage from './pages/VehiclesPage';
import TaskPage from './pages/TaskPage'; // Import the TaskPage
import TopHeader from './components/TopHeader';
import SideNav from './components/SideNav';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeSidebar = () => {
    setSidebarCollapsed(true);
  };

  // Layout wrapper component
  const AppLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50">
      <div className={`${sidebarCollapsed ? '' : 'opacity-70 bg-gray-800 bg-opacity-20'}`}>
        <TopHeader onToggleSidebar={toggleSidebar} />
      </div>
      
      <div className="p-4">
        <div className="flex">
          <SideNav collapsed={sidebarCollapsed} onClose={closeSidebar} />

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Public route - no layout */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Home route with layout */}
        <Route path="/" element={
          <AppLayout>
            <HomePage />
          </AppLayout>
        } />
        
        {/* Other protected routes with layout */}
        <Route path="/companies" element={
          <AppLayout>
            <CompaniesPage />
          </AppLayout>
        } />
        
        <Route path="/fleet-tasks" element={
          <AppLayout>
            <FleetTasksPage />
          </AppLayout>
        } />
        
        <Route path="/drivers" element={
          <AppLayout>
            <DriversPage />
          </AppLayout>
        } />
        
        <Route path="/vehicles" element={
          <AppLayout>
            <VehiclesPage />
          </AppLayout>
        } />
        
        {/* Add the new Tasks route */}
        <Route path="/tasks" element={
          <AppLayout>
            <TaskPage />
          </AppLayout>
        } />
        
        {/* Default route - redirect to home instead of login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;