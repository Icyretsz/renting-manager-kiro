import React, { useState } from 'react';
import { Card, Button, Typography } from 'antd';
import { BellOutlined, CloseOutlined } from '@ant-design/icons';
import { NotificationPromptProps } from '@/types';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { useTranslation } from 'react-i18next';

const { Text, Paragraph } = Typography;

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onDismiss }) => {
  const { t } = useTranslation();
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
            {t('notifications.stayUpdated')}
          </Text>
          <Paragraph className="text-blue-700 mb-3 mt-1">
            {t('notifications.stayUpdatedDesc')}
          </Paragraph>
          <div className="flex space-x-2">
            <Button 
              type="primary" 
              size="small"
              onClick={handleEnableNotifications}
            >
              {t('notifications.enableNotifications')}
            </Button>
            <Button 
              size="small"
              onClick={handleDismiss}
            >
              {t('notifications.maybeLater')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};