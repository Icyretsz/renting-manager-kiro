import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';

interface SocketStore {
    socket: Socket | null;
    isConnected: boolean;
    connect: (token: string) => void;
    disconnect: () => void;
    setupNotificationListeners: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
    socket: null,
    isConnected: false,

    connect: (token: string) => {
        // Prevent multiple connections
        if (get().socket?.connected) return;

        const socket = io(
            import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
            {
                auth: {
                    token: token
                },
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            }
        );

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            set({ isConnected: true, socket });
            
            // Setup notification listeners after connection
            get().setupNotificationListeners();
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            set({ isConnected: false });
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            set({ isConnected: false });
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            socket.removeAllListeners();
            set({ socket: null, isConnected: false });
        }
    },

    setupNotificationListeners: () => {
        const { socket } = get();
        if (!socket) return;

        const { addNotification, updateNotification } = useNotificationStore.getState();

        // Listen for new notifications
        socket.on('notification:new', (notification) => {
            console.log('New notification received:', notification);
            addNotification(notification);
            
            // Show browser notification if permission is granted
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                });
            }
        });

        // Listen for notification updates (read status, etc.)
        socket.on('notification:update', (update) => {
            console.log('Notification update received:', update);
            if (update.type === 'read') {
                const { markAsRead } = useNotificationStore.getState();
                markAsRead(update.notificationId);
            }
        });

        // Listen for bulk notification updates
        socket.on('notification:bulk_update', (update) => {
            console.log('Bulk notification update received:', update);
            if (update.type === 'mark_all_read') {
                const { markAllAsRead } = useNotificationStore.getState();
                markAllAsRead();
            }
        });

        console.log('Notification listeners setup complete');
    },
}));