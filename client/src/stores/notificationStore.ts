import { create } from 'zustand';
import { Notification } from '@/types';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: Notification[]) => void;
  updateNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification: Notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      const unreadCount = newNotifications.filter(n => !n.readStatus).length;
      return {
        notifications: newNotifications,
        unreadCount,
      };
    });
  },

  markAsRead: (id: string) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === id
          ? { ...notification, readStatus: true }
          : notification
      );
      const unreadCount = updatedNotifications.filter(n => !n.readStatus).length;
      return {
        notifications: updatedNotifications,
        unreadCount,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(notification => ({
        ...notification,
        readStatus: true,
      })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id: string) => {
    set((state) => {
      const updatedNotifications = state.notifications.filter(n => n.id !== id);
      const unreadCount = updatedNotifications.filter(n => !n.readStatus).length;
      return {
        notifications: updatedNotifications,
        unreadCount,
      };
    });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  setNotifications: (notifications: Notification[]) => {
    const unreadCount = notifications.filter(n => !n.readStatus).length;
    set({
      notifications,
      unreadCount,
    });
  },

  updateNotification: (notification: Notification) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(n => 
        n.id === notification.id ? notification : n
      );
      const unreadCount = updatedNotifications.filter(n => !n.readStatus).length;
      return {
        notifications: updatedNotifications,
        unreadCount,
      };
    });
  },
}));