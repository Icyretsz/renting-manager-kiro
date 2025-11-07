import React from 'react';
import { Button, Card, Typography } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';

const { Text } = Typography;

export const FirebaseDebugButton: React.FC = () => {
  const { isSupported, permission, isInitialized, error, requestPermission } = useFirebaseMessaging();

  const handleDebug = () => {
    console.log('🐛 Firebase Debug Info:', {
      isSupported,
      permission,
      isInitialized,
      error,
      hasVapidKey: !!import.meta.env.VITE_FIREBASE_VAPID_KEY,
      vapidKeyLength: import.meta.env.VITE_FIREBASE_VAPID_KEY?.length || 0,
      notificationSupported: 'Notification' in window,
      serviceWorkerSupported: 'serviceWorker' in navigator,
    });
  };

  const handleRequestPermission = async () => {
    console.log('🔔 Manually requesting permission...');
    const success = await requestPermission();
    console.log('Permission result:', success);
  };

  return (
    <Card size="small" className="mb-4">
      <div className="space-y-2">
        <Text strong>Firebase Debug</Text>
        <div className="flex space-x-2">
          <Button 
            icon={<BugOutlined />} 
            onClick={handleDebug}
            size="small"
          >
            Debug Info
          </Button>
          <Button 
            onClick={handleRequestPermission}
            size="small"
            disabled={permission === 'granted' || permission === 'denied'}
          >
            Request Permission
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          Status: {permission} | Supported: {isSupported ? 'Yes' : 'No'} | Initialized: {isInitialized ? 'Yes' : 'No'}
        </div>
        {error && <div className="text-xs text-red-500">Error: {error}</div>}
      </div>
    </Card>
  );
};