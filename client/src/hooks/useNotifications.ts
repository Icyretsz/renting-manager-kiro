import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import api from '@/services/api';
import { Notification, ApiResponse } from '@/types';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...notificationKeys.lists(), { filters }] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

// Fetch user notifications (initial load only, no polling)
export const useNotificationsQuery = () => {
  const { isAuthenticated } = useAuth0();
  const { token, user } = useAuthStore();
  const { setNotifications } = useNotificationStore();

  return useQuery({
    queryKey: notificationKeys.lists(),
    queryFn: async (): Promise<Notification[]> => {
      const response = await api.get<ApiResponse<Notification[]>>('/notifications');
      const notifications = response.data.data || [];
      
      // Update the store with fetched notifications
      setNotifications(notifications);
      
      return notifications;
    },
    enabled: isAuthenticated && !!token && !!user, // Only fetch when authenticated with token
    staleTime: Infinity, // Don't refetch automatically - rely on WebSocket updates
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

// Fetch unread notifications count (initial load only)
export const useUnreadNotificationsQuery = () => {
  const { isAuthenticated } = useAuth0();
  const { token, user } = useAuthStore();

  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async (): Promise<number> => {
      const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      return response.data.data?.count || 0;
    },
    enabled: isAuthenticated && !!token && !!user, // Only fetch when authenticated with token
    staleTime: Infinity, // Don't refetch automatically - rely on WebSocket updates
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

// Mark notification as read mutation
export const useMarkNotificationReadMutation = () => {
  const { markAsRead } = useNotificationStore();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.put<ApiResponse<Notification>>(`/notifications/${notificationId}/read`);
      return response.data.data;
    },
    onSuccess: (_, notificationId) => {
      // Update local store immediately for optimistic UI
      markAsRead(notificationId);
      
      // No need to invalidate queries - WebSocket will handle real-time updates
      // queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

// Mark all notifications as read mutation
export const useMarkAllNotificationsReadMutation = () => {
  const { markAllAsRead } = useNotificationStore();

  return useMutation({
    mutationFn: async () => {
      const response = await api.put<ApiResponse<void>>('/notifications/mark-all-read');
      return response.data;
    },
    onSuccess: () => {
      // Update local store immediately for optimistic UI
      markAllAsRead();
      
      // No need to invalidate queries - WebSocket will handle real-time updates
      // queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

// Delete notification mutation
export const useDeleteNotificationMutation = () => {
  const { removeNotification } = useNotificationStore();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete<ApiResponse<void>>(`/notifications/${notificationId}`);
      return response.data;
    },
    onSuccess: (_, notificationId) => {
      // Update local store immediately for optimistic UI
      removeNotification(notificationId);
      
      // No need to invalidate queries - WebSocket will handle real-time updates
      // queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

// Clear all notifications mutation
export const useClearAllNotificationsMutation = () => {
  const { clearAll } = useNotificationStore();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete<ApiResponse<void>>('/notifications/clear-all');
      return response.data;
    },
    onSuccess: () => {
      // Update local store immediately for optimistic UI
      clearAll();
      
      // No need to invalidate queries - WebSocket will handle real-time updates
      // queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

//Update user's FCM token for push notification mutation
export const useUpdateFCMTokenMutation = () => {
  return useMutation({
    mutationFn: async (fcmToken: string) => {
      console.log('🔄 Updating FCM token:', fcmToken.substring(0, 20) + '...');
      const response = await api.patch<ApiResponse<void>>('/notifications/fcm-token', { 
        fcmToken 
      });
      return response.data;
    },
    onSuccess: () => {
      console.log('✅ FCM token updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update FCM token:', error);
    },
  });
};