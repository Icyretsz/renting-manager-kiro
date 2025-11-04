import React, { useState } from 'react';
import {
  Badge,
  Button,
  Dropdown,
  List,
  Typography,
  Space,
  Empty,
  Divider,
  Popconfirm,
} from 'antd';
import {
  BellOutlined,
  DeleteOutlined,
  CheckOutlined,
  ClearOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from '@/hooks/useNotifications';
import { Notification } from '@/types';

const { Text } = Typography;

export const NotificationBell: React.FC = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { notifications, unreadCount } = useNotificationStore();
  
  const { isLoading } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();
  const clearAllMutation = useClearAllNotificationsMutation();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllMutation.mutateAsync();
      setDropdownVisible(false);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reading_submitted':
        return '📊';
      case 'reading_approved':
        return '✅';
      case 'reading_rejected':
        return '❌';
      case 'payment_due':
        return '💰';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const renderNotificationItem = (notification: Notification) => (
    <List.Item
      key={notification.id}
      className={`px-4 py-3 hover:bg-gray-50 ${!notification.readStatus ? 'bg-blue-50' : ''}`}
      actions={[
        <Space key="actions">
          {!notification.readStatus && (
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleMarkAsRead(notification.id)}
              loading={markReadMutation.isPending}
            />
          )}
          <Popconfirm
            title="Delete this notification?"
            onConfirm={() => handleDeleteNotification(notification.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              loading={deleteMutation.isPending}
            />
          </Popconfirm>
        </Space>,
      ]}
    >
      <List.Item.Meta
        avatar={
          <div className="text-lg">
            {getNotificationIcon(notification.type)}
          </div>
        }
        title={
          <div className="flex items-center justify-between">
            <Text strong={!notification.readStatus} className="text-sm">
              {notification.title}
            </Text>
            {!notification.readStatus && (
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
            )}
          </div>
        }
        description={
          <div>
            <div className="text-sm text-gray-600 mb-1">
              {notification.message}
            </div>
            <div className="text-xs text-gray-400">
              {formatTimeAgo(notification.createdAt)}
            </div>
          </div>
        }
      />
    </List.Item>
  );

  const dropdownContent = (
    <div className="w-80 max-h-96 overflow-hidden bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <Text strong>Notifications</Text>
          <Space>
            {unreadCount > 0 && (
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                loading={markAllReadMutation.isPending}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Popconfirm
                title="Clear all notifications?"
                description="This action cannot be undone."
                onConfirm={handleClearAll}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  danger
                  loading={clearAllMutation.isPending}
                >
                  Clear all
                </Button>
              </Popconfirm>
            )}
          </Space>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <Text type="secondary">Loading notifications...</Text>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No notifications"
              className="my-4"
            />
          </div>
        ) : (
          <List
            dataSource={notifications.slice(0, 10)} // Show only first 10
            renderItem={renderNotificationItem}
            split={false}
          />
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <>
          <Divider className="my-0" />
          <div className="px-4 py-2 text-center bg-gray-50">
            <Button type="link" size="small" onClick={() => setDropdownVisible(false)}>
              View all notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
    >
      <Button
        type="text"
        icon={
          <Badge count={unreadCount} size="small" offset={[0, 0]}>
            <BellOutlined className="text-lg" />
          </Badge>
        }
        className="flex items-center justify-center"
      />
    </Dropdown>
  );
};