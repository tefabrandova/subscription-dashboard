import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Packages from './pages/Packages';
import Customers from './pages/Customers';
import Revenue from './pages/Revenue';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import UserPanel from './pages/UserPanel';
import Notifications from './pages/Notifications';
import ActivityLog from './pages/ActivityLog';
import { useAuth } from './hooks/useAuth';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={
          <PrivateRoute allowedRoles={['admin']}>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="accounts" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Accounts />
          </PrivateRoute>
        } />
        <Route path="packages" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Packages />
          </PrivateRoute>
        } />
        <Route path="customers" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Customers />
          </PrivateRoute>
        } />
        <Route path="revenue" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Revenue />
          </PrivateRoute>
        } />
        <Route path="reports" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Reports />
          </PrivateRoute>
        } />
        <Route path="activity-log" element={
          <PrivateRoute allowedRoles={['admin']}>
            <ActivityLog />
          </PrivateRoute>
        } />
        <Route path="admin" element={
          <PrivateRoute allowedRoles={['admin']}>
            <Admin />
          </PrivateRoute>
        } />
        <Route path="notifications" element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        } />
        <Route path="user-panel" element={
          <PrivateRoute allowedRoles={['user']}>
            <UserPanel />
          </PrivateRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;