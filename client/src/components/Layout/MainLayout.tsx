import React, { ReactNode } from 'react';
import { Layout } from 'antd';
import { MobileNavigation } from './MobileNavigation';
import { MobileHeader } from './Header';
import { MobileDrawer } from './Sidebar';

const { Content } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Layout className="min-h-screen bg-gray-50">
      <MobileHeader />
      <Content className="pb-16">
        <div className="px-4 py-4">
          {children}
        </div>
      </Content>
      <MobileNavigation />
      <MobileDrawer />
    </Layout>
  );
};