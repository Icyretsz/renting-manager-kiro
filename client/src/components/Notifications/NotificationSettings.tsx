import React from 'react';
import {
  Card,
  Switch,
  Button,
  Alert,
  Typography,
  Divider,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

export const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const {
    isSupported,
    permission,
    isInitialized,
    error,
    requestPermission,
  } = useFirebaseMessaging();

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          status: 'success' as const,
          icon: <CheckCircleOutlined className="text-green-500" />,
          text: t('notifications.notificationsEnabled'),
          description: t('notifications.notificationsEnabledDesc'),
        };
      case 'denied':
        return {
          status: 'error' as const,
          icon: <ExclamationCircleOutlined className="text-red-500" />,
          text: t('notifications.notificationsBlocked'),
          description: t('notifications.notificationsBlockedDesc'),
        };
      default:
        return {
          status: 'warning' as const,
          icon: <BellOutlined className="text-orange-500" />,
          text: t('notifications.notificationsNotConfigured'),
          description: t('notifications.notificationsNotConfiguredDesc'),
        };
    }
  };

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (!success) {
      console.error('Failed to enable notifications');
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!isSupported) {
    return (
      <Card>
        <Alert
          message={t('notifications.notSupported')}
          description={t('notifications.notSupportedDesc')}
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <SettingOutlined className="text-lg" />
            <Title level={4} className="mb-0">{t('notifications.notificationSettings')}</Title>
          </div>
        </div>

        {/* Current Status */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            {permissionStatus.icon}
            <Text strong>{permissionStatus.text}</Text>
          </div>
          <Paragraph className="text-gray-600 mb-0">
            {permissionStatus.description}
          </Paragraph>
        </div>

        {/* Error Display */}
        {error && (
          <Alert
            message={t('notifications.notificationError')}
            description={error}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {/* Enable/Disable Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Text strong>{t('notifications.pushNotifications')}</Text>
              <div className="text-sm text-gray-500">
                {t('notifications.pushNotificationsDesc')}
              </div>
            </div>
            <Switch
              checked={permission === 'granted' && isInitialized}
              onChange={handleEnableNotifications}
              disabled={permission === 'denied'}
            />
          </div>

          {permission === 'default' && (
            <Button
              type="primary"
              icon={<BellOutlined />}
              onClick={handleEnableNotifications}
              className="w-full"
            >
              {t('notifications.enableNotifications')}
            </Button>
          )}

          {permission === 'denied' && (
            <Alert
              message={t('notifications.notificationsBlocked')}
              description={
                <div>
                  <Paragraph className="mb-2">
                    {t('notifications.notificationsBlockedInstructions')}
                  </Paragraph>
                  <ol className="ml-4">
                    <li>{t('notifications.notificationsBlockedStep1')}</li>
                    <li>{t('notifications.notificationsBlockedStep2')}</li>
                    <li>{t('notifications.notificationsBlockedStep3')}</li>
                  </ol>
                </div>
              }
              type="warning"
              showIcon
            />
          )}
        </div>

        <Divider />

        {/* Notification Types */}
        <div className="space-y-3">
          <Text strong>{t('notifications.notificationTypes')}</Text>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Text>{t('notifications.readingSubmissions')}</Text>
                <div className="text-sm text-gray-500">
                  {t('notifications.readingSubmissionsDesc')}
                </div>
              </div>
              <Switch
                checked={permission === 'granted'}
                disabled={permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text>{t('notifications.readingApprovalsType')}</Text>
                <div className="text-sm text-gray-500">
                  {t('notifications.readingApprovalsDesc')}
                </div>
              </div>
              <Switch
                checked={permission === 'granted'}
                disabled={permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text>{t('notifications.paymentReminders')}</Text>
                <div className="text-sm text-gray-500">
                  {t('notifications.paymentRemindersDesc')}
                </div>
              </div>
              <Switch
                checked={permission === 'granted'}
                disabled={permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text>{t('notifications.systemUpdates')}</Text>
                <div className="text-sm text-gray-500">
                  {t('notifications.systemUpdatesDesc')}
                </div>
              </div>
              <Switch
                checked={permission === 'granted'}
                disabled={permission !== 'granted'}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};