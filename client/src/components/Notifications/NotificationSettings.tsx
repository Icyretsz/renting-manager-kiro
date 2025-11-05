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

const { Title, Text, Paragraph } = Typography;

export const NotificationSettings: React.FC = () => {
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
          text: 'Notifications enabled',
          description: 'You will receive push notifications for important updates.',
        };
      case 'denied':
        return {
          status: 'error' as const,
          icon: <ExclamationCircleOutlined className="text-red-500" />,
          text: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings to receive updates.',
        };
      default:
        return {
          status: 'warning' as const,
          icon: <BellOutlined className="text-orange-500" />,
          text: 'Notifications not configured',
          description: 'Enable notifications to stay updated on reading approvals and important updates.',
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
          message="Notifications Not Supported"
          description="Your browser does not support push notifications. Please use a modern browser to receive notifications."
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
            <Title level={4} className="mb-0">Notification Settings</Title>
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
            message="Notification Error"
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
              <Text strong>Push Notifications</Text>
              <div className="text-sm text-gray-500">
                Receive notifications for reading approvals and updates
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
              Enable Notifications
            </Button>
          )}

          {permission === 'denied' && (
            <Alert
              message="Notifications Blocked"
              description={
                <div>
                  <Paragraph className="mb-2">
                    To enable notifications, please:
                  </Paragraph>
                  <ol className="ml-4">
                    <li>Click the lock icon in your browser's address bar</li>
                    <li>Change notifications from "Block" to "Allow"</li>
                    <li>Refresh this page</li>
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
          <Text strong>Notification Types</Text>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Text>Reading Submissions</Text>
                <div className="text-sm text-gray-500">
                  When tenants submit new meter readings (Admin only)
                </div>
              </div>
              <Switch
                checked={permission === 'granted'}
                disabled={permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text>Reading Approvals</Text>
                <div className="text-sm text-gray-500">
                  When your readings are approved or rejected
                </div>
              </div>
              <Switch
                checked={permission === 'granted'}
                disabled={permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text>Payment Reminders</Text>
                <div className="text-sm text-gray-500">
                  Reminders for upcoming or overdue payments
                </div>
              </div>
              <Switch
                checked={permission === 'granted'}
                disabled={permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text>System Updates</Text>
                <div className="text-sm text-gray-500">
                  Important system announcements and updates
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