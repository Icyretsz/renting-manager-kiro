import React from 'react';
import { Layout, Avatar, Dropdown, Typography } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,

} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NotificationBell } from '@/components/Notifications';
import { LanguageSwitcher } from '@/components/Common/LanguageSwitcher';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export const MobileHeader: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Build menu items conditionally based on user role
  const userMenuItems = user?.role === 'USER' 
    ? [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: t('auth.profile'),
          onClick: () => navigate('/profile'),
        },
        {
          type: 'divider' as const,
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: t('auth.signOut'),
          onClick: logout,
          danger: true,
        },
      ]
    : [
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: t('auth.signOut'),
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
          {t('header.rentalManager')}
        </Text>
      </div>

      {/* Right side - Language, Notifications and User Menu */}
      <div className="flex items-center space-x-2">
        {/* Language Switcher */}
        <LanguageSwitcher />
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