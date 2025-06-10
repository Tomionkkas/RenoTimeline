import React from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import { DashboardProvider } from '@/contexts/DashboardContext';
import Dashboard from './Dashboard';

const Index = () => {
  return (
    <ProtectedRoute>
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </ProtectedRoute>
  );
};

export default Index;
