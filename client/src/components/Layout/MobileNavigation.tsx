import React from 'react';
import { Badge } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NavItem } from '@/types';

export const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems: NavItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/',
    },
    {
      key: 'readings',
      icon: <FileTextOutlined />,
      label: 'Readings',
      path: '/meter-readings',
    },
    {
      key: 'billing',
      icon: <DollarOutlined />,
      label: 'Billing',
      path: '/billing',
    },
    ...(isAdmin() ? [
      {
        key: 'rooms',
        icon: <HomeOutlined />,
        label: 'Rooms',
        path: isAdmin() ? '/rooms' : '/my-rooms',
      },
      {
        key: 'approvals',
        icon: <CheckCircleOutlined />,
        label: 'Approvals',
        path: '/approvals',
        adminOnly: true,
        badge: 0, // This would be populated with pending approvals count
      },
      {
        key: 'tenants',
        icon: <CheckCircleOutlined />,
        label: 'Users',
        path: '/user-management',
        adminOnly: true,
      }
    ] : []),
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <div
              key={item.key}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors ${isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="relative mb-1">
                {item.badge !== undefined && item.badge > 0 ? (
                  <Badge count={item.badge} size="small">
                    <span className={`text-xl ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                  </Badge>
                ) : (
                  <span className={`text-xl ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};