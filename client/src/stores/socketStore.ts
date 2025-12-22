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
        const socketURL = import.meta.env.MODE === 'development' ? import.meta.env.VITE_SOCKET_URL_DEV : import.meta.env.VITE_SOCKET_URL_PROD
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
            socketURL,
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
            console.log('Socket auth token present:', !!token);
            set({ isConnected: true, socket });
            
            // Send a ping to verify the connection works
            socket.emit('ping', (response: string) => {
                console.log('Ping response:', response);
            });
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