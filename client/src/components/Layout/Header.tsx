import React from 'react';
import { Layout, Avatar, Dropdown, Typography } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,

} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import { NotificationBell } from '@/components/Notifications';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export const MobileHeader: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Build menu items conditionally based on user role
  const userMenuItems = user?.role === 'USER' 
    ? [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Profile',
          onClick: () => navigate('/profile'),
        },
        {
          type: 'divider' as const,
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Sign Out',
          onClick: logout,
          danger: true,
        },
      ]
    : [
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Sign Out',
          onClick: logout,
          danger: true,
        },
      ];

  return (
    <AntHeader className="bg-white shadow-sm border-b border-gray-200 px-4 flex items-center justify-between h-14 sticky top-0 z-40">
      {/* Left side - Menu button and title */}
      <div className="flex items-center space-x-3">
        {/* <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => openModal('mobile-menu')}
          className="flex items-center justify-center p-1"
        /> */}
        <Text className="text-lg font-semibold text-gray-800">
          Rental Manager
        </Text>
      </div>

      {/* Right side - Notifications and User Menu */}
      <div className="flex items-center space-x-2">
        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Avatar
            size="small"
            icon={<UserOutlined />}
            className="cursor-pointer bg-blue-500"
          />
        </Dropdown>
      </div>
    </AntHeader>
  );
};