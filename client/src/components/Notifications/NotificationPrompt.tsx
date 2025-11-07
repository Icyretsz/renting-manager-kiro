import React, { useState } from 'react';
import { Card, Button, Alert, Typography } from 'antd';
import { BellOutlined, CloseOutlined } from '@ant-design/icons';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';

const { Text, Paragraph } = Typography;

interface NotificationPromptProps {
  onDismiss?: () => void;
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { requestPermission, permission } = useFirebaseMessaging();

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      setIsVisible(false);
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Don't show if permission already granted or denied, or if not supported
  if (!isVisible || permission === 'granted' || permission === 'denied') {
    return null;
  }

  // Also check if notifications are supported
  if (!('Notification' in window)) {
    return null;
  }

  return (
    <Card 
      className="mb-4 border-blue-200 bg-blue-50"
      size="small"
      extra={
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={handleDismiss}
          size="small"
        />
      }
    >
      <div className="flex items-start space-x-3">
        <BellOutlined className="text-blue-500 text-xl mt-1" />
        <div className="flex-1">
          <Text strong className="text-blue-800">
            Stay Updated with Push Notifications
          </Text>
          <Paragraph className="text-blue-700 mb-3 mt-1">
            Get instant notifications when your meter readings are approved, bills are ready, 
            or important updates are available.
          </Paragraph>
          <div className="flex space-x-2">
            <Button 
              type="primary" 
              size="small"
              onClick={handleEnableNotifications}
            >
              Enable Notifications
            </Button>
            <Button 
              size="small"
              onClick={handleDismiss}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};