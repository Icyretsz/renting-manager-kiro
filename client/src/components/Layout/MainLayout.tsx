import React, { useState } from 'react';
import { Layout } from 'antd';
import { MainLayoutProps } from '@/types';
import { MobileNavigation } from './MobileNavigation';
import { MobileHeader } from './Header';
import { MobileDrawer } from './Sidebar';
import { NotificationPrompt } from '@/components/Notifications/NotificationPrompt';

const { Content } = Layout;

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

  return (
    <Layout className="min-h-screen bg-gray-50">
      <MobileHeader />
      <Content className="pb-16">
        <div className="px-4 py-4">
          {showNotificationPrompt && (
            <NotificationPrompt onDismiss={() => setShowNotificationPrompt(false)} />
          )}
          {children}
        </div>
      </Content>
      <MobileNavigation />
      <MobileDrawer />
    </Layout>
  );
};