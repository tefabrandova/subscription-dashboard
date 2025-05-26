import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  UserCircle, 
  DollarSign, 
  PieChart, 
  Settings, 
  LogOut, 
  Shield, 
  UserCog,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  History
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useStore } from '../store';
import NotificationBell from './NotificationBell';
import { checkExpiringAccounts, checkExpiringPackages } from '../utils/notifications';

const adminNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Users },
  { name: 'Packages', href: '/packages', icon: Package },
  { name: 'Customers', href: '/customers', icon: UserCircle },
  { name: 'Revenue', href: '/revenue', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: PieChart },
  { name: 'Activity Log', href: '/activity-log', icon: History },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Admin', href: '/admin', icon: Shield },
];

const userNavigation = [
  { name: 'User Panel', href: '/user-panel', icon: UserCog },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useUserStore();
  const { accounts, packages, customers, logo } = useStore();
  
  const isAdmin = currentUser?.role === 'admin';
  const navigation = isAdmin ? adminNavigation : userNavigation;

  // Get notifications
  const expiringAccounts = isAdmin ? checkExpiringAccounts(accounts) : [];
  const expiringPackages = checkExpiringPackages(customers, packages);
  
  const notifications = [
    ...(isAdmin ? expiringAccounts : []),
    ...expiringPackages
  ];

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
  };

  const sidebarVariants = {
    expanded: { width: '256px' },
    collapsed: { width: '70px' }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <NotificationBell 
            notifications={notifications}
            onViewAll={handleViewAllNotifications}
          />
        </div>
      </div>

      <div className="flex min-h-screen pt-[48px] lg:pt-0">
        {/* Sidebar */}
        <div className="relative">
          <motion.div 
            className={`fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            initial={false}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
            variants={sidebarVariants}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center h-16 px-4">
                {logo ? (
                  <img 
                    src={logo}
                    alt="Logo"
                    className="h-8 w-auto object-contain"
                    style={{ maxWidth: isCollapsed ? '40px' : '100%' }}
                  />
                ) : (
                  <Package 
                    className="h-8 w-8 text-[#8a246c]"
                  />
                )}
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-[#8a246c] text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="ml-3"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </nav>

              {/* Logout button */}
              <div className="p-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full p-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="ml-3"
                      >
                        Logout
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 items-center justify-center w-6 h-24 bg-white border border-gray-200 ${
              isCollapsed ? 'left-[70px]' : 'left-[256px]'
            } -mr-3 rounded-r-md transition-all duration-300 hover:bg-gray-50 focus:outline-none`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Main content */}
        <div className={`flex-1 ${isCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[256px]'} transition-all duration-300`}>
          <div className="hidden lg:block bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="text-[#8a246c] font-semibold">
                  Subscription Management System
                </div>
                <NotificationBell 
                  notifications={notifications}
                  onViewAll={handleViewAllNotifications}
                />
              </div>
            </div>
          </div>

          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}