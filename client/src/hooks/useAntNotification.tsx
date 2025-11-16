import { notification } from 'antd';
import { useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { 
  getNotificationNavigation, 
  getNotificationIcon 
} from '@/utils/notificationNavigation';
import { WebsocketNotification } from '@/types';
import getNotificationMessage from '@/utils/getNotificationMessage.ts';

export const useAntNotification = (navigate: NavigateFunction) => {
  const [api, contextHolder] = notification.useNotification();

  const showNotification = useCallback((notificationData: WebsocketNotification) => {
    const navigationInfo = getNotificationNavigation(notificationData);
    const IconComponent = getNotificationIcon(notificationData.type);
    const {title, message} = getNotificationMessage(notificationData)

    api.open({
      message: title,
      description: message,
      icon: <IconComponent style={{ color: '#1890ff' }} />,
      placement: 'topRight',
      duration: 6,
      onClick: navigationInfo.shouldNavigate ? () => {
        navigate(navigationInfo.path);
        api.destroy();
      } : undefined,
      style: {
        cursor: navigationInfo.shouldNavigate ? 'pointer' : 'default',
        borderLeft: '4px solid #1890ff',
      },
      className: navigationInfo.shouldNavigate ? 'notification-clickable' : '',
    });
  }, [api, navigate]);

  const showSuccessNotification = useCallback((title: string, description: string) => {
    api.success({
      message: title,
      description,
      placement: 'topRight',
      duration: 4,
    });
  }, [api]);

  const showErrorNotification = useCallback((title: string, description: string) => {
    api.error({
      message: title,
      description,
      placement: 'topRight',
      duration: 6,
    });
  }, [api]);

  const showWarningNotification = useCallback((title: string, description: string) => {
    api.warning({
      message: title,
      description,
      placement: 'topRight',
      duration: 5,
    });
  }, [api]);

  const showInfoNotification = useCallback((title: string, description: string) => {
    api.info({
      message: title,
      description,
      placement: 'topRight',
      duration: 4,
    });
  }, [api]);

  return {
    contextHolder,
    showNotification,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    destroyAll: api.destroy,
  };
};