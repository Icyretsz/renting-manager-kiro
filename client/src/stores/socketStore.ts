import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketStore {
    socket: Socket | null;
    isConnected: boolean;
    connect: (token: string) => void;
    disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
    socket: null,
    isConnected: false,

    connect: (token: string) => {
        // Prevent multiple connections
        const currentSocket = get().socket;
        if (currentSocket?.connected) {
            console.log('Socket already connected, skipping connection attempt');
            return;
        }

        // Disconnect existing socket if it exists but not connected
        if (currentSocket) {
            currentSocket.disconnect();
            currentSocket.removeAllListeners();
        }

        console.log('Creating new socket connection...');
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

}));