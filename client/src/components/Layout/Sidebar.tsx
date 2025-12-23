import React from 'react';
import { Drawer, Menu } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUIStore } from '@/stores/uiStore';

export const MobileDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useUserProfile();
  const isAdmin = () => user?.role === 'ADMIN';
  const { activeModal, closeModal } = useUIStore();

  const isOpen = activeModal === 'mobile-menu';

  const handleNavigation = (path: string) => {
    navigate(path);
    closeModal();
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => handleNavigation('/'),
    },
    {
      key: isAdmin() ? '/rooms' : '/my-rooms',
      icon: <HomeOutlined />,
      label: 'Rooms',
      onClick: () => handleNavigation(isAdmin() ? '/rooms' : '/my-rooms'),
    },
    {
      key: '/meter-readings',
      icon: <FileTextOutlined />,
      label: 'Meter Readings',
      onClick: () => handleNavigation('/meter-readings'),
    },
    {
      key: '/billing',
      icon: <DollarOutlined />,
      label: 'Billing',
      onClick: () => handleNavigation('/billing'),
    },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Admin Dashboard',
      onClick: () => handleNavigation('/admin'),
    },
    {
      key: '/tenants',
      icon: <UserOutlined />,
      label: 'Tenants',
      onClick: () => handleNavigation('/tenants'),
    },
    {
      key: '/approvals',
      icon: <CheckCircleOutlined />,
      label: 'Reading Approvals',
      onClick: () => handleNavigation('/approvals'),
    },
    {
      key: '/financial-dashboard',
      icon: <DollarOutlined />,
      label: 'Financial Dashboard',
      onClick: () => handleNavigation('/financial-dashboard'),
    },
    {
      key: '/user-management',
      icon: <UserOutlined />,
      label: 'User Management',
      onClick: () => handleNavigation('/user-management'),
    },
  ];

  const allMenuItems = isAdmin() ? [...menuItems, ...adminMenuItems] : menuItems;

  return (
    <Drawer
      title="Menu"
      placement="left"
      onClose={closeModal}
      open={isOpen}
      width={280}
      className="mobile-drawer"
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        className="border-none"
        items={allMenuItems}
      />
    </Drawer>
  );
};