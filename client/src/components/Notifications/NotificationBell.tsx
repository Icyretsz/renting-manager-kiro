import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';
import {
  Badge,
  Button,
  Dropdown,
  Typography,
  Space,
  Empty,
  Popconfirm,
} from 'antd';
import {
  BellOutlined,
  DeleteOutlined,
  CheckOutlined,
  ClearOutlined,
  EyeOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from '@/hooks/useNotifications';
import { NotificationDB } from '@/types';
import { 
  getNotificationNavigation, 
  getNotificationIcon 
} from '@/utils/notificationNavigation';

const { Text } = Typography;

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
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

  console.log(notifications)

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

  // Handle notification click to navigate to relevant page
  const handleNotificationClick = (notification: NotificationDB) => {
    // Mark as read if not already read
    if (!notification.readStatus) {
      handleMarkAsRead(notification.id);
    }

    // Get navigation info
    const navigationInfo = getNotificationNavigation(notification);
    
    if (navigationInfo.shouldNavigate) {
      navigate(navigationInfo.path);
      setDropdownVisible(false); // Close dropdown after navigation
    }
  };

  const renderNotificationItem = (notification: NotificationDB) => {
    const navigationInfo = getNotificationNavigation(notification);
    const isClickable = navigationInfo.shouldNavigate;
    const IconComponent = getNotificationIcon(notification.type);
    
    return (
      <div
        key={notification.id}
        className={`notification-item relative p-4 transition-all duration-200 ${
          isClickable ? 'hover:bg-blue-50 cursor-pointer active:bg-blue-100 touch-manipulation' : 'cursor-default'
        } ${!notification.readStatus ? 'bg-blue-25 border-l-4 border-blue-500' : ''}`}
        onClick={isClickable ? () => handleNotificationClick(notification) : undefined}
        role={isClickable ? 'button' : 'listitem'}
        tabIndex={isClickable ? 0 : -1}
        onKeyDown={isClickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNotificationClick(notification);
          }
        } : undefined}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            !notification.readStatus ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <IconComponent className={`text-lg ${
              !notification.readStatus ? 'text-blue-600' : 'text-gray-500'
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <Text 
                  strong={!notification.readStatus} 
                  className={`text-sm block ${
                    !notification.readStatus ? 'text-gray-900' : 'text-gray-700'
                  }`}
                  style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {notification.title}
                </Text>
                <Text 
                  className={`text-xs mt-1 block ${
                    !notification.readStatus ? 'text-gray-600' : 'text-gray-500'
                  }`}
                  style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {notification.message}
                </Text>
                <div className="flex items-center justify-between mt-2">
                  <Text type="secondary" className="text-xs">
                    {formatTimeAgo(notification.createdAt)}
                  </Text>
                  {isClickable && (
                    <div className="flex items-center text-blue-600">
                      <Text className="text-xs mr-1">Tap</Text>
                      <RightOutlined className="text-xs" />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="notification-item-actions flex flex-col items-center space-y-1" onClick={(e) => e.stopPropagation()}>
                {!notification.readStatus && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    loading={markReadMutation.isPending}
                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 w-8 h-8 flex items-center justify-center"
                  />
                )}
                <Popconfirm
                  title="Delete?"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                  okText="Yes"
                  cancelText="No"
                  placement="topRight"
                  //onClick={(e) => e?.stopPropagation()}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deleteMutation.isPending}
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 flex items-center justify-center"
                  />
                </Popconfirm>
              </div>
            </div>

            {/* Unread indicator */}
            {!notification.readStatus && (
              <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const dropdownContent = (
    <div className="w-screen max-w-sm mx-2 bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellOutlined className="text-blue-600" />
            <Text strong className="text-gray-800">Notifications</Text>
            {unreadCount > 0 && (
              <Badge count={unreadCount} size="small" />
            )}
          </div>
          <Space size="small">
            {unreadCount > 0 && (
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                loading={markAllReadMutation.isPending}
                className="text-blue-600 hover:bg-blue-100"
              />
            )}
            {notifications.length > 0 && (
              <Popconfirm
                title="Clear all notifications?"
                description="This action cannot be undone."
                onConfirm={handleClearAll}
                okText="Yes"
                cancelText="No"
                placement="bottomRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  loading={clearAllMutation.isPending}
                  className="text-red-500 hover:bg-red-50"
                />
              </Popconfirm>
            )}
          </Space>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-pulse">
              <BellOutlined className="text-2xl text-gray-300 mb-2" />
              <Text type="secondary">Loading notifications...</Text>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Empty
              image={<BellOutlined className="text-4xl text-gray-300" />}
              description={
                <Text type="secondary" className="text-sm">
                  No notifications yet
                </Text>
              }
              className="my-2"
            />
          </div>
        ) : (
          <div>
            {notifications.slice(0, 8).map(renderNotificationItem)}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 8 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <Button 
            type="link" 
            size="small" 
            onClick={() => setDropdownVisible(false)}
            className="w-full text-center text-blue-600"
          >
            View all {notifications.length} notifications
          </Button>
        </div>
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
      overlayClassName="notification-dropdown"
    >
      <Button
        type="text"
        icon={
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <BellOutlined className="text-xl" />
          </Badge>
        }
        className="flex items-center justify-center h-10 w-10 hover:bg-gray-100 rounded-full"
      />
    </Dropdown>
  );
};